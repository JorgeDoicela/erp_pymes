/**
 * @file attendance.jobs.js
 * @description Tarea programada para monitoreo de solicitudes de ausencia pendientes y escalamiento (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import cron from 'node-cron';
import prisma from '../../database/db.js';
import notificationService from '../notifications/notification.service.js';

export const checkRequestReminders = async () => {
  console.log('[CRON] Checking for Pending Requests (Reminders & Escalations)...');

  try {
    const now = new Date();
    const pendingRequests = await prisma.absenceRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, tenantId: true },
        },
      },
    });

    const adminCache = new Map();
    const getAdmins = async (tenantId) => {
      const cacheKey = tenantId || 'default';
      if (adminCache.has(cacheKey)) return adminCache.get(cacheKey);

      const admins = await prisma.employee.findMany({
        where: {
          role: 'admin',
          isActive: true,
          ...(tenantId ? { tenantId } : {}),
        },
        select: { id: true },
      });
      adminCache.set(cacheKey, admins);
      return admins;
    };

    for (const req of pendingRequests) {
      const admins = await getAdmins(req.employee?.tenantId);
      const created = new Date(req.createdAt);
      const diffMs = now - created;
      const diffHours = diffMs / (1000 * 60 * 60);

      // 1. Reminder after 24 hours (Allowing a 1h window: 24 <= h < 25)
      if (diffHours >= 24 && diffHours < 25) {
        await Promise.allSettled(
          admins.map((admin) =>
            notificationService.createNotification({
              recipientId: admin.id,
              title: `Recordatorio de Solicitud Pendiente (24h)`,
              message: `La solicitud de ausencia de ${req.employee.firstName} ${req.employee.lastName} sigue pendiente de aprobación (24 horas).`,
              type: 'REQUEST_REMINDER_ADMIN',
              relatedEntity: 'AbsenceRequest',
              relatedEntityId: req.id,
            })
          )
        );
      }

      // 2. Escalation after 48 hours (Allowing a 1h window: 48 <= h < 49)
      if (diffHours >= 48 && diffHours < 49) {
        await Promise.allSettled(
          admins.map((admin) =>
            notificationService.createNotification({
              recipientId: admin.id,
              title: `URGENTE: Escalamiento de Solicitud (48h)`,
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
  // Run every hour at minute 0
  cron.schedule('0 * * * *', checkRequestReminders);
  console.log('[CRON] Request Monitor Cron Job scheduled (Hourly).');
};

export default {
  checkRequestReminders,
  initRequestMonitorCronJob,
};
