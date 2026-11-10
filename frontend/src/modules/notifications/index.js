/**
 * @file index.js
 * @description Módulo de Notificaciones y Alertas en Tiempo Real
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

export { default as NotificationsPage } from './pages/NotificationsPage.jsx';
export { default as NotificationSettings } from './pages/NotificationSettings.jsx';
export { default as NotificationBell } from './components/NotificationBell.jsx';

export * as notificationService from './services/notification.service.js';
export { default as useNotificationSocket } from './hooks/useNotificationSocket.js';
