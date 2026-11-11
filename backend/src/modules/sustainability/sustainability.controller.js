/**
 * @file sustainability.controller.js
 * @description Controlador HTTP para el dominio de Sostenibilidad ODS 8, Asistente RAG y Exportador de Fine-Tuning
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import sustainabilityService from './sustainability.service.js';
import sustainabilityRagService from './sustainabilityRag.service.js';
import sustainabilityFineTuningService from './sustainabilityFineTuning.service.js';
import sustainabilityRepository from './sustainability.repository.js';
import { AdvisorQuerySchema, DocumentIngestSchema, FineTuningExportSchema } from './sustainability.dto.js';

/**
 * GET /api/sustainability/ods8
 * Obtiene el reporte y estado de cumplimiento de los indicadores del ODS 8
 */
export async function getOds8Metrics(req, res) {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    const metrics = await sustainabilityService.calculateOds8Metrics(tenantId);
    return res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al calcular indicadores de sostenibilidad ODS 8',
      error: error.message,
    });
  }
}

/**
 * POST /api/sustainability/advisor/query
 * Realiza una consulta al Asistente RAG con citación legal de Ecuador y ODS 8
 */
export async function queryAdvisor(req, res) {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    const validation = AdvisorQuerySchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros de consulta inválidos',
        errors: validation.error.format(),
      });
    }

    const { query, conversationHistory, odsTargetFilter } = validation.data;
    const result = await sustainabilityRagService.processQuery({
      query,
      conversationHistory,
      tenantId,
      odsTargetFilter,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al procesar consulta en el asistente de sostenibilidad',
      error: error.message,
    });
  }
}

/**
 * POST /api/sustainability/knowledge/ingest
 * Ingesta un nuevo documento o reglamento en la base de datos de conocimiento
 */
export async function ingestDocument(req, res) {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    const validation = DocumentIngestSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Estructura del documento inválida',
        errors: validation.error.format(),
      });
    }

    const document = await sustainabilityRepository.ingestDocument(validation.data, tenantId);
    return res.status(201).json({
      success: true,
      data: document,
      message: 'Documento legal indexado exitosamente para el motor RAG',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al indexar documento legal',
      error: error.message,
    });
  }
}

/**
 * POST /api/sustainability/fine-tuning/export
 * Genera el dataset JSONL para entrenamiento / fine-tuning de un modelo LLM grande
 */
export async function exportFineTuningDataset(req, res) {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    const validation = FineTuningExportSchema.safeParse(req.body || {});

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Opciones de exportación inválidas',
        errors: validation.error.format(),
      });
    }

    const { targetModel, includeTenantData, categories } = validation.data;
    const dataset = await sustainabilityFineTuningService.generateDataset({
      targetModel,
      includeTenantData,
      tenantId,
      categories,
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="fine_tuning_ecuador_ods8_${targetModel}.jsonl"`);

    return res.json({
      success: true,
      data: dataset,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al exportar dataset de fine-tuning',
      error: error.message,
    });
  }
}
