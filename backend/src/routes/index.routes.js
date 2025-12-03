import { Router } from 'express';
import { login } from '../controllers/authController.js';

const router = Router();

// Ruta de prueba
router.get('/', (req, res) => {
    res.send('API EMPLIFI funcionando correctamente v1');
});

// Login real
router.post('/auth/login', login);

export default router;
