import { Router } from 'express';
import attendanceController from '../../controllers/attendance/attendanceController.js';
import { optionalAuth } from '../../middleware/auth.middleware.js';

const router = Router();

// POST /attendance/mark (Autenticado o Quiosco público)
router.post('/mark', optionalAuth, attendanceController.markAttendance);

// GET /attendance/status/:employeeId
router.get('/status/:employeeId', optionalAuth, attendanceController.getStatus);

export default router;
