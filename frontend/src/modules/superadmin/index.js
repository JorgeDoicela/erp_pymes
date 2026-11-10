/**
 * @file index.js
 * @description Módulo de Administración Multi-Tenant, Auditoría de Empresas y Credenciales
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

export { default as SuperAdminDashboard } from './pages/SuperAdminDashboard.jsx';
export { default as AdminSettings } from './pages/AdminSettings.jsx';

export { default as CompanyFormModal } from './components/CompanyFormModal.jsx';
export { default as TenantAuditModal } from './components/TenantAuditModal.jsx';
export { default as TenantCredentialsModal } from './components/TenantCredentialsModal.jsx';

export { default as systemService } from './services/systemService.js';
