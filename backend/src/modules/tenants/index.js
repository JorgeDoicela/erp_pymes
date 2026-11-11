/**
 * @file index.js
 * @description Módulo Multi-Tenant y Control SaaS (Vertical Slice Bounded Context).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import tenantRouter from './tenant.routes.js';
import superAdminRouter from './superAdmin.routes.js';
import * as tenantController from './tenant.controller.js';
import * as superAdminController from './superAdmin.controller.js';
import * as seedController from './seed.controller.js';
import tenantService, { TenantService } from './tenant.service.js';
import superAdminService, { SuperAdminService } from './superAdmin.service.js';
import tenantRepository, { TenantRepository } from './tenant.repository.js';

export {
  tenantRouter as tenantRoutes,
  superAdminRouter as superAdminRoutes,
  tenantController,
  superAdminController,
  seedController,
  tenantService,
  TenantService,
  superAdminService,
  SuperAdminService,
  tenantRepository,
  TenantRepository,
};

export default tenantRouter;

