import { Router } from 'express';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../../controllers/notifications/notificationController.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);

// Preferences
import { getPreferences, updatePreferences } from '../../controllers/notification.preferences.controller.js';
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

export default router;
