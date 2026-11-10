/**
 * @file index.js
 * @description Módulo de Nómina de Norma ERP (Monolito Modular / Hexagonal).
 * Agrupa rutas, controladores, servicios, repositorios y DTOs del dominio de nómina.
 */

import router from '../../routes/payroll/payrollConfig.routes.js';
import payrollRepository from '../../repositories/payroll/payrollRepository.js';
import payrollController from '../../controllers/payroll/payrollController.js';
import payrollConfigController from '../../controllers/payroll/payrollConfigController.js';
import payrollCalculationService from '../../services/payroll/payrollCalculationService.js';
import payrollConfigService from '../../services/payroll/payrollConfigService.js';
import * as payrollDto from '../../dto/payroll/payroll.dto.js';

export {
  router as payrollRoutes,
  payrollRepository,
  payrollController,
  payrollConfigController,
  payrollCalculationService,
  payrollConfigService,
  payrollDto,
};

export default router;
