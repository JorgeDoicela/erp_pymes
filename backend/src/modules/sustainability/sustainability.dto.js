/**
 * @file sustainability.dto.js
 * @description Esquemas de validación Zod para el dominio de Sostenibilidad ODS 8 y Asistente RAG
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { z } from 'zod';

export const AdvisorQuerySchema = z.object({
  query: z.string().min(3, 'La consulta debe tener al menos 3 caracteres').max(1500, 'La consulta no puede superar 1500 caracteres'),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ).optional().default([]),
  stream: z.boolean().optional().default(false),
  odsTargetFilter: z.enum(['8.3', '8.5', '8.8']).optional(),
  departmentFilter: z.string().optional(),
});

export const MetricFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  department: z.string().optional(),
});

export const DocumentIngestSchema = z.object({
  title: z.string().min(3),
  category: z.enum(['LABOR_CODE', 'IESS_REGULATION', 'MDT_AGREEMENT', 'ODS_8_FRAMEWORK', 'INTERNAL_POLICY']),
  sourceUrl: z.string().url().optional(),
  version: z.string().optional().default('2026'),
  chunks: z.array(
    z.object({
      content: z.string().min(10),
      articleCode: z.string().optional(),
      odsTarget: z.enum(['8.3', '8.5', '8.8']).optional(),
      metadata: z.record(z.any()).optional(),
    })
  ).min(1, 'Debe incluir al menos un fragmento para ingestión'),
});

export const FineTuningExportSchema = z.object({
  format: z.enum(['jsonl', 'csv']).optional().default('jsonl'),
  targetModel: z.enum(['llama3', 'mistral', 'qwen2.5', 'openai']).optional().default('llama3'),
  includeTenantData: z.boolean().optional().default(false), // Por defecto false para preservar privacidad
  categories: z.array(z.string()).optional(),
});
