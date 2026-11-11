/**
 * @file index.js
 * @description Registro maestro y barrel export de los 20 Bounded Contexts (Vertical Slices) del Frontend.
 * Arquitectura Modular por Dominio (Feature / Domain-Driven Architecture).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

export * as accountingModule from './accounting/index.js';
export * as analyticsModule from './analytics/index.js';
export * as attendanceModule from './attendance/index.js';
export * as auditModule from './audit/index.js';
export * as authModule from './auth/index.js';
export * as communicationModule from './communication/index.js';
export * as complianceModule from './compliance/index.js';
export * as contractsModule from './contracts/index.js';
export * as employeesModule from './employees/index.js';
export * as entrepreneurshipModule from './entrepreneurship/index.js';
export * as helpModule from './help/index.js';
export * as notificationsModule from './notifications/index.js';
export * as payrollModule from './payroll/index.js';
export * as performanceModule from './performance/index.js';
export * as portalModule from './portal/index.js';
export * as recruitmentModule from './recruitment/index.js';
export * as reportsModule from './reports/index.js';
export * as signaturesModule from './signatures/index.js';
export * as superadminModule from './superadmin/index.js';
export * as sustainabilityModule from './sustainability/index.js';
