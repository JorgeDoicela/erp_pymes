/**
 * @file auth.routes.js
 * @description Norma ERP - Enrutador de Autenticación
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import { login, forgotPassword, resetPassword } from './auth.controller.js';
import { rateLimit } from '../../middleware/rateLimit.middleware.js';

const router = Router();

router.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 10 }), login);
router.post(
  '/forgot-password',
  rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 5 }),
  forgotPassword
);
router.post('/reset-password', resetPassword);

export default router;

