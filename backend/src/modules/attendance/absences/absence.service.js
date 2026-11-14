/**
 * @file absenceService.js
 * @description Servicio de dominio para ausencias, permisos y vacaciones con aislamiento multi-tenant.
 */

import { absenceRepository } from './absence.repository.js';
import { employeeRepository } from '../../employees/index.js';
import { notificationService } from '../../notifications/index.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../core/errors/appError.js';
import {
  isVacationType,
  parseCanonicalCalendarDate,
  calculateCalendarDays,
  getEcuadorTodayIso,
} from './absenceDate.helper.js';

export { isVacationType, parseCanonicalCalendarDate, calculateCalendarDays, getEcuadorTodayIso };

const MAX_SINGLE_VACATION_REQUEST_DAYS = 30;

export const absenceService = {
  async getPendingVacationDays(employeeId, tenantId = null) {
    const reqs = await absenceRepository.getPendingRequestsByEmployee(employeeId, tenantId);
    return (reqs || [])
      .filter((r) => isVacationType(r.type))
      .reduce((acc, r) => acc + calculateCalendarDays(r.startDate, r.endDate), 0);
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
      throw new ForbiddenError('Contexto de empresa (tenantId) requerido para validar vacaciones.');
    }
    const employee = await employeeRepository.findById(employeeId);
    if (!employee || !employee.isActive) {
      throw new NotFoundError('Colaborador no encontrado o inactivo en el sistema.');
    }
    if (employee.tenantId !== tenantId) {
      throw new ForbiddenError('Acceso denegado: el colaborador no pertenece a la empresa activa.');
    }

    const [start, end] = [
      parseCanonicalCalendarDate(startDate),
      parseCanonicalCalendarDate(endDate),
    ];
    if (!start || !end) {
      throw new ValidationError(
        'Las fechas de inicio y fin deben tener formato válido YYYY-MM-DD.'
      );
    }
    if (end.utcMidnightMs < start.utcMidnightMs) {
      throw new ValidationError(
        'La fecha de fin de la ausencia no puede ser anterior a la fecha de inicio.'
      );
    }
    const todayIso = getEcuadorTodayIso();
    if (!allowPastDates && start.iso < todayIso) {
      throw new ValidationError(
        `La fecha de inicio (${start.iso}) no puede ser anterior a la fecha actual (${todayIso}).`
      );
    }

    const daysRequested = calculateCalendarDays(start.iso, end.iso);
    if (daysRequested > MAX_SINGLE_VACATION_REQUEST_DAYS) {
      throw new ValidationError(
        `Una solicitud individual no puede superar ${MAX_SINGLE_VACATION_REQUEST_DAYS} días calendario.`
      );
    }
    const cleanReason = String(reason || '').trim();
    if (cleanReason.length < 3) {
      throw new ValidationError('Debe indicar un motivo válido de al menos 3 caracteres.');
    }

    const overlap = await absenceRepository.findOverlapping(
      employeeId,
      start.utcNoon,
      end.utcNoon,
      tenantId
    );
    if (overlap) {
      throw new ConflictError(
        'El colaborador ya cuenta con una solicitud de ausencia pendiente o aprobada en ese rango de fechas.'
      );
    }

    const pendingVacationDays = await this.getPendingVacationDays(employeeId, tenantId);
    const vacationDaysTotal = Number(employee.vacationDays || 0);
    const netAvailableBefore = Math.max(0, vacationDaysTotal - pendingVacationDays);
    if (netAvailableBefore < daysRequested) {
      throw new ValidationError(
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
    const [start, end] = [
      parseCanonicalCalendarDate(startDate),
      parseCanonicalCalendarDate(endDate),
    ];
    if (!start || !end) throw new ValidationError('Las fechas de inicio y fin no son válidas.');
    if (end.utcMidnightMs < start.utcMidnightMs) {
      throw new ValidationError(
        'La fecha de fin de la ausencia no puede ser anterior a la fecha de inicio'
      );
    }

    const employee = await employeeRepository.findById(employeeId);
    if (!employee) throw new NotFoundError('Empleado no encontrado');
    if (tenantId && employee.tenantId !== tenantId) {
      throw new ForbiddenError('Acceso denegado: el colaborador no pertenece a la empresa activa.');
    }

    const effectiveTenantId = tenantId || employee.tenantId || null;
    if (!allowPastDates && start.iso < getEcuadorTodayIso()) {
      throw new ValidationError('La fecha de inicio de la solicitud no puede estar en el pasado.');
    }

    const daysRequested = calculateCalendarDays(start.iso, end.iso);
    const overlap = await absenceRepository.findOverlapping(
      employeeId,
      start.utcNoon,
      end.utcNoon,
      effectiveTenantId
    );
    if (overlap) {
      throw new ConflictError(
        'El empleado ya cuenta con una solicitud de ausencia en este rango de fechas.'
      );
    }

    const cleanType = String(type || '').trim();
    if (isVacationType(cleanType)) {
      const pendingVacationDays = await this.getPendingVacationDays(employeeId, effectiveTenantId);
      const netAvailable = Math.max(0, Number(employee.vacationDays || 0) - pendingVacationDays);
      if (netAvailable < daysRequested) {
        throw new ValidationError(
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
    const admins = await employeeRepository.findAll({ tenantId: employee.tenantId || tenantId });
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

  async getEmployeeRequests(employeeId, tenantId = null) {
    return absenceRepository.getByEmployee(employeeId, tenantId);
  },

  async updateRequestStatus(arg1, statusArg, adminCommentArg, tenantIdArg) {
    const { id, status, adminComment, tenantId } =
      arg1 && typeof arg1 === 'object'
        ? arg1
        : { id: arg1, status: statusArg, adminComment: adminCommentArg, tenantId: tenantIdArg };
    if (!tenantId)
      throw new ForbiddenError('Se requiere el contexto de la empresa para gestionar solicitudes');

    const request = await absenceRepository.getRequestById(id, tenantId);
    if (!request) throw new NotFoundError('Solicitud no encontrada');
    if (request.status === status) return request;

    const isVacation = isVacationType(request.type);
    const days = calculateCalendarDays(request.startDate, request.endDate);
    let updated;

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
      updated = await absenceRepository.revertVacationWithIncrement(
        id,
        request.employeeId,
        days,
        status,
        adminComment
      );
    } else {
      updated = await absenceRepository.updateStatus(id, status, adminComment);
    }

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
