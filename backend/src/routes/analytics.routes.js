import { Router } from 'express';
import { getDashboardData } from '../controllers/analytics.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/dashboard', authenticate, authorize(['admin', 'hr']), getDashboardData);

export default router;
