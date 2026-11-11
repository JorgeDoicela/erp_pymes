/**
 * @file index.js
 * @description Módulo de Comunicación Interna (Vertical Slice Bounded Context).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import router from './announcement.routes.js';
import * as announcementController from './announcement.controller.js';
import announcementService, { AnnouncementService } from './announcement.service.js';
import announcementRepository, { AnnouncementRepository } from './announcement.repository.js';

export {
  router as announcementRoutes,
  announcementController,
  announcementService,
  AnnouncementService,
  announcementRepository,
  AnnouncementRepository,
};

export default router;

