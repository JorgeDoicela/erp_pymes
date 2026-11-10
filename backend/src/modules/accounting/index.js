/**
 * @file index.js
 * @description Módulo Contable de Norma ERP (Vertical Slice Bounded Context).
 * Expone la API pública, rutas, controlador, servicio, repositorio y DTOs del dominio contable.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import router from './accounting.routes.js';
import accountingRepository, { AccountingRepository } from './accounting.repository.js';
import * as accountingController from './accounting.controller.js';
import accountingService, { AccountingService } from './accounting.service.js';
import * as accountingDto from './accounting.dto.js';

export {
  router as accountingRoutes,
  accountingRepository,
  AccountingRepository,
  accountingController,
  accountingService,
  AccountingService,
  accountingDto,
};

export default router;
