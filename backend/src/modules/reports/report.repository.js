/**
 * @file report.repository.js
 * @description Norma ERP - Repositorio de Reportes y Exportación
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../database/db.js';

export class ReportRepository {
  async findEmployeesAttendanceData(whereEmployee, start, end) {
    return prisma.employee.findMany({
      where: whereEmployee,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        department: true,
        attendance: {
          where: {
            date: {
              gte: start,
              lte: end,
            },
          },
          select: {
            id: true,
            date: true,
            checkIn: true,
            checkOut: true,
            workedHours: true,
            overtimeHours: true,
            status: true,
            ipAddress: true,
            entryLatitude: true,
            entryLongitude: true,
            exitLatitude: true,
            exitLongitude: true,
          },
        },
        absences: {
          where: {
            status: 'APPROVED',
            OR: [{ startDate: { lte: end }, endDate: { gte: start } }],
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            type: true,
          },
        },
        schedules: {
          select: {
            shift: {
              select: {
                startTime: true,
                endTime: true,
              },
            },
          },
        },
      },
    });
  }

  async findEmployeesForExport() {
    return prisma.employee.findMany({
      include: {
        contracts: {
          where: { status: 'Active' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async findPayrollDetailsForExport(payrollId) {
    return prisma.payrollDetail.findMany({
      where: { payrollId },
      include: { employee: true, payroll: true },
    });
  }
}

export default new ReportRepository();

