/**
 * @file payrollBankAndSignatures.helper.js
 * @description Helpers de dominio para construcción de detalles firmados, archivo bancario Cash Management y sellos de firma de rol.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { auditRepository } from '../../audit/index.js';
import { safeDecrypt } from '../../../core/security/encryption.js';
import { financial } from '../../../core/utils/financialUtils.js';
import { qrSignatureService } from '../../signatures/index.js';
import { notificationService } from '../../notifications/index.js';
import { getAdvanceRemainingBalance } from '../advances/advanceInstallment.js';
import { computeEmployeePayrollBreakdown } from './payrollDomainRules.helper.js';

const UTF8_BOM = '\uFEFF';

export const groupByEmployeeId = (items = []) => {
  const map = new Map();
  for (const item of items) {
    if (!map.has(item.employeeId)) map.set(item.employeeId, []);
    map.get(item.employeeId).push(item);
  }
  return map;
};

export const parseJsonArray = (value, fallback = []) => {
  if (!value) return fallback;
  return typeof value === 'string' ? JSON.parse(value || '[]') : value;
};

export const buildPayrollDetailsList = async ({
  employees,
  config,
  batch,
  month,
  year,
  startDate,
  endDate,
}) => {
  const attendanceMap = groupByEmployeeId(batch.allAttendance);
  const scheduleMap = groupByEmployeeId(batch.allSchedules);
  const benefitMap = groupByEmployeeId(batch.allBenefits);
  const advanceMap = groupByEmployeeId(batch.allAdvances);
  const absenceMap = groupByEmployeeId(batch.allAbsences);
  const periodStr = `${year}-${String(month).padStart(2, '0')}`;

  const payrollDetails = [];
  let totalPayrollAmount = financial.from(0);

  for (const emp of employees) {
    const contract = emp.contracts?.[0];
    if (!contract) continue;

    const breakdown = computeEmployeePayrollBreakdown({
      emp,
      contract,
      config,
      records: attendanceMap.get(emp.id) || [],
      schedules: scheduleMap.get(emp.id) || [],
      approvedAbsences: absenceMap.get(emp.id) || [],
      benefits: benefitMap.get(emp.id) || [],
      advances: advanceMap.get(emp.id) || [],
      startDate,
      endDate,
    });

    const sig = await qrSignatureService.generateQrSignature({
      docType: 'PAYSLIP',
      docId: `${periodStr}-${emp.id.slice(-6)}`,
      signerName: `${emp.firstName} ${emp.lastName}`,
      signerId: emp.identityCard || 'S/N',
      issuer: 'NORMA ERP S.A.',
      content: {
        period: periodStr,
        employee: `${emp.firstName} ${emp.lastName}`,
        identityCard: emp.identityCard,
        baseSalary: breakdown.roundedBaseSalary,
        netSalary: breakdown.finalNetSalary,
        workedDays: breakdown.workedDays,
      },
      notes: `Rol Individual de Pagos correspondiente al período ${periodStr}`,
    });

    payrollDetails.push({
      employeeId: emp.id,
      baseSalary: breakdown.roundedBaseSalary,
      workedDays: breakdown.workedDays,
      overtimeHours: breakdown.roundedOvertimeHours,
      overtimeAmount: breakdown.roundedOvertimeAmount,
      bonuses: JSON.stringify(breakdown.employeeBonuses),
      deductions: JSON.stringify(breakdown.employeeDeductions),
      netSalary: breakdown.finalNetSalary,
      signatureStatus: 'PENDING',
      signatureCode: sig.verificationCode,
      signatureToken: sig.token,
      signatureData: JSON.stringify({
        qrDataUrl: sig.qrDataUrl,
        verificationUrl: sig.verificationUrl,
        docHash: sig.docHash,
      }),
    });
    totalPayrollAmount = totalPayrollAmount.plus(breakdown.finalNetSalary);
  }

  return { payrollDetails, totalPayrollAmount };
};

export const settleBenefitsAndAdvancesInTx = async (tx, details) => {
  const benefitIds = [];
  const advanceDeductions = [];

  for (const detail of details) {
    for (const bonus of parseJsonArray(detail.bonuses)) {
      if (bonus.benefitId && bonus.frequency === 'ONE_TIME') benefitIds.push(bonus.benefitId);
    }
    for (const ded of parseJsonArray(detail.deductions)) {
      if (ded.advanceId)
        advanceDeductions.push({ advanceId: ded.advanceId, amount: ded.amount || 0 });
    }
  }

  if (benefitIds.length > 0) {
    await tx.employeeBenefit.updateMany({
      where: { id: { in: benefitIds } },
      data: { status: 'PROCESSED' },
    });
  }
  if (advanceDeductions.length === 0) return;

  const advances = await tx.salaryAdvance.findMany({
    where: { id: { in: advanceDeductions.map((a) => a.advanceId) } },
  });
  const advanceMap = new Map(advances.map((a) => [a.id, a]));

  for (const ded of advanceDeductions) {
    const adv = advanceMap.get(ded.advanceId);
    if (!adv) continue;
    const applied = financial.min(ded.amount, getAdvanceRemainingBalance(adv));
    const newInstallments = adv.paidInstallments + 1;
    const newPaidAmount = financial.round(financial.from(adv.paidAmount).plus(applied));
    await tx.salaryAdvance.update({
      where: { id: ded.advanceId },
      data: {
        paidInstallments: newInstallments,
        paidAmount: newPaidAmount,
        status:
          newInstallments >= adv.installments || newPaidAmount >= adv.amount ? 'PAID' : 'APPROVED',
      },
    });
  }
};

export const notifyPublishedPayroll = (payroll, adminId, tx) => {
  const periodFormatted = new Date(payroll.period).toLocaleDateString('es-EC', {
    month: 'long',
    year: 'numeric',
  });
  for (const detail of payroll.details) {
    notificationService
      .createNotification({
        recipientId: detail.employeeId,
        title: 'Rol de Pagos Publicado',
        message: `Tu rol de pagos de ${periodFormatted} está disponible para revisión y firma de conformidad.`,
        type: 'PAYROLL_PUBLISHED',
        relatedEntity: 'PayrollDetail',
        relatedEntityId: detail.id,
      })
      .catch((err) => console.error('Error enviando notificación de nómina:', err));
  }
  if (adminId) {
    auditRepository
      .createLog(
        {
          entity: 'Payroll',
          entityId: payroll.id,
          action: 'CONFIRM',
          performedBy: adminId,
          details: `Confirmed payroll ${payroll.id}`,
        },
        tx
      )
      .catch((err) => console.error('Audit Log Error:', err));
  }
};

export const formatBankCashManagementCsv = (payroll) => {
  let csv = `${UTF8_BOM}Identificacion,Beneficiario,Banco,TipoCuenta,NumeroCuenta,Monto,Detalle\n`;
  for (const det of payroll.details) {
    const emp = det.employee;
    if (!emp?.bankName || !emp?.accountNumber) continue;
    const name = `${emp.firstName || ''} ${emp.lastName || ''}`.replace(/,/g, '');
    let bank = 'ERROR_DECRYPT';
    let account = 'ERROR_DECRYPT';
    try {
      bank = safeDecrypt(emp.bankName).replace(/,/g, '');
      account = safeDecrypt(emp.accountNumber);
    } catch {
      // Mantiene marcadores defensivos en caso de fallo de llave
    }
    const amount = financial.from(det.netSalary).toFixed(2);
    csv += `${emp.identityCard},${name},${bank},${emp.accountType || 'AHORROS'},${account},${amount},Nómina ${new Date(payroll.period).toLocaleDateString()}\n`;
  }
  return csv;
};

export const buildSignedPayslipPayload = ({ detail, signatureType, notes, p12Data }) => {
  const signedAt = new Date();
  let signatureDataObj;
  try {
    signatureDataObj = JSON.parse(detail.signatureData || '{}');
  } catch {
    signatureDataObj = {};
  }

  signatureDataObj.signedBy = `${detail.employee.firstName} ${detail.employee.lastName}`;
  signatureDataObj.signedAt = signedAt.toISOString();
  signatureDataObj.signatureType = signatureType;
  signatureDataObj.notes = notes || 'Conformidad de rol de pagos';
  if (p12Data) signatureDataObj.p12Stamp = p12Data;

  return {
    signatureStatus: 'SIGNED',
    signedAt,
    signatureType,
    signatureData: JSON.stringify(signatureDataObj),
  };
};

export const computeManualDetailUpdateData = (detail, data) => {
  const bonuses = parseJsonArray(data.bonuses ?? detail.bonuses);
  const deductions = parseJsonArray(data.deductions ?? detail.deductions);
  const totalBonuses = bonuses.reduce((acc, c) => acc.plus(c.amount), financial.from(0));
  const totalDeductions = deductions.reduce((acc, c) => acc.plus(c.amount), financial.from(0));
  const baseSalary = financial.from(data.baseSalary ?? detail.baseSalary);
  const overtimeAmount = financial.from(data.overtimeAmount ?? detail.overtimeAmount);
  const netSalary = baseSalary.plus(overtimeAmount).plus(totalBonuses).minus(totalDeductions);

  return {
    baseSalary: financial.round(baseSalary),
    overtimeAmount: financial.round(overtimeAmount),
    bonuses: JSON.stringify(bonuses),
    deductions: JSON.stringify(deductions),
    netSalary: financial.round(netSalary),
    workedDays: data.workedDays ?? detail.workedDays,
  };
};
