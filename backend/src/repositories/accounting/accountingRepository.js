/**
 * @file accountingRepository.js
 * @description Repositorio desacoplado para el módulo contable (AccountingPeriod, AccountingAccount, CostCenter, JournalEntry).
 * Encapsula la persistencia con Prisma ORM bajo estándar de Clean Architecture / Repositories.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../database/db.js';

export class AccountingRepository {
  // =========================================================================
  // 1. Periodos Contables
  // =========================================================================

  async getPeriods(tenantId = null) {
    return await prisma.accountingPeriod.findMany({
      where: tenantId ? { tenantId } : {},
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async findPeriodById(id, tenantId = null) {
    return await prisma.accountingPeriod.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async findPeriodByMonthYear(year, month, tenantId = null) {
    return await prisma.accountingPeriod.findFirst({
      where: {
        year: parseInt(year, 10),
        month: parseInt(month, 10),
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async findOpenPeriodByDate(date, tenantId = null) {
    const targetDate = new Date(date);
    return await prisma.accountingPeriod.findFirst({
      where: {
        year: targetDate.getFullYear(),
        month: targetDate.getMonth() + 1,
        status: 'OPEN',
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async createPeriod(data) {
    return await prisma.accountingPeriod.create({
      data: {
        tenantId: data.tenantId,
        year: parseInt(data.year, 10),
        month: parseInt(data.month, 10),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: data.status || 'OPEN',
      },
    });
  }

  async updatePeriod(id, data) {
    return await prisma.accountingPeriod.update({
      where: { id },
      data,
    });
  }

  async countJournalsInDateRange(startDate, endDate, tenantId = null) {
    return await prisma.journalEntry.count({
      where: {
        date: { gte: startDate, lte: endDate },
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async deletePeriod(id) {
    return await prisma.accountingPeriod.delete({ where: { id } });
  }

  // =========================================================================
  // 2. Catálogo de Cuentas Contables
  // =========================================================================

  async getAccounts(tenantId = null) {
    return await prisma.accountingAccount.findMany({
      where: tenantId ? { tenantId } : {},
      include: { subAccounts: true },
      orderBy: { code: 'asc' },
    });
  }

  async findAccountByCode(code, tenantId = null) {
    return await prisma.accountingAccount.findFirst({
      where: {
        code,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async findAccountById(id, tenantId = null) {
    return await prisma.accountingAccount.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async createAccount(data) {
    return await prisma.accountingAccount.create({
      data: {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        description: data.description || null,
        type: data.type,
        level: parseInt(data.level, 10) || 1,
        isTransactional: Boolean(data.isTransactional),
        parentId: data.parentId || null,
      },
    });
  }

  async updateAccount(id, data) {
    return await prisma.accountingAccount.update({
      where: { id },
      data,
    });
  }

  async countSubAccounts(parentId) {
    return await prisma.accountingAccount.count({ where: { parentId } });
  }

  async countAccountMovements(accountId) {
    return await prisma.journalLine.count({ where: { accountId } });
  }

  async deleteAccount(id) {
    return await prisma.accountingAccount.delete({ where: { id } });
  }

  // =========================================================================
  // 3. Centros de Costo
  // =========================================================================

  async getCostCenters(tenantId = null) {
    return await prisma.costCenter.findMany({
      where: tenantId ? { tenantId } : {},
      orderBy: { code: 'asc' },
    });
  }

  async findCostCenterByCode(code, tenantId = null) {
    return await prisma.costCenter.findFirst({
      where: {
        code,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async findCostCenterById(id, tenantId = null) {
    return await prisma.costCenter.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async createCostCenter(data) {
    return await prisma.costCenter.create({
      data: {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        description: data.description || null,
      },
    });
  }

  async updateCostCenter(id, data) {
    return await prisma.costCenter.update({
      where: { id },
      data,
    });
  }

  async countCostCenterMovements(costCenterId) {
    return await prisma.journalLine.count({ where: { costCenterId } });
  }

  async deleteCostCenter(id) {
    return await prisma.costCenter.delete({ where: { id } });
  }

  // =========================================================================
  // 4. Asientos Contables (Diarios y Líneas)
  // =========================================================================

  async getJournalEntries(where = {}, take = 150) {
    return await prisma.journalEntry.findMany({
      where,
      include: {
        lines: {
          include: { account: true, costCenter: true },
        },
      },
      orderBy: { date: 'desc' },
      take,
    });
  }

  async findJournalEntryById(id, tenantId = null) {
    return await prisma.journalEntry.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        lines: {
          include: { account: true, costCenter: true },
        },
      },
    });
  }

  async createJournalEntryWithLines(entryData, linesData) {
    return await prisma.$transaction(async (tx) => {
      return await tx.journalEntry.create({
        data: {
          ...entryData,
          lines: {
            create: linesData.map((line) => ({
              accountId: line.accountId,
              costCenterId: line.costCenterId || null,
              description: line.description || null,
              debit: parseFloat(line.debit) || 0,
              credit: parseFloat(line.credit) || 0,
            })),
          },
        },
        include: { lines: true },
      });
    });
  }

  async updateJournalEntryStatus(id, status) {
    return await prisma.journalEntry.update({
      where: { id },
      data: { status },
      include: { lines: true },
    });
  }

  async deleteJournalEntry(id) {
    return await prisma.journalEntry.delete({ where: { id } });
  }

  async findJournalEntryByReference(referenceModule, referenceId, tenantId = null) {
    return await prisma.journalEntry.findFirst({
      where: {
        referenceModule,
        referenceId,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async getTrialBalanceLines(where = {}) {
    return await prisma.journalLine.findMany({
      where,
      include: { account: true },
    });
  }

  async getGeneralLedgerLines(where = {}) {
    return await prisma.journalLine.findMany({
      where,
      include: {
        journalEntry: true,
        account: true,
        costCenter: true,
      },
      orderBy: {
        journalEntry: {
          date: 'asc',
        },
      },
    });
  }

  async findAccountsByCodes(codes, tenantId = null) {
    return await prisma.accountingAccount.findMany({
      where: {
        code: { in: codes },
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async getActiveCostCenters(tenantId = null) {
    return await prisma.costCenter.findMany({
      where: {
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async getPayrollForIntegration(payrollId, tenantId = null) {
    return await prisma.payroll.findFirst({
      where: {
        id: payrollId,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        details: {
          include: {
            employee: {
              select: { department: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });
  }

  async createJournalEntryRaw(data) {
    return await prisma.journalEntry.create({
      data,
    });
  }
}

export default new AccountingRepository();
