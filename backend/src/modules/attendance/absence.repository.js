/**
 * @file absence.repository.js
 * @description Repositorio de persistencia para ausencias, permisos y vacaciones (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../database/db.js';

export const absenceRepository = {
  async createRequest(data) {
    return prisma.absenceRequest.create({ data });
  },

  async getAllRequests(filter = {}) {
    const { tenantId, ...rest } = filter;
    const where = { ...rest };
    if (tenantId) {
      where.employee = { tenantId };
    }
    return prisma.absenceRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            position: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getRequestById(id) {
    return prisma.absenceRequest.findUnique({ where: { id } });
  },

  async updateStatus(id, status, adminComment) {
    return prisma.absenceRequest.update({
      where: { id },
      data: { status, adminComment },
    });
  },

  async getByEmployee(employeeId) {
    return prisma.absenceRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  },
};

export default absenceRepository;
