/**
 * @file superAdmin.middleware.js
 * @description Middleware para validar permisos de SuperAdministrador (Dueño de la Plataforma NORMA ERP) dentro del dominio Tenants.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../../database/db.js';
import { isSuperAdminRole } from '../../../config/roles.js';

/**
 * Middleware para validar permisos de SuperAdministrador (Dueño de la Plataforma NORMA ERP).
 */
export const requireSuperAdmin = async (req, res, next) => {
  try {
    const userRole = (req.user?.role || '').toLowerCase();

    if (isSuperAdminRole(userRole)) {
      return next();
    }

    // Validación de respaldo en BD únicamente si el rol no venía definido en el token
    if (!userRole && req.user?.id) {
      try {
        const user = await prisma.employee.findUnique({
          where: { id: req.user.id },
          select: { role: true },
        });

        if (user && isSuperAdminRole(user.role)) {
          req.user.role = 'superadmin';
          return next();
        }
      } catch (dbErr) {
        // Si la base de datos no está disponible o falla, prevalece la decisión del token
        console.warn('[SUPERADMIN MIDDLEWARE] Fallback DB role lookup skipped:', dbErr.message);
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Acceso denegado: Se requieren privilegios de SuperAdministrador de la plataforma.',
      code: 'SUPERADMIN_REQUIRED',
    });
  } catch (error) {
    console.error('[SUPERADMIN MIDDLEWARE ERROR]:', error);
    return res.status(500).json({ success: false, message: 'Error interno de autorización' });
  }
};

export default {
  requireSuperAdmin,
};
