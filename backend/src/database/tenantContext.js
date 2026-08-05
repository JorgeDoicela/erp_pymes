import { AsyncLocalStorage } from 'async_hooks';

export const tenantStorage = new AsyncLocalStorage();

/**
 * Ejecuta una función dentro del contexto asíncrono de un Tenant.
 * @param {string} tenantId - ID de la empresa
 * @param {Function} callback - Función a ejecutar
 */
export const runWithTenant = (tenantId, callback, isSuperAdmin = false) => {
    return tenantStorage.run({ tenantId, isSuperAdmin }, callback);
};

export const getTenantId = () => {
    const store = tenantStorage.getStore();
    return store?.tenantId || null;
};

export const isSuperAdminContext = () => {
    const store = tenantStorage.getStore();
    return store?.isSuperAdmin || false;
};
