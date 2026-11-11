/**
 * @file index.js
 * @description Módulo de Notificaciones Multicanal y Tiempo Real (Vertical Slice Bounded Context).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import router from './notification.routes.js';
import * as notificationController from './notification.controller.js';
import * as notificationPreferencesController from './notificationPreferences.controller.js';
import notificationService, { NotificationService } from './notification.service.js';
import notificationRepository, { NotificationRepository } from './notification.repository.js';
import emailService, { EmailService } from './email.service.js';
import socketService, { SocketService } from './socket.service.js';

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

