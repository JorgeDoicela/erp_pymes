/**
 * @file index.js
 * @description Módulo de Sistema y Salud Operativa (Vertical Slice Bounded Context).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import router from './system.routes.js';
import systemService, { SystemService } from './system.service.js';

export {
  router as systemRoutes,
  systemService,
  SystemService,
};

export default router;

