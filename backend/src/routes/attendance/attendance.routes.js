import { Router } from 'express';
import attendanceController from '../../controllers/attendance/attendanceController.js';

const router = Router();

// POST /attendance/mark
router.post('/mark', attendanceController.markAttendance);

// GET /attendance/status/:employeeId
router.get('/status/:employeeId', attendanceController.getStatus);

export default router;
