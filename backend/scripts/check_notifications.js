import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Notifications ---');

    const notifications = await prisma.notification.findMany();
    console.log(`Total Notifications: ${notifications.length}`);

    if (notifications.length > 0) {
        console.log('Sample Notification Recipient IDs:');
        notifications.forEach(n => console.log(`- ID: ${n.id} | Recipient: ${n.recipientId} | Title: ${n.title}`));
    } else {
        console.log('NO NOTIFICATIONS FOUND.');
    }

    const admin = await prisma.employee.findUnique({ where: { email: 'admin@emplifi.com' } });
    if (admin) {
        console.log(`\nAdmin User ID: ${admin.id}`);
        const adminNotifs = await prisma.notification.count({ where: { recipientId: admin.id } });
        console.log(`Notifications for Admin: ${adminNotifs}`);
    } else {
        console.log('Admin user not found in DB.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
