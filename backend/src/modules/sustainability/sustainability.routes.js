/**
 * @file sustainability.routes.js
 * @description Rutas HTTP para el dominio de Sostenibilidad ODS 8 y Asistente RAG Ecuatoriano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import { authenticate, authorize } from '../auth/auth.middleware.js';
import * as sustainabilityController from './sustainability.controller.js';

const router = Router();

// Todas las rutas requieren usuario autenticado
router.use(authenticate);

// 1. Métricas e Indicadores de Cumplimiento ODS 8 (Exclusivo para roles del tenant, aislamiento LOPDP)
router.get(
  '/ods8',
  authorize(['admin', 'hr', 'accounting', 'manager']),
  sustainabilityController.getOds8Metrics
);

// 2. Consulta al Asistente RAG con Citas de Legislación de Ecuador (Disponible para todos los roles autenticados)
router.post(
  '/advisor/query',
  authorize(['admin', 'hr', 'accounting', 'manager', 'employee', 'entrepreneur', 'superadmin']),
  sustainabilityController.queryAdvisor
);

// 3. Ingestión de Conocimiento Legal y Políticas
router.post(
  '/knowledge/ingest',
  authorize(['admin', 'superadmin']),
  sustainabilityController.ingestDocument
);

// 4. Exportación de Dataset para Fine-Tuning de Modelos Grandes
router.post(
  '/fine-tuning/export',
  authorize(['admin', 'superadmin']),
  sustainabilityController.exportFineTuningDataset
);

// 5. Certificación y Evaluación Cuantitativa del Motor RAG (6 métricas Ragas / DeepEval)
router.post(
  '/eval/benchmark',
  authorize(['admin', 'hr', 'accounting', 'manager', 'superadmin']),
  sustainabilityController.runEvaluationBenchmark
);

export default router;
