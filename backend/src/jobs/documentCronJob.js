import cron from 'node-cron';
import prisma from '../database/db.js';
import notificationService from '../services/notifications/notificationService.js';

export const checkDocumentExpirations = async () => {
    console.log('[CRON] Checking for Expiring Documents...');

    try {
        const today = new Date();
        const future30 = new Date(today); future30.setDate(today.getDate() + 30);
        const future15 = new Date(today); future15.setDate(today.getDate() + 15);

        // Define function to check specific date
        const checkDate = async (targetDate, days) => {
            const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

            const documents = await prisma.document.findMany({
                where: {
                    expiryDate: { gte: startOfDay, lte: endOfDay }
                },
                include: { employee: true }
            });

            for (const doc of documents) {
                // Notify Employee
                await notificationService.sendDocumentExpirationAlert({
                    recipientId: doc.employeeId,
                    documentType: doc.type,
                    daysRemaining: days,
                    documentId: doc.id
                });

                // Notify Admins
                const admins = await prisma.employee.findMany({ where: { role: 'admin', isActive: true } });
                for (const admin of admins) {
                    await notificationService.createNotification({
                        recipientId: admin.id,
                        title: `Vencimiento de Documento (Empleado)`,
                        message: `El documento "${doc.type}" de ${doc.employee.firstName} ${doc.employee.lastName} vence en ${days} días.`,
                        type: 'DOCUMENT_EXPIRATION_HR',
                        relatedEntity: 'Document',
                        relatedEntityId: doc.id
                    });
                }
            }
        };

        // Check for 30 days and 15 days
        await checkDate(future30, 30);
        await checkDate(future15, 15);

        // Check for Expired Yesterday (or Today if we want immediate alert on expiration)
        // Let's check expired YESTERDAY to mark as 'Overdue' alert
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        const expired = await prisma.document.findMany({
            where: {
                expiryDate: {
                    gte: new Date(yesterday.setHours(0, 0, 0, 0)),
                    lte: new Date(yesterday.setHours(23, 59, 59, 999))
                }
            },
            include: { employee: true }
        });

        for (const doc of expired) {
            const admins = await prisma.employee.findMany({ where: { role: 'admin', isActive: true } });
            for (const admin of admins) {
                await notificationService.createNotification({
                    recipientId: admin.id,
                    title: `Documento Vencido`,
                    message: `El documento "${doc.type}" de ${doc.employee.firstName} ${doc.employee.lastName} HA VENCIDO.`,
                    type: 'DOCUMENT_EXPIRED',
                    relatedEntity: 'Document',
                    relatedEntityId: doc.id
                });
            }
        }

    } catch (error) {
        console.error('[CRON] Error checking document expirations:', error);
    }
};

export const initDocumentCronJob = () => {
    // Run every day at 08:30
    cron.schedule('30 8 * * *', checkDocumentExpirations);
    console.log('[CRON] Document Expiration Cron Job scheduled (08:30 Daily).');
};
