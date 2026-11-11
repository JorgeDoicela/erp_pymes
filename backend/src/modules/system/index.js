/**
 * @file index.js
 * @description Módulo de Sistema, Configuración Global y Salud de Infraestructura (Vertical Slice Bounded Context).
 * Expone la API pública, rutas, controlador, servicio y repositorio del dominio.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import router from './system.routes.js';
import * as systemController from './system.controller.js';
import systemService, { SystemService } from './system.service.js';
import systemRepository, { SystemRepository } from './system.repository.js';
import { maintenanceMiddleware } from './maintenance.middleware.js';

export {
  router as systemRoutes,
  systemController,
  systemService,
  SystemService,
  systemRepository,
  SystemRepository,
  maintenanceMiddleware,
};

export default router;
