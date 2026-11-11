/**
 * @file index.js
 * @description Módulo Multi-Tenant y Control SaaS (Pure Nested Vertical Slices).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import tenantRouter from './organization/tenant.routes.js';
import superAdminRouter from './superadmin/superAdmin.routes.js';
import * as tenantController from './organization/tenant.controller.js';
import * as superAdminController from './superadmin/superAdmin.controller.js';
import * as seedController from './organization/seed.controller.js';
import tenantService, { TenantService } from './organization/tenant.service.js';
import superAdminService, { SuperAdminService } from './superadmin/superAdmin.service.js';
import tenantRepository, { TenantRepository } from './organization/tenant.repository.js';
import { requireTenant, requirePlan } from './organization/tenant.middleware.js';
import { requireSuperAdmin } from './superadmin/superAdmin.middleware.js';

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
  requireTenant,
  requirePlan,
  requireSuperAdmin,
};

export default tenantRouter;
