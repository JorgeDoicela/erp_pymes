/**
 * @file notification.routes.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import {
  getNotifications,
  getNotificationStats,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
} from '../../controllers/notifications/notificationController.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import {
  getPreferences,
  updatePreferences,
} from '../../controllers/notification.preferences.controller.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

router.get('/stats', getNotificationStats);
router.get('/unread-count', getUnreadCount);
router.get('/', getNotifications);

router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

router.delete('/clear-read', clearReadNotifications);
router.delete('/:id', deleteNotification);

// Preferencias de Canales (App / Email)
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

export default router;
