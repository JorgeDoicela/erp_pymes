/**
 * Error Handling Middleware
 * Maneja errores globales de la aplicación
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Errores de validación
  if (err.message.includes('Nombre') || err.message.includes('Apellido') ||
    err.message.includes('Email') || err.message.includes('Departamento') ||
    err.message.includes('Puesto') || err.message.includes('Salario')) {
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
        type: 'PayloadTooLarge'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Error al subir archivo: ${err.message}`,
      type: 'UploadError'
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

  // Error genérico
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message,
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
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
}

/**
 * Middleware para validar que el body no esté vacío en POST/PUT
 */
export function validateBodyNotEmpty(req, res, next) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    // Skip validation for multipart/form-data (file uploads)
    if (req.headers['content-type']?.includes('multipart/form-data')) {
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
