/**
 * @file payrollCalculationService.js
 * @description Motor de Cálculo de Nómina, Horas Extra, Recargo Nocturno, Beneficios de Ley y Deducciones (Código de Trabajo Ecuador).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { auditRepository } from '../../audit/index.js';
import { financial } from '../../../core/utils/financialUtils.js';
import { notificationService } from '../../notifications/index.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../core/errors/appError.js';
import payrollRepository from './payroll.repository.js';
import {
  buildPayrollDetailsList,
  buildSignedPayslipPayload,
  computeManualDetailUpdateData,
  formatBankCashManagementCsv,
  notifyPublishedPayroll,
  settleBenefitsAndAdvancesInTx,
} from './payrollBankAndSignatures.helper.js';

const PUBLISHED_PAYROLL_STATUSES = ['APPROVED', 'PAID'];

const logAudit = (entity, entityId, action, performedBy, details, tx) => {
  if (!performedBy) return Promise.resolve();
  return auditRepository
    .createLog({ entity, entityId, action, performedBy, details }, tx)
    .catch((err) => console.error('Audit Error:', err));
};

const assertDetailsMatchHeader = (details, totalAmount) => {
  const calc = details.reduce((acc, d) => acc.plus(d.netSalary), financial.from(0));
  const stored = financial.from(totalAmount);
  if (!calc.equals(stored)) {
    throw new Error(
      `Inconsistencia detectada: El total de detalles (${calc}) no coincide con el total de cabecera (${stored}).`
    );
  }
};

class PayrollCalculationService {
  async generatePayroll(month, year, adminId = null, tenantId = null) {
    const periodDate = new Date(year, month - 1, 1);
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    if (await payrollRepository.findExistingPayrollByPeriod(periodDate, tenantId)) {
      throw new Error(`Ya existe una nómina para el período ${month}/${year}`);
    }
    const config = await payrollRepository.getActiveConfig(tenantId);
    if (!config) {
      throw new Error('No hay configuración de nómina activa. Configure los parámetros primero.');
    }
    const employees = await payrollRepository.findEligibleEmployeesForPeriod(
      startDate,
      endDate,
      tenantId
    );
    if (employees.length === 0) {
      throw new Error(
        `No se encontraron empleados con contratos activos para el periodo ${month}/${year}.`
      );
    }

    const empIds = employees.map((e) => e.id);
    const batch = await payrollRepository.findBatchPayrollInputs(empIds, startDate, endDate);
    const { payrollDetails, totalPayrollAmount } = await buildPayrollDetailsList({
      employees,
      config,
      batch,
      month,
      year,
      startDate,
      endDate,
    });

    const payroll = await payrollRepository.createPayrollWithDetails({
      tenantId,
      periodDate,
      endDate: new Date(year, month, 0),
      totalAmount: financial.round(totalPayrollAmount),
      payrollDetails,
    });

    logAudit('Payroll', payroll.id, 'GENERATE', adminId, `Generated payroll ${month}/${year}`);
    return payroll;
  }

  async validatePayrollTotals(payrollId) {
    const payroll = await payrollRepository.findPayrollForValidation(payrollId);
    if (!payroll) throw new Error('Nómina no encontrada para validación');
    assertDetailsMatchHeader(payroll.details, payroll.totalAmount);
    return true;
  }

  async getPayrolls(page = 1, limit = 10, tenantId = null) {
    const skip = (page - 1) * limit;
    const [payrolls, total] = await payrollRepository.findPayrollsPage(skip, limit, tenantId);
    return {
      data: payrolls,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPayrollsByEmployee(employeeId, user = null) {
    const tenantId = user?.tenantId && user?.role !== 'superadmin' ? user.tenantId : null;
    let actualEmployeeId = employeeId;
    if (user) {
      const emp = await payrollRepository.resolveEmployeeForUser(employeeId, user, tenantId);
      if (emp) actualEmployeeId = emp.id;
    }
    if (!actualEmployeeId) return [];
    const details = await payrollRepository.findPublishedDetailsByEmployee(actualEmployeeId);
    details.forEach((d) => {
      d.signatureStatus = d.signatureStatus || 'PENDING';
    });
    return details;
  }

  async getPayrollById(id, tenantId = null) {
    const payroll = await payrollRepository.findPayrollByIdWithContracts(id, tenantId);
    if (!payroll) throw new Error('Nómina no encontrada');
    payroll.details?.forEach((d) => {
      d.signatureStatus = d.signatureStatus || 'PENDING';
    });
    return payroll;
  }

  async confirmPayroll(id, adminId, tenantId = null) {
    return await payrollRepository.runInTransaction(async (tx) => {
      const payroll = await tx.payroll.findFirst({
        where: { id, ...(tenantId ? { tenantId } : {}) },
        include: { details: true },
      });
      if (!payroll) throw new NotFoundError('Nómina no encontrada');
      if (payroll.status === 'APPROVED') throw new ConflictError('Nómina ya está aprobada');
      if (payroll.status !== 'DRAFT') {
        throw new ConflictError('Solo se puede aprobar una nómina en estado borrador');
      }

      assertDetailsMatchHeader(payroll.details, payroll.totalAmount);
      await settleBenefitsAndAdvancesInTx(tx, payroll.details);
      const updated = await tx.payroll.update({ where: { id }, data: { status: 'APPROVED' } });
      notifyPublishedPayroll(payroll, adminId, tx);
      return updated;
    });
  }

  async generateBankFile(id, tenantId = null) {
    const payroll = await payrollRepository.findPayrollById(id, tenantId);
    if (!payroll) throw new NotFoundError('Nómina no encontrada');
    if (!PUBLISHED_PAYROLL_STATUSES.includes(payroll.status)) {
      throw new ConflictError(
        'El archivo bancario solo se genera para nóminas aprobadas o pagadas'
      );
    }
    return formatBankCashManagementCsv(payroll);
  }

  async markAsPaid(id, adminId, tenantId = null) {
    const payroll = await payrollRepository.findPayrollHeader(id, tenantId);
    if (!payroll) throw new NotFoundError('Nómina no encontrada');
    if (payroll.status === 'PAID')
      throw new ConflictError('La nómina ya fue registrada como pagada');
    if (payroll.status !== 'APPROVED') {
      throw new ConflictError('Solo se puede registrar el pago de una nómina aprobada');
    }
    const updated = await payrollRepository.updatePayrollPaid(id, new Date());
    logAudit('Payroll', id, 'PAYMENT', adminId, `Marked payroll ${id} as PAID`);
    return updated;
  }

  async updatePayrollDetail(detailId, data, adminId, tenantId = null) {
    return await payrollRepository.runInTransaction(async (tx) => {
      const detail = await tx.payrollDetail.findFirst({
        where: { id: detailId, ...(tenantId ? { payroll: { tenantId } } : {}) },
        include: { payroll: true },
      });
      if (!detail) throw new Error('Detalle de nómina no encontrado');
      if (detail.payroll.status !== 'DRAFT') {
        throw new Error(
          `No se puede editar una nómina en estado ${detail.payroll.status}. Solo se permiten cambios en modo BORRADOR.`
        );
      }

      const updatedDetail = await tx.payrollDetail.update({
        where: { id: detailId },
        data: computeManualDetailUpdateData(detail, data),
      });
      const allDetails = await tx.payrollDetail.findMany({
        where: { payrollId: detail.payrollId },
      });
      const newTotal = allDetails.reduce((acc, d) => acc.plus(d.netSalary), financial.from(0));
      await tx.payroll.update({
        where: { id: detail.payrollId },
        data: { totalAmount: financial.round(newTotal) },
      });
      await logAudit('PayrollDetail', detailId, 'UPDATE_MANUAL', adminId, `Manual adjustment`, tx);
      return updatedDetail;
    });
  }

  async deletePayroll(id, adminId, tenantId = null) {
    return await payrollRepository.runInTransaction(async (tx) => {
      const payroll = await tx.payroll.findFirst({
        where: { id, ...(tenantId ? { tenantId } : {}) },
      });
      if (!payroll) throw new Error('Nómina no encontrada');
      if (payroll.status !== 'DRAFT') {
        throw new Error(
          `No se puede eliminar una nómina en estado ${payroll.status}. Solo se permiten eliminaciones en modo BORRADOR.`
        );
      }
      await tx.payrollDetail.deleteMany({ where: { payrollId: id } });
      const deleted = await tx.payroll.delete({ where: { id } });
      await logAudit('Payroll', id, 'DELETE', adminId, `Deleted payroll draft`, tx);
      return deleted;
    });
  }

  async signPayslip(params) {
    const {
      detailId,
      employeeId,
      tenantId,
      signatureType = 'QR_DIGITAL',
      notes = '',
      p12Data = null,
    } = params;
    const detail = await this.getOwnPublishedPayslip({ detailId, employeeId, tenantId });
    const payload = buildSignedPayslipPayload({ detail, signatureType, notes, p12Data });
    return await payrollRepository.updatePayrollDetailWithRelations(detailId, payload);
  }

  async getOwnPublishedPayslip({ detailId, employeeId, tenantId }) {
    if (!tenantId)
      throw new ForbiddenError('Se requiere el contexto de la empresa para gestionar el rol');
    const detail = await payrollRepository.findDetailWithPayroll(detailId, tenantId);
    if (!detail) throw new NotFoundError('Detalle de rol de pagos no encontrado');
    if (detail.employeeId !== employeeId)
      throw new ForbiddenError('No tienes autorización para gestionar este rol de pagos');
    if (!PUBLISHED_PAYROLL_STATUSES.includes(detail.payroll?.status)) {
      throw new ConflictError('El rol de pagos aún no ha sido publicado para firma');
    }
    return detail;
  }

  async disputePayslip({ detailId, employeeId, tenantId, reason }) {
    await this.getOwnPublishedPayslip({ detailId, employeeId, tenantId });
    return await payrollRepository.updatePayrollDetailWithRelations(detailId, {
      signatureStatus: 'DISPUTED',
      disputeReason: reason,
    });
  }

  async notifyPendingSignatures(payrollId, tenantId = null) {
    const payroll = await payrollRepository.findPayrollHeader(payrollId, tenantId);
    if (!payroll) throw new Error('Nómina no encontrada');
    const pendingDetails = await payrollRepository.findPendingSignatureDetails(payrollId);
    const periodFmt = new Date(payroll.period).toLocaleDateString('es-EC', {
      month: 'long',
      year: 'numeric',
    });
    for (const d of pendingDetails) {
      await notificationService
        .createNotification({
          recipientId: d.employeeId,
          title: 'Recordatorio: Firma de Rol de Pagos',
          message: `Por favor revisa y firma tu rol de pagos correspondiente al período ${periodFmt}.`,
          type: 'PAYROLL_SIGN_REMINDER',
          relatedEntity: 'PayrollDetail',
          relatedEntityId: d.id,
        })
        .catch((err) => console.error(err));
    }
    return { sentCount: pendingDetails.length, totalPending: pendingDetails.length };
  }
}

export default new PayrollCalculationService();
