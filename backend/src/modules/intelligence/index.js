/**
 * @file index.js
 * @description Módulo de Inteligencia Artificial, People Analytics y Emprendimiento (Pure Nested Vertical Slices).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import intelligenceRouter from './predictive/intelligence.routes.js';
import analyticsRouter from './analytics/analytics.routes.js';
import entrepreneurshipRouter from './entrepreneurship/entrepreneurship.routes.js';
import * as intelligenceController from './predictive/intelligence.controller.js';
import * as analyticsController from './analytics/analytics.controller.js';
import * as entrepreneurshipController from './entrepreneurship/entrepreneurship.controller.js';
import * as capTableController from './entrepreneurship/capTable.controller.js';
import * as validationController from './entrepreneurship/validation.controller.js';
import * as entrepreneurshipIntelligenceController from './entrepreneurship/entrepreneurshipIntelligence.controller.js';
import * as intelligenceService from './predictive/intelligence.service.js';
import * as entrepreneurshipIntelligenceService from './entrepreneurship/entrepreneurshipIntelligence.service.js';
import analyticsService, { AnalyticsService } from './analytics/analytics.service.js';
import entrepreneurshipRepository, {
  EntrepreneurshipRepository,
} from './entrepreneurship/entrepreneurship.repository.js';
import causalInferenceService from './predictive/causalInference.service.js';
import federatedLearningService from './predictive/federatedLearning.service.js';
import ftTransformerService from './predictive/ftTransformer.service.js';
import morlOptimizationService from './predictive/morlOptimization.service.js';
import rsiService from './predictive/rsi.service.js';
import temporalAttentionService from './predictive/temporalAttention.service.js';

export {
  intelligenceRouter as intelligenceRoutes,
  analyticsRouter as analyticsRoutes,
  entrepreneurshipRouter as entrepreneurshipRoutes,
  intelligenceController,
  analyticsController,
  entrepreneurshipController,
  capTableController,
  validationController,
  entrepreneurshipIntelligenceController,
  intelligenceService,
  entrepreneurshipIntelligenceService,
  analyticsService,
  AnalyticsService,
  entrepreneurshipRepository,
  EntrepreneurshipRepository,
  causalInferenceService,
  federatedLearningService,
  ftTransformerService,
  morlOptimizationService,
  rsiService,
  temporalAttentionService,
};

export * from './predictive/rdpAccountant.js';
export * from './predictive/intelligence.service.js';

export default intelligenceRouter;
