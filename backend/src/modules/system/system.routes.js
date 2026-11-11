/**
 * @file system.routes.js
 * @description Norma ERP - Enrutador de Configuración de Sistema y Salud
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import * as systemController from './system.controller.js';
import { authenticate, authorize, optionalAuth } from '../auth/auth.middleware.js';

const router = Router();

router.get('/health', systemController.getHealth);
router.get(
  '/settings',
  authenticate,
  authorize(['admin', 'superadmin']),
  systemController.getSettings
);
router.put(
  '/settings',
  authenticate,
  authorize(['admin', 'superadmin']),
  systemController.updateSettings
);
router.get('/geocode', systemController.reverseGeocode);
router.get('/biometric-setting', optionalAuth, systemController.getBiometricSetting);

export default router;
