/**
 * @file validators.js
 * @description Validadores reutilizables y reglas comunes para esquemas Zod en Ecuador y Norma ERP.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { z } from 'zod';

/**
 * Algoritmo de validación de Cédula de Identidad Ecuatoriana (Módulo 10).
 * @param {string} cedula
 * @returns {boolean}
 */
export const validateCedulaEcuatoriana = (cedula) => {
  if (typeof cedula !== 'string' || cedula.length !== 10) return false;
  if (!/^\d+$/.test(cedula)) return false;

  const province = parseInt(cedula.substring(0, 2), 10);
  if (province < 1 || province > 24) return false;

  const thirdDigit = parseInt(cedula.charAt(2), 10);
  if (thirdDigit >= 6) return false; // Para personas naturales es menor a 6

  const lastDigit = parseInt(cedula.substring(9, 10), 10);
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    let digit = parseInt(cedula.charAt(i), 10);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  const verifier = Math.ceil(sum / 10) * 10 - sum;
  const result = verifier === 10 ? 0 : verifier;

  return result === lastDigit;
};

/**
 * Esquema Zod para Cédula Ecuatoriana
 */
export const cedulaSchema = z
  .string({ required_error: 'La cédula es requerida' })
  .trim()
  .length(10, 'La cédula debe contener exactamente 10 dígitos numéricos')
  .refine(validateCedulaEcuatoriana, {
    message: 'La cédula ingresada no es válida para Ecuador',
  });

/**
 * Esquema Zod para Teléfono Móvil de Ecuador (09XXXXXXXX)
 */
export const phoneEcuadorSchema = z
  .string()
  .trim()
  .regex(/^0\d{9}$/, 'El teléfono debe tener 10 dígitos y empezar con 0');

/**
 * Esquema Zod para montos monetarios positivos
 */
export const positiveMoneySchema = z.coerce
  .number({ required_error: 'El monto es requerido', invalid_type_error: 'Debe ser un número' })
  .positive('El monto debe ser estrictamente mayor a 0');

/**
 * Esquema Zod para montos no negativos (>= 0)
 */
export const nonNegativeMoneySchema = z.coerce
  .number({ invalid_type_error: 'Debe ser un número' })
  .min(0, 'El monto no puede ser negativo')
  .default(0);

/**
 * Esquema Zod para Paginación estándar
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(10),
});
