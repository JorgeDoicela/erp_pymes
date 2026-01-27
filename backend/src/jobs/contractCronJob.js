import cron from 'node-cron';
import prisma from '../database/db.js';
import notificationService from '../services/notifications/notificationService.js';

export const checkContractExpirations = async () => {
    console.log('--- Running Contract Expiration Check ---');
    try {
        const today = new Date();
        const futureDate30 = new Date(); futureDate30.setDate(today.getDate() + 30);
        const futureDate15 = new Date(); futureDate15.setDate(today.getDate() + 15);
        const futureDate7 = new Date(); futureDate7.setDate(today.getDate() + 7);

        // Fetch active contracts
        const contracts = await prisma.contract.findMany({
            where: {
                status: 'Active',
                endDate: { not: null }
            },
            include: { employee: true }
        });

        for (const contract of contracts) {
            if (!contract.endDate) continue;

            const endDate = new Date(contract.endDate);

            // Helper to check if same day (ignoring time)
            const isSameDay = (d1, d2) =>
                d1.getFullYear() === d2.getFullYear() &&
                d1.getMonth() === d2.getMonth() &&
                d1.getDate() === d2.getDate();

            if (isSameDay(endDate, futureDate30)) {
                await notificationService.sendContractExpirationAlert(contract, 30);
            } else if (isSameDay(endDate, futureDate15)) {
                await notificationService.sendContractExpirationAlert(contract, 15);
            } else if (isSameDay(endDate, futureDate7)) {
                await notificationService.sendContractExpirationAlert(contract, 7);
            }
        }
        console.log('--- Contract Expiration Check Completed ---');

    } catch (error) {
        console.error('Error in contract cron job:', error);
    }
};

export const initContractCronJob = () => {
    // Run every day at 8:00 AM
    cron.schedule('0 8 * * *', async () => {
        await checkContractExpirations();
    });

    console.log('Contract Cron Job initialized (0 8 * * *)');
};
