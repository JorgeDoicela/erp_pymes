/**
 * @file salaryAdvance.repository.js
 * @description Repositorio de persistencia para anticipos de sueldo y préstamos (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../../database/db.js';

export class SalaryAdvanceRepository {
  async findActiveContractForEmployee(employeeId) {
    return prisma.contract.findFirst({
      where: {
        employeeId,
        status: 'Active',
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findEmployeeById(employeeId) {
    return prisma.employee.findUnique({
      where: { id: employeeId },
    });
  }

  async findEmployeeWithActiveContract(employeeId, tenantId = null) {
    return prisma.employee.findFirst({
      where: {
        id: employeeId,
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

  async createAdvance(data, includePosition = false) {
    return prisma.salaryAdvance.create({
      data,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityCard: true,
            department: true,
            ...(includePosition ? { position: true } : {}),
          },
        },
      },
    });
  }

  async getStatsData(tenantId = null) {
    const baseWhere = tenantId ? { employee: { tenantId } } : {};

    return Promise.all([
      prisma.salaryAdvance.count({ where: baseWhere }),
      prisma.salaryAdvance.count({ where: { ...baseWhere, status: 'PENDING' } }),
      prisma.salaryAdvance.count({ where: { ...baseWhere, status: 'APPROVED' } }),
      prisma.salaryAdvance.count({ where: { ...baseWhere, status: 'PAID' } }),
      prisma.salaryAdvance.count({ where: { ...baseWhere, status: 'REJECTED' } }),
      prisma.salaryAdvance.count({ where: { ...baseWhere, status: 'CANCELLED' } }),
      prisma.salaryAdvance.findMany({
        where: { ...baseWhere, status: 'APPROVED' },
        select: { amount: true, paidAmount: true, monthlyDeduction: true },
      }),
    ]);
  }

  async findAdvancesPaginated({ where, skip, take }) {
    return Promise.all([
      prisma.salaryAdvance.findMany({
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
      prisma.salaryAdvance.count({ where }),
    ]);
  }

  async findByEmployee(employeeId) {
    return prisma.salaryAdvance.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByIdForTenant(id, tenantId = null) {
    return prisma.salaryAdvance.findFirst({
      where: {
        id,
        ...(tenantId ? { employee: { tenantId } } : {}),
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, email: true, department: true },
        },
      },
    });
  }

  async findById(id) {
    return prisma.salaryAdvance.findUnique({ where: { id } });
  }

  async updateWithEmployee(id, data) {
    return prisma.salaryAdvance.update({
      where: { id },
      data,
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
    });
  }

  async updateStatus(id, status) {
    return prisma.salaryAdvance.update({
      where: { id },
      data: { status },
    });
  }
}

export const salaryAdvanceRepository = new SalaryAdvanceRepository();
export default salaryAdvanceRepository;
