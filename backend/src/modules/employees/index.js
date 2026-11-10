/**
 * @file index.js
 * @description Módulo de Empleados y Talento Humano (Vertical Slice Bounded Context).
 * Expone la API pública, rutas, controlador, servicio, repositorio, submódulos de activos,
 * expedientes digitales, offboarding y DTOs del dominio de empleados.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import router from './employee.routes.js';
import onboardingOffboardingRoutes from './onboardingOffboarding.routes.js';
import employeeRepository, { EmployeeRepository } from './employee.repository.js';
import employeeController, { EmployeeController } from './employee.controller.js';
import employeeService, { EmployeeService } from './employee.service.js';
import assetService, { AssetService } from './asset.service.js';
import expedientService, { ExpedientService } from './expedient.service.js';
import offboardingService, { OffboardingService } from './offboarding.service.js';
import onboardingOffboardingController from './onboardingOffboarding.controller.js';
import * as employeeDto from './employee.dto.js';

export {
  router as employeeRoutes,
  onboardingOffboardingRoutes,
  employeeRepository,
  EmployeeRepository,
  employeeController,
  EmployeeController,
  employeeService,
  EmployeeService,
  assetService,
  AssetService,
  expedientService,
  ExpedientService,
  offboardingService,
  OffboardingService,
  onboardingOffboardingController,
  employeeDto,
};

export default router;
