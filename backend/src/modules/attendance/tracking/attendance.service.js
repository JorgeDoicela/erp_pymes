/**
 * @file attendance.service.js
 * @description Motor de Control Asistencial, Geocercas (Haversine), Cifrado GPS y Detección Anti-VPN/Proxy.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { attendanceRepository } from './attendance.repository.js';
import { employeeRepository } from '../../employees/index.js';
import { systemRepository } from '../../system/index.js';
import { auditRepository } from '../../audit/index.js';
import { encryptCoordinate } from '../../../core/security/encryption.js';
import {
  computeEntryLateness,
  computeExitMetrics,
  decryptLocationPair,
  resolveEmployeeGeofenceConfig,
  validateAttendanceGeofence,
  validateNetworkPolicy,
} from './geofence.helper.js';

export { computeExitMetrics };

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CUID_REGEX = /^c[a-z0-9]{20,}$/i;

const isInternalId = (value) => UUID_REGEX.test(value) || CUID_REGEX.test(value);

const resolveEmployeeRecord = async (inputIdentifier) => {
  if (employeeRepository?.findEmployeeForAttendance) {
    const emp = await employeeRepository.findEmployeeForAttendance(inputIdentifier);
    if (emp) return emp;
  }
  if (employeeRepository?.findById && isInternalId(inputIdentifier)) {
    const emp = await employeeRepository.findById(inputIdentifier);
    if (emp) return emp;
  }
  if (employeeRepository?.findByIdentityCard && !isInternalId(inputIdentifier)) {
    const emp = await employeeRepository.findByIdentityCard(inputIdentifier);
    if (emp) return emp;
  }
  return null;
};

export const attendanceService = {
  async registerAttendance(
    inputIdentifierRaw,
    type,
    location = null,
    ip = null,
    isSupervisorOverride = false,
    options = {}
  ) {
    const inputIdentifier = inputIdentifierRaw?.toString().trim();
    if (!inputIdentifier) throw new Error('Identificador de empleado es requerido');

    const employee = await resolveEmployeeRecord(inputIdentifier);
    if (!employee) {
      if (isInternalId(inputIdentifier)) {
        throw new Error(`Empleado no encontrado con ID: ${inputIdentifier}`);
      }
      throw new Error(`No se encontró empleado con la cédula: ${inputIdentifier}`);
    }

    const employeeId = employee.id;
    const systemSettings = employee.tenantId
      ? await systemRepository.findByTenantId(employee.tenantId)
      : await systemRepository.findGlobalDefault();

    const { effectiveLocation } = validateAttendanceGeofence({
      employee,
      systemSettings,
      location,
      type,
      isSupervisorOverride,
      autoGeofence: Boolean(options?.autoGeofence),
    });

    await validateNetworkPolicy(ip, systemSettings);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let existingRecord = await attendanceRepository.findByEmployeeAndDate(employeeId, today);
    if (!existingRecord && type !== 'ENTRY') {
      existingRecord = await attendanceRepository.findFirst(
        {
          employeeId,
          checkOut: null,
          checkIn: { gte: new Date(Date.now() - 28 * 60 * 60 * 1000) },
        },
        { checkIn: 'desc' }
      );
    }

    if (type === 'ENTRY') {
      if (existingRecord) throw new Error('Ya se ha registrado una entrada para este día.');

      const activeSchedule = await attendanceRepository.findActiveSchedule(employeeId, today);
      const isLate = computeEntryLateness(now, activeSchedule);

      const entryData = {
        employeeId,
        date: today,
        checkIn: now,
        status: isLate ? 'LATE' : 'Present',
        isLate,
        ipAddress: ip,
      };

      if (effectiveLocation?.latitude && effectiveLocation?.longitude && employee.trackingConsent) {
        entryData.entryLatitude = encryptCoordinate(effectiveLocation.latitude);
        entryData.entryLongitude = encryptCoordinate(effectiveLocation.longitude);
      }

      const newRecord = await attendanceRepository.createEntry(entryData);

      await auditRepository.log({
        entity: 'Attendance',
        entityId: newRecord.id,
        action: 'ENTRY',
        performedBy: employeeId,
        details: options?.autoGeofence
          ? 'Registro automático de entrada por detección de geocerca (Consentimiento activo).'
          : 'Registro de entrada. Ubicación validada por geocerca (Consentimiento activo).',
        ip,
      });

      return { message: 'Entrada registrada exitosamente', record: newRecord };
    }

    if (type === 'EXIT') {
      if (!existingRecord) {
        throw new Error(
          'No se encontró registro de entrada para hoy. Debe registrar entrada primero.'
        );
      }
      if (existingRecord.checkOut) {
        throw new Error('Ya se ha registrado una salida para este día.');
      }

      const activeSchedule = await attendanceRepository.findActiveSchedule(employeeId, today);
      const exitMetrics = computeExitMetrics(now, existingRecord, activeSchedule);

      const exitData = {
        checkOut: now,
        ...exitMetrics,
        ipAddress: ip,
      };

      if (effectiveLocation?.latitude && effectiveLocation?.longitude && employee.trackingConsent) {
        exitData.exitLatitude = encryptCoordinate(effectiveLocation.latitude);
        exitData.exitLongitude = encryptCoordinate(effectiveLocation.longitude);
      }

      const updatedRecord = await attendanceRepository.updateExit(existingRecord.id, exitData);

      await auditRepository.log({
        entity: 'Attendance',
        entityId: updatedRecord.id,
        action: 'EXIT',
        performedBy: employeeId,
        details: options?.autoGeofence
          ? `Registro automático de salida al cruzar radio de geocerca. Horas trabajadas: ${exitMetrics.workedHours}.`
          : `Registro de salida. Horas trabajadas: ${exitMetrics.workedHours}. Ubicación validada por geocerca.`,
        ip,
      });

      return {
        message: 'Salida registrada exitosamente',
        record: updatedRecord,
        workedHours: exitMetrics.workedHours,
      };
    }

    if (type === 'BREAK_START') {
      if (!existingRecord) throw new Error('Debe registrar entrada antes de iniciar el almuerzo.');
      if (existingRecord.checkOut) throw new Error('Ya ha marcado su salida del día.');
      if (existingRecord.breakStart) throw new Error('Ya ha registrado un inicio de almuerzo.');

      await attendanceRepository.updateBreak(existingRecord.id, {
        breakStart: now,
        status: 'BREAK',
      });
      return { message: 'Inicio de almuerzo registrado', status: 'BREAK' };
    }

    if (type === 'BREAK_END') {
      if (!existingRecord) throw new Error('No hay registro de asistencia activo.');
      if (!existingRecord.breakStart) throw new Error('No ha iniciado el almuerzo.');
      if (existingRecord.breakEnd) throw new Error('Ya ha finalizado su almuerzo.');

      await attendanceRepository.updateBreak(existingRecord.id, {
        breakEnd: now,
        status: 'WORKING',
      });
      return { message: 'Fin de almuerzo registrado', status: 'WORKING' };
    }

    throw new Error('Tipo de registro no válido (Use ENTRY, EXIT, BREAK_START, BREAK_END).');
  },

  async getStatus(inputIdentifierRaw) {
    const inputIdentifier = inputIdentifierRaw?.toString().trim();
    if (!inputIdentifier) throw new Error('Identificador de empleado es requerido');

    const employee = await resolveEmployeeRecord(inputIdentifier);
    if (!employee) {
      if (isInternalId(inputIdentifier)) throw new Error('Empleado no encontrado');
      throw new Error(`No se encontró empleado con la cédula: ${inputIdentifier}`);
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let record = await attendanceRepository.findByEmployeeAndDate(employee.id, today);
    if (!record) {
      record = await attendanceRepository.findFirst(
        {
          employeeId: employee.id,
          checkOut: null,
          checkIn: { gte: new Date(Date.now() - 28 * 60 * 60 * 1000) },
        },
        { checkIn: 'desc' }
      );
    }

    const systemSettings = employee.tenantId
      ? await systemRepository.findByTenantId(employee.tenantId)
      : await systemRepository.findGlobalDefault();
    const geofence = resolveEmployeeGeofenceConfig(employee, systemSettings);

    const employeeData = {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      position: employee.position,
      department: employee.department,
      trackingConsent: Boolean(employee.trackingConsent),
      hasBiometric: Boolean(employee.biometricCredentials?.length > 0),
      geofence: {
        enabled: geofence.enabled,
        targetLat: geofence.targetLat,
        targetLng: geofence.targetLng,
        radius: geofence.radius,
      },
    };

    const activeSchedule = await attendanceRepository.findActiveSchedule(employee.id, today);
    const buildResponse = (status, rec = null) => {
      const response = { status, employee: employeeData, geofence: employeeData.geofence };
      if (rec) {
        response.checkIn = rec.checkIn;
        response.checkOut = rec.checkOut;
        response.breakStart = rec.breakStart;
        response.breakEnd = rec.breakEnd;
        const entryLoc = decryptLocationPair(rec.entryLatitude, rec.entryLongitude);
        if (entryLoc) response.entryLocation = entryLoc;
        const exitLoc = decryptLocationPair(rec.exitLatitude, rec.exitLongitude);
        if (exitLoc) response.exitLocation = exitLoc;
        response.isLate = computeEntryLateness(new Date(rec.checkIn), activeSchedule);
      }
      return response;
    };

    if (!record) return buildResponse('NOT_STARTED');
    if (record.checkIn && !record.checkOut) {
      return buildResponse(record.breakStart && !record.breakEnd ? 'ON_BREAK' : 'WORKING', record);
    }
    if (record.checkOut) return buildResponse('COMPLETED', record);

    return { status: 'UNKNOWN', employee: employeeData, geofence: employeeData.geofence };
  },
};
