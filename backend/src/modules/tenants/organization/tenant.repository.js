/**
 * @file tenant.repository.js
 * @description Norma ERP - Repositorio de Empresas (Tenants) y Control SaaS
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../../database/db.js';

export class TenantRepository {
  async findTenantBySlug(slug, select = null) {
    return prisma.tenant.findUnique({
      where: { slug },
      ...(select ? { select } : {}),
    });
  }

  async findTenantBySlugOrRuc(slug, ruc) {
    return prisma.tenant.findFirst({
      where: {
        OR: [{ slug }, ...(ruc ? [{ ruc }] : [])],
      },
    });
  }

  async findEmployeeByEmail(email) {
    return prisma.employee.findUnique({
      where: { email },
    });
  }

  /**
   * Provisiona de forma atómica un nuevo Tenant junto con su configuración inicial
   * (SystemSetting, PayrollConfig, Shift por defecto, usuario Administrador y opcionalmente AuditLog).
   */
  async provisionTenantWithAdmin({ tenantData, adminData, auditData = null }) {
    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({ data: tenantData });

      await tx.systemSetting.create({
        data: {
          tenantId: tenant.id,
          maintenanceMode: false,
          biometricEnabled: false,
        },
      });

      await tx.payrollConfig.create({
        data: {
          tenantId: tenant.id,
          workingDays: 30,
          currency: 'USD',
          isActive: true,
          items: {
            create: [
              {
                name: 'Aporte Personal IESS',
                type: 'DEDUCTION',
                isMandatory: true,
                percentage: 9.45,
              },
              {
                name: 'Impuesto a la Renta',
                type: 'DEDUCTION',
                isMandatory: false,
                percentage: 0,
              },
            ],
          },
        },
      });

      await tx.shift.create({
        data: {
          tenantId: tenant.id,
          name: 'Jornada Ordinaria (08:00 - 17:00)',
          startTime: '08:00',
          endTime: '17:00',
          breakMinutes: 60,
          toleranceMinutes: 15,
        },
      });

      const admin = await tx.employee.create({
        data: {
          tenantId: tenant.id,
          ...adminData,
        },
      });

      if (auditData) {
        await tx.auditLog.create({
          data: {
            tenantId: tenant.id,
            entityId: tenant.id,
            ...auditData,
            details:
              typeof auditData.details === 'function'
                ? auditData.details(tenant)
                : auditData.details,
          },
        });
      }

      return { tenant, admin };
    });
  }

  async findTenantByIdWithEmployeeCount(id) {
    return prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });
  }

  async updateTenant(id, data) {
    return prisma.tenant.update({
      where: { id },
      data,
    });
  }

  async findTenantById(id) {
    return prisma.tenant.findUnique({ where: { id } });
  }

  async getPlatformMetricsData(sevenDaysFromNow) {
    return Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { subscriptionStatus: 'ACTIVE', isActive: true } }),
      prisma.tenant.count({ where: { subscriptionStatus: 'TRIAL', isActive: true } }),
      prisma.tenant.count({ where: { subscriptionStatus: 'SUSPENDED' } }),
      prisma.tenant.count({
        where: {
          subscriptionStatus: 'TRIAL',
          trialEndsAt: { lte: sevenDaysFromNow },
        },
      }),
      prisma.employee.count({ where: { isActive: true } }),
      prisma.tenant.count({ where: { plan: 'ESSENTIAL' } }),
      prisma.tenant.count({ where: { plan: 'GROWTH' } }),
      prisma.tenant.count({ where: { plan: 'ENTERPRISE' } }),
      prisma.tenant.findMany({
        where: {
          subscriptionStatus: 'TRIAL',
          trialEndsAt: { lte: sevenDaysFromNow },
        },
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          trialEndsAt: true,
          plan: true,
          _count: { select: { employees: true } },
        },
        orderBy: { trialEndsAt: 'asc' },
      }),
      prisma.tenant.findMany({
        where: { subscriptionStatus: 'ACTIVE', isActive: true },
        select: { plan: true, _count: { select: { employees: true } } },
      }),
    ]);
  }

  async findTenantsPaginated(where, skip, take) {
    return Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { employees: true },
          },
          employees: {
            where: { role: 'admin' },
            take: 1,
            select: { firstName: true, lastName: true, email: true, phone: true },
          },
        },
      }),
      prisma.tenant.count({ where }),
    ]);
  }

  async findTenantDetailById(id) {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            employees: true,
            payrolls: true,
            jobVacancies: true,
            announcements: true,
          },
        },
        employees: {
          where: { role: 'admin' },
          take: 1,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            hireDate: true,
          },
        },
        systemSettings: true,
      },
    });

    if (!tenant) return null;

    const [contractCount, attendanceCount] = await Promise.all([
      prisma.contract.count({ where: { employee: { tenantId: id } } }),
      prisma.attendance.count({ where: { employee: { tenantId: id } } }),
    ]);

    return { tenant, contractCount, attendanceCount };
  }

  async findActiveTenantsList() {
    return prisma.tenant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        subscriptionStatus: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findGlobalAuditLogsPaginated(where, skip, take) {
    return Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { timestamp: 'desc' },
        include: {
          tenant: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);
  }

  async findTenantForImpersonation(id) {
    return prisma.tenant.findUnique({
      where: { id },
      include: {
        employees: {
          where: { role: 'admin', isActive: true },
          take: 1,
        },
      },
    });
  }

  async createAuditLogDirect(data) {
    return prisma.auditLog.create({ data });
  }
}

export default new TenantRepository();
