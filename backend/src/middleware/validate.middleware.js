/**
 * @file validate.middleware.js
 * @description Middleware de validación en los bordes con Zod (RNF-15 / Clean Architecture).
 * Valida de forma estricta body, query y params antes de tocar controladores o servicios.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { ZodError } from 'zod';

/**
 * Middleware para validar esquemas Zod en Express.
 * @param {import('zod').ZodSchema | { body?: import('zod').ZodSchema, query?: import('zod').ZodSchema, params?: import('zod').ZodSchema }} schema
 */
export const validate = (schema) => async (req, res, next) => {
  try {
    // Caso 1: Se pasó un esquema directo para el body
    if (schema && typeof schema.parseAsync === 'function') {
      req.body = await schema.parseAsync(req.body);
      return next();
    }

    // Caso 2: Se pasó un objeto con { body, query, params }
    if (schema.body && typeof schema.body.parseAsync === 'function') {
      req.body = await schema.body.parseAsync(req.body);
    }

    if (schema.query && typeof schema.query.parseAsync === 'function') {
      req.query = await schema.query.parseAsync(req.query);
    }

    if (schema.params && typeof schema.params.parseAsync === 'function') {
      req.params = await schema.params.parseAsync(req.params);
    }

    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));

      return res.status(400).json({
        success: false,
        message: 'Error de validación en la solicitud',
        errors: formattedErrors,
        type: 'ValidationError',
      });
    }

    return next(error);
  }
};
