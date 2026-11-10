/**
 * @file index.js
 * @description Módulo de Firma Digital QR y Firma Electrónica Oficial Ecuador .p12 (Vertical Slice Bounded Context).
 * Expone la API pública, rutas, controlador y servicios de criptografía, hashing y verificación de documentos.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import router from './signature.routes.js';
import signatureController, { SignatureController } from './signature.controller.js';
import qrSignatureService, { QrSignatureService } from './qrSignature.service.js';
import ecuadorianElectronicSignatureService, { EcuadorianElectronicSignatureService } from './ecuadorianElectronicSignature.service.js';

export {
  router as signatureRoutes,
  signatureController,
  SignatureController,
  qrSignatureService,
  QrSignatureService,
  ecuadorianElectronicSignatureService,
  EcuadorianElectronicSignatureService,
};

export default router;
