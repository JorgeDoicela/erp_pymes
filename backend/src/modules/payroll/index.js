/**
 * @file index.js
 * @description Módulo de Nómina de Norma ERP (Pure Nested Vertical Slices).
 * Expone la API pública, rutas, controladores, servicios, repositorio y DTOs del dominio de nómina.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import router from './calculation/payroll.routes.js';
import benefitsRoutes from './benefits/benefits.routes.js';
import salaryAdvanceRoutes from './advances/salaryAdvance.routes.js';

import payrollRepository, { PayrollRepository } from './calculation/payroll.repository.js';
import payrollController, { PayrollController } from './calculation/payroll.controller.js';
import payrollConfigController, {
  PayrollConfigController,
} from './config/payrollConfig.controller.js';
import employeeBenefitController from './benefits/employeeBenefit.controller.js';
import * as salaryAdvanceController from './advances/salaryAdvance.controller.js';

import payrollCalculationService from './calculation/payrollCalculation.service.js';
import payrollConfigService from './config/payrollConfig.service.js';
import employeeBenefitService from './benefits/employeeBenefit.service.js';
import salaryAdvanceService from './advances/salaryAdvance.service.js';
import { checkPayrollReminders, initPayrollCronJob } from './calculation/payroll.jobs.js';

import * as payrollDto from './calculation/payroll.dto.js';

export {
  router as payrollRoutes,
  benefitsRoutes,
  salaryAdvanceRoutes,
  payrollRepository,
  PayrollRepository,
  payrollController,
  PayrollController,
  payrollConfigController,
  PayrollConfigController,
  employeeBenefitController,
  salaryAdvanceController,
  payrollCalculationService,
  payrollConfigService,
  employeeBenefitService,
  salaryAdvanceService,
  payrollDto,
  checkPayrollReminders,
  initPayrollCronJob,
};

export * from './calculation/payroll.dto.js';

export default router;
