import { Router } from 'express';
import employeeController from '../../controllers/employees/employeeController.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Rutas para gestión de empleados
router.post('/', employeeController.create);
router.get('/', authenticate, employeeController.getAll);
router.get('/me/profile', authenticate, employeeController.getProfile); // Nueva ruta protegida
router.get('/stats/salary', authenticate, employeeController.getSalaryStats);
router.get('/:id', authenticate, employeeController.getById);
router.get('/department/:department', authenticate, employeeController.getByDepartment);
router.put('/:id', authenticate, employeeController.update);
router.post('/:id/terminate', authenticate, employeeController.terminate);

router.get('/:id/history', employeeController.getHistory);
router.delete('/:id', employeeController.delete);

export default router;
