/**
 * @file index.js
 * @description Módulo de Gestión Contractual Laboral (Vertical Slice Bounded Context).
 * Expone la API pública, rutas, controlador, servicio, repositorio y tareas programadas.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import router from './contract.routes.js';
import contractController, { ContractController } from './contract.controller.js';
import contractService, { ContractService } from './contract.service.js';
import contractRepository, { ContractRepository } from './contract.repository.js';
import { checkContractExpirations, initContractCronJob } from './contract.jobs.js';

export {
  router as contractRoutes,
  contractController,
  ContractController,
  contractService,
  ContractService,
  contractRepository,
  ContractRepository,
  checkContractExpirations,
  initContractCronJob,
};

export default router;
