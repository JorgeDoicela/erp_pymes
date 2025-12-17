import { Router } from 'express';
import { login } from '../controllers/authController.js';
import employeeRoutes from './employee.routes.js';

const router = Router();

// Ruta de prueba
router.get('/', (req, res) => {
    res.send('API EMPLIFI funcionando correctamente v1');
});

// Login real
router.post('/auth/login', login);

// Rutas de empleados
router.use('/employees', employeeRoutes);

export default router;
