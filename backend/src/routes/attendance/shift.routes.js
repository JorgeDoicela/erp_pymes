import { Router } from 'express';
import shiftController from '../../controllers/attendance/shiftController.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

// /shifts
router.post('/', authorize(['admin', 'hr', 'manager']), shiftController.createShift);
router.get('/', authorize(['admin', 'hr', 'manager', 'employee']), shiftController.getAllShifts);
router.put('/:id', authorize(['admin', 'hr', 'manager']), shiftController.updateShift);
router.delete('/:id', authorize(['admin', 'hr', 'manager']), shiftController.deleteShift);

// /shifts/assign
router.post('/assign', authorize(['admin', 'hr', 'manager']), shiftController.assignShifts);
router.get('/schedules', authorize(['admin', 'hr', 'manager']), shiftController.getAllSchedules);
router.delete('/schedule/:id', authorize(['admin', 'hr', 'manager']), shiftController.deleteSchedule);

// /shifts/employee/:employeeId
router.get('/employee/:employeeId', authorize(['admin', 'hr', 'manager', 'employee']), shiftController.getEmployeeSchedule);

export default router;
