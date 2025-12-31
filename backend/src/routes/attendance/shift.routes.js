import { Router } from 'express';
import shiftController from '../../controllers/attendance/shiftController.js';

const router = Router();

// /shifts
router.post('/', shiftController.createShift);
router.get('/', shiftController.getAllShifts);

// /shifts/assign
router.post('/assign', shiftController.assignShifts);

// /shifts/employee/:employeeId
router.get('/employee/:employeeId', shiftController.getEmployeeSchedule);

export default router;
