import notificationService from '../src/services/notifications/notificationService.js';
import prisma from '../src/database/db.js';

async function triggerTest() {
    console.log('--- RNF-21: Disparando notificación de prueba ---');

    // Buscar un usuario real para no fallar por FK
    const user = await prisma.employee.findFirst();
    if (!user) {
        console.error('No se encontró ningún empleado en la BD para la prueba.');
        process.exit(1);
    }

    await notificationService.createNotification({
        recipientId: user.id,
        title: 'Prueba de Tiempo Real',
        message: 'Esta es una notificación de prueba para Socket.io',
        type: 'TEST'
    });

    console.log(`✅ Notificación enviada al usuario ${user.firstName} (${user.id})`);
    process.exit(0);
}

triggerTest();
