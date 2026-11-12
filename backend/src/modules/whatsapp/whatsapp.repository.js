/**
 * @file whatsapp.repository.js
 * @description Repositorio de datos para resolución de identidad, estado del empleado y métricas de tenant vía WhatsApp.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../database/db.js';

export class WhatsappRepository {
  constructor(prismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Busca un colaborador en la base de datos coincidiendo con cualquiera de las variantes telefónicas normalizadas.
   * @param {string[]} phoneVariants
   * @returns {Promise<Object|null>} Colaborador con tenant asociado o null si no existe.
   */
  async findEmployeeByPhoneVariants(phoneVariants) {
    if (!phoneVariants || !phoneVariants.length) {
      return null;
    }

    try {
      const orConditions = phoneVariants.flatMap((variant) => [
        { phone: variant },
        { phone: { contains: variant } },
      ]);

      const employee = await this.prisma.employee.findFirst({
        where: {
          OR: orConditions,
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          department: true,
          position: true,
          role: true,
          phone: true,
          vacationDays: true,
          hireDate: true,
          tenantId: true,
          isActive: true,
          tenant: {
            select: {
              id: true,
              name: true,
              ruc: true,
            },
          },
        },
      });

      return employee;
    } catch (err) {
      console.error(
        '[WhatsApp Repository Error] Error al buscar colaborador por teléfono:',
        err.message
      );
      return null;
    }
  }

  /**
   * Obtiene el registro de marcación de asistencia del colaborador para la fecha de hoy.
   * @param {string} employeeId
   * @returns {Promise<Object|null>}
   */
  async getEmployeeAttendanceToday(employeeId) {
    if (!employeeId) return null;

    try {
      const now = new Date();
      // Rango del día actual (00:00:00 a 23:59:59 UTC)
      const startOfDay = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
      );
      const endOfDay = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59)
      );

      const attendance = await this.prisma.attendance.findFirst({
        where: {
          employeeId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return attendance;
    } catch (err) {
      console.error(
        '[WhatsApp Repository Error] Error al consultar asistencia de hoy:',
        err.message
      );
      return null;
    }
  }

  /**
   * Obtiene métricas agregadas del tenant para directores o administradores con permisos.
   * @param {string} tenantId
   * @returns {Promise<Object>}
   */
  async getTenantSummaryMetrics(tenantId) {
    if (!tenantId) return {};

    try {
      const now = new Date();
      const startOfDay = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
      );
      const endOfDay = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59)
      );

      const [totalActiveEmployees, totalAttendancesToday, pendingAbsenceRequests] =
        await Promise.all([
          this.prisma.employee.count({
            where: { tenantId, isActive: true },
          }),
          this.prisma.attendance.count({
            where: {
              employee: { tenantId },
              date: { gte: startOfDay, lte: endOfDay },
            },
          }),
          this.prisma.absenceRequest.count({
            where: {
              employee: { tenantId },
              status: 'PENDING',
            },
          }),
        ]);

      return {
        totalActiveEmployees,
        totalAttendancesToday,
        pendingAbsenceRequests,
      };
    } catch (err) {
      console.error(
        '[WhatsApp Repository Error] Error al consultar métricas de tenant:',
        err.message
      );
      return {};
    }
  }
}

const whatsappRepository = new WhatsappRepository();
export default whatsappRepository;
