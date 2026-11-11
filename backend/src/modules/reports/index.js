/**
 * @file index.js
 * @description Módulo de Reportes Operativos y Exportación (Pure Nested Vertical Slices).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import reportRouter from './analytics/report.routes.js';
import exportRouter from './exports/export.routes.js';
import reportController, { ReportController } from './analytics/report.controller.js';
import exportController, { ExportController } from './exports/export.controller.js';
import reportService, { ReportService } from './analytics/report.service.js';
import exportService, { ExportService } from './exports/export.service.js';
import reportRepository, { ReportRepository } from './analytics/report.repository.js';

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
