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

export const absenceService = {
  async createRequest({ employeeId, type, startDate, endDate, reason, file }) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const cleanStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const cleanEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const daysRequested = Math.max(
      1,
      Math.round((cleanEnd - cleanStart) / (1000 * 60 * 60 * 24)) + 1
    );

    if (end < start) {
      throw new Error('La fecha de fin de la ausencia no puede ser anterior a la fecha de inicio');
    }

    // Detección de solapamiento de ausencias vía Repository
    const existingOverlap = await absenceRepository.findOverlapping(employeeId, start, end);

    if (existingOverlap) {
      throw new Error(
        'El empleado ya cuenta con una solicitud de ausencia en este rango de fechas.'
      );
    }

    // Validación de Vacaciones
    const cleanType = type.trim();

    if (
      ['Vacaciones', 'VACATION', 'vacaciones'].some(
        (t) => t.toLowerCase() === cleanType.toLowerCase()
      )
    ) {
      const employee = await employeeRepository.findById(employeeId);
      if (!employee) throw new Error('Empleado no encontrado');

      if (employee.vacationDays < daysRequested) {
        throw new Error(
          `Saldo insuficiente. Tienes ${employee.vacationDays} días, solicitaste ${daysRequested}.`
        );
      }
    }

    const data = {
      employeeId,
      type,
      startDate: start,
      endDate: end,
      reason,
      status: 'PENDING',
      evidenceUrl: file ? file.filename : null,
    };

    const request = await absenceRepository.createRequest(data);

    this.notifyAdminsOnAbsenceRequest({
      employeeId,
      request,
      type,
      startDate,
      endDate,
      tenantId: data.tenantId,
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

  async updateRequestStatus(id, status, adminComment) {
    // 1. Validar que exista
    const request = await absenceRepository.getRequestById(id);
    if (!request) throw new Error('Solicitud no encontrada');

    if (request.status === status) {
      return request;
    }

    const requestType = request.type.trim();
    const isVacation = ['Vacaciones', 'VACATION', 'vacaciones'].includes(requestType);

    const start = new Date(request.startDate);
    const end = new Date(request.endDate);
    const cleanStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const cleanEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const days = Math.max(1, Math.round((cleanEnd - cleanStart) / (1000 * 60 * 60 * 24)) + 1);

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
