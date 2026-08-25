/**
 * @file signature.routes.js
 * @description Rutas REST para gestión y validación desacoplada de firmas QR y firma electrónica oficial del Ecuador (.p12).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 */

import { Router } from 'express';
import multer from 'multer';
import signatureController from '../../controllers/signatures/signatureController.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // Máximo 10MB para certificados .p12
});

// Rutas Públicas (para escaneo desde teléfono o validación externa de autenticidad)
router.get('/qr/public/:token', signatureController.verifyQrPublic);
router.post('/qr/verify', signatureController.verifyQr);
router.post('/electronic/verify', signatureController.verifyP12Signature);

// Rutas Protegidas (Generación y firmado dentro del ERP)
router.post('/qr/generate', authenticate, signatureController.generateQr);
router.post('/electronic/inspect', authenticate, upload.single('p12File'), signatureController.inspectP12);
router.post('/electronic/sign', authenticate, upload.single('p12File'), signatureController.signWithP12);

export default router;
