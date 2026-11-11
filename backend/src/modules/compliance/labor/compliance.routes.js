/**
 * @file compliance.routes.js
 * @description Rutas HTTP para auditoría de cumplimiento normativo y provisiones estatutarias (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import { getComplianceAlerts, getStatutoryProvisions } from './compliance.controller.js';
import { authenticate, authorize } from '../../auth/auth.middleware.js';

const router = Router();

router.get('/alerts', authenticate, authorize(['admin', 'hr']), getComplianceAlerts);
router.get('/provisions', authenticate, authorize(['admin', 'hr']), getStatutoryProvisions);

export default router;
