/**
 * @file index.js
 * @description Módulo de Gestión de Empleados, Expedientes, Activos y Certificados
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

// Páginas
export { default as RegisterEmployee } from './pages/RegisterEmployee.jsx';
export { default as EmployeeList } from './pages/EmployeeList.jsx';
export { default as EmployeeProfile } from './pages/EmployeeProfile.jsx';
export { default as EmployeeExpedient } from './pages/EmployeeExpedient.jsx';
export { default as EmployeeAssetsManagement } from './pages/EmployeeAssetsManagement.jsx';
export { default as MyAssets } from './pages/MyAssets.jsx';
export { default as OffboardingManagement } from './pages/OffboardingManagement.jsx';

// Componentes
export { default as DocumentsTab } from './components/DocumentsTab.jsx';
export { default as EmployeeProfileHeader } from './components/EmployeeProfileHeader.jsx';
export { default as JobInfoTab } from './components/JobInfoTab.jsx';
export { default as PersonalInfoTab } from './components/PersonalInfoTab.jsx';
export { default as SuperAdminProfileView } from './components/SuperAdminProfileView.jsx';
export { default as TerminateEmployeeModal } from './components/TerminateEmployeeModal.jsx';
export { default as WorkHistoryTab } from './components/WorkHistoryTab.jsx';
export * from './components/expedient';
export * from './components/assets';

// Servicios
export { default as employeeService } from './services/employee.service.js';
export * from './services/employee.service.js';
export { default as onboardingOffboardingService } from './services/onboardingOffboarding.service.js';
export * from './services/onboardingOffboarding.service.js';

// Hooks & Utils & Constants
export * from './constants/employeeOptions.js';
export * from './hooks/useEmployees.js';
export * from './utils/generateCertificatePDF.js';
