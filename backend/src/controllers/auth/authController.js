import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import auditRepository from '../../repositories/audit/auditRepository.js';

const prisma = new PrismaClient();

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario
        const user = await prisma.employee.findUnique({
            where: { email },
        });

        if (!user) {
            auditRepository.createLog({
                entity: 'Auth',
                entityId: 'UNKNOWN',
                action: 'FAILED_LOGIN',
                performedBy: 'System',
                details: { email, reason: 'User not found' }
            }).catch(err => console.error('Audit Log Error:', err));

            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas',
            });
        }

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            auditRepository.createLog({
                entity: 'Auth',
                entityId: user.id,
                action: 'FAILED_LOGIN',
                performedBy: 'System',
                details: { email, reason: 'Invalid password' }
            }).catch(err => console.error('Audit Log Error:', err));

            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas',
            });
        }

        // Generar Token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret_key_change_me',
            { expiresIn: '1d' }
        );

        // Log successful login (Non-blocking)
        auditRepository.createLog({
            entity: 'Auth',
            entityId: user.id,
            action: 'LOGIN',
            performedBy: user.id,
            details: `Successful login for ${email}`
        }).catch(err => console.error('Audit Log Error:', err));

        res.status(200).json({
            success: true,
            message: 'Login exitoso',
            data: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
            },
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
        });
    }
};
