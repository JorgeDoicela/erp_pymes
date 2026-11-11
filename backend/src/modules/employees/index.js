/**
 * @file index.js
 * @description Módulo de Empleados y Talento Humano (Pure Nested Vertical Slices).
 * Expone la API pública, rutas, controlador, servicio, repositorio, submódulos de activos,
 * expedientes digitales, offboarding y DTOs del dominio de empleados.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import router from './directory/employee.routes.js';
import onboardingOffboardingRoutes from './lifecycle/onboardingOffboarding.routes.js';
import employeeRepository, { EmployeeRepository } from './directory/employee.repository.js';
import employeeController, { EmployeeController } from './directory/employee.controller.js';
import employeeService, { EmployeeService } from './directory/employee.service.js';
import assetService, { AssetService } from './records/asset.service.js';
import expedientService, { ExpedientService } from './records/expedient.service.js';
import offboardingService, { OffboardingService } from './lifecycle/offboarding.service.js';
import onboardingOffboardingController from './lifecycle/onboardingOffboarding.controller.js';
import * as employeeDto from './directory/employee.dto.js';

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

export * from './directory/employee.dto.js';

export default router;
