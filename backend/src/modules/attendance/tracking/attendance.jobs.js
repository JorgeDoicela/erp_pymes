/**
 * @file attendance.jobs.js
 * @description Tarea programada para monitoreo de solicitudes de ausencia pendientes y escalamiento (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import cron from 'node-cron';
import { attendanceRepository } from './attendance.repository.js';
import { notificationService } from '../../notifications/index.js';

export const checkRequestReminders = async () => {
  try {
    const now = new Date();
    const pendingRequests = await attendanceRepository.findPendingAbsenceRequestsWithEmployee();

    const adminCache = new Map();
    const getAdmins = async (tenantId) => {
      if (!tenantId) return [];
      if (adminCache.has(tenantId)) return adminCache.get(tenantId);

      const admins = await attendanceRepository.findActiveAdminsByTenant(tenantId);
      adminCache.set(tenantId, admins);
      return admins;
    };

    for (const req of pendingRequests) {
      const admins = await getAdmins(req.employee?.tenantId);
      const created = new Date(req.createdAt);
      const diffHours = (now - created) / (1000 * 60 * 60);

      if (diffHours >= 24 && diffHours < 25) {
        await Promise.allSettled(
          admins.map((admin) =>
            notificationService.createNotification({
              recipientId: admin.id,
              title: 'Recordatorio de Solicitud Pendiente (24h)',
              message: `La solicitud de ausencia de ${req.employee.firstName} ${req.employee.lastName} sigue pendiente de aprobación (24 horas).`,
              type: 'REQUEST_REMINDER_ADMIN',
              relatedEntity: 'AbsenceRequest',
              relatedEntityId: req.id,
            })
          )
        );
      }

      if (diffHours >= 48 && diffHours < 49) {
        await Promise.allSettled(
          admins.map((admin) =>
            notificationService.createNotification({
              recipientId: admin.id,
              title: 'URGENTE: Escalamiento de Solicitud (48h)',
              message: `La solicitud de ausencia de ${req.employee.firstName} ${req.employee.lastName} lleva más de 48 horas sin respuesta. Por favor resuelva inmediatamente.`,
              type: 'REQUEST_ESCALATION_ADMIN',
              relatedEntity: 'AbsenceRequest',
              relatedEntityId: req.id,
            })
          )
        );
      }
    }
  } catch (error) {
    console.error('[CRON] Error checking request reminders:', error);
  }
};

export const initRequestMonitorCronJob = () => {
  cron.schedule('0 * * * *', checkRequestReminders);
};

export default {
  checkRequestReminders,
  initRequestMonitorCronJob,
};
