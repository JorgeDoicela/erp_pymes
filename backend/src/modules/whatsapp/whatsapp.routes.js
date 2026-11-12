/**
 * @file whatsapp.routes.js
 * @description Definición de rutas HTTP para el módulo de WhatsApp Cloud API.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import whatsappController from './whatsapp.controller.js';
import { authenticate, authorize } from '../auth/auth.middleware.js';

const router = Router();

// Endpoints públicos del Webhook de Meta y documentación legal
router.get('/webhook', whatsappController.verifyWebhook);
router.post('/webhook', whatsappController.handleWebhook);
router.get('/privacy', whatsappController.getPrivacyPolicy);
router.get('/terms', whatsappController.getTermsOfService);

// Endpoints protegidos para administración y pruebas
router.get(
  '/status',
  authenticate,
  authorize(['admin', 'superadmin']),
  whatsappController.getStatus
);
router.post('/test', authenticate, authorize(['admin', 'superadmin']), whatsappController.sendTest);

export default router;
