import { Router } from 'express';
import { login } from '../controllers/auth/authController.js';
import employeeRoutes from './employees/employee.routes.js';
import contractRoutes from './contracts/contract.routes.js';
import documentRoutes from './documents/document.routes.js';


const router = Router();

// Ruta de prueba
router.get('/', (req, res) => {
    res.send('API EMPLIFI funcionando correctamente v1');
});

// Login real
router.post('/auth/login', login);

// Rutas de empleados
router.use('/employees', employeeRoutes);
router.use('/contracts', contractRoutes);
router.use('/documents', documentRoutes);

export default router;
