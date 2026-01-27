import 'dotenv/config';
import { checkDocumentExpirations } from '../src/jobs/documentCronJob.js';
import { seedDocumentExpiration } from '../prisma/seeds/documents_test.js';
import prisma from '../src/database/db.js';

async function main() {
    console.log('--- Triggering Document Expiration Manual Check ---');

    // Seed data
    await seedDocumentExpiration(prisma);

    // Run the check
    await checkDocumentExpirations();

    // Check Notifications for Employee
    const emp = await prisma.employee.findUnique({ where: { email: 'empleado@test.com' } });
    if (emp) {
        console.log('\n--- Notifications for Employee ---');
        const notifications = await prisma.notification.findMany({
            where: {
                recipientId: emp.id,
                type: 'DOCUMENT_EXPIRATION'
            },
            take: 5,
            orderBy: { createdAt: 'desc' }
        });
        notifications.forEach(n => console.log(`[${n.type}] ${n.title} - ${n.message}`));
    }

    // Check Notifications for Admin (HR)
    const admin = await prisma.employee.findUnique({ where: { email: 'admin@emplifi.com' } });
    if (admin) {
        console.log('\n--- Notifications for Admin ---');
        const notifications = await prisma.notification.findMany({
            where: {
                recipientId: admin.id,
                type: { in: ['DOCUMENT_EXPIRATION_HR', 'DOCUMENT_EXPIRED'] }
            },
            take: 5,
            orderBy: { createdAt: 'desc' }
        });
        notifications.forEach(n => console.log(`[${n.type}] ${n.title} - ${n.message}`));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
