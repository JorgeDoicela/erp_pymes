/**
 * @file index.js
 * @description Módulo de Inteligencia Artificial, People Analytics y Emprendimiento (Vertical Slice Bounded Context).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import intelligenceRouter from './intelligence.routes.js';
import analyticsRouter from './analytics.routes.js';
import entrepreneurshipRouter from './entrepreneurship.routes.js';
import * as intelligenceController from './intelligence.controller.js';
import * as analyticsController from './analytics.controller.js';
import * as entrepreneurshipController from './entrepreneurship.controller.js';
import * as capTableController from './capTable.controller.js';
import * as validationController from './validation.controller.js';
import * as entrepreneurshipIntelligenceController from './entrepreneurshipIntelligence.controller.js';
import * as intelligenceService from './intelligence.service.js';
import * as entrepreneurshipIntelligenceService from './entrepreneurshipIntelligence.service.js';
import analyticsService, { AnalyticsService } from './analytics.service.js';
import entrepreneurshipRepository, {
  EntrepreneurshipRepository,
} from './entrepreneurship.repository.js';
import causalInferenceService from './causalInference.service.js';
import federatedLearningService from './federatedLearning.service.js';
import ftTransformerService from './ftTransformer.service.js';
import morlOptimizationService from './morlOptimization.service.js';
import rsiService from './rsi.service.js';
import temporalAttentionService from './temporalAttention.service.js';

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

export default intelligenceRouter;

