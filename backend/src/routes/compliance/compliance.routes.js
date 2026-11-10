/**
 * @file compliance.routes.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import {
  getComplianceAlerts,
  getStatutoryProvisions,
} from '../../controllers/compliance/complianceController.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/alerts', authenticate, authorize(['admin', 'hr']), getComplianceAlerts);
router.get('/provisions', authenticate, authorize(['admin', 'hr']), getStatutoryProvisions);

export default router;
