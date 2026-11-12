/**
 * @file whatsapp.controller.js
 * @description Controlador HTTP para endpoints del Webhook de WhatsApp Cloud API y diagnóstico.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import whatsappService from './whatsapp.service.js';

export class WhatsappController {
  constructor(service = whatsappService) {
    this.service = service;
  }

  /**
   * Endpoint GET /api/whatsapp/webhook: Responde al Handshake de verificación de Meta.
   */
  verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const result = this.service.verifyWebhookChallenge({ mode, token, challenge });

    if (result.success && result.challenge) {
      return res.status(200).send(result.challenge);
    }

    return res.status(403).json({
      error: 'Forbidden',
      message: 'Fallo de verificación de token de Webhook de Meta.',
    });
  };

  /**
   * Endpoint POST /api/whatsapp/webhook: Recibe notificaciones y mensajes entrantes de Meta.
   * Responde HTTP 200 inmediatamente a Meta para cumplir con el SLA y procesa en segundo plano.
   */
  handleWebhook = (req, res) => {
    // 1. Responder 200 OK inmediatamente a Meta para evitar reintentos por timeout
    res.status(200).send('EVENT_RECEIVED');

    // 2. Procesar en background de forma asíncrona
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const signatureHeader = req.headers['x-hub-signature-256'];

    this.service
      .processWebhookEvent({
        body: req.body,
        rawBody,
        signatureHeader,
      })
      .catch((err) => {
        console.error('[WhatsApp Controller Error] Error en procesamiento de evento:', err);
      });
  };

  /**
   * Endpoint GET /api/whatsapp/status: Diagnóstico de conectividad de WhatsApp y proveedores de IA.
   */
  getStatus = (req, res) => {
    const status = this.service.getDiagnosticStatus();
    return res.status(200).json(status);
  };

  /**
   * Endpoint POST /api/whatsapp/test: Envío directo de prueba (solo administradores).
   */
  sendTest = async (req, res) => {
    const { to, text } = req.body;

    if (!to || !text) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Los campos "to" (número de teléfono) y "text" (mensaje) son requeridos.',
      });
    }

    const result = await this.service.sendDirectTestMessage({ to, text });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Mensaje de prueba despachado a WhatsApp.',
        messageId: result.messageId,
      });
    }

    return res.status(502).json({
      success: false,
      error: 'WhatsAppDispatchFailed',
      message: result.error || 'Fallo al despachar mensaje vía Meta Graph API.',
    });
  };
}

const whatsappController = new WhatsappController();
export default whatsappController;
