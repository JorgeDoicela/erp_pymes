/**
 * @file index.js
 * @description Módulo contable de Norma ERP (Monolito Modular / Hexagonal).
 * Agrupa rutas, controladores, repositorios y DTOs del dominio contable.
 */

import router from '../../routes/accounting.routes.js';
import accountingRepository from '../../repositories/accounting/accountingRepository.js';
import * as accountingController from '../../controllers/accounting/accounting.controller.js';
import * as accountingDto from '../../dto/accounting/accounting.dto.js';

export { router as accountingRoutes, accountingRepository, accountingController, accountingDto };

export default router;
