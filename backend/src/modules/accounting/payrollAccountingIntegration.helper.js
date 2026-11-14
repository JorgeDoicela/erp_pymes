/**
 * @file payrollAccountingIntegration.helper.js
 * @description Cálculos contables de precisión Decimal.js para Balance de Comprobación e Integración de Nómina (Partida Doble).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { financial } from '../../core/utils/financialUtils.js';
import { ValidationError } from '../../core/errors/appError.js';

const parseJsonList = (value) => {
  if (!value) return [];
  return typeof value === 'string' ? JSON.parse(value || '[]') : value;
};

export const buildValidatedJournalEntryPayload = ({
  tenantId,
  date,
  description,
  type,
  lines,
  referenceModule,
  referenceId,
}) => {
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

  const entryDate = new Date(date);
  const entryNumber = `AS-${entryDate.getFullYear()}${String(entryDate.getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`;

  return {
    entryDate,
    entryData: {
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
    },
  };
};

export const computeTrialBalanceRows = (lines = []) => {
  const sums = new Map();

  for (const line of lines) {
    const acc = line.account;
    if (!sums.has(acc.id)) {
      sums.set(acc.id, {
        account: acc,
        totalDebit: financial.from(0),
        totalCredit: financial.from(0),
      });
    }
    const group = sums.get(acc.id);
    group.totalDebit = group.totalDebit.plus(financial.from(line.debit || 0));
    group.totalCredit = group.totalCredit.plus(financial.from(line.credit || 0));
  }

  return Array.from(sums.values()).map((item) => {
    const isDebitNature = ['ASSET', 'EXPENSE'].includes(item.account.type);
    const balance = isDebitNature
      ? item.totalDebit.minus(item.totalCredit)
      : item.totalCredit.minus(item.totalDebit);

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
};

const accumulatePayrollExpensesByCostCenter = (details = [], allCostCenters = []) => {
  const expensesByCC = new Map();
  let totalDeducciones = financial.from(0);
  let totalNeto = financial.from(0);

  for (const det of details) {
    const dept = (det.employee?.department || 'General').toLowerCase();
    const cc = allCostCenters.find(
      (c) => c.name?.toLowerCase() === dept || c.code?.toLowerCase() === dept
    );
    const ccId = cc ? cc.id : null;
    const key = ccId || 'DEFAULT';

    if (!expensesByCC.has(key)) {
      expensesByCC.set(key, {
        ccId,
        sueldos: financial.from(0),
        extras: financial.from(0),
        bonos: financial.from(0),
      });
    }

    const bonuses = parseJsonList(det.bonuses);
    const detBonuses = bonuses.reduce(
      (acc, b) => acc.plus(financial.from(b.amount || 0)),
      financial.from(0)
    );

    const group = expensesByCC.get(key);
    group.sueldos = group.sueldos.plus(financial.from(det.baseSalary || 0));
    group.extras = group.extras.plus(financial.from(det.overtimeAmount || 0));
    group.bonos = group.bonos.plus(detBonuses);

    totalNeto = totalNeto.plus(financial.from(det.netSalary || 0));

    const deductions = parseJsonList(det.deductions);
    for (const d of deductions) {
      totalDeducciones = totalDeducciones.plus(financial.from(d.amount || 0));
    }
  }

  return { expensesByCC, totalDeducciones, totalNeto };
};

export const buildPayrollJournalIntegration = ({ payroll, accounts, allCostCenters }) => {
  const accMap = {};
  accounts.forEach((a) => {
    accMap[a.code] = a.id;
  });

  if (!accMap['5.1.1'] || !accMap['2.1.1']) {
    throw new ValidationError(
      'Faltan cuentas críticas en el catálogo (Sueldos o Pasivos por pagar)'
    );
  }

  const { expensesByCC, totalDeducciones, totalNeto } = accumulatePayrollExpensesByCostCenter(
    payroll.details,
    allCostCenters
  );

  const lines = [];
  for (const group of expensesByCC.values()) {
    const suffix = group.ccId ? 'CC' : 'Gral';
    if (group.sueldos.gt(0)) {
      lines.push({
        accountId: accMap['5.1.1'],
        costCenterId: group.ccId,
        description: `Gasto Sueldos - ${suffix}`,
        debit: financial.round(group.sueldos),
        credit: 0,
      });
    }
    if (group.extras.gt(0)) {
      lines.push({
        accountId: accMap['5.1.2'] || accMap['5.1.1'],
        costCenterId: group.ccId,
        description: `Gasto Horas Extras - ${suffix}`,
        debit: financial.round(group.extras),
        credit: 0,
      });
    }
    if (group.bonos.gt(0)) {
      lines.push({
        accountId: accMap['5.1.3'] || accMap['5.1.1'],
        costCenterId: group.ccId,
        description: `Gasto Bonos y Beneficios - ${suffix}`,
        debit: financial.round(group.bonos),
        credit: 0,
      });
    }
  }

  lines.push({
    accountId: accMap['2.1.1'],
    description: 'Nómina por Pagar (Neto Consolidado)',
    debit: 0,
    credit: financial.round(totalNeto),
  });

  if (totalDeducciones.gt(0)) {
    lines.push({
      accountId: accMap['2.1.2'] || accMap['2.1.1'],
      description: 'Retenciones y Deducciones de Nómina',
      debit: 0,
      credit: financial.round(totalDeducciones),
    });
  }

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
    const diff = financial.from(calculatedTotalDebit).minus(calculatedTotalCredit);
    const lastCreditLine = [...lines].reverse().find((l) => l.credit > 0);
    if (lastCreditLine) {
      lastCreditLine.credit = financial.round(financial.from(lastCreditLine.credit).plus(diff));
      calculatedTotalCredit = calculatedTotalDebit;
    }
  }

  const dateObj = new Date(payroll.period);
  const rawEntryData = {
    tenantId: payroll.tenantId,
    entryNumber: `PAY-${dateObj.getFullYear()}${String(dateObj.getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`,
    date: new Date(),
    description: `Nexus: Importación de Nómina ${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`,
    type: 'DAILY',
    status: 'DRAFT',
    referenceModule: 'PAYROLL',
    referenceId: payroll.id,
    totalDebit: calculatedTotalDebit,
    totalCredit: calculatedTotalCredit,
    lines: { create: lines },
  };

  return { lines, calculatedTotalDebit, calculatedTotalCredit, rawEntryData };
};
