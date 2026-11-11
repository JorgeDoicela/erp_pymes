/**
 * @file shift.repository.js
 * @description Repositorio de persistencia para turnos y horarios laborales (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../../database/db.js';

export const shiftRepository = {
  // --- SHIFTS ---
  async createShift(data, tenantId = null) {
    return prisma.shift.create({
      data: {
        ...data,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  },

  async getAllShifts(tenantId = null) {
    return prisma.shift.findMany({
      where: tenantId ? { tenantId } : {},
    });
  },

  async getShiftById(id) {
    return prisma.shift.findUnique({ where: { id } });
  },

  async updateShift(id, data, tenantId = null) {
    return prisma.shift.update({
      where: { id },
      data,
    });
  },

  async deleteShift(id, tenantId = null) {
    return prisma.shift.delete({
      where: { id },
    });
  },

  // --- SCHEDULES ---
  async createSchedule(data) {
    return prisma.employeeSchedule.create({ data });
  },

  async getAllSchedules(tenantId = null) {
    return prisma.employeeSchedule.findMany({
      where: {
        isActive: true,
        ...(tenantId ? { employee: { tenantId } } : {}),
      },
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
        shift: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async deleteSchedule(id) {
    return prisma.employeeSchedule.update({
      where: { id },
      data: { isActive: false },
    });
  },

  async findOverlappingSchedules(employeeId, startDate, endDate) {
    const where = {
      employeeId,
      isActive: true,
      AND: [
        { startDate: { lte: endDate || new Date(2100, 0, 1) } },
        {
          OR: [{ endDate: null }, { endDate: { gte: startDate } }],
        },
      ],
    };

    return prisma.employeeSchedule.findMany({
      where,
    });
  },
};

export default shiftRepository;
