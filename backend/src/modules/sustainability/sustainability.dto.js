/**
 * @file sustainability.dto.js
 * @description Esquemas de validación Zod para el dominio de Sostenibilidad ODS 8, Asistente RAG Multi-Lugar,
 * Evaluador Jurídico y Adaptador Universal de Modelos (DeepSeek, OpenAI, Gemini, Local Fine-Tuned).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { z } from 'zod';

export const AdvisorQuerySchema = z.object({
  query: z
    .string()
    .min(3, 'La consulta debe tener al menos 3 caracteres')
    .max(2000, 'La consulta no puede superar 2000 caracteres'),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
  stream: z.boolean().optional().default(false),
  odsTargetFilter: z.enum(['8.3', '8.5', '8.8']).nullable().optional(),
  categoryFilter: z.string().nullable().optional(),
  moduleContext: z
    .enum([
      'payroll',
      'contracts',
      'offboarding',
      'attendance',
      'accounting',
      'employees',
      'performance',
      'recruitment',
      'signatures',
      'compliance',
      'analytics',
      'entrepreneurship',
      'sustainability',
      'whatsapp',
      'general',
    ])
    .nullable()
    .optional()
    .transform((val) => val || 'sustainability'),
  providerOverrides: z
    .object({
      provider: z.string().nullable().optional(),
      model: z.string().nullable().optional(),
      baseUrl: z.string().nullable().optional(),
      apiKey: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export const MetricFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  department: z.string().optional(),
});

export const DocumentIngestSchema = z.object({
  title: z.string().min(3),
  category: z.enum([
    'LABOR_CODE',
    'IESS_REGULATION',
    'MDT_AGREEMENT',
    'ODS_8_FRAMEWORK',
    'INTERNAL_POLICY',
  ]),
  sourceUrl: z.string().url().optional(),
  version: z.string().optional().default('2026'),
  chunks: z
    .array(
      z.object({
        content: z.string().min(10),
        articleCode: z.string().optional(),
        odsTarget: z.enum(['8.3', '8.5', '8.8']).optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .min(1, 'Debe incluir al menos un fragmento para ingestión'),
});

export const FineTuningExportSchema = z.object({
  format: z.enum(['jsonl', 'csv']).optional().default('jsonl'),
  targetModel: z
    .enum(['llama3', 'mistral', 'qwen2.5', 'deepseek', 'openai'])
    .optional()
    .default('qwen2.5'),
  includeTenantData: z.boolean().optional().default(false),
  includeFullPdfCorpus: z.boolean().optional().default(false),
  categories: z.array(z.string()).optional(),
});
