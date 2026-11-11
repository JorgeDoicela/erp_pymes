/**
 * @file index.js
 * @description Módulo de Contabilidad Empresarial, Plan de Cuentas y Asientos Diarios
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

// Páginas
export { default as AccountingDashboard } from './pages/AccountingDashboard.jsx';
export { default as ChartOfAccounts } from './pages/ChartOfAccounts.jsx';
export { default as JournalEntries } from './pages/JournalEntries.jsx';
export { default as CostCenterManagement } from './pages/CostCenterManagement.jsx';
export { default as TrialBalance } from './pages/TrialBalance.jsx';
export { default as PeriodsManagement } from './pages/PeriodsManagement.jsx';

// Servicios
export { default as accountingService } from './services/accounting.service.js';
export * from './services/accounting.service.js';
