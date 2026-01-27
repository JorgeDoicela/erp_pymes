import cron from 'node-cron';
import prisma from '../database/db.js';
import notificationService from '../services/notifications/notificationService.js';

export const checkPayrollReminders = async () => {
    console.log('[CRON] Checking Payroll Reminders...');

    try {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // 1. Determine Payment Date (Last day of current month)
        // new Date(year, month + 1, 0) gives the last day of the month
        const paymentDate = new Date(currentYear, currentMonth + 1, 0);

        // 2. Determine Closing Date (5 days before Payment)
        const closingDate = new Date(paymentDate);
        closingDate.setDate(paymentDate.getDate() - 5);

        // Calculate differences in days (ignoring time)
        const diffDays = (target) => {
            const oneDay = 24 * 60 * 60 * 1000;
            // Reset hours for accurate day diff
            const t = new Date(target).setHours(0, 0, 0, 0);
            const n = new Date(today).setHours(0, 0, 0, 0);
            return Math.round((t - n) / oneDay);
        };

        const daysToClosing = diffDays(closingDate);
        const daysToPayment = diffDays(paymentDate);

        // Find Admins
        const admins = await prisma.employee.findMany({ where: { role: 'admin', isActive: true } });

        // Logic 1: Closing Warning (5 days before Closing)
        // If Closing is 25th, 5 days before is 20th. (daysToClosing === 5)
        if (daysToClosing === 5) {
            for (const admin of admins) {
                await notificationService.sendPayrollAlert({
                    recipientId: admin.id,
                    title: 'Recordatorio: Cierre de Nómina Próximo',
                    message: `Faltan 5 días para el cierre de novedades de nómina (${closingDate.toLocaleDateString()}). Por favor verifique asistencias y permisos.`,
                    type: 'PAYROLL_CLOSING'
                });
            }
            console.log(`[PAYROLL] Use case: Closing Warning sent (Target: ${closingDate.toDateString()})`);
        }

        // Logic 2: Review Alert (3 days before Payment)
        // If Payment is 30th, 3 days before is 27th. (daysToPayment === 3)
        if (daysToPayment === 3) {
            for (const admin of admins) {
                await notificationService.sendPayrollAlert({
                    recipientId: admin.id,
                    title: 'Alerta: Revisión de Nómina',
                    message: `La fecha de pago es el ${paymentDate.toLocaleDateString()}. Faltan 3 días. Es momento de revisar y generar los borradores.`,
                    type: 'PAYROLL_REVIEW'
                });
            }
            console.log(`[PAYROLL] Use case: Review Alert sent (Target: ${paymentDate.toDateString()})`);
        }

        // Logic 3: Confirmation (1 day before Payment)
        // If Payment is 30th, 1 day before is 29th. (daysToPayment === 1)
        if (daysToPayment === 1) {
            for (const admin of admins) {
                await notificationService.sendPayrollAlert({
                    recipientId: admin.id,
                    title: 'URGENTE: Mañana es día de Pago',
                    message: `Confirme que la nómina esté finalizada. El pago está programado para mañana ${paymentDate.toLocaleDateString()}.`,
                    type: 'PAYROLL_CONFIRM'
                });
            }
            console.log(`[PAYROLL] Use case: Confirmation Alert sent (Target: ${paymentDate.toDateString()})`);
        }

    } catch (error) {
        console.error('[CRON] Error checking payroll reminders:', error);
    }
};

export const initPayrollCronJob = () => {
    // Run every day at 09:00
    cron.schedule('0 9 * * *', checkPayrollReminders);
    console.log('[CRON] Payroll Reminder Cron Job scheduled (09:00 Daily).');
};
