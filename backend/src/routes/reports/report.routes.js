import { Router } from 'express';
import reportController from '../../controllers/reports/reportController.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/attendance', authenticate, authorize(['admin']), reportController.getAttendanceReport);

export default router;
