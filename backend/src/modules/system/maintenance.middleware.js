/**
 * @file maintenance.middleware.js
 * @description Middleware de Mantenimiento (RNF-17) para el dominio System (Norma ERP).
 * Valida si el sistema está en mantenimiento programado y restringe el acceso no administrativo.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import systemService from './system.service.js';
import jwt from 'jsonwebtoken';

/**
 * RNF-17: Middleware de Mantenimiento
 */
export const maintenanceMiddleware = async (req, res, next) => {
  // Rutas siempre permitidas
  const publicRoutes = [
    '/health',
    '/api/system/health',
    '/api/auth/login',
    '/api/recruitment/public',
    '/system/health',
    '/auth/login',
  ];

  // Comprobar si la ruta coincide con rutas permitidas
  if (
    publicRoutes.some((route) => req.path.includes(route)) ||
    req.path.includes('/system/settings')
  ) {
    return next();
  }

  try {
    let decoded = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'secret_key_change_me';
        decoded = jwt.verify(token, secret);
      } catch (error) {
        console.log('Maintenance token check failed:', error.message);
      }
    }

    // Aislar la lectura de mantenimiento al tenant del usuario autenticado (o global si no pertenece a un tenant)
    const tenantId = decoded?.tenantId || null;
    const settings = await systemService.getSettings(tenantId);

    // Si settings no carga o no está en mantenimiento, proceder
    if (!settings?.maintenanceMode) {
      return next();
    }

    const role = decoded?.role ? decoded.role.toLowerCase() : '';
    if (role === 'admin' || role === 'superadmin') {
      return next();
    }

    return res.status(503).json({
      success: false,
      message:
        settings.maintenanceMessage ||
        'El sistema se encuentra en mantenimiento programado. Por favor, intente más tarde.',
      maintenance: true,
    });
  } catch (error) {
    console.error('Maintenance check failed:', error);
    next();
  }
};

export default maintenanceMiddleware;
