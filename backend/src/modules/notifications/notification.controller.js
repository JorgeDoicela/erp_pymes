/**
 * @file notification.controller.js
 * @description Norma ERP - Controlador de Notificaciones de Usuario
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import notificationService from './notification.service.js';

export const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user?.employeeId || req.user?.id;
    if (!userId) {
      return res.json({
        success: true,
        data: {
          total: 0,
          unread: 0,
          absenceCount: 0,
          evaluationCount: 0,
          contractCount: 0,
          payrollCount: 0,
        },
      });
    }

    const stats = await notificationService.getStatsForUser(userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res
      .status(500)
      .json({ success: false, message: 'Error al obtener estadísticas de notificaciones' });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.employeeId || req.user?.id;
    if (!userId) {
      return res.json([]);
    }

    const result = await notificationService.getNotificationsForUser(userId, req.query);
    res.json({ success: true, ...result });
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
    const count = await notificationService.getUnreadCountForUser(userId);
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
    const updated = await notificationService.markAsRead(id, userId);

    if (!updated) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error al actualizar notificación' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.employeeId || req.user?.id;
    if (userId) {
      await notificationService.markAllAsRead(userId);
    }
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
    const deleted = await notificationService.deleteNotification(id, userId);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
    }

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

    await notificationService.clearReadNotifications(userId);
    res.json({ success: true, message: 'Notificaciones leídas eliminadas exitosamente' });
  } catch (error) {
    console.error('Error clearing read notifications:', error);
    res.status(500).json({ success: false, message: 'Error al limpiar notificaciones' });
  }
};

