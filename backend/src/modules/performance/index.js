/**
 * @file index.js
 * @description Módulo de Evaluación de Desempeño 360 y Objetivos OKR (Vertical Slice Bounded Context).
 * Expone la API pública, rutas, controladores, servicios y tareas programadas.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import evaluationRoutes from './evaluation.routes.js';
import goalsRoutes from './goals.routes.js';
import * as evaluationController from './evaluation.controller.js';
import * as goalsController from './goals.controller.js';
import performanceService, { PerformanceService } from './performance.service.js';
import { checkPerformanceReminders, initPerformanceCronJob } from './performance.jobs.js';

export {
  evaluationRoutes,
  goalsRoutes,
  evaluationController,
  goalsController,
  performanceService,
  PerformanceService,
  checkPerformanceReminders,
  initPerformanceCronJob,
};

export default {
  evaluationRoutes,
  goalsRoutes,
};
