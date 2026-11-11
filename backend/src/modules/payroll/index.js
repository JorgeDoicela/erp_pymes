/**
 * @file index.js
 * @description Módulo de Nómina de Norma ERP (Vertical Slice Bounded Context).
 * Expone la API pública, rutas, controladores, servicios, repositorio y DTOs del dominio de nómina.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import router from './payroll.routes.js';
import benefitsRoutes from './benefits.routes.js';
import salaryAdvanceRoutes from './salaryAdvance.routes.js';

import payrollRepository, { PayrollRepository } from './payroll.repository.js';
import payrollController, { PayrollController } from './payroll.controller.js';
import payrollConfigController, { PayrollConfigController } from './payrollConfig.controller.js';
import employeeBenefitController from './employeeBenefit.controller.js';
import * as salaryAdvanceController from './salaryAdvance.controller.js';

import payrollCalculationService from './payrollCalculation.service.js';
import payrollConfigService from './payrollConfig.service.js';
import employeeBenefitService from './employeeBenefit.service.js';
import salaryAdvanceService from './salaryAdvance.service.js';
import { checkPayrollReminders, initPayrollCronJob } from './payroll.jobs.js';

import * as payrollDto from './payroll.dto.js';

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

export default router;
