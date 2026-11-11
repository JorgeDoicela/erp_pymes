/**
 * @file index.js
 * @description Módulo de Notificaciones Multicanal y Tiempo Real (Pure Nested Vertical Slices).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import router from './alerts/notification.routes.js';
import * as notificationController from './alerts/notification.controller.js';
import * as notificationPreferencesController from './alerts/notificationPreferences.controller.js';
import notificationService, { NotificationService } from './alerts/notification.service.js';
import notificationRepository, {
  NotificationRepository,
} from './alerts/notification.repository.js';
import emailService, { EmailService } from './channels/email.service.js';
import socketService, { SocketService } from './channels/socket.service.js';

export {
  router as notificationRoutes,
  notificationController,
  notificationPreferencesController,
  notificationService,
  NotificationService,
  notificationRepository,
  NotificationRepository,
  emailService,
  EmailService,
  socketService,
  SocketService,
};

export default router;
