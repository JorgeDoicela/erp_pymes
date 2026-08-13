import cron from 'node-cron';
import prisma from '../database/db.js';
import notificationService from '../services/notifications/notificationService.js';

export const checkRequestReminders = async () => {
    console.log('[CRON] Checking for Pending Requests (Reminders & Escalations)...');

    try {
        const now = new Date();
        const pendingRequests = await prisma.absenceRequest.findMany({
            where: { status: 'PENDING' },
            include: { employee: true }
        });

        for (const req of pendingRequests) {
            const tenantId = req.employee?.tenantId;
            const admins = await prisma.employee.findMany({
                where: {
                    role: 'admin',
                    isActive: true,
                    ...(tenantId ? { tenantId } : {})
                },
                select: { id: true, email: true }
            });

            const created = new Date(req.createdAt);
            const diffMs = now - created;
            const diffHours = diffMs / (1000 * 60 * 60);

            // 1. Reminder after 24 hours (Allowing a 1h window: 24 <= h < 25)
            if (diffHours >= 24 && diffHours < 25) {
                console.log(`[CRON] Sending 24h Reminder for Request ${req.id}`);
                for (const admin of admins) {
                    await notificationService.sendAbsenceReminder({
                        recipientId: admin.id,
                        employeeName: `${req.employee.firstName} ${req.employee.lastName}`,
                        hoursPending: Math.floor(diffHours),
                        requestId: req.id
                    });
                }
            }

            // 2. Escalation after 48 hours (48 <= h < 49)
            if (diffHours >= 48 && diffHours < 49) {
                console.log(`[CRON] Sending 48h Escalation for Request ${req.id}`);
                for (const admin of admins) {
                    await notificationService.sendAbsenceEscalation({
                        recipientId: admin.id,
                        employeeName: `${req.employee.firstName} ${req.employee.lastName}`,
                        hoursPending: Math.floor(diffHours),
                        requestId: req.id
                    });
                }
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
