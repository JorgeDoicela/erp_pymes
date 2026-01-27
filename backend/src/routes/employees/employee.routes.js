import { Router } from 'express';
import employeeController from '../../controllers/employees/employeeController.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { validateEmployeeData } from '../../middleware/validation.middleware.js';

const router = Router();

// Rutas para gestión de empleados
router.post('/', authenticate, authorize(['admin', 'hr']), validateEmployeeData, employeeController.create);
router.get('/', authenticate, authorize(['admin', 'hr']), employeeController.getAll);
router.get('/profile', authenticate, employeeController.getProfile); // Nueva ruta protegida
router.get('/stats/salary', authenticate, authorize(['admin', 'hr']), employeeController.getSalaryStats);
router.get('/:id', authenticate, authorize(['admin', 'hr', 'employee']), employeeController.getById);
router.get('/department/:department', authenticate, employeeController.getByDepartment);
router.put('/:id', authenticate, authorize(['admin', 'hr']), validateEmployeeData, employeeController.update);
router.post('/:id/terminate', authenticate, employeeController.terminate);

router.get('/:id/history', employeeController.getHistory);
router.delete('/:id', employeeController.delete);

export default router;
