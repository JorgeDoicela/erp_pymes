/**
 * @file index.js
 * @description Módulo de Reportes Operativos y Exportación (Vertical Slice Bounded Context).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import reportRouter from './report.routes.js';
import exportRouter from './export.routes.js';
import reportController, { ReportController } from './report.controller.js';
import exportController, { ExportController } from './export.controller.js';
import reportService, { ReportService } from './report.service.js';
import exportService, { ExportService } from './export.service.js';
import reportRepository, { ReportRepository } from './report.repository.js';

export {
  reportRouter as reportRoutes,
  exportRouter as exportRoutes,
  reportController,
  ReportController,
  exportController,
  ExportController,
  reportService,
  ReportService,
  exportService,
  ExportService,
  reportRepository,
  ReportRepository,
};

export default reportRouter;

