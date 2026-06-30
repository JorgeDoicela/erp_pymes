import prisma from '../../database/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import emailService from '../../services/notifications/emailService.js';
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
                trackingConsent: user.trackingConsent,
            },
            token,
        });
    } catch (error) {
        console.error('[AUTH ERROR] Login Exception:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor: ' + error.message,
        });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'El correo es requerido' });
        }

        const user = await prisma.employee.findUnique({ where: { email } });
        if (!user) {
            // Seguridad: No confirmar si el correo existe o no
            return res.status(200).json({
                success: true,
                message: 'Si el correo está registrado, recibirás un enlace de recuperación pronto.'
            });
        }

        // Generar Token
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hora

        await prisma.employee.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: token,
                resetPasswordExpires: expires
            }
        });

        // Enviar Email
        const resetUrl = `${process.env.ORIGIN || 'https://recursoshumanos-eight.vercel.app'}/reset-password?token=${token}`;

        const html = `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #1e293b; text-align: center;">Recuperación de Contraseña</h2>
            <p>Hola <strong>${user.firstName}</strong>,</p>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Jorge-Doicela Recursos Humanos</strong>.</p>
            <p>Haz clic en el botón de abajo para elegir una nueva contraseña. Este enlace es válido por 1 hora.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Restablecer Contraseña</a>
            </div>
            <p style="color: #64748b; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;">
            <p style="font-size: 11px; color: #94a3b8; text-align: center;">© ${new Date().getFullYear()} Jorge-Doicela Recursos Humanos. Sistema de Gestión de Talento Humano.</p>
        </div>
        `;

        await emailService.sendEmail({
            to: user.email,
            subject: 'Recuperación de Contraseña - Recursos Humanos',
            html
        });

        res.status(200).json({
            success: true,
            message: 'Si el correo está registrado, recibirás un enlace de recuperación pronto.'
        });
    } catch (error) {
        console.error('[AUTH ERROR] Forgot Password:', error);
        res.status(500).json({ success: false, message: 'Error al procesar la solicitud' });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ success: false, message: 'Token y nueva contraseña son requeridos' });
        }

        const user = await prisma.employee.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: { gt: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'El enlace de recuperación es inválido o ha expirado' });
        }

        // Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.employee.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null
            }
        });

        auditRepository.createLog({
            entity: 'Auth',
            entityId: user.id,
            action: 'RESET_PASSWORD',
            performedBy: user.id,
            details: `Password reset successful for ${user.email}`
        }).catch(err => console.error('Audit Log Error:', err));

        res.status(200).json({ success: true, message: 'Tu contraseña ha sido actualizada exitosamente' });
    } catch (error) {
        console.error('[AUTH ERROR] Reset Password:', error);
        res.status(500).json({ success: false, message: 'Error al restablecer la contraseña' });
    }
};
