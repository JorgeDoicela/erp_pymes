/**
 * @file tenant.service.js
 * @description Norma ERP - Servicio de Onboarding y Perfil de Empresa (Tenant)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { encrypt } from '../../utils/encryption.js';
import tenantRepository from './tenant.repository.js';
import auditRepository from '../audit/audit.repository.js';

export class TenantHttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function normalizeSlug(raw, companyName) {
  return (raw || companyName)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export class TenantService {
  async registerTenant(payload) {
    const {
      companyName,
      slug: slugRaw,
      ruc,
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPassword,
      adminPhone,
      plan = 'ESSENTIAL',
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
      throw new TenantHttpError(400, 'Ya existe una empresa registrada con ese nombre/slug o RUC.');
    }

    const existingUser = await tenantRepository.findEmployeeByEmail(adminEmail);
    if (existingUser) {
      throw new TenantHttpError(400, 'El correo electrónico ya está registrado en el sistema.');
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const trialEndsAt = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
    const normalizedPlan = plan.toUpperCase();

    const result = await tenantRepository.provisionTenantWithAdmin({
      tenantData: {
        name: companyName,
        slug,
        ruc: ruc || null,
        plan: normalizedPlan,
        subscriptionStatus: 'TRIAL',
        trialEndsAt,
        maxEmployees: normalizedPlan === 'ESSENTIAL' ? 25 : 100,
      },
      adminData: {
        firstName: adminFirstName,
        lastName: adminLastName,
        email: adminEmail.toLowerCase().trim(),
        password: passwordHash,
        role: 'admin',
        department: 'Dirección',
        position: 'Administrador General',
        salary: encrypt('0'),
        identityCard: `ADM-${Date.now().toString().slice(-7)}`,
        birthDate: new Date('1990-01-01'),
        hireDate: new Date(),
        address: 'Matriz Principal',
        phone: adminPhone || '0999999999',
        civilStatus: 'Soltero',
        contractType: 'Indefinido',
        vacationDays: 15,
      },
    });

    const token = jwt.sign(
      { id: result.admin.id, role: result.admin.role, tenantId: result.tenant.id },
      process.env.JWT_SECRET || 'secret_key_change_me',
      { expiresIn: '1d' }
    );

    return {
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        plan: result.tenant.plan,
        subscriptionStatus: result.tenant.subscriptionStatus,
        trialEndsAt: result.tenant.trialEndsAt,
      },
      user: {
        id: result.admin.id,
        tenantId: result.tenant.id,
        firstName: result.admin.firstName,
        lastName: result.admin.lastName,
        email: result.admin.email,
        role: result.admin.role,
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          slug: result.tenant.slug,
          plan: result.tenant.plan,
          subscriptionStatus: result.tenant.subscriptionStatus,
        },
      },
      token,
    };
  }

  async getMyTenant(tenantId) {
    const tenant = await tenantRepository.findTenantByIdWithEmployeeCount(tenantId);
    if (!tenant) {
      throw new TenantHttpError(404, 'Empresa no encontrada');
    }
    return tenant;
  }

  async updateMyTenant(tenantId, userId, { name, ruc }) {
    const updated = await tenantRepository.updateTenant(tenantId, {
      ...(name ? { name } : {}),
      ...(ruc !== undefined ? { ruc } : {}),
    });

    await auditRepository
      .log({
        tenantId,
        entity: 'Tenant',
        entityId: updated.id,
        action: 'UPDATE_TENANT_PROFILE',
        userId,
        details: { name: updated.name, ruc: updated.ruc },
      })
      .catch((err) => console.error('[Audit Error] updateMyTenant:', err));

    return updated;
  }
}

export default new TenantService();

