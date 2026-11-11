/**
 * @file index.js
 * @description Módulo de Biometría WebAuthn / FIDO2 (Vertical Slice Bounded Context).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import router from './biometric.routes.js';
import * as biometricController from './biometric.controller.js';
import biometricService, { BiometricService } from './biometric.service.js';
import biometricRepository, { BiometricRepository } from './biometric.repository.js';

export {
  router as biometricRoutes,
  biometricController,
  biometricService,
  BiometricService,
  biometricRepository,
  BiometricRepository,
};

export default router;

