/**
 * @file whatsappClient.service.js
 * @description Cliente HTTP desacoplado para Meta WhatsApp Cloud API (Graph API v21.0).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import axios from 'axios';
import { META_GRAPH_BASE_URL } from './whatsapp.constants.js';

export class WhatsappClientService {
  constructor(httpClient = axios) {
    this.http = httpClient;
  }

  /**
   * Resuelve credenciales y configuración activa de WhatsApp Cloud API.
   * @param {Object} [overrides]
   * @returns {{ phoneNumberId: string, accessToken: string, isConfigured: boolean }}
   */
  resolveConfig(overrides = {}) {
    const phoneNumberId = overrides.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '';

    const accessToken =
      overrides.accessToken ||
      process.env.WHATSAPP_ACCESS_TOKEN ||
      process.env.WHATSAPP_TOKEN ||
      '';

    return {
      phoneNumberId,
      accessToken,
      isConfigured: Boolean(phoneNumberId && accessToken),
    };
  }

  /**
   * Envía un mensaje de texto plano a un número de WhatsApp vía Meta Graph API.
   * @param {Object} params
   * @param {string} params.to Número de destino en formato internacional (ej. '593987654321').
   * @param {string} params.text Contenido textual del mensaje.
   * @param {boolean} [params.previewUrl=false] Indicar si Meta debe generar vista previa de enlaces.
   * @param {Object} [params.configOverrides]
   * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
   */
  async sendTextMessage({ to, text, previewUrl = false, configOverrides = {} }) {
    const config = this.resolveConfig(configOverrides);

    if (!config.isConfigured) {
      console.warn(
        '[WhatsApp Client] Advertencia: WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_ACCESS_TOKEN no configurados. Mensaje no enviado.'
      );
      return {
        success: false,
        error: 'CREDENTIALS_NOT_CONFIGURED',
      };
    }

    if (!to || !text) {
      return {
        success: false,
        error: 'INVALID_PARAMETERS',
      };
    }

    // Normalizar destino: solo números
    const cleanTo = String(to).replace(/[^\d]/g, '');

    // Si el texto excede el límite de WhatsApp (~4096 caracteres), dividir en fragmentos limpios
    const chunks = this.splitMessageIntoChunks(text, 4000);
    let lastMessageId = null;

    for (const chunk of chunks) {
      try {
        const url = `${META_GRAPH_BASE_URL}/${config.phoneNumberId}/messages`;
        const payload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanTo,
          type: 'text',
          text: {
            preview_url: previewUrl,
            body: chunk,
          },
        };

        const response = await this.http.post(url, payload, {
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        });

        const data = response.data;
        if (data?.messages?.[0]?.id) {
          lastMessageId = data.messages[0].id;
        }
      } catch (err) {
        const metaError = err.response?.data?.error || {};
        console.error('[WhatsApp Client Error] Error al despachar mensaje vía Meta:', {
          status: err.response?.status,
          message: metaError.message || err.message,
          code: metaError.code,
          subcode: metaError.error_subcode,
          type: metaError.type,
        });

        return {
          success: false,
          error: metaError.message || err.message,
          code: metaError.code,
        };
      }
    }

    return {
      success: true,
      messageId: lastMessageId,
    };
  }

  /**
   * Envía estado de lectura (double blue check) a Meta para un mensaje recibido.
   * @param {Object} params
   * @param {string} params.messageId ID del mensaje entrante recibido de Meta.
   * @param {Object} [params.configOverrides]
   * @returns {Promise<boolean>}
   */
  async markMessageAsRead({ messageId, configOverrides = {} }) {
    const config = this.resolveConfig(configOverrides);

    if (!config.isConfigured || !messageId) {
      return false;
    }

    try {
      const url = `${META_GRAPH_BASE_URL}/${config.phoneNumberId}/messages`;
      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      };

      await this.http.post(url, payload, {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      return true;
    } catch {
      // La confirmación de lectura no es bloqueante
      return false;
    }
  }

  /**
   * Divide un mensaje largo en bloques menores a maxLen respetando párrafos o saltos de línea.
   * @private
   */
  splitMessageIntoChunks(text, maxLen = 4000) {
    if (!text || text.length <= maxLen) {
      return [text];
    }

    const chunks = [];
    let remaining = text;

    while (remaining.length > maxLen) {
      let splitIndex = remaining.lastIndexOf('\n\n', maxLen);
      if (splitIndex === -1 || splitIndex < maxLen * 0.5) {
        splitIndex = remaining.lastIndexOf('\n', maxLen);
      }
      if (splitIndex === -1 || splitIndex < maxLen * 0.5) {
        splitIndex = remaining.lastIndexOf(' ', maxLen);
      }
      if (splitIndex === -1) {
        splitIndex = maxLen;
      }

      chunks.push(remaining.substring(0, splitIndex).trim());
      remaining = remaining.substring(splitIndex).trim();
    }

    if (remaining.length > 0) {
      chunks.push(remaining);
    }

    return chunks;
  }
}

const whatsappClientService = new WhatsappClientService();
export default whatsappClientService;
