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

class PayrollCalculationService {
  async generatePayroll(month, year, adminId = null, tenantId = null) {
    const periodDate = new Date(year, month - 1, 1);
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const existingPayroll = await payrollRepository.findExistingPayrollByPeriod(
      periodDate,
      tenantId
    );
    if (existingPayroll) throw new Error(`Ya existe una nómina para el período ${month}/${year}`);

    const config = await payrollRepository.getActiveConfig(tenantId);
    if (!config)
      throw new Error('No hay configuración de nómina activa. Configure los parámetros primero.');

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

    const batch = await payrollRepository.findBatchPayrollInputs(
      employees.map((e) => e.id),
      startDate,
      endDate
    );
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

    if (adminId) {
      auditRepository
        .createLog({
          entity: 'Payroll',
          entityId: payroll.id,
          action: 'GENERATE',
          performedBy: adminId,
          details: `Generated payroll for ${month}/${year}. Total: ${payroll.totalAmount}`,
        })
        .catch((err) => console.error('Audit Log Error:', err));
    }

    return payroll;
  }

  async validatePayrollTotals(payrollId) {
    const payroll = await payrollRepository.findPayrollForValidation(payrollId);
    if (!payroll) throw new Error('Nómina no encontrada para validación');

    const calculatedTotal = payroll.details.reduce(
      (acc, d) => acc.plus(d.netSalary),
      financial.from(0)
    );
    const storedTotal = financial.from(payroll.totalAmount);
    if (!calculatedTotal.equals(storedTotal)) {
      throw new Error(
        `Inconsistencia detectada: El total de detalles (${calculatedTotal}) no coincide con el total de cabecera (${storedTotal}).`
      );
    }
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
    const isSuperAdmin = user?.role === 'superadmin';
    const tenantId = user?.tenantId && !isSuperAdmin ? user.tenantId : null;

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

      const calculatedTotal = payroll.details.reduce(
        (acc, d) => acc.plus(d.netSalary),
        financial.from(0)
      );
      const storedTotal = financial.from(payroll.totalAmount);
      if (!calculatedTotal.equals(storedTotal)) {
        throw new Error(
          `Inconsistencia detectada: El total de detalles (${calculatedTotal}) no coincide con el total de cabecera (${storedTotal}).`
        );
      }

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
    if (adminId) {
      auditRepository
        .createLog({
          entity: 'Payroll',
          entityId: id,
          action: 'PAYMENT',
          performedBy: adminId,
          details: `Marked payroll ${id} as PAID`,
        })
        .catch((err) => console.error('Audit Log Error:', err));
    }
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

      if (adminId) {
        await auditRepository
          .createLog(
            {
              entity: 'PayrollDetail',
              entityId: detailId,
              action: 'UPDATE_MANUAL',
              performedBy: adminId,
              details: `Manual adjustment for employee in payroll ${detail.payrollId}. New Net: ${updatedDetail.netSalary}`,
            },
            tx
          )
          .catch((err) => console.error('Audit Log Error:', err));
      }
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

      if (adminId) {
        await auditRepository
          .createLog(
            {
              entity: 'Payroll',
              entityId: id,
              action: 'DELETE',
              performedBy: adminId,
              details: `Deleted payroll draft for period ${payroll.period}`,
            },
            tx
          )
          .catch((err) => console.error('Audit Log Error:', err));
      }
      return deleted;
    });
  }

  async signPayslip({
    detailId,
    employeeId,
    tenantId,
    signatureType = 'QR_DIGITAL',
    notes = '',
    p12Data = null,
  }) {
    const detail = await this.getOwnPublishedPayslip({ detailId, employeeId, tenantId });
    const payload = buildSignedPayslipPayload({ detail, signatureType, notes, p12Data });
    return await payrollRepository.updatePayrollDetailWithRelations(detailId, payload);
  }

  async getOwnPublishedPayslip({ detailId, employeeId, tenantId }) {
    if (!tenantId)
      throw new ForbiddenError('Se requiere el contexto de la empresa para gestionar el rol');
    const detail = await payrollRepository.findDetailWithPayroll(detailId, tenantId);
    if (!detail) throw new NotFoundError('Detalle de rol de pagos no encontrado');
    if (detail.employeeId !== employeeId) {
      throw new ForbiddenError('No tienes autorización para gestionar este rol de pagos');
    }
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
    const periodFormatted = new Date(payroll.period).toLocaleDateString('es-EC', {
      month: 'long',
      year: 'numeric',
    });

    for (const detail of pendingDetails) {
      await notificationService
        .createNotification({
          recipientId: detail.employeeId,
          title: 'Recordatorio: Firma de Rol de Pagos',
          message: `Por favor revisa y firma tu rol de pagos correspondiente al período ${periodFormatted}.`,
          type: 'PAYROLL_SIGN_REMINDER',
          relatedEntity: 'PayrollDetail',
          relatedEntityId: detail.id,
        })
        .catch((err) => console.error(err));
    }
    return { sentCount: pendingDetails.length, totalPending: pendingDetails.length };
  }
}

export default new PayrollCalculationService();
