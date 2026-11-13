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

  /**
   * Endpoint GET /api/whatsapp/privacy: Política de Privacidad LOPDP (HTML estático para crawler de Meta).
   */
  getPrivacyPolicy = (_req, res) => {
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Politica de Privacidad - Norma ERP</title>
</head>
<body style="font-family: Inter, system-ui, sans-serif; background: #f9fafb; color: #111827; line-height: 1.6; padding: 40px 20px; margin: 0;">
  <main style="max-width: 780px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 36px;">
    <h1 style="font-size: 22px; margin-top: 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">Politica de Privacidad y Proteccion de Datos Personales — Norma ERP</h1>
    <p style="font-size: 13px; color: #4b5563;">Ultima actualizacion: Noviembre de 2026 | Cumplimiento LOPDP (Ecuador)</p>

    <h2 style="font-size: 16px; margin-top: 24px;">1. Responsable del Tratamiento</h2>
    <p style="font-size: 14px; color: #374151;">Norma ERP (norma.doicela.dev) administra datos empresariales y laborales exclusivamente bajo las directrices de la Ley Organica de Proteccion de Datos Personales (LOPDP) de la Republica del Ecuador.</p>

    <h2 style="font-size: 16px; margin-top: 20px;">2. Datos Procesados via Canal WhatsApp y Consentimiento Previo</h2>
    <p style="font-size: 14px; color: #374151;">Al interactuar con el asistente corporativo a traves de WhatsApp Cloud API (Meta), el sistema procesa unicamente el numero de telefono remitente y el contenido de las consultas para autenticar la identidad del colaborador en su empresa empleadora y responder sobre su estado operativo (asistencias, vacaciones, anticipos) y normativa laboral ecuatoriana. Conforme a los Arts. 8 y 12 de la LOPDP, el uso del canal requiere consentimiento expreso mediante la palabra <strong>ACEPTO</strong>.</p>

    <h2 style="font-size: 16px; margin-top: 20px;">3. Confidencialidad y Cero Entrenamiento</h2>
    <p style="font-size: 14px; color: #374151;">Los mensajes y datos personales no se venden ni se comparten con terceros para fines publicitarios. Los datos salariales se mantienen cifrados con AES-256-GCM y estrictamente aislados por organizacion (multi-tenant).</p>

    <h2 style="font-size: 16px; margin-top: 20px;">4. Derechos LOPDP: Revocatoria, Rectificacion y Eliminacion</h2>
    <p style="font-size: 14px; color: #374151;">En cumplimiento del Art. 15 de la LOPDP, el colaborador puede <strong>revocar su consentimiento en cualquier momento</strong> respondiendo con la palabra <strong>REVOCAR</strong> en el chat de WhatsApp, cesando de inmediato el procesamiento de sus datos por dicho canal. Asimismo, los titulares pueden solicitar la actualizacion o eliminacion de su numero vinculado en cualquier momento a traves de su departamento de Talento Humano o escribiendo a jorge.doicela.m@gmail.com.</p>
  </main>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  };

  /**
   * Endpoint GET /api/whatsapp/terms: Condiciones del Servicio (HTML estático para Meta).
   */
  getTermsOfService = (_req, res) => {
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Condiciones del Servicio - Norma ERP</title>
</head>
<body style="font-family: Inter, system-ui, sans-serif; background: #f9fafb; color: #111827; line-height: 1.6; padding: 40px 20px; margin: 0;">
  <main style="max-width: 780px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 36px;">
    <h1 style="font-size: 22px; margin-top: 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">Condiciones del Servicio — Norma ERP</h1>
    <p style="font-size: 14px; color: #374151;">El asistente corporativo de Norma ERP provee orientacion informativa basada en la legislacion laboral vigente de Ecuador y registros internos del empleador. El acceso esta restringido a colaboradores activos autorizados por cada empresa cliente.</p>
  </main>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  };
}

const whatsappController = new WhatsappController();
export default whatsappController;
