/**
 * @file absenceService.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { absenceRepository } from './absence.repository.js';
import { employeeRepository } from '../../employees/index.js';
import { notificationService } from '../../notifications/index.js';
import { ForbiddenError, NotFoundError } from '../../../core/errors/appError.js';

const VACATION_TYPE_KEYS = new Set(['vacaciones', 'vacation']);
const MAX_SINGLE_VACATION_REQUEST_DAYS = 30;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function isVacationType(type) {
  return VACATION_TYPE_KEYS.has(
    String(type || '')
      .trim()
      .toLowerCase()
  );
}

/**
 * Convierte una entrada de fecha (YYYY-MM-DD o Date) en fecha canónica sin corrimiento por zona horaria.
 * @param {string|Date} input
 * @returns {{ iso: string, utcNoon: Date, utcMidnightMs: number } | null}
 */
export function parseCanonicalCalendarDate(input) {
  if (!input) return null;

  if (typeof input === 'string') {
    const isoMatch = input.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const year = Number(isoMatch[1]);
      const month = Number(isoMatch[2]);
      const day = Number(isoMatch[3]);
      const probe = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      if (
        Number.isNaN(probe.getTime()) ||
        probe.getUTCFullYear() !== year ||
        probe.getUTCMonth() !== month - 1 ||
        probe.getUTCDate() !== day
      ) {
        return null;
      }
      return {
        iso: `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`,
        utcNoon: probe,
        utcMidnightMs: Date.UTC(year, month - 1, day),
      };
    }
  }

  const parsed = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getUTCFullYear();
  const month = parsed.getUTCMonth();
  const day = parsed.getUTCDate();
  const pad = (n) => String(n).padStart(2, '0');

  return {
    iso: `${year}-${pad(month + 1)}-${pad(day)}`,
    utcNoon: new Date(Date.UTC(year, month, day, 12, 0, 0)),
    utcMidnightMs: Date.UTC(year, month, day),
  };
}

export function calculateCalendarDays(startInput, endInput) {
  const start = parseCanonicalCalendarDate(startInput);
  const end = parseCanonicalCalendarDate(endInput);
  if (!start || !end) return 0;

  return Math.max(1, Math.round((end.utcMidnightMs - start.utcMidnightMs) / MS_PER_DAY) + 1);
}

