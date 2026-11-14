/**
 * @file employeeBenefit.repository.js
 * @description Repositorio de persistencia para beneficios, bonos y comisiones de colaboradores (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../../database/db.js';

export class EmployeeBenefitRepository {
  async findBenefitsPaginated({ where, skip, take }) {
    return Promise.all([
      prisma.employeeBenefit.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              identityCard: true,
              department: true,
              position: true,
            },
          },
        },
      }),
      prisma.employeeBenefit.count({ where }),
    ]);
  }

  async getStatsData(tenantId = null) {
    const baseWhere = tenantId ? { employee: { tenantId } } : {};

    return Promise.all([
      prisma.employeeBenefit.count({ where: baseWhere }),
      prisma.employeeBenefit.count({ where: { ...baseWhere, status: 'ACTIVE' } }),
      prisma.employeeBenefit.count({ where: { ...baseWhere, status: 'PROCESSED' } }),
      prisma.employeeBenefit.count({ where: { ...baseWhere, status: 'CANCELLED' } }),
      prisma.employeeBenefit.aggregate({
        where: { ...baseWhere, status: 'ACTIVE' },
        _sum: { amount: true },
      }),
    ]);
  }

  async findByEmployee(employeeId, tenantId = null) {
    const where = { employeeId };
    if (tenantId) {
      where.employee = { tenantId };
    }

    return prisma.employeeBenefit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
            position: true,
          },
        },
      },
    });
  }

  async findEmployeeInTenant(employeeId, tenantId = null) {
    return prisma.employee.findFirst({
      where: {
        id: employeeId,
        ...(tenantId ? { tenantId } : {}),
      },
      select: { id: true, firstName: true, lastName: true },
    });
  }

  async findEmployeesWithActiveContracts(employeeIds, tenantId = null) {
    return prisma.employee.findMany({
      where: {
        id: { in: employeeIds },
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        contracts: {
          where: {
            status: 'Active',
            OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
          },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    });
  }

  async createBenefit(data) {
    return prisma.employeeBenefit.create({
      data,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
            position: true,
          },
        },
      },
    });
  }

  async createManyBenefits(data) {
    return prisma.employeeBenefit.createMany({ data });
  }

  async findByIdForTenant(id, tenantId = null) {
    return prisma.employeeBenefit.findFirst({
      where: {
        id,
        ...(tenantId ? { employee: { tenantId } } : {}),
      },
    });
  }

  async updateBenefit(id, data) {
    return prisma.employeeBenefit.update({
      where: { id },
      data,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
            position: true,
          },
        },
      },
    });
  }

  async deactivateBenefit(id) {
    return prisma.employeeBenefit.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}

export const employeeBenefitRepository = new EmployeeBenefitRepository();
export default employeeBenefitRepository;
