/**
 * @file errorHandler.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { AppError } from '../core/errors/appError.js';

/**
 * Error Handling Middleware
 * Maneja errores globales de la aplicación bajo estándar RFC 7807 y Clean Architecture
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // 1. Errores operacionales tipados de Dominio/Aplicación (AppError)
  if (err instanceof AppError || (err.isOperational && err.statusCode)) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      type: err.type || err.name || 'AppError',
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  // 2. Errores de Zod (Validación de Esquema / DTOs)
  if (err.name === 'ZodError' || (err.issues && Array.isArray(err.issues))) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación en la solicitud',
      errors: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      type: 'ValidationError',
    });
  }

  // 3. Errores de Base de Datos conocidos (Prisma ORM)
  if (err.code === 'P2002') {
    const target = err.meta?.target;
    const fields = Array.isArray(target) ? target.join(', ') : target || 'campo';
    return res.status(409).json({
      success: false,
      message: `Conflicto de unicidad: el registro con '${fields}' ya existe en el sistema.`,
      type: 'ConflictError',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: err.meta?.cause || 'El recurso solicitado no fue encontrado.',
      type: 'NotFoundError',
    });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'Violación de integridad referencial: el registro relacionado no existe o se encuentra restringido.',
      type: 'ForeignKeyConstraintError',
    });
  }

  // Errores de validación
  if (
    err.message.includes('Nombre') ||
    err.message.includes('Apellido') ||
    err.message.includes('Email') ||
    err.message.includes('Departamento') ||
    err.message.includes('Puesto') ||
    err.message.includes('Salario')
  ) {
    return res.status(400).json({
      success: false,
      message: err.message,
      type: 'ValidationError',
    });
  }

  // Errores de Multer (Carga de archivos)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'El archivo es demasiado grande. El límite es de 15MB.',
        type: 'PayloadTooLarge',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Error al subir archivo: ${err.message}`,
      type: 'UploadError',
    });
  }

  // Errores de no encontrado
  if (err.message === 'Empleado no encontrado') {
    return res.status(404).json({
      success: false,
      message: err.message,
      type: 'NotFoundError',
    });
  }

  // Errores de encriptación
  if (err.message.includes('ENCRYPTION_KEY') || err.message.includes('encriptado')) {
    return res.status(500).json({
      success: false,
      message: 'Error de seguridad en el servidor',
      type: 'EncryptionError',
    });
  }

  // Errores con status code explícito
  if (err.statusCode || err.status) {
    const status = err.statusCode || err.status;
    return res.status(status).json({
      success: false,
      message: err.message,
      type: err.type || 'HttpError',
    });
  }

  // Error genérico
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message,
    type: 'InternalServerError',
  });
}

/**
 * Middleware para loguear solicitudes
 */
export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
  });

  next();
}

/**
 * Middleware para validar que el body no esté vacío en POST/PUT
 */
export function validateBodyNotEmpty(req, res, next) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    // Skip validation for multipart/form-data (file uploads)
    if (req.headers?.['content-type']?.includes('multipart/form-data')) {
      return next();
    }

    // Permitir cuerpos vacíos para acciones específicas de "trigger" (ej: notificaciones, mayorizar, activar/desactivar, etc.)
    const isTriggerAction =
      req.path?.endsWith('/post') ||
      req.path?.endsWith('/toggle') ||
      req.path?.endsWith('/notify-pending') ||
      req.path?.endsWith('/close') ||
      req.path?.endsWith('/reopen') ||
      req.path?.endsWith('/process');

    if (isTriggerAction) {
      return next();
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El body de la solicitud no puede estar vacío',
      });
    }
  }
  next();
}
