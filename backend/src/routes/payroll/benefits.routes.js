import { Router } from 'express';
import employeeBenefitController from '../../controllers/payroll/employeeBenefitController.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

// Rutas de administración y consulta global
router.get('/', authenticate, authorize(['admin', 'hr', 'accounting']), employeeBenefitController.getAll);
router.get('/stats', authenticate, authorize(['admin', 'hr', 'accounting']), employeeBenefitController.getStats);
router.post('/', authenticate, authorize(['admin', 'hr', 'accounting']), employeeBenefitController.create);
router.post('/bulk', authenticate, authorize(['admin', 'hr', 'accounting']), employeeBenefitController.bulkCreate);

// Rutas por empleado y edición / cancelación
router.get('/employee/:employeeId', authenticate, authorize(['admin', 'hr', 'employee', 'accounting']), employeeBenefitController.getByEmployee);
router.put('/:id', authenticate, authorize(['admin', 'hr', 'accounting']), employeeBenefitController.update);
router.put('/:id/deactivate', authenticate, authorize(['admin', 'hr', 'accounting']), employeeBenefitController.deactivate);

export default router;
