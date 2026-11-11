/**
 * @file biometric.routes.js
 * @description Norma ERP - Enrutador de Autenticación Biométrica WebAuthn / FIDO2
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import * as biometricController from './biometric.controller.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = Router();

// Registro (Requiere estar logueado por password primero)
router.get('/status', authenticate, biometricController.getBiometricStatus);
router.get('/register/options', authenticate, biometricController.getRegistrationOptions);
router.post('/register/verify', authenticate, biometricController.verifyRegistration);

// Autenticación (Público, usado para marcar asistencia o login)
router.post('/login/options', biometricController.getAuthenticationOptions);
router.post('/login/verify', biometricController.verifyAuthentication);

export default router;
