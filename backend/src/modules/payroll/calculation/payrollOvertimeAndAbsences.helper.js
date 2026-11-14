/**
 * @file payrollOvertimeAndAbsences.helper.js
 * @description Cálculo de turnos, horas suplementarias (50%), extraordinarias (100%),
 * recargo nocturno (25%) e impacto de ausencias/vacaciones/permisos médicos.
 */

import { financial } from '../../../core/utils/financialUtils.js';

const VACATION_TYPES_REGEX = /vacacion|vacation/i;
const UNPAID_LEAVE_REGEX =
  /sin\s+sueldo|no\s+remunerad|unpaid|falta\s+injustificada|ausencia\s+injustificada/i;
const MEDICAL_LEAVE_REGEX = /m[eé]dic|enfermedad|iess|salud|reposo|medical/i;

export const toIsoDateKey = (dateInput) => {
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
  if (!dailyOvertime.gt(0)) {
    return { supplementaryHours50: financial.from(0), extraordinaryHours100: financial.from(0) };
  }
  if (isWeekendOrHoliday && hasDoubleOvertime) {
    return { supplementaryHours50: financial.from(0), extraordinaryHours100: dailyOvertime };
  }
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
