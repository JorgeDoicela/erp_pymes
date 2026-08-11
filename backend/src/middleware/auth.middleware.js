import jwt from 'jsonwebtoken';
import { ROLES, isSuperAdminRole } from '../config/roles.js';

export const authenticate = (req, res, next) => {
    try {
        let token = null;
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({
                message: 'No autenticado: Falta token o formato inválido',
                code: 'AUTH_MISSING_TOKEN'
            });
        }
        const secret = process.env.JWT_SECRET || 'secret_key_change_me';

        const decoded = jwt.verify(token, secret);

        // Attach user info to request
        req.user = decoded; // { id, role, ... }

        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error.message);
        return res.status(401).json({
            message: 'Token inválido o expirado: ' + error.message,
            code: 'AUTH_INVALID_TOKEN',
            detail: error.message
        });
    }
};

export const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'No autenticado' });
        }

        const userRole = (req.user.role || '').toLowerCase();
        const isSuperAdmin = isSuperAdminRole(userRole);

        const allowedRoles = roles.map(r => r.toLowerCase());

        if (allowedRoles.length > 0 && !allowedRoles.includes(userRole) && !isSuperAdmin) {
            return res.status(403).json({ message: 'No autorizado: Rol insuficiente' });
        }

        next();
    };
};

export const optionalAuth = (req, res, next) => {
    try {
        let token = null;
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        }

        if (token) {
            const secret = process.env.JWT_SECRET || 'secret_key_change_me';
            const decoded = jwt.verify(token, secret);
            req.user = decoded;
        }
        next();
    } catch (error) {
        // Token inválido o expirado en petición opcional, continua sin req.user
        next();
    }
};
