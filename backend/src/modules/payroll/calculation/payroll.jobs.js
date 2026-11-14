/**
 * @file payroll.jobs.js
 * @description Norma ERP - Tareas Programadas (Cron) del Dominio de Nómina
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import cron from 'node-cron';
import payrollRepository from './payroll.repository.js';
import { notificationService } from '../../notifications/index.js';

const getDiffDays = (today, target) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const t = new Date(target).setHours(0, 0, 0, 0);
  const n = new Date(today).setHours(0, 0, 0, 0);
  return Math.round((t - n) / oneDay);
};

const notifyAdmins = async (admins, payload) => {
  for (const admin of admins) {
    await notificationService.sendPayrollAlert({
      recipientId: admin.id,
      ...payload,
    });
  }
};

export const checkPayrollReminders = async () => {
  try {
    const today = new Date();
    const paymentDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const closingDate = new Date(paymentDate);
    closingDate.setDate(paymentDate.getDate() - 5);

    const daysToClosing = getDiffDays(today, closingDate);
    const daysToPayment = getDiffDays(today, paymentDate);
    const admins = await payrollRepository.findActiveAdmins();

    if (daysToClosing === 5) {
      await notifyAdmins(admins, {
        title: 'Recordatorio: Cierre de Nómina Próximo',
        message: `Faltan 5 días para el cierre de novedades de nómina (${closingDate.toLocaleDateString()}). Por favor verifique asistencias y permisos.`,
        type: 'PAYROLL_CLOSING',
      });
    }

    if (daysToPayment === 3) {
      await notifyAdmins(admins, {
        title: 'Alerta: Revisión de Nómina',
        message: `La fecha de pago es el ${paymentDate.toLocaleDateString()}. Faltan 3 días. Es momento de revisar y generar los borradores.`,
        type: 'PAYROLL_REVIEW',
      });
    }

    if (daysToPayment === 1) {
      await notifyAdmins(admins, {
        title: 'URGENTE: Mañana es día de Pago',
        message: `Confirme que la nómina esté finalizada. El pago está programado para mañana ${paymentDate.toLocaleDateString()}.`,
        type: 'PAYROLL_CONFIRM',
      });
    }
  } catch (error) {
    console.error('[CRON] Error checking payroll reminders:', error);
  }
};

export const initPayrollCronJob = () => {
  cron.schedule('0 9 * * *', checkPayrollReminders);
};
