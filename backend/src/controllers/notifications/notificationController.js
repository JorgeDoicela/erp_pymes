import notificationService from '../../services/notifications/notificationService.js';
import prisma from '../../database/db.js';

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id; // Asumiendo middleware de auth que popula req.user
        const notifications = await prisma.notification.findMany({
            where: { recipientId: userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Error al obtener notificaciones' });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verificar propiedad
        const notification = await prisma.notification.findUnique({
            where: { id }
        });

        if (!notification || notification.recipientId !== userId) {
            return res.status(404).json({ message: 'Notificación no encontrada' });
        }

        const updated = await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Error al actualizar notificación' });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await prisma.notification.updateMany({
            where: { recipientId: userId, isRead: false },
            data: { isRead: true }
        });
        res.json({ message: 'Todas las notificaciones marcadas como leídas' });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ message: 'Error al actualizar notificaciones' });
    }
};
