/**
 * @file index.js
 * @description Módulo de Evaluación de Desempeño 360 y Objetivos OKR (Pure Nested Vertical Slices).
 * Expone la API pública, rutas, controladores, servicios, repositorios y tareas programadas.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import evaluationRoutes from './evaluations/evaluation.routes.js';
import goalsRoutes from './goals/goals.routes.js';
import * as evaluationController from './evaluations/evaluation.controller.js';
import * as goalsController from './goals/goals.controller.js';
import performanceService, { PerformanceService } from './evaluations/performance.service.js';
import goalsService, { GoalsService } from './goals/goals.service.js';
import performanceRepository, {
  PerformanceRepository,
} from './evaluations/performance.repository.js';
import {
  checkPerformanceReminders,
  initPerformanceCronJob,
} from './evaluations/performance.jobs.js';

export {
  evaluationRoutes,
  goalsRoutes,
  evaluationController,
  goalsController,
  performanceService,
  PerformanceService,
  goalsService,
  GoalsService,
  performanceRepository,
  PerformanceRepository,
  checkPerformanceReminders,
  initPerformanceCronJob,
};

export default {
  evaluationRoutes,
  goalsRoutes,
};
