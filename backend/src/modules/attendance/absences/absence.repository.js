/**
 * @file absence.repository.js
 * @description Repositorio de persistencia para ausencias, permisos y vacaciones (Norma ERP).
 * Encapsula la interacción con Prisma ORM y transacciones atómicas del dominio Absence.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../../database/db.js';
import { ValidationError } from '../../../core/errors/appError.js';

export const absenceRepository = {
  async createRequest(data) {
    return prisma.absenceRequest.create({ data });
  },

  async findOverlapping(employeeId, start, end, tenantId = null) {
    const where = {
      employeeId,
      status: { in: ['PENDING', 'APPROVED'] },
      startDate: { lte: end },
      endDate: { gte: start },
    };

    if (tenantId) {
      where.employee = { tenantId };
    }

    return prisma.absenceRequest.findFirst({ where });
  },

  async getPendingRequestsByEmployee(employeeId, tenantId = null) {
    const where = {
      employeeId,
      status: 'PENDING',
    };

    if (tenantId) {
      where.employee = { tenantId };
    }

    return prisma.absenceRequest.findMany({
      where,
      select: {
        id: true,
        type: true,
        startDate: true,
        endDate: true,
      },
    });
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

  async getRequestById(id, tenantId = null) {
    const where = { id };
    if (tenantId) {
      where.employee = { tenantId };
    }
    return prisma.absenceRequest.findFirst({ where });
  },

  async updateStatus(id, status, adminComment) {
    return prisma.absenceRequest.update({
      where: { id },
      data: { status, adminComment },
    });
  },

  async approveVacationWithDecrement(requestId, employeeId, days, status, adminComment) {
    return prisma.$transaction(async (tx) => {
      const employee = await tx.employee.findUnique({ where: { id: employeeId } });

      if (employee.vacationDays < days) {
        throw new ValidationError(
          `No se puede aprobar: Saldo insuficiente (${employee.vacationDays} días).`
        );
      }

      await tx.employee.update({
        where: { id: employeeId },
        data: { vacationDays: { decrement: days } },
      });

      return tx.absenceRequest.update({
        where: { id: requestId },
        data: { status, adminComment },
      });
    });
  },

  async revertVacationWithIncrement(requestId, employeeId, days, status, adminComment) {
    return prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id: employeeId },
        data: { vacationDays: { increment: days } },
      });

      return tx.absenceRequest.update({
        where: { id: requestId },
        data: { status, adminComment },
      });
    });
  },

  async getByEmployee(employeeId, tenantId = null) {
    const where = { employeeId };
    if (tenantId) where.employee = { tenantId };
    return prisma.absenceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  },
};

export default absenceRepository;
