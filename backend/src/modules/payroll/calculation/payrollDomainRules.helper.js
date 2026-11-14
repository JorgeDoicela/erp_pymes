/**
 * @file payrollDomainRules.helper.js
 * @description Reglas de dominio del Código del Trabajo de Ecuador para cálculo de nómina:
 * fondos de reserva, beneficios, anticipos y liquidación neta por colaborador.
 */

import { financial } from '../../../core/utils/financialUtils.js';
import { resolveInstallmentAmount } from '../advances/advanceInstallment.js';
import {
  computeNightHoursForRecord,
  evaluateAbsencesImpact,
  evaluateAttendanceRecordMetrics,
  resolveDailyExpectedHours,
} from './payrollOvertimeAndAbsences.helper.js';

export {
  computeNightHoursForRecord,
  evaluateAbsencesImpact,
  evaluateAttendanceRecordMetrics,
  resolveDailyExpectedHours,
};

const RESERVE_FUND_ITEM_REGEX = /fondo[s]?\s+de\s+reserva/i;

export const hasReserveFundEligibility = (emp, contract, periodEndDate) => {
  const startRaw = emp?.hireDate || contract?.startDate;
  if (!startRaw) return true;
  const startDate = new Date(startRaw);
  if (Number.isNaN(startDate.getTime())) return true;
  return (periodEndDate.getTime() - startDate.getTime()) / 86400000 >= 365;
};

const buildBonusesAndDeductions = ({
  emp,
  contract,
  config,
  endDate,
  earnedSalary,
  overtimeTotalCost,
  nightSurchargeAmount,
  undertimeAmount,
  benefits,
  advances,
  absenceImpact,
}) => {
  const employeeBonuses = [];
  const employeeDeductions = [];
  if (nightSurchargeAmount.gt(0)) {
    employeeBonuses.push({
      name: 'Recargo Nocturno (25%)',
      amount: financial.round(nightSurchargeAmount),
    });
  }

  let taxableBonusesTotal = financial.from(0);
  for (const benefit of benefits) {
    const benAmount = financial.from(benefit.amount);
    const isNonTaxable = ['HEALTH', 'MEAL', 'TRANSPORT', 'ALLOWANCE'].includes(benefit.type);
    if (!isNonTaxable) taxableBonusesTotal = taxableBonusesTotal.plus(benAmount);
    employeeBonuses.push({
      name: benefit.name,
      amount: financial.round(benAmount),
      benefitId: benefit.id,
      frequency: benefit.frequency,
      isTaxable: !isNonTaxable,
    });
  }

  const taxableEarnings = earnedSalary
    .plus(overtimeTotalCost)
    .plus(nightSurchargeAmount)
    .plus(taxableBonusesTotal);
  const reserveFundEligible = hasReserveFundEligibility(emp, contract, endDate);

  for (const item of config.items || []) {
    const isReserveFund = RESERVE_FUND_ITEM_REGEX.test(item.name || '');
    if (isReserveFund && item.type === 'EARNING' && !reserveFundEligible) continue;
    let amount = financial.from(0);
    if (item.fixedValue) amount = financial.from(item.fixedValue);
    else if (item.percentage) {
      const base = item.type === 'DEDUCTION' || isReserveFund ? taxableEarnings : earnedSalary;
      amount = financial.percentage(base, item.percentage);
    }
    (item.type === 'EARNING' ? employeeBonuses : employeeDeductions).push({
      name: item.name,
      amount: financial.round(amount),
    });
  }

  for (const adv of advances) {
    const installmentAmount = resolveInstallmentAmount(adv);
    if (installmentAmount.gt(0)) {
      employeeDeductions.push({
        name: `Anticipo/Préstamo (Cuota ${(adv.paidInstallments || 0) + 1}/${adv.installments})`,
        amount: financial.round(installmentAmount),
        advanceId: adv.id,
      });
    }
  }

  if (absenceImpact.medicalSubsidyDeduction > 0) {
    employeeDeductions.push({
      name: `Subsidio IESS Enfermedad (${absenceImpact.iessSubsidizedDays}d al 75%)`,
      amount: absenceImpact.medicalSubsidyDeduction,
    });
  }
  if (undertimeAmount.gt(0)) {
    employeeDeductions.push({
      name: 'Descuento por Horas No Trabajadas',
      amount: financial.round(undertimeAmount),
    });
  }
  return { employeeBonuses, employeeDeductions };
};

