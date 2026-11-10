/**
 * @file contract.repository.js
 * @description Repositorio de persistencia para contratos laborales (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../database/db.js';

export class ContractRepository {
  async create(data) {
    return await prisma.contract.create({
      data,
    });
  }

  async findByEmployeeId(employeeId) {
    return await prisma.contract.findMany({
      where: { employeeId },
      orderBy: { startDate: 'desc' },
    });
  }

  async findById(id) {
    return await prisma.contract.findUnique({
      where: { id },
    });
  }

  async update(id, data) {
    return await prisma.contract.update({
      where: { id },
      data,
    });
  }
}

export default new ContractRepository();
