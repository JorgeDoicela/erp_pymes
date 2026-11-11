/**
 * @file contract.repository.js
 * @description Repositorio de persistencia para contratos laborales (Norma ERP).
 * Encapsula la interacción con Prisma ORM aislando la capa de datos.
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

  async findByIdWithEmployee(id) {
    return await prisma.contract.findUnique({
      where: { id },
      include: { employee: true },
    });
  }

  async findOverlapping(employeeId, newStart, newEnd) {
    return await prisma.contract.findFirst({
      where: {
        employeeId,
        status: 'Active',
        OR: [
          {
            startDate: { lte: newStart },
            OR: [{ endDate: null }, { endDate: { gte: newStart } }],
          },
          newEnd
            ? {
                startDate: { lte: newEnd, gte: newStart },
              }
            : {
                startDate: { gte: newStart },
              },
        ],
      },
    });
  }

  async findExpiring(today, futureDate, tenantId = null) {
    return await prisma.contract.findMany({
      where: {
        status: 'Active',
        endDate: {
          gte: today,
          lte: futureDate,
        },
        ...(tenantId ? { employee: { tenantId } } : {}),
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
            position: true,
            email: true,
          },
        },
      },
      orderBy: {
        endDate: 'asc',
      },
    });
  }

  async update(id, data) {
    return await prisma.contract.update({
      where: { id },
      data,
    });
  }
}

export const contractRepository = new ContractRepository();
export default contractRepository;
