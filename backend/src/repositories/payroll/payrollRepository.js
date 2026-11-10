/**
 * @file payrollRepository.js
 * @description Repositorio desacoplado para el módulo de nómina (PayrollConfig, Payroll, PayrollDetail).
 * Encapsula la persistencia con Prisma ORM bajo estándar de Clean Architecture / Repositories.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../database/db.js';

export class PayrollRepository {
  // =========================================================================
  // 1. Configuración de Nómina (PayrollConfig)
  // =========================================================================

  async getActiveConfig(tenantId = null) {
    return await prisma.payrollConfig.findFirst({
      where: {
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  async createConfigWithItems(configData, itemsData, tenantId = null) {
    return await prisma.$transaction(async (tx) => {
      // Desactivar configuraciones previas para este tenant
      await tx.payrollConfig.updateMany({
        where: {
          isActive: true,
          ...(tenantId ? { tenantId } : {}),
        },
        data: { isActive: false },
      });

      // Crear la nueva configuración activa
      return await tx.payrollConfig.create({
        data: {
          tenantId,
          workingDays: configData.workingDays,
          currency: configData.currency || 'USD',
          isActive: true,
          items: {
            create: itemsData,
          },
        },
        include: { items: true },
      });
    });
  }

  // =========================================================================
  // 2. Nómina y Liquidaciones (Payroll & PayrollDetail)
  // =========================================================================

  async findPayrollById(id, tenantId = null) {
    return await prisma.payroll.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        details: {
          include: {
            employee: true,
          },
        },
      },
    });
  }

  async findPayrolls(skip = 0, take = 10, tenantId = null) {
    return await prisma.payroll.findMany({
      where: tenantId ? { tenantId } : {},
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        details: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                department: true,
                position: true,
              },
            },
          },
        },
      },
    });
  }

  async countPayrolls(tenantId = null) {
    return await prisma.payroll.count({
      where: tenantId ? { tenantId } : {},
    });
  }

  async findPayrollsByEmployee(employeeId, tenantId = null) {
    return await prisma.payrollDetail.findMany({
      where: {
        employeeId,
        payroll: {
          status: { in: ['CONFIRMED', 'PAID'] },
          ...(tenantId ? { tenantId } : {}),
        },
      },
      include: {
        payroll: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updatePayrollStatus(id, status) {
    return await prisma.payroll.update({
      where: { id },
      data: { status },
    });
  }

  async updatePayrollDetail(detailId, data) {
    return await prisma.payrollDetail.update({
      where: { id: detailId },
      data,
    });
  }

  async deletePayroll(id) {
    return await prisma.payroll.delete({ where: { id } });
  }
}

export default new PayrollRepository();
