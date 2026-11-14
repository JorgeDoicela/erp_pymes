/**
 * @file payrollDomainRules.helper.js
 * @description Reglas de dominio del Código del Trabajo de Ecuador para cálculo de nómina:
 * turnos, horas suplementarias (50%), extraordinarias (100%), recargo nocturno (25%),
 * ausencias/vacaciones/permisos médicos y fondos de reserva.
 */

import { financial } from '../../../core/utils/financialUtils.js';
import { resolveInstallmentAmount } from '../advances/advanceInstallment.js';

const VACATION_TYPES_REGEX = /vacacion|vacation/i;
const UNPAID_LEAVE_REGEX =
  /sin\s+sueldo|no\s+remunerad|unpaid|falta\s+injustificada|ausencia\s+injustificada/i;
const MEDICAL_LEAVE_REGEX = /m[eé]dic|enfermedad|iess|salud|reposo|medical/i;
const RESERVE_FUND_ITEM_REGEX = /fondo[s]?\s+de\s+reserva/i;

const toIsoDateKey = (dateInput) => {
  const d = new Date(dateInput);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

const getOverlapHours = (start, end, winStart, winEnd) => {
  const diffMs =
    Math.min(end.getTime(), winEnd.getTime()) - Math.max(start.getTime(), winStart.getTime());
  return diffMs > 0 ? financial.divide(diffMs, 3600000) : financial.from(0);
};

export const resolveDailyExpectedHours = (recDate, schedules = []) => {
  let expectedHours = financial.from(8);
  const dailySchedule = schedules.find((sched) => {
    const sStart = new Date(sched.startDate);
    const sEnd = sched.endDate ? new Date(sched.endDate) : new Date(2100, 0, 1);
    return recDate >= sStart && recDate <= sEnd;
  });

  if (dailySchedule?.shift?.startTime && dailySchedule?.shift?.endTime) {
    const [sh, sm] = dailySchedule.shift.startTime.split(':').map(Number);
    const [eh, em] = dailySchedule.shift.endTime.split(':').map(Number);
    let shiftDuration = financial
      .from(eh)
      .plus(financial.divide(em, 60))
      .minus(financial.from(sh).plus(financial.divide(sm, 60)));
    if (shiftDuration.lt(0)) shiftDuration = shiftDuration.plus(24);
    const breakHours = financial.divide(dailySchedule.shift.breakMinutes ?? 60, 60);
    expectedHours = financial.max(shiftDuration.minus(breakHours), 0);
  }
  return { expectedHours, shift: dailySchedule?.shift || null };
};

export const computeNightHoursForRecord = (rec) => {
  if (!rec.checkIn || !rec.checkOut) return financial.from(0);
  const checkIn = new Date(rec.checkIn);
  const checkOut = new Date(rec.checkOut);
  const baseD = new Date(rec.date);
  const [y, m, d] = [baseD.getFullYear(), baseD.getMonth(), baseD.getDate()];
  return getOverlapHours(checkIn, checkOut, new Date(y, m, d, 0, 0), new Date(y, m, d, 6, 0))
    .plus(getOverlapHours(checkIn, checkOut, new Date(y, m, d, 19, 0), new Date(y, m, d + 1, 0, 0)))
    .plus(
      getOverlapHours(checkIn, checkOut, new Date(y, m, d + 1, 0, 0), new Date(y, m, d + 1, 6, 0))
    );
};

const splitOvertimeByLegalRate = ({
  rec,
  recDate,
  dailyOvertime,
  isWeekendOrHoliday,
  hasDoubleOvertime,
}) => {
  if (!dailyOvertime.gt(0))
    return { supplementaryHours50: financial.from(0), extraordinaryHours100: financial.from(0) };
  if (isWeekendOrHoliday && hasDoubleOvertime)
    return { supplementaryHours50: financial.from(0), extraordinaryHours100: dailyOvertime };
  if (!isWeekendOrHoliday && hasDoubleOvertime && rec.checkIn && rec.checkOut) {
    const checkOut = new Date(rec.checkOut);
    const overtimeStart = new Date(checkOut.getTime() - dailyOvertime.toNumber() * 3600000);
    const [y, m, d] = [recDate.getFullYear(), recDate.getMonth(), recDate.getDate()];
    const madSame = getOverlapHours(
      overtimeStart,
      checkOut,
      new Date(y, m, d, 0, 0),
      new Date(y, m, d, 6, 0)
    );
    const madNext = getOverlapHours(
      overtimeStart,
      checkOut,
      new Date(y, m, d + 1, 0, 0),
      new Date(y, m, d + 1, 6, 0)
    );
    const extraordinaryHours100 = financial.min(dailyOvertime, madSame.plus(madNext));
    return {
      supplementaryHours50: dailyOvertime.minus(extraordinaryHours100),
      extraordinaryHours100,
    };
  }
  return { supplementaryHours50: dailyOvertime, extraordinaryHours100: financial.from(0) };
};

export const evaluateAttendanceRecordMetrics = ({
  rec,
  schedules,
  hourlyRate,
  hasNightSurcharge = true,
  hasDoubleOvertime = true,
}) => {
  const recDate = new Date(rec.date);
  const dayOfWeek = recDate.getUTCDay();
  const isWeekendOrHoliday = dayOfWeek === 0 || dayOfWeek === 6 || Boolean(rec.isHoliday);
  const { expectedHours } = resolveDailyExpectedHours(recDate, schedules);
  const hasWorkedHours = rec.workedHours !== undefined && rec.workedHours !== null;
  const hours = financial.from(rec.workedHours || 0);

  let dailyOvertime = financial.from(0);
  if (hasWorkedHours && hours.gt(0)) {
    const netExcess = financial.max(hours.minus(expectedHours), 0);
    dailyOvertime =
      rec.overtimeHours !== undefined && rec.overtimeHours !== null
        ? financial.min(financial.max(rec.overtimeHours, 0), netExcess)
        : netExcess;
  } else if (!hasWorkedHours && rec.overtimeHours !== undefined && rec.overtimeHours !== null) {
    dailyOvertime = financial.max(rec.overtimeHours, 0);
  }

  const { supplementaryHours50, extraordinaryHours100 } = splitOvertimeByLegalRate({
    rec,
    recDate,
    dailyOvertime,
    isWeekendOrHoliday,
    hasDoubleOvertime,
  });
  const overtimeCost = supplementaryHours50
    .mul(hourlyRate)
    .mul(1.5)
    .plus(extraordinaryHours100.mul(hourlyRate).mul(2.0));
  const nightHours = hasNightSurcharge ? computeNightHoursForRecord(rec) : financial.from(0);
  const nightSurcharge = nightHours.gt(0)
    ? nightHours.mul(hourlyRate).mul(0.25)
    : financial.from(0);
  const undertimeHours =
    hours.gt(0) && hours.lt(expectedHours) ? expectedHours.minus(hours) : financial.from(0);

  return {
    dailyOvertime,
    supplementaryHours50,
    extraordinaryHours100,
    overtimeCost,
    nightHours,
    nightSurcharge,
    undertimeHours,
  };
};

const registerApprovedLeaveDays = ({
  req,
  effectiveStart,
  effectiveEnd,
  excusedDates,
  unpaidDates,
}) => {
  const reqStart = new Date(Math.max(new Date(req.startDate).getTime(), effectiveStart.getTime()));
  const reqEnd = new Date(Math.min(new Date(req.endDate).getTime(), effectiveEnd.getTime()));
  if (reqEnd < reqStart) return 0;

  const cursor = new Date(
    Date.UTC(reqStart.getUTCFullYear(), reqStart.getUTCMonth(), reqStart.getUTCDate())
  );
  const lastDay = new Date(
    Date.UTC(reqEnd.getUTCFullYear(), reqEnd.getUTCMonth(), reqEnd.getUTCDate())
  );
  const typeStr = String(req.type || '');
  const isUnpaid = UNPAID_LEAVE_REGEX.test(typeStr);
  const isMedical = !isUnpaid && MEDICAL_LEAVE_REGEX.test(typeStr);
  let medicalDays = 0;

  while (cursor <= lastDay) {
    const key = toIsoDateKey(cursor);
    if (isUnpaid) {
      unpaidDates.add(key);
    } else {
      excusedDates.add(key);
      if (isMedical && !VACATION_TYPES_REGEX.test(typeStr)) medicalDays += 1;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return medicalDays;
};

export const evaluateAbsencesImpact = ({
  approvedAbsences = [],
  records = [],
  effectiveStart,
  effectiveEnd,
  salaryPerDay,
}) => {
  const excusedDates = new Set();
  const unpaidAbsenceDates = new Set();
  let medicalLeaveDaysCount = 0;

  for (const req of approvedAbsences) {
    if (req.status && req.status !== 'APPROVED') continue;
    medicalLeaveDaysCount += registerApprovedLeaveDays({
      req,
      effectiveStart,
      effectiveEnd,
      excusedDates,
      unpaidDates: unpaidAbsenceDates,
    });
  }

  for (const rec of records) {
    if (rec.status === 'Falta') {
      const key = toIsoDateKey(rec.date);
      if (!excusedDates.has(key)) unpaidAbsenceDates.add(key);
    }
  }

  const iessSubsidizedDays = Math.max(0, medicalLeaveDaysCount - 3);
  const medicalSubsidyDeduction =
    iessSubsidizedDays > 0 ? financial.round(salaryPerDay.mul(iessSubsidizedDays).mul(0.75)) : 0;
  return {
    unpaidDays: unpaidAbsenceDates.size,
    medicalLeaveDaysCount,
    iessSubsidizedDays,
    medicalSubsidyDeduction,
  };
};

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
