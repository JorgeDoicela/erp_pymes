/**
 * @file compliance.repository.js
 * @description Repositorio de persistencia para el módulo de Cumplimiento Normativo y Beneficios Legales (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../../database/db.js';

export class ComplianceRepository {
  /**
   * Obtener contratos activos para evaluación de alertas de período de prueba.
   */
  async findActiveContracts(where) {
    return prisma.contract.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            tenantId: true,
            firstName: true,
            lastName: true,
            identityCard: true,
            department: true,
            position: true,
          },
        },
      },
    });
  }

  /**
   * Obtener documentos que expiran para alertas preventivas de vigencia.
   */
  async findExpiringDocuments(where) {
    return prisma.document.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            tenantId: true,
            firstName: true,
            lastName: true,
            identityCard: true,
            department: true,
            position: true,
          },
        },
      },
    });
  }

  /**
   * Obtener colaboradores activos con contrato vigente para cálculo de provisiones legales.
   */
  async findEmployeesWithActiveContract(empWhere, startDate, endDate) {
    return prisma.employee.findMany({
      where: empWhere,
      include: {
        contracts: {
          where: {
            startDate: { lte: endDate },
            OR: [{ endDate: null }, { endDate: { gte: startDate } }],
            status: 'Active',
          },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    });
  }
}

export const complianceRepository = new ComplianceRepository();
export default complianceRepository;
