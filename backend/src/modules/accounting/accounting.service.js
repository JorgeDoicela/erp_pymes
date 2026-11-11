/**
 * @file accounting.service.js
 * @description Servicio de dominio y aplicación para el módulo Contable (Norma ERP).
 * Orquesta reglas de negocio contables, partida doble ecuatoriana, validación de periodos fiscales e integración de nómina.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import defaultAccountingRepo from './accounting.repository.js';
import defaultAuditRepo from '../audit/audit.repository.js';
import { financial } from '../../utils/financialUtils.js';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../../core/errors/appError.js';

export class AccountingService {
  /**
   * @param {Object} [deps] - Inyección de dependencias
   * @param {Object} [deps.accountingRepo] - Repositorio contable
   * @param {Object} [deps.auditRepo] - Repositorio de auditoría
   */
  constructor({ accountingRepo = defaultAccountingRepo, auditRepo = defaultAuditRepo } = {}) {
    this.accountingRepo = accountingRepo;
    this.auditRepo = auditRepo;
  }

  // ==========================================
  // 1. Periodos Fiscales
  // ==========================================

  async getPeriods(tenantId = null) {
    return await this.accountingRepo.getPeriods(tenantId);
  }

  async createPeriod({ tenantId, year, month, startDate, endDate, user }) {
    const existing = await this.accountingRepo.findPeriodByMonthYear(year, month, tenantId);
    if (existing) {
      throw new ConflictError('El periodo ya existe.');
    }

    const period = await this.accountingRepo.createPeriod({
      tenantId,
      year: parseInt(year, 10),
      month: parseInt(month, 10),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'OPEN',
    });

    this.auditRepo
      .createLog({
        entity: 'AccountingPeriod',
        entityId: period.id,
        action: 'CREATE',
        performedBy: user?.id || 'Admin',
        details: `Periodo creado: ${month}/${year}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    return period;
  }

  async togglePeriodStatus(id, user) {
    const period = await this.accountingRepo.findPeriodById(id);
    if (!period) {
      throw new NotFoundError('Periodo no encontrado.');
    }

    const newStatus = period.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    const updated = await this.accountingRepo.updatePeriod(id, { status: newStatus });

    this.auditRepo
      .createLog({
        entity: 'AccountingPeriod',
        entityId: id,
        action: 'UPDATE_STATUS',
        performedBy: user?.id || 'Admin',
        details: `Estado cambiado a ${newStatus} para el periodo ${period.month}/${period.year}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    return updated;
  }

  async deletePeriod(id, user) {
    const period = await this.accountingRepo.findPeriodById(id);
    if (!period) {
      throw new NotFoundError('Periodo no encontrado.');
    }

    const journalsCount = await this.accountingRepo.countJournalsInDateRange(
      period.startDate,
      period.endDate,
      period.tenantId
    );

    if (journalsCount > 0) {
      throw new ConflictError('No se puede eliminar un periodo que contiene asientos contables.');
    }

    await this.accountingRepo.deletePeriod(id);

    this.auditRepo
      .createLog({
        entity: 'AccountingPeriod',
        entityId: id,
        action: 'DELETE',
        performedBy: user?.id || 'Admin',
        details: `Periodo eliminado: ${period.month}/${period.year}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    return { message: 'Periodo eliminado exitosamente.' };
  }

  // ==========================================
  // 2. Catálogo de Cuentas Contables
  // ==========================================

  async getAccounts(tenantId = null) {
    return await this.accountingRepo.getAccounts(tenantId);
  }

  async createAccount({ tenantId, code, name, description, type, level, isTransactional, parentId, user }) {
    const existing = await this.accountingRepo.findAccountByCode(code, tenantId);
    if (existing) {
      throw new ConflictError('El código contable ya está registrado.');
    }

    const account = await this.accountingRepo.createAccount({
      tenantId,
      code,
      name,
      description: description || null,
      type,
      level: parseInt(level, 10) || 1,
      isTransactional: Boolean(isTransactional),
      parentId: parentId || null,
    });

    this.auditRepo
      .createLog({
        entity: 'AccountingAccount',
        entityId: account.id,
        action: 'CREATE',
        performedBy: user?.id || 'Admin',
        details: `Cuenta creada: [${code}] ${name}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    return account;
  }

  async updateAccount(id, { name, description, isTransactional, isActive }, user) {
    const updated = await this.accountingRepo.updateAccount(id, {
      name,
      description,
      isTransactional,
      isActive,
    });

    this.auditRepo
      .createLog({
        entity: 'AccountingAccount',
        entityId: id,
        action: 'UPDATE',
        performedBy: user?.id || 'Admin',
        details: `Cuenta modificada: ${id}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    return updated;
  }

  async deleteAccount(id, user) {
    const hasChildren = await this.accountingRepo.countSubAccounts(id);
    if (hasChildren > 0) {
      throw new ConflictError('No se puede eliminar una cuenta que posee subcuentas vinculadas.');
    }

    const hasMovements = await this.accountingRepo.countAccountMovements(id);
    if (hasMovements > 0) {
      throw new ConflictError('No se puede eliminar una cuenta que posee asientos contables registrados.');
    }

    await this.accountingRepo.deleteAccount(id);

    this.auditRepo
      .createLog({
        entity: 'AccountingAccount',
        entityId: id,
        action: 'DELETE',
        performedBy: user?.id || 'Admin',
        details: `Cuenta contable eliminada ID: ${id}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    return { message: 'Cuenta eliminada exitosamente.' };
  }

  // ==========================================
  // 3. Centros de Costo
  // ==========================================

  async getCostCenters(tenantId = null) {
    return await this.accountingRepo.getCostCenters(tenantId);
  }

  async createCostCenter({ tenantId, code, name, description, user }) {
    const existing = await this.accountingRepo.findCostCenterByCode(code, tenantId);
    if (existing) {
      throw new ConflictError('El código de centro de costo ya existe.');
    }

    const center = await this.accountingRepo.createCostCenter({
      tenantId,
      code,
      name,
      description,
    });

    this.auditRepo
      .createLog({
        entity: 'CostCenter',
        entityId: center.id,
        action: 'CREATE',
        performedBy: user?.id || 'Admin',
        details: `Centro de costo creado: [${code}] ${name}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    return center;
  }

  async updateCostCenter(id, { name, description }, user) {
    const updated = await this.accountingRepo.updateCostCenter(id, { name, description });

    this.auditRepo
      .createLog({
        entity: 'CostCenter',
        entityId: id,
        action: 'UPDATE',
        performedBy: user?.id || 'Admin',
        details: `Centro de costo modificado ID: ${id}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    return updated;
  }

  async deleteCostCenter(id, user) {
    const hasMovements = await this.accountingRepo.countCostCenterMovements(id);
    if (hasMovements > 0) {
      throw new ConflictError('No se puede eliminar un centro de costo con movimientos contables.');
    }

    await this.accountingRepo.deleteCostCenter(id);

    this.auditRepo
      .createLog({
        entity: 'CostCenter',
        entityId: id,
        action: 'DELETE',
        performedBy: user?.id || 'Admin',
        details: `Centro de costo eliminado ID: ${id}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    return { message: 'Centro de costo eliminado exitosamente.' };
  }

  // ==========================================
  // 4. Asientos y Comprobantes Contables
  // ==========================================

  async getJournalEntries({ tenantId, status, periodId, take = 150 }) {
    const where = tenantId ? { tenantId } : {};

    if (status) {
      where.status = status;
    }

    if (periodId) {
      const period = await this.accountingRepo.findPeriodById(periodId);
      if (period) {
        where.date = {
          gte: period.startDate,
          lte: period.endDate,
        };
      }
    }

    return await this.accountingRepo.getJournalEntries(where, take);
  }

  async createJournalEntry({ tenantId, date, description, type, lines, referenceModule, referenceId, user }) {
    // 1. Validar cuadratura del asiento (Partida Doble)
    const sumDebits = lines.reduce(
      (acc, l) => acc.plus(financial.from(l.debit || 0)),
      financial.from(0)
    );
    const sumCredits = lines.reduce(
      (acc, l) => acc.plus(financial.from(l.credit || 0)),
      financial.from(0)
    );

    const totalDebit = financial.round(sumDebits);
    const totalCredit = financial.round(sumCredits);

    if (Math.abs(financial.from(totalDebit).minus(totalCredit).toNumber()) > 0.001) {
      throw new ValidationError(
        `El asiento contable no está cuadrado. La suma del DEBE ($${totalDebit}) debe ser igual al HABER ($${totalCredit}).`
      );
    }

    // 2. Validar que la fecha pertenezca a un periodo contable ABIERTO
    const entryDate = new Date(date);
    const period = await this.accountingRepo.findOpenPeriodByDate(entryDate, tenantId);
    if (!period) {
      throw new ValidationError('No existe un periodo contable ABIERTO para la fecha del asiento.');
    }

    const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
    const entryNumber = `AS-${entryDate.getFullYear()}${String(entryDate.getMonth() + 1).padStart(2, '0')}-${randomSuffix}`;

    const entryData = {
      tenantId,
      entryNumber,
      date: entryDate,
      description,
      type: type || 'DAILY',
      status: 'DRAFT',
      totalDebit,
      totalCredit,
      referenceModule: referenceModule || null,
      referenceId: referenceId || null,
    };

    const result = await this.accountingRepo.createJournalEntryWithLines(entryData, lines);

    this.auditRepo
      .createLog({
        entity: 'JournalEntry',
        entityId: result.id,
        action: 'CREATE',
        performedBy: user?.id || 'Admin',
        details: `Asiento creado: ${entryNumber} por $${totalDebit}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    return result;
  }

  async postJournalEntry(id, user) {
    const entry = await this.accountingRepo.findJournalEntryById(id);
    if (!entry) {
      throw new NotFoundError('Asiento contable no encontrado');
    }

    if (entry.status === 'POSTED') {
      throw new ConflictError('El asiento ya se encuentra mayorizado.');
    }

    const entryDate = new Date(entry.date);
    const period = await this.accountingRepo.findOpenPeriodByDate(entryDate);
    if (!period) {
      throw new ValidationError('No se puede mayorizar un asiento en un periodo fiscal CERRADO.');
    }

    const updatedEntry = await this.accountingRepo.updateJournalEntryStatus(id, 'POSTED');

    this.auditRepo
      .createLog({
        entity: 'JournalEntry',
        entityId: id,
        action: 'POST',
        performedBy: user?.id || 'Admin',
        details: `Asiento mayorizado: ${entry.entryNumber}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    return updatedEntry;
  }

  async deleteJournalEntry(id, user) {
    const entry = await this.accountingRepo.findJournalEntryById(id);
    if (!entry) {
      throw new NotFoundError('Asiento no encontrado');
    }

    if (entry.status === 'POSTED') {
      throw new ConflictError('No se puede eliminar un comprobante contable que ya ha sido mayorizado.');
    }

    await this.accountingRepo.deleteJournalEntry(id);

    this.auditRepo
      .createLog({
        entity: 'JournalEntry',
        entityId: id,
        action: 'DELETE',
        performedBy: user?.id || 'Admin',
        details: `Asiento eliminado: ${entry.entryNumber}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    return { message: 'Asiento contable eliminado exitosamente' };
  }

  // ==========================================
  // 5. Reportes Financieros
  // ==========================================

  async getTrialBalance({ tenantId, periodId, status = 'POSTED' }) {
    const where = {
      journalEntry: {
        status,
        ...(tenantId ? { tenantId } : {}),
      },
    };

    if (periodId) {
      const period = await this.accountingRepo.findPeriodById(periodId);
      if (period) {
        where.journalEntry.date = {
          gte: period.startDate,
          lte: period.endDate,
        };
      }
    }

    const lines = await this.accountingRepo.getTrialBalanceLines(where);

    const sums = {};
    lines.forEach((line) => {
      const acc = line.account;
      if (!sums[acc.id]) {
        sums[acc.id] = {
          account: acc,
          totalDebit: 0,
          totalCredit: 0,
        };
      }
      sums[acc.id].totalDebit += line.debit;
      sums[acc.id].totalCredit += line.credit;
    });

    const result = Object.values(sums).map((item) => {
      const isDebitNature = ['ASSET', 'EXPENSE'].includes(item.account.type);
      const balance = isDebitNature
        ? item.totalDebit - item.totalCredit
        : item.totalCredit - item.totalDebit;

      return {
        accountId: item.account.id,
        code: item.account.code,
        name: item.account.name,
        type: item.account.type,
        totalDebit: financial.round(item.totalDebit),
        totalCredit: financial.round(item.totalCredit),
        balance: financial.round(balance),
        nature: isDebitNature ? 'DEUDORA' : 'ACREEDORA',
      };
    });

    return result;
  }

  async getGeneralLedger({ tenantId, periodId, accountId }) {
    const where = {
      journalEntry: {
        status: 'POSTED',
        ...(tenantId ? { tenantId } : {}),
      },
    };

    if (accountId) {
      where.accountId = accountId;
    }

    if (periodId) {
      const period = await this.accountingRepo.findPeriodById(periodId);
      if (period) {
        where.journalEntry.date = {
          gte: period.startDate,
          lte: period.endDate,
        };
      }
    }

    return await this.accountingRepo.getGeneralLedgerLines(where);
  }

  // ==========================================
  // 6. Integración Nómina - Contabilidad
  // ==========================================

  async integratePayroll({ payrollId, tenantId, user }) {
    const payroll = await this.accountingRepo.getPayrollForIntegration(payrollId, tenantId);
    if (!payroll) {
      throw new NotFoundError('Nómina no encontrada');
    }

    if (payroll.status === 'DRAFT') {
      throw new ValidationError('La nómina debe estar APROBADA para contabilizarse');
    }

    const existingEntry = await this.accountingRepo.findJournalEntryByReference(
      'PAYROLL',
      payrollId,
      tenantId
    );
    if (existingEntry) {
      throw new ConflictError('Esta nómina ya ha sido contabilizada');
    }

    const [accounts, allCostCenters] = await Promise.all([
      this.accountingRepo.findAccountsByCodes(
        ['5.1.1', '5.1.2', '5.1.3', '2.1.1', '2.1.2'],
        tenantId
      ),
      this.accountingRepo.getActiveCostCenters(tenantId),
    ]);

    const accMap = {};
    accounts.forEach((a) => (accMap[a.code] = a.id));

    if (!accMap['5.1.1'] || !accMap['2.1.1']) {
      throw new ValidationError('Faltan cuentas críticas en el catálogo (Sueldos o Pasivos por pagar)');
    }

    const lines = [];
    let totalSueldos = 0;
    let totalHorasExtras = 0;
    let totalBonos = 0;
    let totalDeducciones = 0;
    let totalNeto = 0;

    const expensesByCC = {};

    payroll.details.forEach((det) => {
      const dept = det.employee?.department || 'General';
      const cc = allCostCenters.find(
        (c) =>
          c.name.toLowerCase() === dept.toLowerCase() || c.code.toLowerCase() === dept.toLowerCase()
      );
      const ccId = cc ? cc.id : null;

      if (!expensesByCC[ccId || 'DEFAULT']) {
        expensesByCC[ccId || 'DEFAULT'] = { ccId, sueldos: 0, extras: 0, bonos: 0 };
      }

      const bonuses =
        typeof det.bonuses === 'string' ? JSON.parse(det.bonuses || '[]') : det.bonuses || [];
      const detBonuses = bonuses.reduce((acc, b) => acc + (b.amount || 0), 0);

      expensesByCC[ccId || 'DEFAULT'].sueldos += det.baseSalary || 0;
      expensesByCC[ccId || 'DEFAULT'].extras += det.overtimeAmount || 0;
      expensesByCC[ccId || 'DEFAULT'].bonos += detBonuses;

      totalSueldos += det.baseSalary || 0;
      totalHorasExtras += det.overtimeAmount || 0;
      totalBonos += detBonuses;
      totalNeto += det.netSalary || 0;

      const deductions =
        typeof det.deductions === 'string'
          ? JSON.parse(det.deductions || '[]')
          : det.deductions || [];
      deductions.forEach((d) => (totalDeducciones += d.amount || 0));
    });

    Object.values(expensesByCC).forEach((group) => {
      if (group.sueldos > 0) {
        lines.push({
          accountId: accMap['5.1.1'],
          costCenterId: group.ccId,
          description: `Gasto Sueldos - ${group.ccId ? 'CC' : 'Gral'}`,
          debit: Number(group.sueldos.toFixed(2)),
          credit: 0,
        });
      }
      if (group.extras > 0) {
        lines.push({
          accountId: accMap['5.1.2'] || accMap['5.1.1'],
          costCenterId: group.ccId,
          description: `Gasto Horas Extras - ${group.ccId ? 'CC' : 'Gral'}`,
          debit: Number(group.extras.toFixed(2)),
          credit: 0,
        });
      }
      if (group.bonos > 0) {
        lines.push({
          accountId: accMap['5.1.3'] || accMap['5.1.1'],
          costCenterId: group.ccId,
          description: `Gasto Bonos y Beneficios - ${group.ccId ? 'CC' : 'Gral'}`,
          debit: Number(group.bonos.toFixed(2)),
          credit: 0,
        });
      }
    });

    lines.push({
      accountId: accMap['2.1.1'],
      description: 'Nómina por Pagar (Neto Consolidado)',
      debit: 0,
      credit: Number(totalNeto.toFixed(2)),
    });

    if (totalDeducciones > 0) {
      lines.push({
        accountId: accMap['2.1.2'] || accMap['2.1.1'],
        description: 'Retenciones y Deducciones de Nómina',
        debit: 0,
        credit: Number(totalDeducciones.toFixed(2)),
      });
    }

    const dateObj = new Date(payroll.period);
    const sumDebits = lines.reduce(
      (acc, l) => acc.plus(financial.from(l.debit || 0)),
      financial.from(0)
    );
    const sumCredits = lines.reduce(
      (acc, l) => acc.plus(financial.from(l.credit || 0)),
      financial.from(0)
    );

    const calculatedTotalDebit = financial.round(sumDebits);
    let calculatedTotalCredit = financial.round(sumCredits);

    if (calculatedTotalDebit !== calculatedTotalCredit && lines.length > 0) {
      const diff = financial.from(calculatedTotalDebit).minus(calculatedTotalCredit).toNumber();
      const lastCreditLine = lines
        .slice()
        .reverse()
        .find((l) => l.credit > 0);
      if (lastCreditLine) {
        lastCreditLine.credit = Number((lastCreditLine.credit + diff).toFixed(2));
        calculatedTotalCredit = calculatedTotalDebit;
      }
    }

    const entry = await this.accountingRepo.createJournalEntryRaw({
      tenantId,
      entryNumber: `PAY-${dateObj.getFullYear()}${String(dateObj.getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`,
      date: new Date(),
      description: `Nexus: Importación de Nómina ${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`,
      type: 'DAILY',
      status: 'DRAFT',
      referenceModule: 'PAYROLL',
      referenceId: payrollId,
      totalDebit: calculatedTotalDebit,
      totalCredit: calculatedTotalCredit,
      lines: { create: lines },
    });

    this.auditRepo
      .createLog({
        entity: 'JournalEntry',
        entityId: entry.id,
        action: 'GENERATE',
        performedBy: user?.id || 'Admin',
        details: `Integración de nómina realizada. Asiento: ${entry.entryNumber}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    return {
      message: 'Nexus: Nómina importada exitosamente como BORRADOR',
      entryId: entry.id,
      entryNumber: entry.entryNumber,
    };
  }
}

export default new AccountingService();
