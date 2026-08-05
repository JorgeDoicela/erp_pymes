import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireSuperAdmin } from '../../middleware/superAdmin.middleware.js';
import {
    getPlatformMetrics,
    getAllTenants,
    updateTenantStatus,
    updateTenantPlan
} from '../../controllers/admin/superAdminController.js';

const router = Router();

// Todas las rutas de SuperAdmin requieren Autenticación + Permisos de SuperAdmin
router.use(authenticate, requireSuperAdmin);

router.get('/metrics', getPlatformMetrics);
router.get('/tenants', getAllTenants);
router.patch('/tenants/:id/status', updateTenantStatus);
router.patch('/tenants/:id/plan', updateTenantPlan);

export default router;
