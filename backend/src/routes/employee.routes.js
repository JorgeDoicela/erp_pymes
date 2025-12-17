import { Router } from 'express';
import employeeController from '../controllers/employeeController.js';

const router = Router();

// Rutas para gestión de empleados
router.post('/', employeeController.create);
router.get('/', employeeController.getAll);
router.get('/stats/salary', employeeController.getSalaryStats); // Colocar antes de :id para evitar conflicto
router.get('/:id', employeeController.getById);
router.get('/department/:department', employeeController.getByDepartment);
router.put('/:id', employeeController.update);
router.delete('/:id', employeeController.delete);

export default router;
