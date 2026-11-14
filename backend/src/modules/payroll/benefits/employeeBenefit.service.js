/**
 * @file employeeBenefit.service.js
 * @description Servicio de dominio para gestión de beneficios, bonos y comisiones (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { auditRepository } from '../../audit/index.js';
import { financial } from '../../../core/utils/financialUtils.js';
import { decryptSalary } from '../../../core/security/encryption.js';
import { ValidationError, NotFoundError, ConflictError } from '../../../core/errors/appError.js';
import defaultEmployeeBenefitRepo from './employeeBenefit.repository.js';

const hasMinimumOneYearSeniority = (employee, activeContract, referenceDate = new Date()) => {
  const startRaw = employee?.hireDate || activeContract?.startDate;
  if (!startRaw) return true;
  const startDate = new Date(startRaw);
  if (Number.isNaN(startDate.getTime())) return true;
  const diffDays = (referenceDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 365;
};

export class EmployeeBenefitService {
  SBU = 460.0;

  constructor({ benefitRepo = defaultEmployeeBenefitRepo, auditRepo = auditRepository } = {}) {
    this.benefitRepo = benefitRepo;
    this.auditRepo = auditRepo;
  }

  async getBenefits({ page = 1, limit = 20, status, type, employeeId, search, tenantId }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (type) where.type = type;
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

    const [data, total] = await this.benefitRepo.findBenefitsPaginated({
      where,
      skip,
      take: limit,
    });

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getStats(tenantId = null) {
    const [total, active, processed, cancelled, activeSum] =
      await this.benefitRepo.getStatsData(tenantId);
    return {
      total,
      active,
      processed,
      cancelled,
      activeAmountTotal: activeSum._sum?.amount || 0,
    };
  }

  async getByEmployee(employeeId, tenantId = null) {
    return this.benefitRepo.findByEmployee(employeeId, tenantId);
  }

  async createBenefit(
    { employeeId, name, amount, type = 'BONUS', frequency = 'ONE_TIME' },
    tenantId = null,
    adminId = null
  ) {
    if (!employeeId) throw new ValidationError('El ID de empleado es requerido');
    if (!name || !name.trim()) {
      throw new ValidationError('El nombre o concepto del beneficio es requerido');
    }

    const numAmount = parseFloat(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      throw new ValidationError('El monto del beneficio debe ser un número positivo mayor a 0');
    }

    const employee = await this.benefitRepo.findEmployeeInTenant(employeeId, tenantId);
    if (!employee) throw new NotFoundError('Empleado no encontrado o sin permisos');

    const benefit = await this.benefitRepo.createBenefit({
      employeeId,
      name: name.trim(),
      amount: financial.round(financial.from(numAmount)),
      type: type || 'BONUS',
      frequency: frequency || 'ONE_TIME',
      status: 'ACTIVE',
    });

    if (adminId) {
      await this.auditRepo
        .log({
          action: 'CREATE_BENEFIT',
          entity: 'EmployeeBenefit',
          entityId: benefit.id,
          userId: adminId,
          tenantId,
          details: {
            employeeId,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            name: benefit.name,
            amount: benefit.amount,
            type: benefit.type,
            frequency: benefit.frequency,
          },
        })
        .catch((err) => console.error('[Audit Error] createBenefit:', err));
    }

    return benefit;
  }

  async bulkCreate(
    { employeeIds, name, amount, type = 'BONUS', frequency = 'ONE_TIME', isSpecialCalculation },
    tenantId = null,
    adminId = null
  ) {
    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      throw new ValidationError('Debe seleccionar al menos un colaborador');
    }
    if (!name || !name.trim()) {
      throw new ValidationError('El concepto del beneficio es requerido');
    }

    const employees = await this.benefitRepo.findEmployeesWithActiveContracts(
      employeeIds,
      tenantId
    );
    if (employees.length === 0) {
      throw new NotFoundError('No se encontraron colaboradores válidos para la asignación');
    }

    const benefitsData = [];

    for (const emp of employees) {
      let finalAmount = parseFloat(amount) || 0;
      const activeContract = emp.contracts?.[0];
      let baseSalary = financial.from(0);

      if (activeContract && activeContract.salary) {
        baseSalary = financial.from(activeContract.salary);
      } else if (emp.salary) {
        const decrypted = decryptSalary(emp.salary);
        if (decrypted) baseSalary = financial.from(decrypted);
      }

      if (isSpecialCalculation === 'DECIMO_TERCERO') {
        finalAmount = financial.round(baseSalary);
      } else if (isSpecialCalculation === 'DECIMO_CUARTO') {
        finalAmount = financial.round(financial.from(this.SBU));
      } else if (isSpecialCalculation === 'FONDO_RESERVA') {
        if (!hasMinimumOneYearSeniority(emp, activeContract)) {
          finalAmount = 0;
        } else {
          finalAmount = financial.round(financial.divide(baseSalary, 12));
        }
      } else if (isSpecialCalculation === 'UTILIDADES' && (!amount || parseFloat(amount) === 0)) {
        finalAmount = financial.round(financial.percentage(baseSalary, 10));
      }

      if (finalAmount > 0) {
        benefitsData.push({
          employeeId: emp.id,
          name: name.trim(),
          amount: finalAmount,
          type: type || 'BONUS',
          frequency: frequency || 'ONE_TIME',
          status: 'ACTIVE',
        });
      }
    }

    if (benefitsData.length === 0) {
      throw new ValidationError(
        'No fue posible calcular montos válidos para los colaboradores seleccionados'
      );
    }

    await this.benefitRepo.createManyBenefits(benefitsData);

    if (adminId) {
      const totalAssigned = benefitsData.reduce(
        (acc, b) => acc.plus(financial.from(b.amount)),
        financial.from(0)
      );
      await this.auditRepo
        .log({
          action: 'BULK_CREATE_BENEFITS',
          entity: 'EmployeeBenefit',
          userId: adminId,
          tenantId,
          details: {
            count: benefitsData.length,
            name,
            type,
            isSpecialCalculation,
            totalAssignedAmount: financial.round(totalAssigned),
          },
        })
        .catch((err) => console.error('[Audit Error] bulkCreate:', err));
    }

    return {
      count: benefitsData.length,
      message: `${benefitsData.length} beneficios asignados exitosamente`,
    };
  }

  async updateBenefit(id, { name, amount, type, frequency }, tenantId = null, adminId = null) {
    const benefit = await this.benefitRepo.findByIdForTenant(id, tenantId);
    if (!benefit) throw new NotFoundError('Beneficio no encontrado o sin permisos');
    if (benefit.status !== 'ACTIVE') {
      throw new ConflictError(`No se puede modificar un beneficio en estado ${benefit.status}`);
    }

    const updateData = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (amount !== undefined) {
      const numAmount = parseFloat(amount);
      if (Number.isNaN(numAmount) || numAmount <= 0) {
        throw new ValidationError('El monto debe ser mayor a 0');
      }
      updateData.amount = financial.round(financial.from(numAmount));
    }
    if (type) updateData.type = type;
    if (frequency) updateData.frequency = frequency;

    const updated = await this.benefitRepo.updateBenefit(id, updateData);

    if (adminId) {
      await this.auditRepo
        .log({
          action: 'UPDATE_BENEFIT',
          entity: 'EmployeeBenefit',
          entityId: id,
          userId: adminId,
          tenantId,
          details: { before: benefit, after: updated },
        })
        .catch((err) => console.error('[Audit Error] updateBenefit:', err));
    }

    return updated;
  }

  async deactivate(id, tenantId = null, adminId = null) {
    const benefit = await this.benefitRepo.findByIdForTenant(id, tenantId);
    if (!benefit) throw new NotFoundError('Beneficio no encontrado o sin permisos');
    if (benefit.status === 'PROCESSED') {
      throw new ConflictError(
        'No se puede cancelar un beneficio que ya fue procesado y pagado en el rol de pagos'
      );
    }

    const updated = await this.benefitRepo.deactivateBenefit(id);

    if (adminId) {
      await this.auditRepo
        .log({
          action: 'DEACTIVATE_BENEFIT',
          entity: 'EmployeeBenefit',
          entityId: id,
          userId: adminId,
          tenantId,
          details: { previousStatus: benefit.status, newStatus: 'CANCELLED' },
        })
        .catch((err) => console.error('[Audit Error] deactivate:', err));
    }

    return updated;
  }
}

export default new EmployeeBenefitService();
