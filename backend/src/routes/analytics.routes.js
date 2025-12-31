import { getDashboardData, getTurnoverReport } from '../controllers/analytics.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { Router } from 'express';

const router = Router();

router.get('/dashboard', authenticate, authorize(['admin', 'hr']), getDashboardData);
router.get('/turnover', authenticate, authorize(['admin', 'hr']), getTurnoverReport);

export default router;