export function getEcuadorTodayIso() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guayaquil',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export const absenceService = {
  async getPendingVacationDays(employeeId, tenantId = null) {
    const pendingRequests = await absenceRepository.getPendingRequestsByEmployee(
      employeeId,
      tenantId
    );
    return (pendingRequests || [])
      .filter((req) => isVacationType(req.type))
      .reduce((acc, req) => acc + calculateCalendarDays(req.startDate, req.endDate), 0);
  },

  async previewVacationRequest({
    employeeId,
    tenantId,
    startDate,
    endDate,
    reason,
    allowPastDates = false,
  }) {
    if (!tenantId) {
      throw new Error('Contexto de empresa (tenantId) requerido para validar vacaciones.');
    }

    const employee = await employeeRepository.findById(employeeId);
    if (!employee || !employee.isActive) {
      throw new Error('Colaborador no encontrado o inactivo en el sistema.');
    }

    if (employee.tenantId !== tenantId) {
      throw new Error('Acceso denegado: el colaborador no pertenece a la empresa activa.');
    }

    const start = parseCanonicalCalendarDate(startDate);
    const end = parseCanonicalCalendarDate(endDate);
    if (!start || !end) {
      throw new Error('Las fechas de inicio y fin deben tener formato válido YYYY-MM-DD.');
    }

    if (end.utcMidnightMs < start.utcMidnightMs) {
      throw new Error('La fecha de fin de la ausencia no puede ser anterior a la fecha de inicio.');
    }

    if (!allowPastDates) {
      const todayIso = getEcuadorTodayIso();
      if (start.iso < todayIso) {
        throw new Error(
          `La fecha de inicio (${start.iso}) no puede ser anterior a la fecha actual (${todayIso}).`
        );
      }
    }

    const daysRequested = calculateCalendarDays(start.iso, end.iso);
    if (daysRequested > MAX_SINGLE_VACATION_REQUEST_DAYS) {
      throw new Error(
        `Una solicitud individual no puede superar ${MAX_SINGLE_VACATION_REQUEST_DAYS} días calendario.`
      );
    }

    const cleanReason = String(reason || '').trim();
    if (cleanReason.length < 3) {
      throw new Error('Debe indicar un motivo válido de al menos 3 caracteres.');
    }

    const existingOverlap = await absenceRepository.findOverlapping(
      employeeId,
      start.utcNoon,
      end.utcNoon,
      tenantId
    );

    if (existingOverlap) {
      throw new Error(
        'El colaborador ya cuenta con una solicitud de ausencia pendiente o aprobada en ese rango de fechas.'
      );
    }

    const pendingVacationDays = await this.getPendingVacationDays(employeeId, tenantId);
    const vacationDaysTotal = Number(employee.vacationDays || 0);
    const netAvailableBefore = Math.max(0, vacationDaysTotal - pendingVacationDays);

    if (netAvailableBefore < daysRequested) {
      throw new Error(
        `Saldo neto insuficiente. Tienes ${vacationDaysTotal} días disponibles (${pendingVacationDays} días en solicitudes pendientes; saldo neto: ${netAvailableBefore} días) y solicitaste ${daysRequested}.`
      );
    }

    return {
      employeeId,
      tenantId,
      startDate: start.iso,
      endDate: end.iso,
      startUtc: start.utcNoon,
      endUtc: end.utcNoon,
      daysRequested,
      reason: cleanReason,
      vacationDaysTotal,
      pendingVacationDays,
      netAvailableBefore,
      projectedAvailableAfter: netAvailableBefore - daysRequested,
    };
  },

  async createRequest({
    employeeId,
    tenantId = null,
    type,
    startDate,
    endDate,
    reason,
    file,
    allowPastDates = true,
  }) {
    const start = parseCanonicalCalendarDate(startDate);
    const end = parseCanonicalCalendarDate(endDate);

    if (!start || !end) {
      throw new Error('Las fechas de inicio y fin no son válidas.');
    }

    if (end.utcMidnightMs < start.utcMidnightMs) {
      throw new Error('La fecha de fin de la ausencia no puede ser anterior a la fecha de inicio');
    }

    const employee = await employeeRepository.findById(employeeId);
    if (!employee) throw new Error('Empleado no encontrado');

    if (tenantId && employee.tenantId !== tenantId) {
      throw new Error('Acceso denegado: el colaborador no pertenece a la empresa activa.');
    }

    const effectiveTenantId = tenantId || employee.tenantId || null;

    if (!allowPastDates && start.iso < getEcuadorTodayIso()) {
      throw new Error('La fecha de inicio de la solicitud no puede estar en el pasado.');
    }

    const daysRequested = calculateCalendarDays(start.iso, end.iso);

    // Detección de solapamiento de ausencias vía Repository (aislada por tenant si aplica)
    const existingOverlap = await absenceRepository.findOverlapping(
      employeeId,
      start.utcNoon,
      end.utcNoon,
      effectiveTenantId
    );

    if (existingOverlap) {
      throw new Error(
        'El empleado ya cuenta con una solicitud de ausencia en este rango de fechas.'
      );
    }

    // Validación de Vacaciones (descontando solicitudes PENDING previas para evitar sobrecompromiso)
    const cleanType = String(type || '').trim();
    if (isVacationType(cleanType)) {
      const pendingVacationDays = await this.getPendingVacationDays(employeeId, effectiveTenantId);
      const netAvailable = Math.max(0, Number(employee.vacationDays || 0) - pendingVacationDays);
      if (netAvailable < daysRequested) {
        throw new Error(
          `Saldo insuficiente. Tienes ${employee.vacationDays} días (${pendingVacationDays} comprometidos en solicitudes pendientes), solicitaste ${daysRequested}.`
        );
      }
    }

    const data = {
      employeeId,
      type: cleanType || type,
      startDate: start.utcNoon,
      endDate: end.utcNoon,
      reason: String(reason || '').trim(),
      status: 'PENDING',
      evidenceUrl: file ? file.filename : null,
    };

    const request = await absenceRepository.createRequest(data);

    this.notifyAdminsOnAbsenceRequest({
      employeeId,
      request,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      tenantId: effectiveTenantId,
    }).catch((err) => console.error('[AbsenceNotification] Error dispatching alerts:', err));

    return request;
  },

  async notifyAdminsOnAbsenceRequest({ employeeId, request, type, startDate, endDate, tenantId }) {
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) return;
    const employeeTenantId = employee.tenantId || tenantId;

    const admins = await employeeRepository.findAll({
      tenantId: employeeTenantId,
    });
    const adminList = (admins || []).filter((a) => a.role === 'admin' && a.isActive);

    await Promise.allSettled(
      adminList.map((admin) =>
        notificationService.sendAbsenceRequested({
          recipientId: admin.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          type,
          startDate,
          endDate,
          requestId: request.id,
        })
      )
    );
  },

  async getAllRequests(filter) {
    return absenceRepository.getAllRequests(filter);
  },

  async getEmployeeRequests(employeeId) {
    return absenceRepository.getByEmployee(employeeId);
  },

  async updateRequestStatus({ id, status, adminComment, tenantId }) {
    // 1. Aislamiento multi-tenant: sin contexto de empresa no se gestiona ninguna solicitud
    if (!tenantId) {
      throw new ForbiddenError('Se requiere el contexto de la empresa para gestionar solicitudes');
    }

    // 2. Validar que exista dentro de la empresa del usuario (otra empresa responde 404)
    const request = await absenceRepository.getRequestById(id, tenantId);
    if (!request) throw new NotFoundError('Solicitud no encontrada');

    if (request.status === status) {
      return request;
    }

    const isVacation = isVacationType(request.type);
    const days = calculateCalendarDays(request.startDate, request.endDate);

    let updated;

    // Aprobar vacaciones -> Restar días
    if (status === 'APPROVED' && isVacation && request.status !== 'APPROVED') {
      updated = await absenceRepository.approveVacationWithDecrement(
        id,
        request.employeeId,
        days,
        status,
        adminComment
      );
    } else if (
      request.status === 'APPROVED' &&
      ['REJECTED', 'CANCELLED'].includes(status) &&
      isVacation
    ) {
      // Revertir aprobación previa de vacaciones -> Reintegrar días
      updated = await absenceRepository.revertVacationWithIncrement(
        id,
        request.employeeId,
        days,
        status,
        adminComment
      );
    } else {
      // Flujo normal
      updated = await absenceRepository.updateStatus(id, status, adminComment);
    }

    // Notificar al colaborador
    notificationService
      .sendAbsenceStatusUpdated({
        recipientId: request.employeeId,
        type: request.type,
        status,
        adminComment,
      })
      .catch((err) => console.error('[AbsenceNotification] Error notifying employee:', err));

    return updated;
  },
};

export default absenceService;
