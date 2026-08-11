/**
 * Constantes de Roles y Utilidades RBAC para el Frontend.
 */

export const ROLES = Object.freeze({
    SUPERADMIN: 'superadmin',  // Administrador Global SaaS
    ADMIN: 'admin',            // Administrador de Empresa (Tenant Admin)
    HR: 'hr',                  // Recursos Humanos del Tenant
    ACCOUNTING: 'accounting',  // Contabilidad y Finanzas del Tenant
    MANAGER: 'manager',        // Supervisor / Jefe de Departamento
    EMPLOYEE: 'employee'       // Empleado (Autogestión Portal)
});

export const isSuperAdmin = (user) => {
    if (!user) return false;
    const role = (user.role || '').toLowerCase();
    return role === ROLES.SUPERADMIN;
};

export const isTenantAdmin = (user) => {
    if (!user) return false;
    const role = (user.role || '').toLowerCase();
    return role === ROLES.ADMIN;
};

export const isHR = (user) => {
    if (!user) return false;
    const role = (user.role || '').toLowerCase();
    return role === ROLES.HR;
};

export const isAccounting = (user) => {
    if (!user) return false;
    const role = (user.role || '').toLowerCase();
    return role === ROLES.ACCOUNTING;
};

export const isEmployee = (user) => {
    if (!user) return false;
    const role = (user.role || '').toLowerCase();
    return role === ROLES.EMPLOYEE;
};

export const canManageEmployees = (user) => {
    if (!user) return false;
    const role = (user.role || '').toLowerCase();
    return [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.HR].includes(role);
};

export const canManagePayroll = (user) => {
    if (!user) return false;
    const role = (user.role || '').toLowerCase();
    return [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.ACCOUNTING, ROLES.HR].includes(role);
};

export const canManageAccounting = (user) => {
    if (!user) return false;
    const role = (user.role || '').toLowerCase();
    return [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.ACCOUNTING].includes(role);
};

export const canAccessIntelligence = (user) => {
    if (!user) return false;
    const role = (user.role || '').toLowerCase();
    return [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.HR, ROLES.ACCOUNTING].includes(role);
};

export const canManageRecruitment = (user) => {
    if (!user) return false;
    const role = (user.role || '').toLowerCase();
    return [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.HR].includes(role);
};

export const getRoleLabel = (user) => {
    if (!user) return 'Usuario';
    const role = (user.role || '').toLowerCase();
    switch (role) {
        case ROLES.SUPERADMIN:
            return 'SuperAdmin SaaS';
        case ROLES.ADMIN:
            return 'Administrador de Empresa';
        case ROLES.HR:
            return 'Recursos Humanos';
        case ROLES.ACCOUNTING:
            return 'Contabilidad y Finanzas';
        case ROLES.MANAGER:
            return 'Supervisor de Equipo';
        case ROLES.EMPLOYEE:
            return 'Empleado / Personal';
        default:
            return 'Empleado / Personal';
    }
};
