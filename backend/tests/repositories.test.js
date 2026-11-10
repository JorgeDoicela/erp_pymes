/**
 * @file repositories.test.js
 * @description Pruebas unitarias para AccountingRepository y PayrollRepository (Fase 2).
 */

import { describe, it, expect, vi } from 'vitest';
import accountingRepository, {
  AccountingRepository,
} from '../src/repositories/accounting/accountingRepository.js';
import payrollRepository, {
  PayrollRepository,
} from '../src/repositories/payroll/payrollRepository.js';

describe('Fase 2: Homogeneización de la Capa de Repositorios', () => {
  describe('AccountingRepository', () => {
    it('debe ser una instancia válida de AccountingRepository con todos los métodos de dominio', () => {
      expect(accountingRepository).toBeInstanceOf(AccountingRepository);
      expect(typeof accountingRepository.getPeriods).toBe('function');
      expect(typeof accountingRepository.findPeriodById).toBe('function');
      expect(typeof accountingRepository.findPeriodByMonthYear).toBe('function');
      expect(typeof accountingRepository.findOpenPeriodByDate).toBe('function');
      expect(typeof accountingRepository.createPeriod).toBe('function');
      expect(typeof accountingRepository.updatePeriod).toBe('function');
      expect(typeof accountingRepository.deletePeriod).toBe('function');

      expect(typeof accountingRepository.getAccounts).toBe('function');
      expect(typeof accountingRepository.findAccountByCode).toBe('function');
      expect(typeof accountingRepository.createAccount).toBe('function');
      expect(typeof accountingRepository.updateAccount).toBe('function');
      expect(typeof accountingRepository.deleteAccount).toBe('function');

      expect(typeof accountingRepository.getCostCenters).toBe('function');
      expect(typeof accountingRepository.createCostCenter).toBe('function');
      expect(typeof accountingRepository.updateCostCenter).toBe('function');
      expect(typeof accountingRepository.deleteCostCenter).toBe('function');

      expect(typeof accountingRepository.getJournalEntries).toBe('function');
      expect(typeof accountingRepository.createJournalEntryWithLines).toBe('function');
      expect(typeof accountingRepository.updateJournalEntryStatus).toBe('function');
      expect(typeof accountingRepository.deleteJournalEntry).toBe('function');
    });
  });

  describe('PayrollRepository', () => {
    it('debe ser una instancia válida de PayrollRepository con todos los métodos de dominio', () => {
      expect(payrollRepository).toBeInstanceOf(PayrollRepository);
      expect(typeof payrollRepository.getActiveConfig).toBe('function');
      expect(typeof payrollRepository.createConfigWithItems).toBe('function');
      expect(typeof payrollRepository.findPayrollById).toBe('function');
      expect(typeof payrollRepository.findPayrolls).toBe('function');
      expect(typeof payrollRepository.countPayrolls).toBe('function');
      expect(typeof payrollRepository.findPayrollsByEmployee).toBe('function');
      expect(typeof payrollRepository.updatePayrollStatus).toBe('function');
      expect(typeof payrollRepository.updatePayrollDetail).toBe('function');
      expect(typeof payrollRepository.deletePayroll).toBe('function');
    });
  });
});
