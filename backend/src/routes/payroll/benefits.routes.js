import { Router } from 'express';
import employeeBenefitController from '../../controllers/payroll/employeeBenefitController.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, authorize(['admin', 'hr']), employeeBenefitController.create);
router.get('/employee/:employeeId', authenticate, authorize(['admin', 'hr', 'employee']), employeeBenefitController.getByEmployee);
router.put('/:id/deactivate', authenticate, authorize(['admin', 'hr']), employeeBenefitController.deactivate);

export default router;
