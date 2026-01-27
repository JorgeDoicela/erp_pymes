import 'dotenv/config';
import prisma from '../src/database/db.js';
import notificationService from '../src/services/notifications/notificationService.js';

// We will mock the date logic by running the core function logic manually with overridden dates
// Since we can't easily mock `new Date()` inside the imported function without extensive refactoring or a library,
// we will duplicate the logic slightly here for verification, OR better, expose a 'checkDate' param in the job.
// Ideally, the job should accept a date to check against.
// Let's modify the job to accept a date, or just replicate the logic here to prove it works against the DB/Service.

// ACTUALLY: The best way is to force the alerts directly using the Service, 
// to verify the whole 'Notification -> DB' pipeline works for these types,
// and rely on the math in the Cron which is standard.
// BUT verifying the math is good too.

async function main() {
    console.log('--- Triggering Payroll Reminders Verification ---');

    const admins = await prisma.employee.findMany({ where: { role: 'admin', isActive: true } });
    if (admins.length === 0) {
        console.log('No admins found.');
        return;
    }

    console.log(`Found ${admins.length} admins. Sending 3 test alerts...`);

    // 1. Simulate Closing Warning
    console.log('1. Sending PAYROLL_CLOSING...');
    for (const admin of admins) {
        await notificationService.sendPayrollAlert({
            recipientId: admin.id,
            title: '[TEST] Recordatorio: Cierre de Nómina Próximo',
            message: `TEST: Faltan 5 días para el cierre.`,
            type: 'PAYROLL_CLOSING'
        });
    }

    // 2. Simulate Review Alert
    console.log('2. Sending PAYROLL_REVIEW...');
    for (const admin of admins) {
        await notificationService.sendPayrollAlert({
            recipientId: admin.id,
            title: '[TEST] Alerta: Revisión de Nómina',
            message: `TEST: Faltan 3 días para el pago.`,
            type: 'PAYROLL_REVIEW'
        });
    }

    // 3. Simulate Confirmation
    console.log('3. Sending PAYROLL_CONFIRM...');
    for (const admin of admins) {
        await notificationService.sendPayrollAlert({
            recipientId: admin.id,
            title: '[TEST] URGENTE: Mañana es día de Pago',
            message: `TEST: Confirme nómina finalizada.`,
            type: 'PAYROLL_CONFIRM'
        });
    }

    // Check DB
    const admin = admins[0];
    const notifications = await prisma.notification.findMany({
        where: {
            recipientId: admin.id,
            type: { in: ['PAYROLL_CLOSING', 'PAYROLL_REVIEW', 'PAYROLL_CONFIRM'] }
        },
        take: 3,
        orderBy: { createdAt: 'desc' }
    });

    console.log('\n--- Verification Results (DB) ---');
    notifications.forEach(n => console.log(`[${n.type}] ${n.title}`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
