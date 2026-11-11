/**
 * @file superAdmin.routes.js
 * @description Norma ERP - Enrutador Backoffice SuperAdmin
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import { authenticate } from '../../auth/auth.middleware.js';
import { requireSuperAdmin } from './superAdmin.middleware.js';
import {
  getPlatformMetrics,
  getAllTenants,
  getTenantsList,
  getTenantDetail,
  updateTenantStatus,
  updateTenantPlan,
  getGlobalAuditLogs,
  createTenantBySuperAdmin,
  impersonateTenant,
} from './superAdmin.controller.js';

const router = Router();

// Todas las rutas de SuperAdmin requieren Autenticación + Permisos de SuperAdmin
router.use(authenticate, requireSuperAdmin);

router.get('/metrics', getPlatformMetrics);
router.get('/tenants', getAllTenants);
router.post('/tenants', createTenantBySuperAdmin);
router.get('/tenants-list', getTenantsList);
router.get('/tenants/:id', getTenantDetail);
router.patch('/tenants/:id/status', updateTenantStatus);
router.patch('/tenants/:id/plan', updateTenantPlan);
router.post('/tenants/:id/impersonate', impersonateTenant);
router.get('/audit', getGlobalAuditLogs);

export default router;
