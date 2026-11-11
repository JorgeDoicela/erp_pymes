/**
 * @file superAdmin.service.js
 * @description Norma ERP - Servicio Backoffice SuperAdmin (Control Plane SaaS)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { runWithTenant } from '../../../database/tenantContext.js';
import { encrypt } from '../../../core/security/encryption.js';
import tenantRepository from '../organization/tenant.repository.js';
import { TenantHttpError, normalizeSlug } from '../organization/tenant.service.js';

const ALLOWED_STATUSES = ['ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED'];
const ALLOWED_PLANS = ['ESSENTIAL', 'GROWTH', 'ENTERPRISE'];
const PLAN_PRICE_PER_EMPLOYEE = {
  ESSENTIAL: 0.5,
  GROWTH: 1.0,
  ENTERPRISE: 2.0,
};

export class SuperAdminService {
  async getPlatformMetrics() {
    return runWithTenant(
      null,
      async () => {
        const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const [
          totalTenants,
          activeTenants,
          trialTenants,
          suspendedTenants,
          expiringTrialsCount,
          totalEmployees,
          essentialCount,
          growthCount,
          enterpriseCount,
          expiringTrialsList,
          activeTenantDetails,
        ] = await tenantRepository.getPlatformMetricsData(sevenDaysFromNow);

        let estimatedMRR = 0;
        activeTenantDetails.forEach((t) => {
          const empCount = t._count.employees || 1;
          const price = PLAN_PRICE_PER_EMPLOYEE[t.plan] || 0.5;
          estimatedMRR += empCount * price;
        });

        const calculatedMRR = Math.round(estimatedMRR * 100) / 100;
        const arpu =
          activeTenants > 0 ? Math.round((calculatedMRR / activeTenants) * 100) / 100 : 0;

        return {
          totalTenants,
          activeTenants,
          trialTenants,
          suspendedTenants,
          expiringTrialsCount,
          totalEmployees,
          estimatedMRR: calculatedMRR,
          arpu,
          currency: 'USD',
          systemHealth: 'OPERATIONAL',
          planDistribution: {
            ESSENTIAL: essentialCount,
            GROWTH: growthCount,
            ENTERPRISE: enterpriseCount,
          },
          expiringTrials: expiringTrialsList.map((t) => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
            trialEndsAt: t.trialEndsAt,
            plan: t.plan,
            employeeCount: t._count.employees,
          })),
        };
      },
      true
    );
  }

  async getAllTenants({ page = 1, limit = 10, q, status, plan }) {
    return runWithTenant(
      null,
      async () => {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        const where = {};
        if (status) {
          if (status === 'EXPIRING') {
            const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            where.subscriptionStatus = 'TRIAL';
            where.trialEndsAt = { lte: sevenDaysFromNow };
          } else {
            where.subscriptionStatus = status;
          }
        }
        if (plan) where.plan = plan;

        if (q && typeof q === 'string' && q.trim()) {
          const search = q.trim();
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
            { ruc: { contains: search } },
            {
              employees: {
                some: {
                  role: 'admin',
                  OR: [
                    { email: { contains: search, mode: 'insensitive' } },
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                  ],
                },
              },
            },
          ];
        }

        const [tenants, total] = await tenantRepository.findTenantsPaginated(where, skip, limitNum);

        return {
          data: tenants.map((t) => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
            ruc: t.ruc,
            plan: t.plan,
            subscriptionStatus: t.subscriptionStatus,
            maxEmployees: t.maxEmployees,
            employeeCount: t._count.employees,
            trialEndsAt: t.trialEndsAt,
            subscriptionEndsAt: t.subscriptionEndsAt,
            createdAt: t.createdAt,
            admin: t.employees[0] || null,
          })),
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
          },
        };
      },
      true
    );
  }

  async getTenantDetail(id) {
    return runWithTenant(
      null,
      async () => {
        const result = await tenantRepository.findTenantDetailById(id);
        if (!result) {
          throw new TenantHttpError(404, 'Empresa no encontrada');
        }

        const { tenant, contractCount, attendanceCount } = result;
        return {
          ...tenant,
          admin: tenant.employees[0] || null,
          employeeCount: tenant._count.employees,
          payrollCount: tenant._count.payrolls,
          vacancyCount: tenant._count.jobVacancies,
          announcementCount: tenant._count.announcements,
          contractCount,
          attendanceCount,
        };
      },
      true
    );
  }

  async updateTenantStatus(id, { subscriptionStatus, extendDays }) {
    return runWithTenant(
      null,
      async () => {
        if (subscriptionStatus && !ALLOWED_STATUSES.includes(subscriptionStatus)) {
          throw new TenantHttpError(
            400,
            `Estado de suscripción inválido. Estados permitidos: ${ALLOWED_STATUSES.join(', ')}`
          );
        }

        const tenant = await tenantRepository.findTenantById(id);
        if (!tenant) {
          throw new TenantHttpError(404, 'Empresa no encontrada');
        }

        const updateData = {};
        if (subscriptionStatus) {
          updateData.subscriptionStatus = subscriptionStatus;
          if (subscriptionStatus === 'ACTIVE' || subscriptionStatus === 'TRIAL') {
            updateData.isActive = true;
          } else if (subscriptionStatus === 'CANCELLED' || subscriptionStatus === 'SUSPENDED') {
            updateData.isActive = false;
          }
        }

        if (extendDays && typeof extendDays === 'number' && extendDays > 0) {
          const currentEnd = tenant.subscriptionEndsAt
            ? new Date(tenant.subscriptionEndsAt)
            : new Date();
          updateData.subscriptionEndsAt = new Date(
            Math.max(currentEnd.getTime(), Date.now()) + extendDays * 24 * 60 * 60 * 1000
          );
        }

        return tenantRepository.updateTenant(id, updateData);
      },
      true
    );
  }

  async updateTenantPlan(id, { plan, maxEmployees }) {
    return runWithTenant(
      null,
      async () => {
        if (plan && !ALLOWED_PLANS.includes(plan)) {
          throw new TenantHttpError(
            400,
            `Plan inválido. Planes permitidos: ${ALLOWED_PLANS.join(', ')}`
          );
        }

        const updateData = {};
        if (plan) updateData.plan = plan;
        if (maxEmployees !== undefined && typeof maxEmployees === 'number' && maxEmployees > 0) {
          updateData.maxEmployees = maxEmployees;
        }

        return tenantRepository.updateTenant(id, updateData);
      },
      true
    );
  }

  async getTenantsList() {
    return runWithTenant(null, () => tenantRepository.findActiveTenantsList(), true);
  }

  async getGlobalAuditLogs({ page = 1, limit = 20, tenantId, entity, search }) {
    return runWithTenant(
      null,
      async () => {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        const where = {};
        if (tenantId) where.tenantId = tenantId;
        if (entity) where.entity = entity;
        if (search) {
          where.OR = [
            { action: { contains: search, mode: 'insensitive' } },
            { performedBy: { contains: search, mode: 'insensitive' } },
            { details: { contains: search, mode: 'insensitive' } },
          ];
        }

        const [logs, total] = await tenantRepository.findGlobalAuditLogsPaginated(
          where,
          skip,
          limitNum
        );

        return {
          data: logs,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
          },
        };
      },
      true
    );
  }

  async createTenantBySuperAdmin(payload, performerEmail) {
    return runWithTenant(
      null,
      async () => {
        const {
          companyName,
          slug: slugRaw,
          ruc,
          plan = 'ESSENTIAL',
          maxEmployees = 50,
          adminFirstName,
          adminLastName,
          adminEmail,
          adminPassword,
        } = payload;

        if (!companyName || !adminEmail || !adminPassword || !adminFirstName || !adminLastName) {
          throw new TenantHttpError(
            400,
            'Nombre de empresa, datos del administrador (nombre, correo y contraseña) son requeridos.'
          );
        }

        const slug = normalizeSlug(slugRaw, companyName);

        const existingTenant = await tenantRepository.findTenantBySlugOrRuc(slug, ruc);
        if (existingTenant) {
          throw new TenantHttpError(400, 'Ya existe una empresa con ese slug o RUC.');
        }

        const existingUser = await tenantRepository.findEmployeeByEmail(adminEmail);
        if (existingUser) {
          throw new TenantHttpError(
            400,
            'El correo electrónico ya está registrado por otro usuario.'
          );
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const trialEndsAt = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);

        return tenantRepository.provisionTenantWithAdmin({
          tenantData: {
            name: companyName,
            slug,
            ruc: ruc || null,
            plan,
            subscriptionStatus: 'TRIAL',
            maxEmployees: parseInt(maxEmployees, 10),
            trialEndsAt,
            isActive: true,
          },
          adminData: {
            firstName: adminFirstName,
            lastName: adminLastName,
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
            department: 'Dirección General',
            position: 'Administrador Principal',
            salary: encrypt('0'),
            identityCard: ruc || `ADMIN-${Date.now()}`,
            phone: '0999999999',
            address: 'Oficina Principal',
            birthDate: new Date('1990-01-01'),
            hireDate: new Date(),
            civilStatus: 'SOLTERO',
            contractType: 'INDEFINIDO',
          },
          auditData: {
            entity: 'TENANT',
            action: 'SUPERADMIN_CREATE_TENANT',
            performedBy: performerEmail || 'SUPERADMIN',
            details: (tenant) =>
              `Empresa '${tenant.name}' creada desde Backoffice SuperAdmin por ${performerEmail}`,
          },
        });
      },
      true
    );
  }

  async impersonateTenant(id, performerEmail) {
    return runWithTenant(
      null,
      async () => {
        const tenant = await tenantRepository.findTenantForImpersonation(id);
        if (!tenant) {
          throw new TenantHttpError(404, 'Empresa no encontrada');
        }

        const adminUser = tenant.employees[0];
        if (!adminUser) {
          throw new TenantHttpError(
            400,
            'La empresa no tiene un administrador activo para impersonar.'
          );
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_me';
        const token = jwt.sign(
          {
            id: adminUser.id,
            email: adminUser.email,
            role: adminUser.role,
            tenantId: tenant.id,
            isImpersonated: true,
            impersonatedBy: performerEmail,
          },
          JWT_SECRET,
          { expiresIn: '2h' }
        );

        await tenantRepository.createAuditLogDirect({
          tenantId: tenant.id,
          entity: 'SUPPORT_SESSION',
          entityId: tenant.id,
          action: 'SUPERADMIN_IMPERSONATE_TENANT',
          performedBy: performerEmail || 'SUPERADMIN',
          details: `Modo soporte iniciado por SuperAdmin '${performerEmail}' en la empresa '${tenant.name}'`,
        });

        return {
          tenantName: tenant.name,
          payload: {
            token,
            user: {
              id: adminUser.id,
              firstName: adminUser.firstName,
              lastName: adminUser.lastName,
              email: adminUser.email,
              role: adminUser.role,
              tenantId: tenant.id,
            },
            tenant: {
              id: tenant.id,
              name: tenant.name,
              slug: tenant.slug,
            },
          },
        };
      },
      true
    );
  }
}

export default new SuperAdminService();
