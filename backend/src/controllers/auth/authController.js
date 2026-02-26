import prisma from '../../database/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import auditRepository from '../../repositories/audit/auditRepository.js';

export const login = async (req, res) => {
    try {
        const { email: identifierRaw, password } = req.body;
        const identifier = identifierRaw?.toString().trim();

        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: 'El identificador (Correo o Cédula) es requerido'
            });
        }

        // Buscar usuario por Email o Cédula
        const user = await prisma.employee.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { identityCard: identifier }
                ]
            },
        });

        if (!user) {
            console.log(`[AUTH] Login failed: User not found (${identifier})`);
            auditRepository.createLog({
                entity: 'Auth',
                entityId: 'UNKNOWN',
                action: 'FAILED_LOGIN',
                performedBy: 'System',
                details: { email: identifier, reason: 'User not found' }
            }).catch(err => console.error('Audit Log Error:', err));

            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas',
            });
        }

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`[AUTH] Login failed: Invalid password for ${user.email}`);
            auditRepository.createLog({
                entity: 'Auth',
                entityId: user.id,
                action: 'FAILED_LOGIN',
                performedBy: 'System',
                details: { email: user.email, reason: 'Invalid password' }
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
        console.log(`[AUTH] Login successful: ${user.email}`);
        auditRepository.createLog({
            entity: 'Auth',
            entityId: user.id,
            action: 'LOGIN',
            performedBy: user.id,
            details: `Successful login for ${user.email}`
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
        console.error('[AUTH ERROR] Login Exception:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor: ' + error.message, // Temporarily expose for debugging, or keep generic if preferred. User asked for help, so exposing is better for now.
        });
    }
};
