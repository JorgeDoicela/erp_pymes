import 'dotenv/config';
import prisma from '../src/database/db.js';
import notificationService from '../src/services/notifications/notificationService.js';

async function verifyEnforcement() {
    console.log('--- Verifying Preference Enforcement ---');

    try {
        // 1. Get Admin User
        const admin = await prisma.employee.findUnique({
            where: { email: 'admin@emplifi.com' }
        });

        if (!admin) {
            console.error('Admin user not found. Run seed first.');
            process.exit(1);
        }

        console.log(`Testing with Admin: ${admin.email} (${admin.id})`);

        // Clean up previous notifications for cleaner test
        await prisma.notification.deleteMany({
            where: {
                recipientId: admin.id,
                type: 'CONTRACT_EXPIRATION'
            }
        });

        // 2. SCENARIO A: DISABLE In-App Notifications
        console.log('\n[Scenario A] Disabling In-App Notifications for CONTRACT_EXPIRATION...');

        await prisma.notificationPreference.upsert({
            where: { employeeId: admin.id },
            update: {
                preferences: { "CONTRACT_EXPIRATION": { "email": true, "inApp": false } }
            },
            create: {
                employeeId: admin.id,
                preferences: { "CONTRACT_EXPIRATION": { "email": true, "inApp": false } }
            }
        });

        // Trigger Alert
        console.log('Triggering Alert...');
        await notificationService.sendContractExpirationAlert({
            id: 'mock-contract-id',
            endDate: new Date(),
            employee: { firstName: 'Test', lastName: 'User' }
        }, 5);

        // Check Count
        const countA = await prisma.notification.count({
            where: { recipientId: admin.id, type: 'CONTRACT_EXPIRATION' }
        });
        console.log(`Notifications created (Should be 0): ${countA}`);

        if (countA === 0) {
            console.log('✅ PASS: No notification created when disabled.');
        } else {
            console.error('❌ FAIL: Notification was created despite being disabled.');
        }

        // 3. SCENARIO B: ENABLE In-App Notifications
        console.log('\n[Scenario B] Enabling In-App Notifications for CONTRACT_EXPIRATION...');

        await prisma.notificationPreference.update({
            where: { employeeId: admin.id },
            data: {
                preferences: { "CONTRACT_EXPIRATION": { "email": true, "inApp": true } }
            }
        });

        // Trigger Alert
        console.log('Triggering Alert...');
        await notificationService.sendContractExpirationAlert({
            id: 'mock-contract-id-2',
            endDate: new Date(),
            employee: { firstName: 'Test', lastName: 'User' }
        }, 5);

        // Check Count
        const countB = await prisma.notification.count({
            where: { recipientId: admin.id, type: 'CONTRACT_EXPIRATION' }
        });
        console.log(`Notifications created (Should be 1): ${countB}`);

        if (countB === 1) {
            console.log('✅ PASS: Notification created when enabled.');
        } else {
            console.error('❌ FAIL: Notification NOT created when enabled.');
        }

    } catch (error) {
        console.error('Verification Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyEnforcement();
