import * as researchService from '../services/researchService.js';

/**
 * Controlador para el Módulo de Investigación Científica
 */

/**
 * POST /api/research/submit
 * Registrar una respuesta de encuesta (Público)
 */
export async function submitSurvey(req, res) {
    try {
        const reqInfo = {
            ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        };

        const result = await researchService.submitSurveyResponse(req.body, reqInfo);
        res.status(201).json({
            success: true,
            message: 'Respuesta registrada correctamente en el estudio científico.',
            data: { id: result.id, createdAt: result.createdAt }
        });
    } catch (error) {
        console.error('[Research] Error al registrar encuesta:', error.message);
        res.status(400).json({ success: false, message: error.message });
    }
}

/**
 * GET /api/research/results
 * Obtener estadísticas y resultados agregados en tiempo real (Público)
 */
export async function getResults(req, res) {
    try {
        const includeSynthetic = req.query.includeSynthetic !== 'false';
        const surveyType = req.query.surveyType || null;

        const results = await researchService.getResearchResults({ includeSynthetic, surveyType });
        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('[Research] Error al obtener resultados:', error.message);
        res.status(500).json({ success: false, message: 'Error interno al procesar los resultados analíticos.' });
    }
}

/**
 * POST /api/research/seed
 * Sembrar respuestas sintéticas (RESTRINGIDO A ADMINISTRADORES)
 */
export async function seedSynthetic(req, res) {
    try {
        const count = parseInt(req.body.count || '30', 10);
        const surveyType = req.body.surveyType || 'POST_SYSTEM';

        // Verificación estricta de autorización
        // req.user es inyectado por el middleware authenticate (o superAdmin)
        if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo los administradores autenticados del sistema pueden ejecutar el sembrado sintético de datos.'
            });
        }

        const result = await researchService.seedSyntheticResponses(count, surveyType);
        res.json(result);
    } catch (error) {
        console.error('[Research] Error en sembrado sintético:', error.message);
        res.status(400).json({ success: false, message: error.message });
    }
}

/**
 * DELETE /api/research/responses/synthetic
 * Eliminar datos sintéticos (RESTRINGIDO A ADMINISTRADORES)
 */
export async function deleteSynthetic(req, res) {
    try {
        if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Se requieren permisos de administrador.'
            });
        }

        const surveyType = req.query.surveyType || null;
        const result = await researchService.deleteSyntheticResponses(surveyType);
        res.json(result);
    } catch (error) {
        console.error('[Research] Error al eliminar sintéticos:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * GET /api/research/export/csv
 * Exportar dataset anonimizado en CSV (Público)
 */
export async function exportCsv(req, res) {
    try {
        const includeSynthetic = req.query.includeSynthetic !== 'false';
        const csvContent = await researchService.exportDatasetCsv(includeSynthetic);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="emplifi_research_dataset_${Date.now()}.csv"`);
        res.status(200).send(csvContent);
    } catch (error) {
        console.error('[Research] Error al exportar CSV:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}
