/**
 * @file contract.service.js
 * @description Servicio de aplicación y dominio para contratos laborales (Norma ERP).
 * Valida solapamiento de fechas, vigencia de contratos, renovaciones y alertas de expiración.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import defaultContractRepo from './contract.repository.js';
import { employeeRepository } from '../employees/index.js';

export class ContractService {
  constructor({ repo = defaultContractRepo, empRepo = employeeRepository } = {}) {
    this.contractRepository = repo;
    this.employeeRepository = empRepo;
  }

  async createContract(data) {
    // Validate end date > start date
    if (data.startDate && data.endDate) {
      if (new Date(data.endDate) <= new Date(data.startDate)) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }
    }

    // Verify employee exists
    const employee = await this.employeeRepository.findById(data.employeeId);
    if (!employee) {
      throw new Error('Empleado no encontrado');
    }

    // 1. Validar solapamiento de fechas
    const newStart = new Date(data.startDate);
    const newEnd = data.endDate ? new Date(data.endDate) : null;

    const overlapping = await this.contractRepository.findOverlapping(
      data.employeeId,
      newStart,
      newEnd
    );

    if (overlapping) {
      throw new Error(
        'El empleado ya tiene un contrato activo en este rango de fechas. Cierre el contrato anterior primero.'
      );
    }

    return await this.contractRepository.create(data);
  }

  async getContractsByEmployee(employeeId) {
    return await this.contractRepository.findByEmployeeId(employeeId);
  }

  async getExpiringContracts(days = 30, tenantId = null) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return await this.contractRepository.findExpiring(today, futureDate, tenantId);
  }

  async renewContract(contractId, data, tenantId = null) {
    const contract = await this.contractRepository.findByIdWithEmployee(contractId);
    if (!contract) throw new Error('Contrato no encontrado');
    if (tenantId && contract.employee?.tenantId !== tenantId) {
      throw new Error('No autorizado para modificar contratos de otra empresa');
    }

    const { newEndDate, newSalary, newType = 'Indefinido', notes } = data;
    const isIndefinite = newType === 'Indefinido' || !newEndDate;

    const updatedContract = await this.contractRepository.update(contractId, {
      endDate: isIndefinite ? null : new Date(newEndDate),
      type: newType,
      salary: newSalary ? parseFloat(newSalary) : contract.salary,
      clauses: notes
        ? `${contract.clauses || ''}\n[Renovado ${new Date().toISOString().split('T')[0]}]: ${notes}`
        : contract.clauses,
      status: 'Active',
    });

    if (typeof this.employeeRepository.update === 'function') {
      await this.employeeRepository.update(contract.employeeId, {
        contractType: newType,
      });
    }

    return updatedContract;
  }
}

export const contractService = new ContractService();
export default contractService;
