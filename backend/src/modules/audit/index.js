/**
 * @file index.js
 * @description Módulo de Auditoría y Trazabilidad (Vertical Slice Bounded Context).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import router from './audit.routes.js';
import * as auditController from './audit.controller.js';
import auditService, { AuditService } from './audit.service.js';
import auditRepository, { AuditRepository } from './audit.repository.js';

export {
  router as auditRoutes,
  auditController,
  auditService,
  AuditService,
  auditRepository,
  AuditRepository,
};

export default router;

