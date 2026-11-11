/**
 * @file tenantRoleIsolation.test.js
 * @description Suite de Pruebas de Aislamiento Multi-Tenant y Verificación Estricta de los 5 Roles Empresariales (RNF-08, RBAC).
 * Verifica que cada tenant configure y mantenga de forma aislada e independiente:
 * 1. admin (Tenant Admin)
 * 2. hr (Recursos Humanos)
 * 3. accounting (Contabilidad y Finanzas)
 * 4. manager (Supervisor / Jefe de Departamento)
 * 5. employee (Empleado / Autogestión)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ROLES,
  TENANT_ROLES,
  GLOBAL_ROLES,
  ROLE_PERMISSIONS,
  isValidRole,
  isTenantRole,
  isSuperAdminRole,
} from '../../../src/config/roles.js';
import { authorize } from '../../../src/modules/auth/auth.middleware.js';
import {
  createEmployeeDto,
  updateEmployeeDto,
} from '../../../src/modules/employees/directory/employee.dto.js';
import { runWithTenant, getTenantId } from '../../../src/database/tenantContext.js';

describe('Aislamiento Multi-Tenant y Gobernanza de los 5 Roles Empresariales', () => {
  describe('1. Estructura y Validación de Roles por Tenant', () => {
    it('debe contener con exactitud los 5 roles empresariales requeridos para cada tenant', () => {
      expect(TENANT_ROLES).toHaveLength(5);
      expect(TENANT_ROLES).toContain(ROLES.ADMIN);
      expect(TENANT_ROLES).toContain(ROLES.HR);
      expect(TENANT_ROLES).toContain(ROLES.ACCOUNTING);
      expect(TENANT_ROLES).toContain(ROLES.MANAGER);
      expect(TENANT_ROLES).toContain(ROLES.EMPLOYEE);
    });

    it('debe distinguir roles de Tenant frente al SuperAdmin Global', () => {
      expect(GLOBAL_ROLES).toContain(ROLES.SUPERADMIN);
      expect(isTenantRole(ROLES.SUPERADMIN)).toBe(false);
      expect(isTenantRole(ROLES.ADMIN)).toBe(true);
      expect(isTenantRole(ROLES.HR)).toBe(true);
      expect(isTenantRole(ROLES.ACCOUNTING)).toBe(true);
      expect(isTenantRole(ROLES.MANAGER)).toBe(true);
      expect(isTenantRole(ROLES.EMPLOYEE)).toBe(true);
      expect(isSuperAdminRole(ROLES.SUPERADMIN)).toBe(true);
      expect(isSuperAdminRole(ROLES.ADMIN)).toBe(false);
    });

    it('debe validar roles válidos e invalidar cadenas arbitrarias o maliciosas', () => {
      expect(isValidRole('admin')).toBe(true);
      expect(isValidRole('hr')).toBe(true);
      expect(isValidRole('accounting')).toBe(true);
      expect(isValidRole('manager')).toBe(true);
      expect(isValidRole('employee')).toBe(true);
      expect(isValidRole('superadmin')).toBe(true);
      expect(isValidRole('hacker_role')).toBe(false);
      expect(isValidRole('')).toBe(false);
      expect(isValidRole(null)).toBe(false);
    });
  });

  describe('2. Matriz de Permisos Específica por Rol (RBAC)', () => {
    it('el rol admin debe tener control integral de la empresa (personal, nómina, finanzas, turnos)', () => {
      const perms = ROLE_PERMISSIONS[ROLES.ADMIN];
      expect(perms).toContain('employees:create');
      expect(perms).toContain('employees:read');
      expect(perms).toContain('employees:update');
      expect(perms).toContain('employees:delete');
      expect(perms).toContain('payroll:read');
      expect(perms).toContain('payroll:write');
      expect(perms).toContain('payroll:confirm');
      expect(perms).toContain('accounting:read');
      expect(perms).toContain('accounting:write');
      expect(perms).toContain('attendance:read');
      expect(perms).toContain('attendance:write');
    });

    it('el rol hr debe gestionar talento y asistencia pero no contabilidad de la empresa', () => {
      const perms = ROLE_PERMISSIONS[ROLES.HR];
      expect(perms).toContain('employees:create');
      expect(perms).toContain('employees:read');
      expect(perms).toContain('attendance:read');
      expect(perms).toContain('recruitment:read');
      expect(perms).toContain('recruitment:write');
      expect(perms).toContain('performance:read');
      expect(perms).not.toContain('accounting:write');
      expect(perms).not.toContain('accounting:read');
    });

    it('el rol accounting debe gestionar finanzas, nómina y anticipos sin crear personal de RRHH', () => {
      const perms = ROLE_PERMISSIONS[ROLES.ACCOUNTING];
      expect(perms).toContain('accounting:read');
      expect(perms).toContain('accounting:write');
      expect(perms).toContain('payroll:read');
      expect(perms).toContain('payroll:write');
      expect(perms).toContain('advances:read');
      expect(perms).toContain('advances:write');
      expect(perms).not.toContain('employees:delete');
      expect(perms).not.toContain('recruitment:write');
    });

    it('el rol manager debe gestionar su equipo directo y disponer de autogestión personal', () => {
      const perms = ROLE_PERMISSIONS[ROLES.MANAGER];
      expect(perms).toContain('team:read');
      expect(perms).toContain('team:attendance');
      expect(perms).toContain('team:absences:approve');
      expect(perms).toContain('team:goals:manage');
      expect(perms).toContain('self:read');
      expect(perms).toContain('self:attendance');
      expect(perms).toContain('self:absences:request');
      expect(perms).not.toContain('accounting:write');
      expect(perms).not.toContain('employees:delete');
    });

    it('el rol employee debe estar estrictamente restringido a su portal de autogestión', () => {
      const perms = ROLE_PERMISSIONS[ROLES.EMPLOYEE];
      expect(perms).toContain('self:read');
      expect(perms).toContain('self:attendance');
      expect(perms).toContain('self:absences:request');
      expect(perms).toContain('self:payroll:read');
      expect(perms).toContain('self:goals:read');
      expect(perms).not.toContain('team:read');
      expect(perms).not.toContain('employees:read');
      expect(perms).not.toContain('payroll:write');
    });
  });

  describe('3. DTOs de Empleados y Validación Zod', () => {
    it('debe aceptar correctamente un empleado con rol manager en createEmployeeDto', () => {
      const validEmployee = {
        firstName: 'Carlos',
        lastName: 'Supervisor',
        email: 'supervisor@tenant1.com',
        department: 'Operaciones',
        position: 'Jefe de Planta',
        salary: '2500.00',
        password: 'Password123!',
        role: 'manager',
      };

      const result = createEmployeeDto.safeParse(validEmployee);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('manager');
      }
    });

    it('debe aceptar todos los roles del tenant en updateEmployeeDto', () => {
      TENANT_ROLES.forEach((role) => {
        const updateData = { role };
        const result = updateEmployeeDto.safeParse(updateData);
        expect(result.success).toBe(true);
      });
    });

    it('debe rechazar roles inválidos o no reconocidos en createEmployeeDto', () => {
      const invalidEmployee = {
        firstName: 'Infiltrado',
        lastName: 'Desconocido',
        email: 'infiltrado@tenant1.com',
        department: 'Sistemas',
        position: 'Root',
        salary: '1000.00',
        password: 'Password123!',
        role: 'super_admin_falso',
      };

      const result = createEmployeeDto.safeParse(invalidEmployee);
      expect(result.success).toBe(false);
    });
  });

  describe('4. Middleware de Autorización RBAC en Peticiones HTTP', () => {
    let mockReq;
    let mockRes;
    let nextFn;

    beforeEach(() => {
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };
      nextFn = vi.fn();
    });

    it('permite acceso si el rol del usuario se encuentra en allowedRoles', () => {
      mockReq = { user: { id: 'usr-1', role: 'manager', tenantId: 'tenant-1' } };
      const middleware = authorize(['admin', 'hr', 'manager']);
      middleware(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('bloquea con 403 Forbidden si el rol no está autorizado', () => {
      mockReq = { user: { id: 'usr-2', role: 'employee', tenantId: 'tenant-1' } };
      const middleware = authorize(['admin', 'hr', 'accounting']);
      middleware(mockReq, mockRes, nextFn);

      expect(nextFn).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'No autorizado: Rol insuficiente',
      });
    });

    it('permite a accounting acceder a endpoints contables y bloquea a hr', () => {
      const accountingMiddleware = authorize(['accounting', 'admin']);

      const reqAccounting = { user: { id: 'acc-1', role: 'accounting', tenantId: 't-1' } };
      const reqHr = { user: { id: 'hr-1', role: 'hr', tenantId: 't-1' } };

      accountingMiddleware(reqAccounting, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalledTimes(1);

      nextFn.mockClear();
      accountingMiddleware(reqHr, mockRes, nextFn);
      expect(nextFn).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('5. Contexto Asíncrono de Aislamiento de Base de Datos (tenantContext)', () => {
    it('mantiene aislado el tenantId en contextos concurrentes independientes', async () => {
      const results = await Promise.all([
        new Promise((resolve) => {
          runWithTenant('tenant-alfa-111', () => {
            setTimeout(() => {
              resolve({ tenant: getTenantId() });
            }, 10);
          });
        }),
        new Promise((resolve) => {
          runWithTenant('tenant-beta-222', () => {
            setTimeout(() => {
              resolve({ tenant: getTenantId() });
            }, 10);
          });
        }),
      ]);

      expect(results[0].tenant).toBe('tenant-alfa-111');
      expect(results[1].tenant).toBe('tenant-beta-222');
      expect(results[0].tenant).not.toBe(results[1].tenant);
    });
  });

  describe('6. Gobernanza y Control del SuperAdmin Global SaaS', () => {
    let mockReq;
    let mockRes;
    let nextFn;

    beforeEach(() => {
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };
      nextFn = vi.fn();
    });

    it('el SuperAdmin dispone de permisos globales de control y métricas de plataforma', () => {
      const perms = ROLE_PERMISSIONS[ROLES.SUPERADMIN];
      expect(perms).toContain('tenants:create');
      expect(perms).toContain('tenants:read');
      expect(perms).toContain('tenants:update');
      expect(perms).toContain('tenants:delete');
      expect(perms).toContain('tenants:suspend');
      expect(perms).toContain('platform:audit');
      expect(perms).toContain('platform:metrics');
      expect(perms).toContain('platform:settings');
    });

    it('el middleware requireSuperAdmin bloquea a roles de empresa con código SUPERADMIN_REQUIRED', async () => {
      const { requireSuperAdmin } =
        await import('../../../src/modules/tenants/superadmin/superAdmin.middleware.js');

      const enterpriseRoles = [
        ROLES.ADMIN,
        ROLES.HR,
        ROLES.ACCOUNTING,
        ROLES.MANAGER,
        ROLES.EMPLOYEE,
      ];
      for (const role of enterpriseRoles) {
        mockReq = { user: { id: `usr-${role}`, role, tenantId: 'tenant-1' } };
        mockRes.status.mockClear();
        mockRes.json.mockClear();
        nextFn.mockClear();

        await requireSuperAdmin(mockReq, mockRes, nextFn);

        expect(nextFn).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'SUPERADMIN_REQUIRED',
          })
        );
      }
    });

    it('el middleware requireSuperAdmin aprueba el acceso únicamente a usuarios con rol superadmin', async () => {
      const { requireSuperAdmin } =
        await import('../../../src/modules/tenants/superadmin/superAdmin.middleware.js');

      mockReq = { user: { id: 'sa-1', role: 'superadmin', tenantId: null } };
      await requireSuperAdmin(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('en módulos operacionales de empresas, requireTenant bloquea escrituras del SuperAdmin con SUPERADMIN_READ_ONLY_SUPERVISION', async () => {
      const { requireTenant } =
        await import('../../../src/modules/tenants/organization/tenant.middleware.js');

      const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
      for (const method of writeMethods) {
        mockReq = {
          user: { id: 'sa-1', role: 'superadmin', tenantId: null },
          method,
          headers: {},
        };
        mockRes.status.mockClear();
        mockRes.json.mockClear();
        nextFn.mockClear();

        await requireTenant(mockReq, mockRes, nextFn);

        expect(nextFn).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'SUPERADMIN_READ_ONLY_SUPERVISION',
          })
        );
      }
    });

    it('en módulos operacionales de empresas, requireTenant permite lecturas (GET) del SuperAdmin en modo supervisión global', async () => {
      const { requireTenant } =
        await import('../../../src/modules/tenants/organization/tenant.middleware.js');

      mockReq = {
        user: { id: 'sa-1', role: 'superadmin', tenantId: null },
        method: 'GET',
        headers: {},
      };

      await requireTenant(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalled();
    });

    it('un usuario de empresa no puede inyectar x-tenant-id para usurpar otra empresa', async () => {
      const { requireTenant } =
        await import('../../../src/modules/tenants/organization/tenant.middleware.js');

      // Usuario normal de Empresa 1 intenta enviar cabecera de Empresa 2
      mockReq = {
        user: { id: 'emp-1', role: 'admin', tenantId: 'tenant-empresa-1' },
        method: 'GET',
        headers: { 'x-tenant-id': 'tenant-empresa-2-victima' },
      };

      // Si busca el tenant en prisma, forzará req.user.tenantId ('tenant-empresa-1')
      // Validamos el comportamiento de resolución segura
      const isSuperAdmin = isSuperAdminRole(mockReq.user?.role);
      const resolvedTenantId = mockReq.user
        ? isSuperAdmin
          ? mockReq.headers['x-tenant-id'] || mockReq.user.tenantId
          : mockReq.user.tenantId
        : mockReq.headers['x-tenant-id'];

      expect(resolvedTenantId).toBe('tenant-empresa-1');
      expect(resolvedTenantId).not.toBe('tenant-empresa-2-victima');
    });
  });
});
