/**
 * @file salaryAdvance.service.js
 * @description Servicio de dominio para anticipos de sueldo y préstamos (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { auditRepository } from '../../audit/index.js';
import { financial } from '../../../core/utils/financialUtils.js';
import { decryptSalary } from '../../../core/security/encryption.js';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '../../../core/errors/appError.js';
import defaultSalaryAdvanceRepo from './salaryAdvance.repository.js';
import { getAdvanceRemainingBalance } from './advanceInstallment.js';

export class SalaryAdvanceService {
  constructor({ salaryAdvanceRepo = defaultSalaryAdvanceRepo, auditRepo = auditRepository } = {}) {
    this.salaryAdvanceRepo = salaryAdvanceRepo;
    this.auditRepo = auditRepo;
  }

  async requestAdvance({ employeeId, amount, installments = 1, reason }) {
    const numAmount = Number(amount);
    const numInstallments = parseInt(installments, 10);

    if (!numAmount || numAmount <= 0) {
      throw new ValidationError('El monto solicitado debe ser mayor a 0');
    }
    if (!numInstallments || numInstallments < 1 || numInstallments > 24) {
      throw new ValidationError('El número de cuotas debe estar entre 1 y 24');
    }

    const contract = await this.salaryAdvanceRepo.findActiveContractForEmployee(employeeId);

    let baseSalary = null;
    if (contract && contract.salary) {
      baseSalary = financial.from(contract.salary);
    } else {
      const employee = await this.salaryAdvanceRepo.findEmployeeById(employeeId);
      const decryptedSalary = decryptSalary(employee?.salary);
      if (decryptedSalary) baseSalary = financial.from(decryptedSalary);
    }

    if (!baseSalary || baseSalary.lte(0)) {
      throw new ValidationError(
        'No se encontró un salario base activo registrado para validar el límite de anticipo'
      );
    }

    const requested = financial.from(numAmount);
    const monthlyDeduction = financial.divide(requested, numInstallments);
    const maxMonthlyQuota = financial.percentage(baseSalary, 50);

    if (monthlyDeduction.gt(maxMonthlyQuota)) {
      throw new ValidationError(
        `La cuota mensual ($${financial.round(monthlyDeduction).toFixed(2)}) supera el límite del 50% de tu sueldo base mensual ($${financial.round(maxMonthlyQuota).toFixed(2)})`
      );
    }

    return this.salaryAdvanceRepo.createAdvance(
      {
        employeeId,
        amount: financial.round(requested),
        installments: numInstallments,
        monthlyDeduction: financial.round(monthlyDeduction),
        reason: reason ? reason.trim() : null,
        status: 'PENDING',
      },
      false
    );
  }

  async createAdvanceByAdmin(
    { employeeId, amount, installments = 1, reason, autoApprove = true },
    adminId = null,
    tenantId = null
  ) {
    const numAmount = Number(amount);
    const numInstallments = parseInt(installments, 10);

    if (!employeeId) throw new ValidationError('El colaborador es requerido');
    if (!numAmount || numAmount <= 0) {
      throw new ValidationError('El monto debe ser un valor positivo mayor a 0');
    }
    if (!numInstallments || numInstallments < 1 || numInstallments > 24) {
      throw new ValidationError('El número de cuotas debe estar entre 1 y 24');
    }

    const employee = await this.salaryAdvanceRepo.findEmployeeWithActiveContract(
      employeeId,
      tenantId
    );
    if (!employee) throw new NotFoundError('Colaborador no encontrado o sin permisos');

    const requested = financial.from(numAmount);
    const monthlyDeduction = financial.divide(requested, numInstallments);
    const status = autoApprove ? 'APPROVED' : 'PENDING';

    const advance = await this.salaryAdvanceRepo.createAdvance(
      {
        employeeId,
        amount: financial.round(requested),
        installments: numInstallments,
        monthlyDeduction: financial.round(monthlyDeduction),
        reason: reason ? reason.trim() : 'Concesión administrativa',
        status,
        approvedBy: autoApprove ? adminId : null,
        approvedAt: autoApprove ? new Date() : null,
      },
      true
    );

    if (adminId) {
      await this.auditRepo
        .log({
          action: autoApprove ? 'ADMIN_CREATE_AND_APPROVE_ADVANCE' : 'ADMIN_CREATE_ADVANCE',
          entity: 'SalaryAdvance',
          entityId: advance.id,
          userId: adminId,
          tenantId,
          details: {
            employeeId,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            amount: advance.amount,
            installments: advance.installments,
            monthlyDeduction: advance.monthlyDeduction,
            status: advance.status,
          },
        })
        .catch((err) => console.error('[Audit Error] createAdvanceByAdmin:', err));
    }

    return advance;
  }

  async getStats(tenantId = null) {
    const [total, pending, approved, paid, rejected, cancelled, approvedAdvances] =
      await this.salaryAdvanceRepo.getStatsData(tenantId);

    const totalActiveBalance = approvedAdvances.reduce(
      (sum, a) => sum.plus(getAdvanceRemainingBalance(a)),
      financial.from(0)
    );
    const monthlyDeductionsTotal = approvedAdvances.reduce(
      (sum, a) => sum.plus(financial.from(a.monthlyDeduction || 0)),
      financial.from(0)
    );

    return {
      total,
      pending,
      approved,
      paid,
      rejected,
      cancelled,
      totalActiveBalance: financial.round(totalActiveBalance),
      monthlyDeductionsTotal: financial.round(monthlyDeductionsTotal),
    };
  }

  async getAdvances({ page = 1, limit = 20, status, employeeId, search, tenantId }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;

    const employeeWhere = tenantId ? { tenantId } : {};
    if (search) {
      const cleanSearch = search.trim();
      employeeWhere.OR = [
        { firstName: { contains: cleanSearch, mode: 'insensitive' } },
        { lastName: { contains: cleanSearch, mode: 'insensitive' } },
        { identityCard: { contains: cleanSearch, mode: 'insensitive' } },
        { department: { contains: cleanSearch, mode: 'insensitive' } },
        { position: { contains: cleanSearch, mode: 'insensitive' } },
      ];
    }

    if (Object.keys(employeeWhere).length > 0) {
      where.employee = employeeWhere;
    }

    const [data, total] = await this.salaryAdvanceRepo.findAdvancesPaginated({
      where,
      skip,
      take: limit,
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMyAdvances(employeeId) {
    return this.salaryAdvanceRepo.findByEmployee(employeeId);
  }

  async approveAdvance(id, adminId, tenantId = null) {
    const advance = await this.salaryAdvanceRepo.findByIdForTenant(id, tenantId);
    if (!advance) throw new NotFoundError('Solicitud de anticipo no encontrada o sin permisos');
    if (advance.status !== 'PENDING') {
      throw new ConflictError(
        `La solicitud se encuentra en estado ${advance.status} y no puede ser aprobada`
      );
    }

    const updated = await this.salaryAdvanceRepo.updateWithEmployee(id, {
      status: 'APPROVED',
      approvedBy: adminId,
      approvedAt: new Date(),
    });

    if (adminId) {
      await this.auditRepo
        .log({
          action: 'APPROVE_SALARY_ADVANCE',
          entity: 'SalaryAdvance',
          entityId: id,
          userId: adminId,
          tenantId,
          details: {
            amount: advance.amount,
            installments: advance.installments,
            monthlyDeduction: advance.monthlyDeduction,
            employeeId: advance.employeeId,
            employeeName: `${advance.employee?.firstName} ${advance.employee?.lastName}`,
          },
        })
        .catch((err) => console.error('[Audit Error] approveAdvance:', err));
    }

    return updated;
  }

  async rejectAdvance(id, rejectionReason, adminId, tenantId = null) {
    const advance = await this.salaryAdvanceRepo.findByIdForTenant(id, tenantId);
    if (!advance) throw new NotFoundError('Solicitud de anticipo no encontrada o sin permisos');
    if (advance.status !== 'PENDING') {
      throw new ConflictError(
        `La solicitud se encuentra en estado ${advance.status} y no puede ser rechazada`
      );
    }

    const updated = await this.salaryAdvanceRepo.updateWithEmployee(id, {
      status: 'REJECTED',
      rejectionReason: rejectionReason
        ? rejectionReason.trim()
        : 'Solicitud no aprobada por administración',
    });

    if (adminId) {
      await this.auditRepo
        .log({
          action: 'REJECT_SALARY_ADVANCE',
          entity: 'SalaryAdvance',
          entityId: id,
          userId: adminId,
          tenantId,
          details: {
            amount: advance.amount,
            rejectionReason: updated.rejectionReason,
            employeeId: advance.employeeId,
            employeeName: `${advance.employee?.firstName} ${advance.employee?.lastName}`,
          },
        })
        .catch((err) => console.error('[Audit Error] rejectAdvance:', err));
    }

    return updated;
  }

  async cancelAdvance(id, employeeId) {
    const advance = await this.salaryAdvanceRepo.findById(id);
    if (!advance) throw new NotFoundError('Solicitud no encontrada');
    if (advance.employeeId !== employeeId) {
      throw new ForbiddenError('No tienes autorización para cancelar esta solicitud');
    }
    if (advance.status !== 'PENDING') {
      throw new ConflictError('Solo se pueden cancelar solicitudes pendientes');
    }

    return this.salaryAdvanceRepo.updateStatus(id, 'CANCELLED');
  }
}

export default new SalaryAdvanceService();
