/**
 * @file appError.js
 * @description Jerarquía estándar de errores de dominio y aplicación (Clean Architecture).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, type = 'AppError') {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404, 'NotFoundError');
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Error de validación en la solicitud', errors = []) {
    super(message, 400, 'ValidationError');
    this.errors = errors;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Acceso no autorizado') {
    super(message, 401, 'UnauthorizedError');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'No tiene permisos para realizar esta acción') {
    super(message, 403, 'ForbiddenError');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflicto con el estado actual del recurso') {
    super(message, 409, 'ConflictError');
  }
}
