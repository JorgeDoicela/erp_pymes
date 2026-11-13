/**
 * @file whatsappConversationHistory.repository.js
 * @description Repositorio para la persistencia del historial y ventana de contexto conversacional en WhatsApp.
 * Gestiona el contexto por phoneKey y el aislamiento multi-tenant en la tabla whatsapp_conversation_contexts.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../database/db.js';

export class WhatsappConversationHistoryRepository {
  constructor(prismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Obtiene el contexto de conversación activo para el número telefónico indicado.
   * @param {string} phoneKey
   * @returns {Promise<Object|null>}
   */
  async getContext(phoneKey) {
    if (!phoneKey) return null;
    return this.prisma.whatsappConversationContext.findUnique({
      where: { phoneKey },
      select: {
        id: true,
        phoneKey: true,
        activeTenantId: true,
        conversationHistoryJson: true,
        lastInteractionAt: true,
      },
    });
  }

  /**
   * Almacena o actualiza la ventana deslizante del historial conversacional y la fecha de última interacción.
   * @param {Object} params
   * @param {string} params.phoneKey
   * @param {string} [params.tenantId]
   * @param {Array<Object>} params.history
   * @param {Date} [params.lastInteractionAt]
   * @returns {Promise<Object|null>}
   */
  async saveHistory({ phoneKey, tenantId, history, lastInteractionAt = new Date() }) {
    if (!phoneKey) return null;

    return this.prisma.whatsappConversationContext.upsert({
      where: { phoneKey },
      create: {
        phoneKey,
        activeTenantId: tenantId || null,
        conversationHistoryJson: history,
        lastInteractionAt,
      },
      update: {
        ...(tenantId ? { activeTenantId: tenantId } : {}),
        conversationHistoryJson: history,
        lastInteractionAt,
      },
    });
  }

  /**
   * Limpia el historial conversacional y la marca de tiempo para el teléfono indicado.
   * @param {string} phoneKey
   * @returns {Promise<Object|null>}
   */
  async clearHistory(phoneKey) {
    if (!phoneKey) return null;

    try {
      return await this.prisma.whatsappConversationContext.updateMany({
        where: { phoneKey },
        data: {
          conversationHistoryJson: null,
          lastInteractionAt: null,
        },
      });
    } catch {
      return null;
    }
  }
}

const whatsappConversationHistoryRepository = new WhatsappConversationHistoryRepository();
export default whatsappConversationHistoryRepository;
