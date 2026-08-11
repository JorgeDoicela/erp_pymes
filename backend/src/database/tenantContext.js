import { AsyncLocalStorage } from 'async_hooks';

export const tenantStorage = new AsyncLocalStorage();

/**
 * Ejecuta una función dentro del contexto asíncrono de un Tenant.
 * @param {string} tenantId - ID de la empresa
 * @param {Function} callback - Función a ejecutar
 * @param {boolean} isSuperAdmin - Indica si es un SuperAdmin
 */
export const runWithTenant = (tenantId, callback, isSuperAdmin = false) => {
    const currentStore = tenantStorage.getStore() || {};
    return tenantStorage.run({ ...currentStore, tenantId, isSuperAdmin, bypassTenantFilter: false }, callback);
};

/**
 * Ejecuta una función deshabilitando temporalmente la interceptación de tenant en Prisma.
 * Esencial para verificaciones internas de existencia/permisos previa a mutaciones sin recursión.
 * @param {Function} callback 
 */
export const runWithoutTenantFilter = (callback) => {
    const currentStore = tenantStorage.getStore() || {};
    return tenantStorage.run({ ...currentStore, bypassTenantFilter: true }, callback);
};

export const getTenantId = () => {
    const store = tenantStorage.getStore();
    return store?.tenantId || null;
};

export const isSuperAdminContext = () => {
    const store = tenantStorage.getStore();
    return store?.isSuperAdmin || false;
};

export const isTenantFilterBypassed = () => {
    const store = tenantStorage.getStore();
    return store?.bypassTenantFilter || false;
};

