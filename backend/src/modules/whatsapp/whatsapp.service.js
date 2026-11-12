/**
 * @file whatsapp.service.js
 * @description Orquestador central del flujo del Webhook de WhatsApp Cloud API y despacho de respuestas.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import whatsappClientService from './whatsappClient.service.js';
import whatsappSecurityService from './whatsappSecurity.service.js';
import whatsappRepository from './whatsapp.repository.js';
import whatsappAiService from './whatsappAi.service.js';
import {
  NON_TEXT_MEDIA_FALLBACK,
  RATE_LIMIT_EXCEEDED_MESSAGE,
  GENERAL_ERROR_MESSAGE,
} from './whatsapp.constants.js';

export class WhatsappService {
  constructor(
    client = whatsappClientService,
    security = whatsappSecurityService,
    repo = whatsappRepository,
    ai = whatsappAiService
  ) {
    this.client = client;
    this.security = security;
    this.repo = repo;
    this.ai = ai;
  }

  /**
   * Responde al desafío de suscripción inicial (Handshake) enviado por Meta.
   * @param {Object} params
   * @param {string} params.mode Parámetro 'hub.mode'
   * @param {string} params.token Parámetro 'hub.verify_token'
   * @param {string} params.challenge Parámetro 'hub.challenge'
   * @returns {{ success: boolean, challenge?: string, error?: string }}
   */
  verifyWebhookChallenge({ mode, token, challenge }) {
    const configuredToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === 'subscribe' && token && configuredToken && token === configuredToken) {
      return { success: true, challenge };
    }

    return {
      success: false,
      error: 'VERIFICATION_TOKEN_MISMATCH',
    };
  }

  /**
   * Procesa un evento entrante del Webhook de Meta de forma asíncrona no bloqueante.
   * @param {Object} params
   * @param {Object} params.body Objeto JSON del payload de Meta.
   * @param {Buffer|string} [params.rawBody] Buffer crudo para comprobación de firma criptográfica.
   * @param {string} [params.signatureHeader] Cabecera 'x-hub-signature-256'.
   */
  async processWebhookEvent({ body, rawBody, signatureHeader }) {
    // 1. Verificación de firma criptográfica HMAC de Meta si está configurada
    if (signatureHeader && rawBody) {
      const isSignatureValid = this.security.verifyWebhookSignature({
        rawBody,
        signatureHeader,
      });

      if (!isSignatureValid) {
        console.warn('[WhatsApp Webhook Warning] Firma HMAC inválida rechazada.');
        return { success: false, reason: 'INVALID_SIGNATURE' };
      }
    }

    // 2. Extraer mensajes del payload estándar de Meta WhatsApp Cloud API
    const incomingMessages = this.extractMessagesFromPayload(body);

    if (!incomingMessages.length) {
      // Eventos de estado (ej: delivered, read) o cambios de cuenta sin mensajes nuevos
      return { success: true, messageCount: 0 };
    }

    // 3. Procesar cada mensaje de forma asíncrona
    for (const msg of incomingMessages) {
      this.handleSingleIncomingMessage(msg).catch((err) => {
        console.error('[WhatsApp Service Error] Error en procesamiento asíncrono de mensaje:', err);
      });
    }

    return { success: true, messageCount: incomingMessages.length };
  }

  /**
   * Procesa un único mensaje de usuario de forma asíncrona.
   * @private
   */
  async handleSingleIncomingMessage(msg) {
    const { from, id: messageId, type, text } = msg;

    // Idempotencia: no procesar mensajes repetidos por reintentos de Meta
    if (this.security.isDuplicateMessage(messageId)) {
      return;
    }

    // Marcar como leído en WhatsApp para dar feedback inmediato al usuario
    this.client.markMessageAsRead({ messageId }).catch(() => {});

    // Rate Limiting por número de teléfono
    if (!this.security.checkRateLimit(from)) {
      await this.client.sendTextMessage({
        to: from,
        text: RATE_LIMIT_EXCEEDED_MESSAGE,
      });
      return;
    }

    // Si el usuario envió un archivo, audio o imagen sin texto
    if (type !== 'text' || !text?.body) {
      await this.client.sendTextMessage({
        to: from,
        text: NON_TEXT_MEDIA_FALLBACK,
      });
      return;
    }

    const userQuery = text.body.trim();

    try {
      const phoneVariants = this.security.normalizePhoneNumberVariants(from);
      const phoneKey =
        typeof this.security.getCanonicalPhoneKey === 'function'
          ? this.security.getCanonicalPhoneKey(from)
          : String(from || '').replace(/[^\d]/g, '');

      let employee = null;

      if (typeof this.repo.resolveEmployeeContext === 'function') {
        const contextResult = await this.repo.resolveEmployeeContext({
          phoneKey,
          phoneVariants,
        });

        // Permitir cambio explícito de empresa cuando el teléfono está vinculado a múltiples tenants
        if (
          contextResult.candidates?.length > 1 &&
          /^(cambiar\s+(?:de\s+)?empresa|mis\s+empresas|empresas)$/i.test(userQuery)
        ) {
          const pendingList = contextResult.candidates.map((emp, idx) => ({
            index: idx + 1,
            tenantId: emp.tenantId,
            tenantName: emp.tenant?.name || `Empresa ${idx + 1}`,
            ruc: emp.tenant?.ruc || null,
            employeeId: emp.id,
          }));
          if (typeof this.repo.clearActiveTenantSelection === 'function') {
            await this.repo.clearActiveTenantSelection({
              phoneKey,
              pendingSelection: pendingList,
            });
          }
          await this.client.sendTextMessage({
            to: from,
            text: this.formatTenantSelectionPrompt(contextResult.candidates),
          });
          return;
        }

        if (contextResult.status === 'MULTI_TENANT_SELECTION_REQUIRED') {
          const chosen = this.matchTenantSelectionReply(userQuery, contextResult.candidates);
          if (chosen && typeof this.repo.setActiveTenantContext === 'function') {
            await this.repo.setActiveTenantContext({
              phoneKey,
              tenantId: chosen.tenantId,
            });
            await this.client.sendTextMessage({
              to: from,
              text:
                `Empresa activa configurada en *${chosen.tenant?.name || 'Norma ERP'}*.\n\n` +
                `Ahora puede consultar sus datos, hacer preguntas legales o solicitar vacaciones en esta empresa. ` +
                `Si necesita cambiar mas adelante, escriba *CAMBIAR EMPRESA*.`,
            });
            return;
          }

          await this.client.sendTextMessage({
            to: from,
            text: this.formatTenantSelectionPrompt(contextResult.candidates),
          });
          return;
        }

        employee = contextResult.employee;
      } else {
        employee = await this.repo.findEmployeeByPhoneVariants(phoneVariants);
      }

      // Generar respuesta con el orquestador de IA (DeepSeek / Gemini + RAG Legal + Skills Agénticas)
      const replyText = await this.ai.generateResponse({
        text: userQuery,
        employee,
        phoneKey,
        messageId,
      });

      // Enviar respuesta al usuario por WhatsApp
      await this.client.sendTextMessage({
        to: from,
        text: replyText,
      });
    } catch (err) {
      console.error('[WhatsApp Service Error] Error al generar respuesta para:', from, err.message);
      await this.client.sendTextMessage({
        to: from,
        text: GENERAL_ERROR_MESSAGE,
      });
    }
  }

  /**
   * Formatea el menú numerado cuando un teléfono pertenece a múltiples empresas (multi-tenant).
   * @private
   */
  formatTenantSelectionPrompt(candidates = []) {
    const lines = candidates.map((emp, idx) => {
      const rucNote = emp.tenant?.ruc ? ` (RUC: ${emp.tenant.ruc})` : '';
      return `${idx + 1}. *${emp.tenant?.name || 'Empresa'}*${rucNote}`;
    });

    return (
      `Su numero esta vinculado a *${candidates.length} empresas* en Norma ERP:\n\n` +
      `${lines.join('\n')}\n\n` +
      `Responda con el *numero de la empresa* (ej: *1* o *EMPRESA 1*) con la que desea operar.`
    );
  }

  /**
   * Resuelve la empresa seleccionada por el usuario ante un prompt multi-tenant.
   * @private
   */
  matchTenantSelectionReply(replyText, candidates = []) {
    const clean = String(replyText || '').trim();
    const numericMatch = clean.match(/^(?:empresa\s*)?(\d{1,2})$/i);
    if (numericMatch) {
      const index = Number(numericMatch[1]) - 1;
      if (index >= 0 && index < candidates.length) {
        return candidates[index];
      }
    }

    const lower = clean.toLowerCase();
    if (lower.length >= 3) {
      return (
        candidates.find((emp) => (emp.tenant?.name || '').toLowerCase().includes(lower)) || null
      );
    }

    return null;
  }

  /**
   * Extrae la lista de mensajes de usuarios del cuerpo anidado de Meta.
   * @private
   */
  extractMessagesFromPayload(body) {
    const messages = [];
    if (!body || body.object !== 'whatsapp_business_account') {
      return messages;
    }

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field === 'messages') {
          const valueMessages = change.value?.messages || [];
          for (const msg of valueMessages) {
            messages.push(msg);
          }
        }
      }
    }

    return messages;
  }

  /**
   * Obtiene el estado de diagnóstico de configuración para la interfaz administrativa.
   * @returns {Object}
   */
  getDiagnosticStatus() {
    const clientConfig = this.client.resolveConfig();
    const aiConfig = this.ai.resolveAiProviderConfig();

    return {
      whatsapp: {
        isConfigured: clientConfig.isConfigured,
        phoneNumberId: clientConfig.phoneNumberId
          ? `${clientConfig.phoneNumberId.slice(0, 4)}***`
          : null,
        hasAccessToken: Boolean(clientConfig.accessToken),
        verifyTokenConfigured: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
        appSecretConfigured: Boolean(process.env.WHATSAPP_APP_SECRET),
      },
      ai: {
        activeProvider: aiConfig.provider,
        model: aiConfig.model,
        deepseekConfigured: Boolean(process.env.DEEPSEEK_API_KEY),
        geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      },
    };
  }

  /**
   * Envía un mensaje directo de prueba para validación manual de infraestructura.
   * @param {Object} params
   */
  async sendDirectTestMessage({ to, text }) {
    return this.client.sendTextMessage({ to, text });
  }
}

const whatsappService = new WhatsappService();
export default whatsappService;
