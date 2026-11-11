/**
 * @file analytics.routes.js
 * @description Norma ERP - Enrutador de Analítica Descriptiva
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import {
  getDashboardData,
  getTurnoverReport,
  getPerformanceReport,
  getPayrollCostReport,
  getSatisfactionReport,
  getCustomReport,
} from './analytics.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/dashboard', authenticate, authorize(['admin', 'hr', 'accounting']), getDashboardData);
router.get('/turnover', authenticate, authorize(['admin', 'hr']), getTurnoverReport);
router.get('/performance', authenticate, authorize(['admin', 'hr']), getPerformanceReport);
router.get(
  '/payroll-costs',
  authenticate,
  authorize(['admin', 'hr', 'accounting']),
  getPayrollCostReport
);
router.get('/satisfaction', authenticate, authorize(['admin', 'hr']), getSatisfactionReport);
router.post(
  '/custom-report',
  authenticate,
  authorize(['admin', 'hr', 'accounting']),
  getCustomReport
);

export default router;

