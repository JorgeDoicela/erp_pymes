import { getDashboardData, getTurnoverReport, getPerformanceReport, getPayrollCostReport, getSatisfactionReport, getCustomReport } from '../controllers/analytics.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { Router } from 'express';

const router = Router();

router.get('/dashboard', authenticate, authorize(['admin', 'hr']), getDashboardData);
router.get('/turnover', authenticate, authorize(['admin', 'hr']), getTurnoverReport);
router.get('/performance', authenticate, authorize(['admin', 'hr']), getPerformanceReport);
router.get('/payroll-costs', authenticate, authorize(['admin', 'hr']), getPayrollCostReport);
router.get('/satisfaction', authenticate, authorize(['admin', 'hr']), getSatisfactionReport);
router.post('/custom-report', authenticate, authorize(['admin', 'hr']), getCustomReport);

export default router;
