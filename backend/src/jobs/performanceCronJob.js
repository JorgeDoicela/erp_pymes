import cron from 'node-cron';
import prisma from '../database/db.js';
import notificationService from '../services/notifications/notificationService.js';

export const checkPerformanceReminders = async () => {
    console.log('--- Running Performance Review Reminder Check ---');
    try {
        const today = new Date();
        const futureDate7 = new Date(); futureDate7.setDate(today.getDate() + 7);
        const futureDate3 = new Date(); futureDate3.setDate(today.getDate() + 3);

        // 1. Find ACTIVE evaluations that are pending
        const evaluations = await prisma.employeeEvaluation.findMany({
            where: {
                status: { in: ['PENDING', 'IN_PROGRESS'] },
                endDate: { not: null }
            },
            include: {
                employee: true,
                template: true,
                reviewers: {
                    where: { status: 'PENDING' },
                    include: { reviewer: true }
                }
            }
        });

        const isSameDay = (d1, d2) =>
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();

        for (const evaluation of evaluations) {
            const endDate = new Date(evaluation.endDate);

            // Check triggers: 7 days or 3 days before deadline
            const daysRemaining = isSameDay(endDate, futureDate7) ? 7 :
                isSameDay(endDate, futureDate3) ? 3 : null;

            if (daysRemaining) {
                // Notify Pending Reviewers
                for (const reviewerRel of evaluation.reviewers) {
                    await notificationService.sendEvaluationReminder({
                        recipientId: reviewerRel.reviewerId,
                        recipientEmail: reviewerRel.reviewer.email,
                        employeeName: `${evaluation.employee.firstName} ${evaluation.employee.lastName}`,
                        daysRemaining: daysRemaining,
                        evaluationId: evaluation.id
                    });
                }
            }

            // Check for Expiration (Expired yesterday/today? To avoid spamming everyday)
            // Let's notify HR if it is EXACTLY the day after deadline or just expired state.
            // For now, let's catch valid "Expired" state to alert HR once. 
            // A simple way is to check if it matches "Yesterday" to send the "Just Expired" alert.
            const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
            if (isSameDay(endDate, yesterday) || (endDate < today && evaluation.status !== 'COMPLETED')) {
                // We might want to limit spam. Let's send only if it expired TODAY/YESTERDAY to be safe, 
                // or assume checks run daily. 
                // Better approach: Check if notification already sent? 
                // For MVP, checking "Expired Yesterday" is a good trigger for "Just became overdue".
                if (isSameDay(endDate, yesterday)) {
                    await notificationService.sendEvaluationExpiredAlert({
                        employeeName: `${evaluation.employee.firstName} ${evaluation.employee.lastName}`,
                        evaluationId: evaluation.id
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
