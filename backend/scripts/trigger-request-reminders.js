import 'dotenv/config';
import { checkRequestReminders } from '../src/jobs/requestMonitorCronJob.js';
import { seedRequests } from '../prisma/seeds/requests.js'; // Can run separately
import prisma from '../src/database/db.js';

async function main() {
    console.log('--- Triggering Request Reminders Manual Check ---');

    // Ensure data exists
    // We could call seedRequests(prisma) here, but better to rely on `prisma db seed` or manual run
    // For this specific test, let's inject valid data first to be sure
    await seedRequests(prisma);

    // Run the check
    await checkRequestReminders();

    // Check Notifications
    const admin = await prisma.employee.findUnique({ where: { email: 'admin@emplifi.com' } });
    if (admin) {
        const notifications = await prisma.notification.findMany({
            where: {
                recipientId: admin.id,
                type: { in: ['ABSENCE_REMINDER', 'ABSENCE_ESCALATION'] }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        console.log('\n--- Recent Notifications for Admin (Limit 5) ---');
        notifications.forEach(n => {
            console.log(`[${n.type}] ${n.title} - ${n.message}`);
        });
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
