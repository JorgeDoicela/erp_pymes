import { Router } from 'express';
import employeeBenefitController from '../../controllers/payroll/employeeBenefitController.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, authorize(['admin', 'hr', 'accounting']), employeeBenefitController.create);
router.post('/bulk', authenticate, authorize(['admin', 'hr', 'accounting']), employeeBenefitController.bulkCreate);
router.get('/employee/:employeeId', authenticate, authorize(['admin', 'hr', 'employee', 'accounting']), employeeBenefitController.getByEmployee);
router.put('/:id/deactivate', authenticate, authorize(['admin', 'hr', 'accounting']), employeeBenefitController.deactivate);

export default router;
