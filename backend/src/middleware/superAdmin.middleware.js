import prisma from '../database/db.js';
import { isSuperAdminRole } from '../config/roles.js';

/**
 * Middleware para validar permisos de SuperAdministrador (Dueño de la Plataforma EMPLIFI).
 */
export const requireSuperAdmin = async (req, res, next) => {
    try {
        const userRole = (req.user?.role || '').toLowerCase();

        if (isSuperAdminRole(userRole)) {
            return next();
        }

        // Validación de respaldo en BD por si el token no se ha renovado
        if (req.user?.id) {
            const user = await prisma.employee.findUnique({
                where: { id: req.user.id },
                select: { role: true }
            });

            if (user && isSuperAdminRole(user.role)) {
                req.user.role = 'superadmin';
                return next();
            }
        }

        return res.status(403).json({
            success: false,
            message: 'Acceso denegado: Se requieren privilegios de SuperAdministrador de la plataforma.',
            code: 'SUPERADMIN_REQUIRED'
        });
    } catch (error) {
        console.error('[SUPERADMIN MIDDLEWARE ERROR]:', error);
        return res.status(500).json({ success: false, message: 'Error interno de autorización' });
    }
};
