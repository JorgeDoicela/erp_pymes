/**
 * @file performance.jobs.js
 * @description Tarea programada de recordatorios y alertas de vencimiento de evaluaciones de desempeño (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import cron from 'node-cron';
import prisma from '../../database/db.js';
import notificationService from '../notifications/notification.service.js';

export const checkPerformanceReminders = async () => {
  console.log('--- Running Performance Review Reminder Check ---');
  try {
    const today = new Date();
    const futureDate7 = new Date();
    futureDate7.setDate(today.getDate() + 7);
    const futureDate3 = new Date();
    futureDate3.setDate(today.getDate() + 3);

    // 1. Find ACTIVE evaluations that are pending
    const evaluations = await prisma.employeeEvaluation.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        NOT: { endDate: null },
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, email: true, tenantId: true },
        },
        template: {
          select: { id: true, title: true },
        },
        reviewers: {
          where: { status: 'PENDING' },
          include: {
            reviewer: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    const isSameDay = (d1, d2) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    for (const evaluation of evaluations) {
      const endDate = new Date(evaluation.endDate);

      // Check triggers: 7 days or 3 days before deadline
      const daysRemaining = isSameDay(endDate, futureDate7)
        ? 7
        : isSameDay(endDate, futureDate3)
          ? 3
          : null;

      if (daysRemaining) {
        // Notify Pending Reviewers
        for (const reviewerRel of evaluation.reviewers) {
          await notificationService.sendEvaluationReminder({
            recipientId: reviewerRel.reviewerId,
            recipientEmail: reviewerRel.reviewer.email,
            employeeName: `${evaluation.employee.firstName} ${evaluation.employee.lastName}`,
            daysRemaining: daysRemaining,
            evaluationId: evaluation.id,
          });
        }
      }

      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      if (isSameDay(endDate, yesterday) || (endDate < today && evaluation.status !== 'COMPLETED')) {
        if (isSameDay(endDate, yesterday)) {
          await notificationService.sendEvaluationExpiredAlert({
            employeeName: `${evaluation.employee.firstName} ${evaluation.employee.lastName}`,
            evaluationId: evaluation.id,
            tenantId: evaluation.employee?.tenantId,
          });
        }
      }
    }
    console.log('--- Performance Check Completed ---');
  } catch (error) {
    console.error('Error in performance cron job:', error);
  }
};

export const initPerformanceCronJob = () => {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    await checkPerformanceReminders();
  });
  console.log('Performance Cron Job initialized (0 9 * * *)');
};

export default {
  checkPerformanceReminders,
  initPerformanceCronJob,
};
