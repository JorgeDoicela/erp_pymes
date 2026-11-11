/**
 * @file payroll.jobs.js
 * @description Norma ERP - Tareas Programadas (Cron) del Dominio de Nómina
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import cron from 'node-cron';
import prisma from '../../../database/db.js';
import { notificationService } from '../../notifications/index.js';

export const checkPayrollReminders = async () => {
  console.log('[CRON] Checking Payroll Reminders...');

  try {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const paymentDate = new Date(currentYear, currentMonth + 1, 0);
    const closingDate = new Date(paymentDate);
    closingDate.setDate(paymentDate.getDate() - 5);

    const diffDays = (target) => {
      const oneDay = 24 * 60 * 60 * 1000;
      const t = new Date(target).setHours(0, 0, 0, 0);
      const n = new Date(today).setHours(0, 0, 0, 0);
      return Math.round((t - n) / oneDay);
    };

    const daysToClosing = diffDays(closingDate);
    const daysToPayment = diffDays(paymentDate);

    const admins = await prisma.employee.findMany({
      where: { role: 'admin', isActive: true },
      select: { id: true, tenantId: true },
    });

    if (daysToClosing === 5) {
      for (const admin of admins) {
        await notificationService.sendPayrollAlert({
          recipientId: admin.id,
          title: 'Recordatorio: Cierre de Nómina Próximo',
          message: `Faltan 5 días para el cierre de novedades de nómina (${closingDate.toLocaleDateString()}). Por favor verifique asistencias y permisos.`,
          type: 'PAYROLL_CLOSING',
        });
      }
      console.log(
        `[PAYROLL] Use case: Closing Warning sent (Target: ${closingDate.toDateString()})`
      );
    }

    if (daysToPayment === 3) {
      for (const admin of admins) {
        await notificationService.sendPayrollAlert({
          recipientId: admin.id,
          title: 'Alerta: Revisión de Nómina',
          message: `La fecha de pago es el ${paymentDate.toLocaleDateString()}. Faltan 3 días. Es momento de revisar y generar los borradores.`,
          type: 'PAYROLL_REVIEW',
        });
      }
      console.log(`[PAYROLL] Use case: Review Alert sent (Target: ${paymentDate.toDateString()})`);
    }

    if (daysToPayment === 1) {
      for (const admin of admins) {
        await notificationService.sendPayrollAlert({
          recipientId: admin.id,
          title: 'URGENTE: Mañana es día de Pago',
          message: `Confirme que la nómina esté finalizada. El pago está programado para mañana ${paymentDate.toLocaleDateString()}.`,
          type: 'PAYROLL_CONFIRM',
        });
      }
      console.log(
        `[PAYROLL] Use case: Confirmation Alert sent (Target: ${paymentDate.toDateString()})`
      );
    }
  } catch (error) {
    console.error('[CRON] Error checking payroll reminders:', error);
  }
};

export const initPayrollCronJob = () => {
  cron.schedule('0 9 * * *', checkPayrollReminders);
  console.log('[CRON] Payroll Reminder Cron Job scheduled (09:00 Daily).');
};
