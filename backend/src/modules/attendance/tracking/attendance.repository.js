/**
 * @file attendance.repository.js
 * @description Repositorio de persistencia para marcas de asistencia, horarios y geocercas (Norma ERP).
 * Encapsula la interacción con Prisma ORM en el dominio Attendance.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../../database/db.js';

export const attendanceRepository = {
  // Buscar asistencia por empleado y fecha
  async findByEmployeeAndDate(employeeId, date) {
    return prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date,
        },
      },
    });
  },

  // Buscar primer registro según criterio
  async findFirst(where, orderBy = { checkIn: 'desc' }) {
    return prisma.attendance.findFirst({
      where,
      orderBy,
    });
  },

  // Registrar entrada
  async createEntry(data) {
    return prisma.attendance.create({
      data,
    });
  },

  // Registrar salida
  async updateExit(id, data) {
    return prisma.attendance.update({
      where: { id },
      data,
    });
  },

  // Registrar actualización de almuerzo/pausa
  async updateBreak(id, data) {
    return prisma.attendance.update({
      where: { id },
      data,
    });
  },

  // Obtener horario activo del colaborador
  async findActiveSchedule(employeeId, today) {
    return prisma.employeeSchedule.findFirst({
      where: {
        employeeId,
        isActive: true,
        startDate: { lte: today },
        OR: [{ endDate: null }, { endDate: { gte: today } }],
      },
      include: { shift: true },
    });
  },

  // Obtener historial de un empleado
  async getHistoryByEmployee(employeeId) {
    return prisma.attendance.findMany({
      where: { employeeId },
      orderBy: { date: 'desc' },
    });
  },
};

export default attendanceRepository;
