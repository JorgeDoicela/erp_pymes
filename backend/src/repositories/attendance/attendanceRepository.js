/**
 * @file attendanceRepository.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../database/db.js';

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

  // Obtener historial de un empleado (opcional por ahora, pero útil)
  async getHistoryByEmployee(employeeId) {
    return prisma.attendance.findMany({
      where: { employeeId },
      orderBy: { date: 'desc' },
    });
  },
};
