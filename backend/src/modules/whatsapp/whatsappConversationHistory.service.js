/**
 * @file whatsappConversationHistory.service.js
 * @description Servicio de gestión de contexto e historial conversacional con ventana deslizante y TTL para WhatsApp.
 * Garantiza aislamiento estricto multi-tenant, caducidad de inactividad (15 min) y control de tokens LOPDP.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import whatsappConversationHistoryRepository from './whatsappConversationHistory.repository.js';
import {
  WHATSAPP_CONVERSATION_HISTORY_MAX_MESSAGES,
  WHATSAPP_CONVERSATION_HISTORY_TTL_MS,
} from './whatsapp.constants.js';

export class WhatsappConversationHistoryService {
  constructor(
    repo = whatsappConversationHistoryRepository,
    maxMessages = WHATSAPP_CONVERSATION_HISTORY_MAX_MESSAGES,
    ttlMs = WHATSAPP_CONVERSATION_HISTORY_TTL_MS
  ) {
    this.repo = repo;
    this.maxMessages = maxMessages;
    this.ttlMs = ttlMs;
  }

  /**
   * Recupera el historial conversacional activo validando aislamiento multi-tenant y TTL de inactividad.
   * @param {Object} params
   * @param {string} params.phoneKey
   * @param {string} [params.tenantId]
   * @param {Date} [params.now]
   * @returns {Promise<Array<{ role: string, content: string }>>}
   */
  async getActiveHistory({ phoneKey, tenantId = null, now = new Date() }) {
    if (!phoneKey) return [];

    try {
      const context = await this.repo.getContext(phoneKey);
      if (!context || !Array.isArray(context.conversationHistoryJson)) {
        return [];
      }

      // Aislamiento Multi-Tenant: Si el colaborador cambió de empresa activa, purgar el historial previo
      if (tenantId && context.activeTenantId && context.activeTenantId !== tenantId) {
        await this.repo.clearHistory(phoneKey);
        return [];
      }

      // Validación estricta de TTL por inactividad
      if (context.lastInteractionAt) {
        const lastTime = new Date(context.lastInteractionAt).getTime();
        const currentTime = new Date(now).getTime();
        const elapsed = currentTime - lastTime;

        if (elapsed > this.ttlMs || elapsed < 0) {
          await this.repo.clearHistory(phoneKey);
          return [];
        }
      }

      const validRoles = new Set(['user', 'assistant']);
      const sanitized = context.conversationHistoryJson
        .filter((item) => item && validRoles.has(item.role) && typeof item.content === 'string')
        .map((item) => ({
          role: item.role,
          content: String(item.content).trim(),
        }))
        .filter((item) => item.content.length > 0);

      return sanitized.slice(-this.maxMessages);
    } catch (err) {
      console.warn(
        '[WhatsApp History Warning] Error al leer historial conversacional:',
        err.message
      );
      return [];
    }
  }

  /**
   * Agrega un turno conversacional (usuario + asistente) y actualiza la ventana deslizante y la marca temporal.
   * @param {Object} params
   * @param {string} params.phoneKey
   * @param {string} [params.tenantId]
   * @param {string} params.userText
   * @param {string} params.assistantText
   * @param {Date} [params.now]
   */
  async recordTurn({ phoneKey, tenantId = null, userText, assistantText, now = new Date() }) {
    if (!phoneKey || !userText || !assistantText) return;

    try {
      const currentHistory = await this.getActiveHistory({ phoneKey, tenantId, now });

      const cleanUser = String(userText).trim().slice(0, 1000);
      const cleanAssistant = String(assistantText).trim().slice(0, 2500);

      const timestamp = new Date(now).toISOString();
      const updatedHistory = [
        ...currentHistory,
        { role: 'user', content: cleanUser, timestamp },
        { role: 'assistant', content: cleanAssistant, timestamp },
      ].slice(-this.maxMessages);

      await this.repo.saveHistory({
        phoneKey,
        tenantId,
        history: updatedHistory,
        lastInteractionAt: now,
      });
    } catch (err) {
      console.warn(
        '[WhatsApp History Warning] Fallo no bloqueante al registrar turno:',
        err.message
      );
    }
  }

  /**
   * Resetea el historial conversacional para el teléfono indicado.
   * @param {Object} params
   * @param {string} params.phoneKey
   */
  async resetHistory({ phoneKey }) {
    if (!phoneKey) return;
    try {
      await this.repo.clearHistory(phoneKey);
    } catch (err) {
      console.warn('[WhatsApp History Warning] Error al reiniciar historial:', err.message);
    }
  }
}

const whatsappConversationHistoryService = new WhatsappConversationHistoryService();
export default whatsappConversationHistoryService;
