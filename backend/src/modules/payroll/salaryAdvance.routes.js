/**
 * @file salaryAdvance.routes.js
 * @description Rutas HTTP para anticipos de sueldo y préstamos (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import {
  requestAdvance,
  createByAdmin,
  getStats,
  getAdvances,
  getMyAdvances,
  approveAdvance,
  rejectAdvance,
  cancelAdvance,
} from './salaryAdvance.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/request', authenticate, requestAdvance);
router.get('/my', authenticate, getMyAdvances);
router.delete('/:id/cancel', authenticate, cancelAdvance);

router.get('/', authenticate, authorize(['admin', 'hr', 'accounting']), getAdvances);
router.get('/stats', authenticate, authorize(['admin', 'hr', 'accounting']), getStats);
router.post('/admin-create', authenticate, authorize(['admin', 'hr', 'accounting']), createByAdmin);
router.post('/:id/approve', authenticate, authorize(['admin', 'hr', 'accounting']), approveAdvance);
router.post('/:id/reject', authenticate, authorize(['admin', 'hr', 'accounting']), rejectAdvance);

export default router;
