import { Router } from 'express';
import * as biometricController from '../../controllers/biometric.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Registro (Requiere estar logueado por password primero)
router.get('/register/options', authenticate, biometricController.getRegistrationOptions);
router.post('/register/verify', authenticate, biometricController.verifyRegistration);

// Autenticación (Público, usado para marcar asistencia)
router.post('/login/options', biometricController.getAuthenticationOptions);
router.post('/login/verify', biometricController.verifyAuthentication);

export default router;
