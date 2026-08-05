import { Router } from 'express';
import { registerTenant, getMyTenant, updateMyTenant } from '../../controllers/tenant/tenantController.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { requireTenant } from '../../middleware/tenant.middleware.js';

const router = Router();

// Registro público de nuevas empresas (Onboarding SaaS)
router.post('/register', registerTenant);

// Endpoints protegidos para gestionar la empresa activa
router.get('/me', authenticate, requireTenant, getMyTenant);
router.put('/me', authenticate, requireTenant, authorize(['admin']), updateMyTenant);

export default router;
