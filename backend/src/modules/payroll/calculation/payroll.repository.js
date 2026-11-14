/**
 * @file payroll.repository.js
 * @description Repositorio de persistencia para el módulo de nómina (Norma ERP).
 * Encapsula la persistencia con Prisma ORM para configuraciones, nóminas y detalles salariales.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../../database/db.js';

export class PayrollRepository {
  async getActiveConfig(tenantId = null) {
    return await prisma.payrollConfig.findFirst({
      where: {
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  async createConfigWithItems(configData, itemsData, tenantId = null) {
    return await prisma.$transaction(async (tx) => {
      await tx.payrollConfig.updateMany({
        where: {
          isActive: true,
          ...(tenantId ? { tenantId } : {}),
        },
        data: { isActive: false },
      });

      return await tx.payrollConfig.create({
        data: {
          tenantId,
          workingDays: configData.workingDays,
          currency: configData.currency || 'USD',
          isActive: true,
          items: { create: itemsData },
        },
        include: { items: true },
      });
    });
  }

  async findExistingPayrollByPeriod(periodDate, tenantId = null) {
    return await prisma.payroll.findFirst({
      where: {
        period: periodDate,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async findEligibleEmployeesForPeriod(startDate, endDate, tenantId = null) {
    const activeContractFilter = {
      startDate: { lte: endDate },
      OR: [{ endDate: null }, { endDate: { gte: startDate } }],
      status: 'Active',
    };
    return await prisma.employee.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        contracts: { some: activeContractFilter },
      },
      include: {
        contracts: {
          where: activeContractFilter,
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    });
  }

  async findBatchPayrollInputs(employeeIds, startDate, endDate) {
    const [allAttendance, allSchedules, allBenefits, allAdvances, allAbsences] = await Promise.all([
      prisma.attendance.findMany({
        where: { employeeId: { in: employeeIds }, date: { gte: startDate, lte: endDate } },
      }),
      prisma.employeeSchedule.findMany({
        where: {
          employeeId: { in: employeeIds },
          isActive: true,
          OR: [{ endDate: null }, { endDate: { gte: startDate } }],
          startDate: { lte: endDate },
        },
        include: { shift: true },
      }),
      prisma.employeeBenefit.findMany({
        where: { employeeId: { in: employeeIds }, status: 'ACTIVE' },
      }),
      prisma.salaryAdvance.findMany({
        where: { employeeId: { in: employeeIds }, status: 'APPROVED' },
      }),
      prisma.absenceRequest?.findMany
        ? prisma.absenceRequest.findMany({
            where: {
              employeeId: { in: employeeIds },
              status: 'APPROVED',
              startDate: { lte: endDate },
              endDate: { gte: startDate },
            },
          })
        : Promise.resolve([]),
    ]);

    return { allAttendance, allSchedules, allBenefits, allAdvances, allAbsences };
  }

  async createPayrollWithDetails({ tenantId, periodDate, endDate, totalAmount, payrollDetails }) {
    return await prisma.payroll.create({
      data: {
        tenantId,
        period: periodDate,
        endDate,
        totalAmount,
        status: 'DRAFT',
        details: {
          create: payrollDetails.map((d) => ({
            employeeId: d.employeeId,
            baseSalary: d.baseSalary,
            workedDays: d.workedDays,
            overtimeHours: d.overtimeHours,
            overtimeAmount: d.overtimeAmount,
            bonuses: d.bonuses,
            deductions: d.deductions,
            netSalary: d.netSalary,
            signatureStatus: d.signatureStatus || 'PENDING',
            signatureCode: d.signatureCode,
            signatureToken: d.signatureToken,
            signatureData: d.signatureData,
          })),
        },
      },
      include: {
        details: { include: { employee: true } },
      },
    });
  }

  async findPayrollForValidation(payrollId) {
    return await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: { details: true },
    });
  }

  async findPayrolls({ skip = 0, take = 10, tenantId = null } = {}) {
    return await prisma.payroll.findMany({
      where: tenantId ? { tenantId } : {},
      skip,
      take,
      orderBy: { period: 'desc' },
    });
  }

  async countPayrolls(tenantId = null) {
    return await prisma.payroll.count({ where: tenantId ? { tenantId } : {} });
  }

  async findPayrollsPage(skip, limit, tenantId = null) {
    return await Promise.all([
      this.findPayrolls({ skip, take: limit, tenantId }),
      this.countPayrolls(tenantId),
    ]);
  }

  async findPayrollsByEmployee(employeeId) {
    return await this.findPublishedDetailsByEmployee(employeeId);
  }

  async updatePayrollStatus(id, status) {
    return await prisma.payroll.update({ where: { id }, data: { status } });
  }

  async updatePayrollDetail(detailId, data) {
    return await this.updatePayrollDetailWithRelations(detailId, data);
  }

  async deletePayroll(id) {
    return await prisma.payroll.delete({ where: { id } });
  }

  async resolveEmployeeForUser(employeeId, user, tenantId = null) {
    return await prisma.employee.findFirst({
      where: {
        OR: [
          ...(employeeId ? [{ id: employeeId }] : []),
          ...(user?.id ? [{ id: user.id }] : []),
          ...(user?.email ? [{ email: user.email }] : []),
        ],
        ...(tenantId ? { tenantId } : {}),
      },
      select: { id: true },
    });
  }

  async findPublishedDetailsByEmployee(employeeId) {
    return await prisma.payrollDetail.findMany({
      where: {
        employeeId,
        payroll: { status: { in: ['APPROVED', 'PAID'] } },
      },
      include: { payroll: true, employee: true },
      orderBy: { payroll: { period: 'desc' } },
    });
  }

  async findPayrollByIdWithContracts(id, tenantId = null) {
    return await prisma.payroll.findFirst({
      where: { id, ...(tenantId ? { tenantId } : {}) },
      include: {
        details: {
          include: {
            employee: {
              include: { contracts: { orderBy: { startDate: 'desc' }, take: 1 } },
            },
          },
        },
      },
    });
  }

  async findPayrollById(id, tenantId = null) {
    return await prisma.payroll.findFirst({
      where: { id, ...(tenantId ? { tenantId } : {}) },
      include: { details: { include: { employee: true } } },
    });
  }

  async findPayrollHeader(id, tenantId = null) {
    return await prisma.payroll.findFirst({
      where: { id, ...(tenantId ? { tenantId } : {}) },
    });
  }

  async findDetailWithPayroll(detailId, tenantId = null) {
    return await prisma.payrollDetail.findFirst({
      where: {
        id: detailId,
        ...(tenantId ? { payroll: { tenantId } } : {}),
      },
      include: { employee: true, payroll: true },
    });
  }

  async updatePayrollPaid(id, paymentDate = new Date()) {
    return await prisma.payroll.update({
      where: { id },
      data: { status: 'PAID', paymentDate },
    });
  }

  async updatePayrollDetailWithRelations(detailId, data) {
    return await prisma.payrollDetail.update({
      where: { id: detailId },
      data,
      include: { employee: true, payroll: true },
    });
  }

  async findPendingSignatureDetails(payrollId) {
    return await prisma.payrollDetail.findMany({
      where: {
        payrollId,
        OR: [{ signatureStatus: 'PENDING' }, { signatureStatus: null }],
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findActiveAdmins() {
    return await prisma.employee.findMany({
      where: { role: 'admin', isActive: true },
      select: { id: true, tenantId: true },
    });
  }

  async runInTransaction(callback) {
    return await prisma.$transaction(callback);
  }
}

export default new PayrollRepository();
