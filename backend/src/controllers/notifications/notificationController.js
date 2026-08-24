import prisma from '../../database/db.js';

export const getNotificationStats = async (req, res) => {
    try {
        const userId = req.user?.employeeId || req.user?.id;
        if (!userId) {
            return res.json({
                success: true,
                data: { total: 0, unread: 0, absenceCount: 0, evaluationCount: 0, contractCount: 0, payrollCount: 0 }
            });
        }

        const [
            total,
            unread,
            absenceCount,
            evaluationCount,
            contractCount,
            payrollCount
        ] = await Promise.all([
            prisma.notification.count({ where: { recipientId: userId } }),
            prisma.notification.count({ where: { recipientId: userId, isRead: false } }),
            prisma.notification.count({
                where: {
                    recipientId: userId,
                    type: { startsWith: 'ABSENCE_' }
                }
            }),
            prisma.notification.count({
                where: {
                    recipientId: userId,
                    type: { startsWith: 'EVALUATION_' }
                }
            }),
            prisma.notification.count({
                where: {
                    recipientId: userId,
                    OR: [
                        { type: { contains: 'CONTRACT' } },
                        { type: { contains: 'DOCUMENT' } }
                    ]
                }
            }),
            prisma.notification.count({
                where: {
                    recipientId: userId,
                    type: { startsWith: 'PAYROLL_' }
                }
            })
        ]);

        res.json({
            success: true,
            data: {
                total,
                unread,
                absenceCount,
                evaluationCount,
                contractCount,
                payrollCount
            }
        });
    } catch (error) {
        console.error('Error fetching notification stats:', error);
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas de notificaciones' });
    }
};

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.employeeId || req.user?.id;
        if (!userId) {
            return res.json([]);
        }

        const { category, isUnread, page = 1, limit = 50 } = req.query;
        const where = { recipientId: userId };

        if (isUnread === 'true' || isUnread === true) {
            where.isRead = false;
        }

        if (category === 'absence') {
            where.type = { startsWith: 'ABSENCE_' };
        } else if (category === 'evaluation') {
            where.type = { startsWith: 'EVALUATION_' };
        } else if (category === 'contract') {
            where.OR = [
                { type: { contains: 'CONTRACT' } },
                { type: { contains: 'DOCUMENT' } }
            ];
        } else if (category === 'payroll') {
            where.type = { startsWith: 'PAYROLL_' };
        }

        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const take = parseInt(limit, 10);

        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take
            }),
            prisma.notification.count({ where })
        ]);

        res.json({
            success: true,
            data: notifications,
            pagination: {
                total,
                page: parseInt(page, 10),
                limit: take,
                totalPages: Math.ceil(total / take)
            }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Error al obtener notificaciones' });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user?.employeeId || req.user?.id;
        if (!userId) {
            return res.json({ count: 0 });
        }
        const count = await prisma.notification.count({
            where: { recipientId: userId, isRead: false }
        });
        res.json({ count });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ message: 'Error al obtener conteo de no leídas' });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.employeeId || req.user?.id;

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

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Error al actualizar notificación' });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user?.employeeId || req.user?.id;
        if (!userId) {
            return res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
        }
        await prisma.notification.updateMany({
            where: { recipientId: userId, isRead: false },
            data: { isRead: true }
        });
        res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar notificaciones' });
    }
};

export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.employeeId || req.user?.id;

        const notification = await prisma.notification.findUnique({
            where: { id }
        });

        if (!notification || notification.recipientId !== userId) {
            return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
        }

        await prisma.notification.delete({
            where: { id }
        });

        res.json({ success: true, message: 'Notificación eliminada exitosamente' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar notificación' });
    }
};

export const clearReadNotifications = async (req, res) => {
    try {
        const userId = req.user?.employeeId || req.user?.id;
        if (!userId) {
            return res.json({ success: true, message: 'Notificaciones leídas eliminadas' });
        }

        await prisma.notification.deleteMany({
            where: { recipientId: userId, isRead: true }
        });

        res.json({ success: true, message: 'Notificaciones leídas eliminadas exitosamente' });
    } catch (error) {
        console.error('Error clearing read notifications:', error);
        res.status(500).json({ success: false, message: 'Error al limpiar notificaciones' });
    }
};
