/**
 * @file whatsappActionSession.repository.js
 * @description Repositorio multi-tenant para sesiones transaccionales agénticas en WhatsApp.
 * Gestiona borradores multi-turno, desafíos OTP por correo, bloqueos y ejecución idempotente.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../database/db.js';

export const WHATSAPP_SESSION_STATUS = {
  COLLECTING_PARAMS: 'COLLECTING_PARAMS',
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
  EXECUTING: 'EXECUTING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  LOCKED: 'LOCKED',
};

const OPEN_SESSION_STATUSES = [
  WHATSAPP_SESSION_STATUS.COLLECTING_PARAMS,
  WHATSAPP_SESSION_STATUS.PENDING_CONFIRMATION,
];

export class WhatsappActionSessionRepository {
  constructor(prismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Obtiene la sesión abierta más reciente estrictamente aislada por tenant, empleado y teléfono.
   * Incluye sesiones vencidas aún en estado abierto para informar expiración limpia.
   */
  async findOpenSession({ phoneKey, tenantId, employeeId }) {
    if (!phoneKey || !tenantId || !employeeId) return null;

    return this.prisma.whatsappActionSession.findFirst({
      where: {
        phoneKey,
        tenantId,
        employeeId,
        status: { in: OPEN_SESSION_STATUSES },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cancela cualquier sesión abierta previa del colaborador dentro del mismo tenant.
   */
  async cancelOpenSessions({ phoneKey, tenantId, employeeId }) {
    if (!phoneKey || !tenantId || !employeeId) return { count: 0 };

    return this.prisma.whatsappActionSession.updateMany({
      where: {
        phoneKey,
        tenantId,
        employeeId,
        status: { in: OPEN_SESSION_STATUSES },
      },
      data: {
        status: WHATSAPP_SESSION_STATUS.CANCELLED,
      },
    });
  }

  async createSession(data) {
    return this.prisma.whatsappActionSession.create({ data });
  }

  async updateSessionScoped({ id, tenantId, employeeId, data }) {
    return this.prisma.whatsappActionSession.updateMany({
      where: { id, tenantId, employeeId },
      data,
    });
  }

  async markStatus({ id, tenantId, employeeId, status }) {
    return this.prisma.whatsappActionSession.updateMany({
      where: { id, tenantId, employeeId },
      data: { status },
    });
  }

  /**
   * Incrementa el contador de intentos fallidos y bloquea el desafío si alcanza el máximo permitido.
   */
  async registerFailedAttempt({ id, tenantId, employeeId, maxAttempts = 3 }) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.whatsappActionSession.findFirst({
        where: {
          id,
          tenantId,
          employeeId,
          status: WHATSAPP_SESSION_STATUS.PENDING_CONFIRMATION,
        },
        select: { attempts: true, maxAttempts: true },
      });

      if (!current) {
        return { attempts: maxAttempts, maxAttempts, locked: true };
      }

      const nextAttempts = current.attempts + 1;
      const limit = current.maxAttempts || maxAttempts;
      const locked = nextAttempts >= limit;

      await tx.whatsappActionSession.updateMany({
        where: {
          id,
          tenantId,
          employeeId,
          status: WHATSAPP_SESSION_STATUS.PENDING_CONFIRMATION,
        },
        data: {
          attempts: nextAttempts,
          status: locked
            ? WHATSAPP_SESSION_STATUS.LOCKED
            : WHATSAPP_SESSION_STATUS.PENDING_CONFIRMATION,
        },
      });

      return { attempts: nextAttempts, maxAttempts: limit, locked };
    });
  }

  /**
   * Reclama atómicamente la sesión para ejecución única (garantiza idempotencia ante reintentos).
   */
  async claimForExecution({ id, tenantId, employeeId, confirmMessageId }) {
    const result = await this.prisma.whatsappActionSession.updateMany({
      where: {
        id,
        tenantId,
        employeeId,
        status: WHATSAPP_SESSION_STATUS.PENDING_CONFIRMATION,
        expiresAt: { gt: new Date() },
      },
      data: {
        status: WHATSAPP_SESSION_STATUS.EXECUTING,
        confirmMessageId: confirmMessageId || null,
      },
    });

    return result.count === 1;
  }

  async markCompleted({ id, tenantId, employeeId, resultingEntityId }) {
    return this.prisma.whatsappActionSession.updateMany({
      where: {
        id,
        tenantId,
        employeeId,
      },
      data: {
        status: WHATSAPP_SESSION_STATUS.COMPLETED,
        resultingEntityId: resultingEntityId || null,
      },
    });
  }
}

const whatsappActionSessionRepository = new WhatsappActionSessionRepository();
export default whatsappActionSessionRepository;
