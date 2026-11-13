/**
 * @file notification.repository.js
 * @description Norma ERP - Repositorio de Notificaciones y Preferencias
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../../database/db.js';

const CATEGORY_FILTERS = {
  absence: { type: { startsWith: 'ABSENCE_' } },
  evaluation: { type: { startsWith: 'EVALUATION_' } },
  contract: { OR: [{ type: { contains: 'CONTRACT' } }, { type: { contains: 'DOCUMENT' } }] },
  payroll: { type: { startsWith: 'PAYROLL_' } },
};

export class NotificationRepository {
  async create(data) {
    return prisma.notification.create({ data });
  }

  async findById(id) {
    return prisma.notification.findUnique({ where: { id } });
  }

  async markAsReadById(id) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsReadForUser(recipientId) {
    return prisma.notification.updateMany({
      where: { recipientId, isRead: false },
      data: { isRead: true },
    });
  }

  async deleteById(id) {
    return prisma.notification.delete({ where: { id } });
  }

  async deleteReadForUser(recipientId) {
    return prisma.notification.deleteMany({
      where: { recipientId, isRead: true },
    });
  }

  async countUnreadForUser(recipientId) {
    return prisma.notification.count({
      where: { recipientId, isRead: false },
    });
  }

  async getStatsForUser(recipientId) {
    const [total, unread, absenceCount, evaluationCount, contractCount, payrollCount] =
      await Promise.all([
        prisma.notification.count({ where: { recipientId } }),
        prisma.notification.count({ where: { recipientId, isRead: false } }),
        prisma.notification.count({ where: { recipientId, ...CATEGORY_FILTERS.absence } }),
        prisma.notification.count({ where: { recipientId, ...CATEGORY_FILTERS.evaluation } }),
        prisma.notification.count({ where: { recipientId, ...CATEGORY_FILTERS.contract } }),
        prisma.notification.count({ where: { recipientId, ...CATEGORY_FILTERS.payroll } }),
      ]);

    return {
      total,
      unread,
      absenceCount,
      evaluationCount,
      contractCount,
      payrollCount,
    };
  }

  async findPaginatedForUser(recipientId, { category, isUnread, page = 1, limit = 50 }) {
    const where = { recipientId };

    if (isUnread === 'true' || isUnread === true) {
      where.isRead = false;
    }

    if (category && CATEGORY_FILTERS[category]) {
      Object.assign(where, CATEGORY_FILTERS[category]);
    }

    const pageNum = parseInt(page, 10);
    const take = parseInt(limit, 10);
    const skip = (pageNum - 1) * take;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findPreferencesByEmployeeId(employeeId) {
    return prisma.notificationPreference.findUnique({
      where: { employeeId },
    });
  }

  async upsertPreferences(employeeId, preferences) {
    return prisma.notificationPreference.upsert({
      where: { employeeId },
      update: { preferences },
      create: { employeeId, preferences },
    });
  }

  async findActiveAdmins(tenantId = null) {
    if (!tenantId) return [];
    return prisma.employee.findMany({
      where: {
        role: 'admin',
        isActive: true,
        tenantId,
      },
    });
  }

  async findEmployeeById(id) {
    return prisma.employee.findUnique({
      where: { id },
    });
  }
}

export default new NotificationRepository();
