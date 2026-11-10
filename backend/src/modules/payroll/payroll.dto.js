/**
 * @file payroll.dto.js
 * @description Esquemas de validación Zod (DTOs) para nómina y configuraciones laborales (RNF-15).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { z } from 'zod';
import { positiveMoneySchema } from '../../dto/common/validators.js';

/**
 * Esquema para Generación de Nómina (POST /api/payroll/generate)
 */
export const generatePayrollDto = z.object({
  month: z.coerce
    .number({ required_error: 'El mes es obligatorio' })
    .int('El mes debe ser un número entero')
    .min(1, 'El mes debe estar entre 1 y 12')
    .max(12, 'El mes debe estar entre 1 y 12'),
  year: z.coerce
    .number({ required_error: 'El año es obligatorio' })
    .int('El año debe ser un número entero')
    .min(2020, 'El año debe ser igual o superior a 2020')
    .max(2100, 'Año fuera de rango'),
});

/**
 * Esquema para Configuración Legal de Nómina (POST /api/payroll/config)
 */
export const createPayrollConfigDto = z.object({
  sbu: positiveMoneySchema,
  iessPersonal: z.coerce.number().min(0, 'No puede ser negativo').max(100, 'Porcentaje inválido'),
  iessPatronal: z.coerce.number().min(0, 'No puede ser negativo').max(100, 'Porcentaje inválido'),
  reserveFundPercentage: z.coerce.number().min(0).max(100).default(8.33),
  nightSurcharge: z.coerce.number().min(0).max(100).default(25),
  specialOvertime: z.coerce.number().min(0).max(100).default(50),
  doubleOvertime: z.coerce.number().min(0).max(100).default(100),
});
