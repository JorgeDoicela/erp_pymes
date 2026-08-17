import { Router } from 'express';
import * as researchController from '../controllers/researchController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Rutas del Módulo de Investigación Científica (Emplifi)
 */

// --- RUTAS PÚBLICAS ---
// Registrar respuesta de encuesta (Línea Base Pre, Post UAT, Evaluación Expertos)
router.post('/submit', researchController.submitSurvey);

// Resultados estadísticos en tiempo real, Alfa de Cronbach y métricas agregadas
router.get('/results', researchController.getResults);

// Exportar dataset completo anonimizado en CSV
router.get('/export/csv', researchController.exportCsv);

// --- RUTAS RESTRINGIDAS A ADMINISTRADORES ---
// Sembrado sintético de datos con IA / Monte Carlo (Requiere sesión activa de Administrador)
router.post('/seed', authenticate, researchController.seedSynthetic);

// Limpiar datos sintéticos previa simulación
router.delete('/responses/synthetic', authenticate, researchController.deleteSynthetic);

export default router;
