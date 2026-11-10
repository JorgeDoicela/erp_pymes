/**
 * @file index.js
 * @description Módulo de Cumplimiento Legal y Beneficios Estatutarios (Vertical Slice Bounded Context).
 * Expone la API pública, rutas, controlador y servicios de auditoría y provisiones sociales Ecuador.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import router from './compliance.routes.js';
import complianceController, { getComplianceAlerts, getStatutoryProvisions } from './compliance.controller.js';
import complianceService, { ComplianceService } from './compliance.service.js';
import statutoryBenefitsService, { StatutoryBenefitsService } from './statutoryBenefits.service.js';

export {
  router as complianceRoutes,
  complianceController,
  getComplianceAlerts,
  getStatutoryProvisions,
  complianceService,
  ComplianceService,
  statutoryBenefitsService,
  StatutoryBenefitsService,
};

export default router;
