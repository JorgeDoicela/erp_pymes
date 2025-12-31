import { Router } from 'express';
import employeeController from '../../controllers/employees/employeeController.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Rutas para gestión de empleados
router.post('/', employeeController.create);
router.get('/', employeeController.getAll);
router.get('/me/profile', authenticate, employeeController.getProfile); // Nueva ruta protegida
router.get('/stats/salary', employeeController.getSalaryStats);
router.get('/:id', employeeController.getById);
router.get('/department/:department', employeeController.getByDepartment);
router.put('/:id', employeeController.update);
router.get('/:id/history', employeeController.getHistory);
router.delete('/:id', employeeController.delete);

export default router;
