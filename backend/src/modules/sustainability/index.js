/**
 * @file index.js
 * @description Registro público del Bounded Context de Sostenibilidad ODS 8, Asistente RAG Multi-Lugar,
 * Evaluador Jurídico y Adaptador Universal de Inferencia (DeepSeek / OpenAI / Gemini / Local GGUF).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

export { default as sustainabilityRoutes } from './sustainability.routes.js';
export { default as sustainabilityService } from './sustainability.service.js';
export { default as sustainabilityRagService } from './sustainabilityRag.service.js';
export { default as sustainabilityFineTuningService } from './sustainabilityFineTuning.service.js';
export { default as sustainabilityRepository } from './sustainability.repository.js';
export { default as llmProviderService } from './llmProvider.service.js';
export { default as legalEvaluatorService } from './legalEvaluator.service.js';
export { default as ragEvaluationService } from './ragEvaluation.service.js';
export {
  ECUADOR_LEGAL_DOMAIN_SIGNALS,
  NON_LABOR_EXCLUSION_PATTERNS,
} from './data/ecuadorLegalSynonyms.js';
export * from './sustainability.controller.js';
export * from './sustainability.dto.js';
