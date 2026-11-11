/**
 * @file accounting.dto.js
 * @description Esquemas de validación Zod (DTOs) para el módulo contable y asientos (RNF-15).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { z } from 'zod';
import { nonNegativeMoneySchema } from '../../core/validators.js';

export const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

/**
 * Esquema para Creación de Periodo Contable (POST /api/accounting/periods)
 */
export const createPeriodDto = z.object({
  year: z.coerce.number().int().min(2000, 'Año inválido').max(2100, 'Año fuera de rango'),
  month: z.coerce
    .number()
    .int()
    .min(1, 'Mes debe ser entre 1 y 12')
    .max(12, 'Mes debe ser entre 1 y 12'),
  startDate: z.string({ required_error: 'Fecha de inicio requerida' }),
  endDate: z.string({ required_error: 'Fecha de fin requerida' }),
});

/**
 * Esquema para Catálogo de Cuentas (POST /api/accounting/accounts)
 */
export const createAccountDto = z.object({
  code: z
    .string({ required_error: 'El código contable es obligatorio' })
    .trim()
    .min(1, 'El código contable no puede estar vacío'),
  name: z
    .string({ required_error: 'El nombre de la cuenta es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().trim().optional().or(z.literal('')),
  type: z.enum(ACCOUNT_TYPES, {
    errorMap: () => ({
      message: 'Tipo de cuenta inválido (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)',
    }),
  }),
  level: z.coerce.number().int().min(1).max(10).default(1),
  isTransactional: z.boolean().default(false),
  parentId: z.string().trim().nullable().optional(),
});

/**
 * Esquema para Centros de Costo (POST /api/accounting/cost-centers)
 */
export const createCostCenterDto = z.object({
  code: z
    .string({ required_error: 'El código es obligatorio' })
    .trim()
    .min(1, 'El código no puede estar vacío'),
  name: z
    .string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().trim().optional().or(z.literal('')),
});

/**
 * Línea de Asiento Contable
 */
const journalLineDto = z
  .object({
    accountId: z.string({ required_error: 'El ID de la cuenta es obligatorio' }).min(1),
    debit: nonNegativeMoneySchema,
    credit: nonNegativeMoneySchema,
    description: z.string().trim().optional().or(z.literal('')),
    costCenterId: z.string().trim().nullable().optional(),
  })
  .refine((data) => !(data.debit > 0 && data.credit > 0), {
    message: 'Una misma línea no puede tener valores en DEBE y HABER simultáneamente',
  })
  .refine((data) => data.debit > 0 || data.credit > 0, {
    message: 'La línea debe contener un monto mayor a 0 en DEBE o en HABER',
  });

/**
 * Esquema para Asientos Contables (POST /api/accounting/journals)
 */
export const createJournalEntryDto = z.object({
  entryNumber: z.string().trim().optional(),
  date: z.string({ required_error: 'La fecha del asiento es requerida' }),
  description: z
    .string({ required_error: 'El concepto o descripción del asiento es obligatorio' })
    .trim()
    .min(3, 'La descripción debe tener al menos 3 caracteres'),
  type: z.string().trim().default('DAILY'),
  lines: z
    .array(journalLineDto, { required_error: 'Las líneas del asiento son requeridas' })
    .min(2, 'Un asiento contable debe contener al menos 2 líneas de movimiento'),
  referenceModule: z.string().trim().optional(),
  referenceId: z.string().trim().optional(),
});
