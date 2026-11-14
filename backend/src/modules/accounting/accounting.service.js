/**
 * @file accounting.service.js
 * @description Servicio de dominio y aplicación para el módulo Contable (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import defaultAccountingRepo from './accounting.repository.js';
import { auditRepository as defaultAuditRepo } from '../audit/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../../core/errors/appError.js';
import {
  buildPayrollJournalIntegration,
  buildValidatedJournalEntryPayload,
  computeTrialBalanceRows,
} from './payrollAccountingIntegration.helper.js';

export class AccountingService {
  constructor({ accountingRepo = defaultAccountingRepo, auditRepo = defaultAuditRepo } = {}) {
    this.accountingRepo = accountingRepo;
    this.auditRepo = auditRepo;
  }

  _logAudit(entity, entityId, action, user, details) {
    this.auditRepo
      .createLog({ entity, entityId, action, performedBy: user?.id || 'Admin', details })
      .catch((err) => console.error('Audit Log Error:', err));
  }

  async _resolvePeriodFilter(tenantId, periodId, status = 'POSTED') {
    const where = { journalEntry: { status, ...(tenantId ? { tenantId } : {}) } };
    if (periodId) {
      const period = await this.accountingRepo.findPeriodById(periodId);
      if (period) where.journalEntry.date = { gte: period.startDate, lte: period.endDate };
    }
    return where;
  }

  async getPeriods(tenantId = null) {
    return await this.accountingRepo.getPeriods(tenantId);
  }

  async createPeriod({ tenantId, year, month, startDate, endDate, user }) {
    if (await this.accountingRepo.findPeriodByMonthYear(year, month, tenantId)) {
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
    this._logAudit(
      'AccountingPeriod',
      period.id,
      'CREATE',
      user,
      `Periodo creado: ${month}/${year}`
    );
    return period;
  }

  async togglePeriodStatus(id, user) {
    const period = await this.accountingRepo.findPeriodById(id);
    if (!period) throw new NotFoundError('Periodo no encontrado.');
    const newStatus = period.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    const updated = await this.accountingRepo.updatePeriod(id, { status: newStatus });
    this._logAudit('AccountingPeriod', id, 'UPDATE_STATUS', user, `Estado cambiado a ${newStatus}`);
    return updated;
  }

  async deletePeriod(id, user) {
    const period = await this.accountingRepo.findPeriodById(id);
    if (!period) throw new NotFoundError('Periodo no encontrado.');
    const count = await this.accountingRepo.countJournalsInDateRange(
      period.startDate,
      period.endDate,
      period.tenantId
    );
    if (count > 0) {
      throw new ConflictError('No se puede eliminar un periodo que contiene asientos contables.');
    }
    await this.accountingRepo.deletePeriod(id);
    this._logAudit(
      'AccountingPeriod',
      id,
      'DELETE',
      user,
      `Periodo eliminado: ${period.month}/${period.year}`
    );
    return { message: 'Periodo eliminado exitosamente.' };
  }

  async getAccounts(tenantId = null) {
    return await this.accountingRepo.getAccounts(tenantId);
  }

  async createAccount(params) {
    const { tenantId, code, name, description, type, level, isTransactional, parentId, user } =
      params;
    if (await this.accountingRepo.findAccountByCode(code, tenantId)) {
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
    this._logAudit(
      'AccountingAccount',
      account.id,
      'CREATE',
      user,
      `Cuenta creada: [${code}] ${name}`
    );
    return account;
  }

  async updateAccount(id, { name, description, isTransactional, isActive }, user) {
    const updated = await this.accountingRepo.updateAccount(id, {
      name,
      description,
      isTransactional,
      isActive,
    });
    this._logAudit('AccountingAccount', id, 'UPDATE', user, `Cuenta modificada: ${id}`);
    return updated;
  }

  async deleteAccount(id, user) {
    if ((await this.accountingRepo.countSubAccounts(id)) > 0) {
      throw new ConflictError('No se puede eliminar una cuenta que posee subcuentas vinculadas.');
    }
    if ((await this.accountingRepo.countAccountMovements(id)) > 0) {
      throw new ConflictError(
        'No se puede eliminar una cuenta que posee asientos contables registrados.'
      );
    }
    await this.accountingRepo.deleteAccount(id);
    this._logAudit('AccountingAccount', id, 'DELETE', user, `Cuenta contable eliminada ID: ${id}`);
    return { message: 'Cuenta eliminada exitosamente.' };
  }

  async getCostCenters(tenantId = null) {
    return await this.accountingRepo.getCostCenters(tenantId);
  }

  async createCostCenter({ tenantId, code, name, description, user }) {
    if (await this.accountingRepo.findCostCenterByCode(code, tenantId)) {
      throw new ConflictError('El código de centro de costo ya existe.');
    }
    const center = await this.accountingRepo.createCostCenter({
      tenantId,
      code,
      name,
      description,
    });
    this._logAudit(
      'CostCenter',
      center.id,
      'CREATE',
      user,
      `Centro de costo creado: [${code}] ${name}`
    );
    return center;
  }

  async updateCostCenter(id, { name, description }, user) {
    const updated = await this.accountingRepo.updateCostCenter(id, { name, description });
    this._logAudit('CostCenter', id, 'UPDATE', user, `Centro de costo modificado ID: ${id}`);
    return updated;
  }

  async deleteCostCenter(id, user) {
    if ((await this.accountingRepo.countCostCenterMovements(id)) > 0) {
      throw new ConflictError('No se puede eliminar un centro de costo con movimientos contables.');
    }
    await this.accountingRepo.deleteCostCenter(id);
    this._logAudit('CostCenter', id, 'DELETE', user, `Centro de costo eliminado ID: ${id}`);
    return { message: 'Centro de costo eliminado exitosamente.' };
  }

  async getJournalEntries({ tenantId, status, periodId, take = 150 }) {
    const where = tenantId ? { tenantId } : {};
    if (status) where.status = status;
    if (periodId) {
      const period = await this.accountingRepo.findPeriodById(periodId);
      if (period) where.date = { gte: period.startDate, lte: period.endDate };
    }
    return await this.accountingRepo.getJournalEntries(where, take);
  }

  async createJournalEntry(params) {
    const { entryDate, entryData } = buildValidatedJournalEntryPayload(params);
    const period = await this.accountingRepo.findOpenPeriodByDate(entryDate, params.tenantId);
    if (!period) {
      throw new ValidationError('No existe un periodo contable ABIERTO para la fecha del asiento.');
    }
    const result = await this.accountingRepo.createJournalEntryWithLines(entryData, params.lines);
    this._logAudit(
      'JournalEntry',
      result.id,
      'CREATE',
      params.user,
      `Asiento creado: ${entryData.entryNumber}`
    );
    return result;
  }

  async postJournalEntry(id, user) {
    const entry = await this.accountingRepo.findJournalEntryById(id);
    if (!entry) throw new NotFoundError('Asiento contable no encontrado');
    if (entry.status === 'POSTED')
      throw new ConflictError('El asiento ya se encuentra mayorizado.');
    if (!(await this.accountingRepo.findOpenPeriodByDate(new Date(entry.date)))) {
      throw new ValidationError('No se puede mayorizar un asiento en un periodo fiscal CERRADO.');
    }
    const updatedEntry = await this.accountingRepo.updateJournalEntryStatus(id, 'POSTED');
    this._logAudit('JournalEntry', id, 'POST', user, `Asiento mayorizado: ${entry.entryNumber}`);
    return updatedEntry;
  }

  async deleteJournalEntry(id, user) {
    const entry = await this.accountingRepo.findJournalEntryById(id);
    if (!entry) throw new NotFoundError('Asiento no encontrado');
    if (entry.status === 'POSTED') {
      throw new ConflictError(
        'No se puede eliminar un comprobante contable que ya ha sido mayorizado.'
      );
    }
    await this.accountingRepo.deleteJournalEntry(id);
    this._logAudit('JournalEntry', id, 'DELETE', user, `Asiento eliminado: ${entry.entryNumber}`);
    return { message: 'Asiento contable eliminado exitosamente' };
  }

  async getTrialBalance({ tenantId, periodId, status = 'POSTED' }) {
    const where = await this._resolvePeriodFilter(tenantId, periodId, status);
    return computeTrialBalanceRows(await this.accountingRepo.getTrialBalanceLines(where));
  }

  async getGeneralLedger({ tenantId, periodId, accountId }) {
    const where = await this._resolvePeriodFilter(tenantId, periodId, 'POSTED');
    if (accountId) where.accountId = accountId;
    return await this.accountingRepo.getGeneralLedgerLines(where);
  }

  async integratePayroll({ payrollId, tenantId, user }) {
    const payroll = await this.accountingRepo.getPayrollForIntegration(payrollId, tenantId);
    if (!payroll) throw new NotFoundError('Nómina no encontrada');
    if (payroll.status === 'DRAFT') {
      throw new ValidationError('La nómina debe estar APROBADA para contabilizarse');
    }
    if (await this.accountingRepo.findJournalEntryByReference('PAYROLL', payrollId, tenantId)) {
      throw new ConflictError('Esta nómina ya ha sido contabilizada');
    }

    const [accounts, allCostCenters] = await Promise.all([
      this.accountingRepo.findAccountsByCodes(
        ['5.1.1', '5.1.2', '5.1.3', '2.1.1', '2.1.2'],
        tenantId
      ),
      this.accountingRepo.getActiveCostCenters(tenantId),
    ]);

    const { rawEntryData } = buildPayrollJournalIntegration({
      payroll,
      accounts,
      allCostCenters,
    });

    const entry = await this.accountingRepo.createJournalEntryRaw({
      ...rawEntryData,
      tenantId,
      referenceId: payrollId,
    });

    this._logAudit('JournalEntry', entry.id, 'GENERATE', user, `Integración: ${entry.entryNumber}`);
    return {
      message: 'Nexus: Nómina importada exitosamente como BORRADOR',
      entryId: entry.id,
      entryNumber: entry.entryNumber,
    };
  }
}

export default new AccountingService();
