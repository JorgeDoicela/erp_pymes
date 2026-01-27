import 'dotenv/config';
import { checkPerformanceReminders } from '../src/jobs/performanceCronJob.js';
import prisma from '../src/database/db.js';

async function main() {
    console.log('--- Triggering Performance Reminders Manual Check ---');
    await checkPerformanceReminders();

    // Check if notifications were created
    const admin = await prisma.employee.findUnique({ where: { email: 'admin@emplifi.com' } });
    if (admin) {
        const notifications = await prisma.notification.findMany({
            where: { recipientId: admin.id },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        console.log('\n--- Recent Notifications for Admin ---');
        notifications.forEach(n => {
            console.log(`[${n.type}] ${n.title}: ${n.message} (Read: ${n.isRead})`);
        });
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
