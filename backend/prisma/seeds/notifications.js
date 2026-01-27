export const seedNotifications = async (prisma, admin, employees) => {
    console.log('--- Seeding Notifications ---');

    if (!admin) {
        console.log('Skipping notifications: No admin found');
        return;
    }

    // Clean up existing notifications for admin
    await prisma.notification.deleteMany({
        where: { recipientId: admin.id }
    });

    // We need some contracts to link to.
    // Try to find contracts for some employees
    const contracts = await prisma.contract.findMany({
        take: 3,
        include: { employee: true }
    });

    const notificationsData = [];

    // 1. Notification: Contract Expiring in 7 days (Unread)
    if (contracts[0]) {
        notificationsData.push({
            recipientId: admin.id,
            title: 'Contrato Próximo a Vencer',
            message: `El contrato de ${contracts[0].employee.firstName} ${contracts[0].employee.lastName} vence en 7 días.`,
            type: 'CONTRACT_EXPIRATION',
            isRead: false,
            relatedEntity: 'Contract',
            relatedEntityId: contracts[0].id
        });
    }

    // 2. Notification: Contract Expiring in 15 days (Read)
    if (contracts[1]) {
        notificationsData.push({
            recipientId: admin.id,
            title: 'Contrato Próximo a Vencer',
            message: `El contrato de ${contracts[1].employee.firstName} ${contracts[1].employee.lastName} vence en 15 días.`,
            type: 'CONTRACT_EXPIRATION',
            isRead: true,
            relatedEntity: 'Contract',
            relatedEntityId: contracts[1].id
        });
    }

    // 3. Notification: Generic System Alert (Unread)
    notificationsData.push({
        recipientId: admin.id,
        title: 'Bienvenido al Sistema',
        message: 'El módulo de notificaciones ha sido activado exitosamente.',
        type: 'SYSTEM',
        isRead: false
    });

    // Create them
    for (const data of notificationsData) {
        await prisma.notification.create({ data });
    }

    console.log(`Created ${notificationsData.length} notifications for Admin.`);
};
