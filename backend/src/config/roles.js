/**
 * Constantes y Gobernanza de Roles y Permisos (RBAC) para el Sistema ERP Multi-Tenant.
 */

export const ROLES = Object.freeze({
    SUPERADMIN: 'superadmin',  // Administrador Global SaaS / Operador de Plataforma
    ADMIN: 'admin',            // Administrador de Empresa (Tenant Admin)
    HR: 'hr',                  // Gestor de Recursos Humanos del Tenant
    ACCOUNTING: 'accounting',  // Contabilidad y Finanzas del Tenant
    MANAGER: 'manager',        // Supervisor / Jefe de Departamento del Tenant
    EMPLOYEE: 'employee'       // Empleado (Autogestión Portal)
});

export const ALL_ROLES = Object.values(ROLES);

export const TENANT_ROLES = Object.freeze([
    ROLES.ADMIN,
    ROLES.HR,
    ROLES.ACCOUNTING,
    ROLES.MANAGER,
    ROLES.EMPLOYEE
]);

export const GLOBAL_ROLES = Object.freeze([
    ROLES.SUPERADMIN
]);

/**
 * Matriz de Permisos por Rol
 */
export const ROLE_PERMISSIONS = Object.freeze({
    [ROLES.SUPERADMIN]: [
        'tenants:create', 'tenants:read', 'tenants:update', 'tenants:delete', 'tenants:suspend',
        'platform:audit', 'platform:metrics', 'platform:settings'
    ],
    [ROLES.ADMIN]: [
        'tenant:read', 'tenant:update',
        'employees:create', 'employees:read', 'employees:update', 'employees:delete',
        'payroll:read', 'payroll:write', 'payroll:confirm',
        'accounting:read', 'accounting:write',
        'recruitment:read', 'recruitment:write',
        'attendance:read', 'attendance:write',
        'performance:read', 'performance:write'
    ],
    [ROLES.HR]: [
        'employees:create', 'employees:read', 'employees:update',
        'attendance:read', 'attendance:write',
        'recruitment:read', 'recruitment:write',
        'performance:read', 'performance:write',
        'payroll:read'
    ],
    [ROLES.ACCOUNTING]: [
        'payroll:read', 'payroll:write', 'payroll:confirm',
        'accounting:read', 'accounting:write',
        'advances:read', 'advances:write',
        'benefits:read', 'benefits:write'
    ],
    [ROLES.MANAGER]: [
        'team:read', 'team:attendance', 'team:absences:approve', 'team:goals:manage'
    ],
    [ROLES.EMPLOYEE]: [
        'self:read', 'self:attendance', 'self:absences:request', 'self:payroll:read', 'self:goals:read'
    ]
});

/**
 * Helper para verificar si un rol es válido en el sistema
 */
export const isValidRole = (role) => {
    if (!role || typeof role !== 'string') return false;
    return ALL_ROLES.includes(role.toLowerCase());
};

/**
 * Helper para verificar si un rol es estrictamente de nivel Tenant
 */
export const isTenantRole = (role) => {
    if (!role || typeof role !== 'string') return false;
    return TENANT_ROLES.includes(role.toLowerCase());
};

/**
 * Helper para verificar si un rol es SuperAdmin Global
 */
export const isSuperAdminRole = (role) => {
    if (!role || typeof role !== 'string') return false;
    return role.toLowerCase() === ROLES.SUPERADMIN;
};
