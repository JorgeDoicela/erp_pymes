/**
 * @file attendance.repository.js
 * @description Repositorio de persistencia para marcas de asistencia (Norma ERP).
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

  // Obtener historial de un empleado
  async getHistoryByEmployee(employeeId) {
    return prisma.attendance.findMany({
      where: { employeeId },
      orderBy: { date: 'desc' },
    });
  },
};

export default attendanceRepository;
