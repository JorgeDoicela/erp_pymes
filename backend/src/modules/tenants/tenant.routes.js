/**
 * @file tenant.routes.js
 * @description Norma ERP - Enrutador de Empresas (Tenants)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import { registerTenant, getMyTenant, updateMyTenant } from './tenant.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { requireTenant } from '../../middleware/tenant.middleware.js';

const router = Router();

// Registro público de nuevas empresas (Onboarding SaaS)
router.post('/register', registerTenant);

// Endpoints protegidos para gestionar la empresa activa
router.get('/me', authenticate, requireTenant, getMyTenant);
router.put('/me', authenticate, requireTenant, authorize(['admin']), updateMyTenant);

export default router;

