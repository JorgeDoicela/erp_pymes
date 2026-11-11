/**
 * @file repositories.test.js
 * @description Pruebas unitarias para AccountingRepository y PayrollRepository (Fase 2).
 */

import { describe, it, expect, vi } from 'vitest';
import { accountingRepository, AccountingRepository } from '../../src/modules/accounting/index.js';
import { payrollRepository, PayrollRepository } from '../../src/modules/payroll/index.js';
import { complianceRepository, ComplianceRepository } from '../../src/modules/compliance/index.js';
import {
  performanceRepository,
  PerformanceRepository,
} from '../../src/modules/performance/index.js';
import { systemRepository, SystemRepository } from '../../src/modules/system/index.js';

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

  describe('ComplianceRepository', () => {
    it('debe ser una instancia válida de ComplianceRepository con todos los métodos de persistencia', () => {
      expect(complianceRepository).toBeInstanceOf(ComplianceRepository);
      expect(typeof complianceRepository.findActiveContracts).toBe('function');
      expect(typeof complianceRepository.findExpiringDocuments).toBe('function');
      expect(typeof complianceRepository.findEmployeesWithActiveContract).toBe('function');
    });
  });

  describe('PerformanceRepository', () => {
    it('debe ser una instancia válida de PerformanceRepository con métodos de evaluaciones y objetivos', () => {
      expect(performanceRepository).toBeInstanceOf(PerformanceRepository);
      expect(typeof performanceRepository.findTemplates).toBe('function');
      expect(typeof performanceRepository.createTemplate).toBe('function');
      expect(typeof performanceRepository.findEvaluations).toBe('function');
      expect(typeof performanceRepository.countEvaluations).toBe('function');
      expect(typeof performanceRepository.findEvaluationById).toBe('function');
      expect(typeof performanceRepository.findMyResults).toBe('function');
      expect(typeof performanceRepository.findGoalsByEmployee).toBe('function');
      expect(typeof performanceRepository.findGoalById).toBe('function');
      expect(typeof performanceRepository.createGoal).toBe('function');
      expect(typeof performanceRepository.updateGoal).toBe('function');
      expect(typeof performanceRepository.deleteGoal).toBe('function');
    });
  });

  describe('SystemRepository', () => {
    it('debe ser una instancia válida de SystemRepository con métodos de configuración y salud', () => {
      expect(systemRepository).toBeInstanceOf(SystemRepository);
      expect(typeof systemRepository.findByTenantId).toBe('function');
      expect(typeof systemRepository.findFirst).toBe('function');
      expect(typeof systemRepository.updateById).toBe('function');
      expect(typeof systemRepository.checkDatabaseConnection).toBe('function');
    });
  });
});
