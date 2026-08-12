import cron from 'node-cron';
import prisma from '../database/db.js';
import notificationService from '../services/notifications/notificationService.js';

export const checkContractExpirations = async () => {
    console.log('--- Running Contract Expiration Check ---');
    try {
        const today = new Date();
        const targets = [30, 15, 7];

        for (const days of targets) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + days);

            const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

            const contracts = await prisma.contract.findMany({
                where: {
                    status: 'Active',
                    endDate: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                include: { employee: true }
            });

            for (const contract of contracts) {
                await notificationService.sendContractExpirationAlert(contract, days);
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
