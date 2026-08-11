import { Router } from 'express';
import shiftController from '../../controllers/attendance/shiftController.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

// /shifts
router.post('/', authorize(['admin', 'hr', 'manager']), shiftController.createShift);
router.get('/', authorize(['admin', 'hr', 'manager', 'employee']), shiftController.getAllShifts);

// /shifts/assign
router.post('/assign', authorize(['admin', 'hr', 'manager']), shiftController.assignShifts);

// /shifts/employee/:employeeId
router.get('/employee/:employeeId', authorize(['admin', 'hr', 'manager', 'employee']), shiftController.getEmployeeSchedule);

export default router;
