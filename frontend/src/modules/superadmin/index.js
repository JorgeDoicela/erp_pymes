/**
 * @file index.js
 * @description Módulo de Administración Multi-Tenant, Auditoría de Empresas y Credenciales
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

export { default as SuperAdminDashboard } from './pages/SuperAdminDashboard.jsx';

export { default as SuperAdminOverview } from './components/SuperAdminOverview.jsx';
export { default as SuperAdminMetricsView } from './components/SuperAdminMetricsView.jsx';
export { default as SuperAdminAuditView } from './components/SuperAdminAuditView.jsx';
export { default as SuperAdminCreateTenantModal } from './components/SuperAdminCreateTenantModal.jsx';
export { default as TenantDetailDrawer } from './components/TenantDetailDrawer.jsx';

export { default as systemService } from './services/systemService.js';
export * from './services/systemService.js';
