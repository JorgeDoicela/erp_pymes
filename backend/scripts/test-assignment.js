import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import notificationService from '../src/services/notifications/notificationService.js';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Testing Initial Assignment Notification ---');

    const admin = await prisma.employee.findUnique({ where: { email: 'admin@emplifi.com' } });
    const employee = await prisma.employee.findUnique({ where: { email: 'empleado@test.com' } });

    if (!admin || !employee) {
        console.error('Missing admin or test employee');
        return;
    }

    console.log('Simulating assignment notification...');

    // Simulate what the controller does: call the service method directly
    await notificationService.sendEvaluationAssigned({
        recipientId: admin.id,
        recipientEmail: admin.email,
        title: "Evaluación Prueba Script",
        employeeName: `${employee.firstName} ${employee.lastName}`,
        endDate: new Date(),
        evaluationId: "test-id",
        role: "REVIEWER"
    });

    console.log('Notification triggered. Checking DB...');

    // Verify
    const notif = await prisma.notification.findFirst({
        where: { recipientId: admin.id, type: 'EVALUATION_ASSIGNED' },
        orderBy: { createdAt: 'desc' }
    });

    if (notif) {
        console.log(`[SUCCESS] Notification created: ${notif.title} - ${notif.message}`);
    } else {
        console.error('[FAIL] Notification not found in DB');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
