/**
 * @file index.js
 * @description Módulo de Cumplimiento Legal y Beneficios Estatutarios (Pure Nested Vertical Slices).
 * Expone la API pública, rutas, controlador y servicios de auditoría y provisiones sociales Ecuador.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import router from './labor/compliance.routes.js';
import complianceController, {
  getComplianceAlerts,
  getStatutoryProvisions,
} from './labor/compliance.controller.js';
import complianceService, { ComplianceService } from './labor/compliance.service.js';
import statutoryBenefitsService, {
  StatutoryBenefitsService,
} from './statutory/statutoryBenefits.service.js';
import complianceRepository, { ComplianceRepository } from './labor/compliance.repository.js';

export {
  router as complianceRoutes,
  complianceController,
  getComplianceAlerts,
  getStatutoryProvisions,
  complianceService,
  ComplianceService,
  statutoryBenefitsService,
  StatutoryBenefitsService,
  complianceRepository,
  ComplianceRepository,
};

export default router;
