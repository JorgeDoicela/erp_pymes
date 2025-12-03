import { Router } from 'express';
import employeeController from '../controllers/employeeController.js';

const router = Router();

// Ruta de prueba
router.get('/', (req, res) => {
    res.send('API EMPLIFI funcionando correctamente v1');
});

// Rutas de Empleados
// GET - Obtener todos los empleados (con paginación)
router.get('/employees', (req, res) => employeeController.getAll(req, res));

// GET - Obtener estadísticas de salarios
router.get('/employees/stats/salary', (req, res) => employeeController.getSalaryStats(req, res));

// GET - Obtener empleados por departamento
router.get('/employees/department/:department', (req, res) => employeeController.getByDepartment(req, res));

// GET - Obtener un empleado por ID
router.get('/employees/:id', (req, res) => employeeController.getById(req, res));

// POST - Crear un nuevo empleado
router.post('/employees', (req, res) => employeeController.create(req, res));

// PUT - Actualizar un empleado
router.put('/employees/:id', (req, res) => employeeController.update(req, res));

// DELETE - Eliminar un empleado
router.delete('/employees/:id', (req, res) => employeeController.delete(req, res));

export default router;
