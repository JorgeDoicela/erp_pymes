/**
 * @file index.js
 * @description Registro central y barrel export de todos los seeds de Norma ERP.
 * Organizado por Bounded Contexts y fases de ingesta.
 */

export * from './common/cleanup.js';
export * from './common/utils.js';
export * from './tenants/users.js';
export * from './employees/core_records.js';
export * from './employees/documents.js';
export * from './employees/offboarding.js';
export * from './recruitment/recruitment.js';
export * from './performance/goals.js';
export * from './performance/performance.js';
export * from './performance/climate.js';
export * from './payroll/benefits.js';
export * from './payroll/payroll_config.js';
export * from './payroll/payroll.js';
export * from './attendance/attendance.js';
export * from './attendance/absences.js';
export * from './communication/audit.js';
export * from './communication/announcements.js';
export * from './communication/notifications.js';
export * from './accounting/accounting.js';
export * from './entrepreneurship/entrepreneurship.js';
export * from './intelligence/research_data.js';
export * from './intelligence/sustainability.js';
