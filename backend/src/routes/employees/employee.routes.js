import { Router } from 'express';
import employeeController from '../../controllers/employees/employeeController.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { validateEmployeeData } from '../../middleware/validation.middleware.js';

const router = Router();

// Rutas para gestión de empleados
router.post('/', authenticate, authorize(['admin', 'hr']), validateEmployeeData, employeeController.create);
router.get('/', authenticate, authorize(['admin', 'hr', 'accounting']), employeeController.getAll);
router.get('/profile', authenticate, employeeController.getProfile);
router.post('/consent', authenticate, employeeController.updateConsent);
router.get('/departments', authenticate, authorize(['admin', 'hr', 'accounting', 'employee']), employeeController.getDepartments);
router.get('/stats/salary', authenticate, authorize(['admin', 'hr']), employeeController.getSalaryStats);
router.get('/department/:department', authenticate, authorize(['admin', 'hr']), employeeController.getByDepartment);
router.get('/:id', authenticate, authorize(['admin', 'hr', 'employee']), employeeController.getById);
router.put('/:id', authenticate, authorize(['admin', 'hr']), validateEmployeeData, employeeController.update);
router.post('/:id/terminate', authenticate, authorize(['admin', 'hr']), employeeController.terminate);
router.get('/:id/history', authenticate, authorize(['admin', 'hr', 'employee']), employeeController.getHistory);
router.delete('/:id', authenticate, authorize(['admin', 'hr']), employeeController.delete);

export default router;
