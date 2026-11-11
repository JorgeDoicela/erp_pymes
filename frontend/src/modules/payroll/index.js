/**
 * @file index.js
 * @description Módulo de Nómina, Liquidaciones, Anticipos y Beneficios Sociales
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

// Páginas
export { default as PayrollConfiguration } from './pages/PayrollConfiguration.jsx';
export { default as PayrollGenerator } from './pages/PayrollGenerator.jsx';
export { default as BenefitsManagement } from './pages/BenefitsManagement.jsx';
export { default as MyPayments } from './pages/MyPayments.jsx';
export { default as SalaryAdvancesManagement } from './pages/SalaryAdvancesManagement.jsx';
export { default as MySalaryAdvances } from './pages/MySalaryAdvances.jsx';

// Componentes
export * from './components/benefits';
export * from './components/config';
export { default as ConfirmActionModal } from './components/ConfirmActionModal.jsx';
export { default as EditPayrollDetailModal } from './components/EditPayrollDetailModal.jsx';
export { default as GeneratePayrollModal } from './components/GeneratePayrollModal.jsx';
export { default as PayrollDetailsTable } from './components/PayrollDetailsTable.jsx';

// Servicios
export { default as payrollConfigService } from './services/payrollConfig.service.js';
export * from './services/payrollConfig.service.js';
export * as benefitsService from './services/benefits.service.js';
export * from './services/benefits.service.js';
export * as salaryAdvanceService from './services/salaryAdvance.service.js';
export * from './services/salaryAdvance.service.js';

// Utils
export * from './utils/generatePayslipPDF.js';
export * from './utils/generateSettlementPDF.js';
