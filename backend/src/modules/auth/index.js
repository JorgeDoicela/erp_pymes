/**
 * @file index.js
 * @description Módulo de Autenticación y Recuperación (Vertical Slice Bounded Context).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import router from './auth.routes.js';
import * as authController from './auth.controller.js';
import authService, { AuthService } from './auth.service.js';
import authRepository, { AuthRepository } from './auth.repository.js';
import { authenticate, authorize, optionalAuth } from './auth.middleware.js';

export {
  router as authRoutes,
  authController,
  authService,
  AuthService,
  authRepository,
  AuthRepository,
  authenticate,
  authorize,
  optionalAuth,
};

export default router;