export const computeEmployeePayrollBreakdown = ({
  emp,
  contract,
  config,
  records = [],
  schedules = [],
  approvedAbsences = [],
  benefits = [],
  advances = [],
  startDate,
  endDate,
}) => {
  const baseSalary = financial.from(contract.salary);
  const contractStart = new Date(contract.startDate);
  const contractEnd = contract.endDate ? new Date(contract.endDate) : null;
  const effectiveStart = contractStart > startDate ? contractStart : startDate;
  const effectiveEnd = contractEnd && contractEnd < endDate ? contractEnd : endDate;
  const effectiveDays = Math.max(0, Math.ceil((effectiveEnd - effectiveStart) / 86400000) + 1);
  const isFullMonth =
    effectiveStart.getTime() === startDate.getTime() && (!contractEnd || contractEnd >= endDate);
  const maxEligibleDays = isFullMonth
    ? config.workingDays
    : Math.min(config.workingDays, effectiveDays);

  const salaryPerDay = financial.divide(baseSalary, config.workingDays);
  const hourlyRate = financial.divide(baseSalary, financial.multiply(config.workingDays, 8));
  const absenceImpact = evaluateAbsencesImpact({
    approvedAbsences,
    records,
    effectiveStart,
    effectiveEnd,
    salaryPerDay,
  });
  const workedDays = Math.max(0, maxEligibleDays - absenceImpact.unpaidDays);
  const earnedSalary = financial.multiply(salaryPerDay, workedDays);

  let totalOvertimeHours = financial.from(0);
  let totalUndertimeHours = financial.from(0);
  let nightSurchargeAmount = financial.from(0);
  let overtimeTotalCost = financial.from(0);

  for (const rec of records) {
    const m = evaluateAttendanceRecordMetrics({
      rec,
      schedules,
      hourlyRate,
      hasNightSurcharge: contract.hasNightSurcharge ?? true,
      hasDoubleOvertime: contract.hasDoubleOvertime ?? true,
    });
    totalOvertimeHours = totalOvertimeHours.plus(m.dailyOvertime);
    totalUndertimeHours = totalUndertimeHours.plus(m.undertimeHours);
    nightSurchargeAmount = nightSurchargeAmount.plus(m.nightSurcharge);
    overtimeTotalCost = overtimeTotalCost.plus(m.overtimeCost);
  }

  const { employeeBonuses, employeeDeductions } = buildBonusesAndDeductions({
    emp,
    contract,
    config,
    endDate,
    earnedSalary,
    overtimeTotalCost,
    nightSurchargeAmount,
    undertimeAmount: totalUndertimeHours.mul(hourlyRate),
    benefits,
    advances,
    absenceImpact,
  });

  const totalBonuses = employeeBonuses.reduce((acc, c) => acc.plus(c.amount), financial.from(0));
  const totalDeductions = employeeDeductions.reduce(
    (acc, c) => acc.plus(c.amount),
    financial.from(0)
  );
  const roundedBaseSalary = financial.round(earnedSalary);
  const roundedOvertimeAmount = financial.round(overtimeTotalCost);
  const netSalary = financial.max(
    financial
      .from(roundedBaseSalary)
      .plus(roundedOvertimeAmount)
      .plus(totalBonuses)
      .minus(totalDeductions),
    0
  );

  return {
    workedDays,
    roundedBaseSalary,
    roundedOvertimeHours: financial.round(totalOvertimeHours),
    roundedOvertimeAmount,
    employeeBonuses,
    employeeDeductions,
    finalNetSalary: financial.round(netSalary),
  };
};
