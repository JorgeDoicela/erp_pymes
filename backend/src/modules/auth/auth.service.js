/**
 * @file auth.service.js
 * @description Norma ERP - Servicio de Autenticación y Recuperación de Contraseña
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import authRepository from './auth.repository.js';
import emailService from '../notifications/email.service.js';
import auditRepository from '../audit/audit.repository.js';
import { isSuperAdminRole } from '../../config/roles.js';

export class AuthHttpError extends Error {
  constructor(statusCode, payload) {
    super(payload.message || 'Error de autenticación');
    this.statusCode = statusCode;
    this.payload = payload;
  }
}

export class AuthService {
  async login(emailRaw, password) {
    const identifier = emailRaw?.toString().trim();

    if (!identifier) {
      throw new AuthHttpError(400, {
        success: false,
        message: 'El identificador (Correo o Cédula) es requerido',
      });
    }

    const user = await authRepository.findUserByIdentifierWithTenant(identifier);

    if (!user) {
      auditRepository
        .createLog({
          entity: 'Auth',
          entityId: 'SYSTEM',
          action: 'LOGIN_FAILED',
          performedBy: 'ANONYMOUS',
          details: { identifier, reason: 'User not found' },
        })
        .catch((err) => console.error('Audit Log Error:', err));

      throw new AuthHttpError(401, {
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      auditRepository
        .createLog({
          entity: 'Auth',
          entityId: user.id,
          action: 'LOGIN_FAILED',
          performedBy: user.id,
          details: { email: user.email, reason: 'Invalid password' },
        })
        .catch((err) => console.error('Audit Log Error:', err));

      throw new AuthHttpError(401, {
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    const effectiveRole = isSuperAdminRole(user.role) ? 'superadmin' : user.role;
    const effectiveTenantId = effectiveRole === 'superadmin' ? null : user.tenantId;

    if (effectiveRole !== 'superadmin' && user.tenant) {
      if (user.tenant.subscriptionStatus === 'SUSPENDED') {
        throw new AuthHttpError(402, {
          success: false,
          message: `La suscripción de la empresa '${user.tenant.name}' se encuentra suspendida por pago pendiente. Por favor contacta al Administrador de la empresa o a soporte de NORMA ERP.`,
          code: 'SUBSCRIPTION_SUSPENDED',
        });
      }
      if (user.tenant.subscriptionStatus === 'CANCELLED') {
        throw new AuthHttpError(403, {
          success: false,
          message: `La cuenta de la empresa '${user.tenant.name}' ha sido cancelada.`,
          code: 'SUBSCRIPTION_CANCELLED',
        });
      }
      if (user.tenant.isActive === false) {
        throw new AuthHttpError(403, {
          success: false,
          message: `La empresa '${user.tenant.name}' está desactivada temporalmente en el sistema.`,
          code: 'TENANT_INACTIVE',
        });
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: effectiveRole, tenantId: effectiveTenantId },
      process.env.JWT_SECRET || 'secret_key_change_me',
      { expiresIn: '1d' }
    );

    console.log(
      `[AUTH] Login successful: ${user.email} (Tenant: ${effectiveRole === 'superadmin' ? 'Global SuperAdmin (N/A)' : user.tenant?.name || 'N/A'})`
    );

    auditRepository
      .createLog({
        entity: 'Auth',
        entityId: user.id,
        action: 'LOGIN',
        performedBy: user.id,
        details: `Successful login for ${user.email}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    return {
      success: true,
      message: 'Login exitoso',
      data: {
        id: user.id,
        tenantId: effectiveTenantId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: effectiveRole,
        trackingConsent: user.trackingConsent,
        tenant:
          effectiveRole !== 'superadmin' && user.tenant
            ? {
                id: user.tenant.id,
                name: user.tenant.name,
                slug: user.tenant.slug,
                plan: user.tenant.plan,
                subscriptionStatus: user.tenant.subscriptionStatus,
              }
            : null,
      },
      token,
    };
  }

  async forgotPassword(email) {
    if (!email) {
      throw new AuthHttpError(400, { success: false, message: 'El correo es requerido' });
    }

    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      return {
        success: true,
        message: 'Si el correo está registrado, recibirás un enlace de recuperación pronto.',
      };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);

    await authRepository.setResetPasswordToken(user.id, token, expires);

    const resetUrl = `${process.env.FRONTEND_URL || process.env.ORIGIN || 'http://localhost:5173'}/reset-password?token=${token}`;
    const html = `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #1e293b; text-align: center;">Recuperación de Contraseña</h2>
            <p>Hola <strong>${user.firstName}</strong>,</p>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Norma ERP</strong>.</p>
            <p>Haz clic en el botón de abajo para elegir una nueva contraseña. Este enlace es válido por 1 hora.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Restablecer Contraseña</a>
            </div>
            <p style="color: #64748b; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;">
            <p style="font-size: 11px; color: #94a3b8; text-align: center;">© ${new Date().getFullYear()} Norma ERP · Sistema de Gestión y Cumplimiento Laboral para PyMEs.</p>
        </div>
        `;

    await emailService.sendEmail({
      to: user.email,
      subject: 'Recuperación de Contraseña - Norma ERP',
      html,
    });

    return {
      success: true,
      message: 'Si el correo está registrado, recibirás un enlace de recuperación pronto.',
    };
  }

  async resetPassword(token, password) {
    if (!token || !password) {
      throw new AuthHttpError(400, {
        success: false,
        message: 'Token y nueva contraseña son requeridos',
      });
    }

    const user = await authRepository.findUserByValidResetToken(token);
    if (!user) {
      throw new AuthHttpError(400, {
        success: false,
        message: 'El enlace de recuperación es inválido o ha expirado',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await authRepository.updatePasswordAndClearResetToken(user.id, hashedPassword);

    auditRepository
      .createLog({
        entity: 'Auth',
        entityId: user.id,
        action: 'RESET_PASSWORD',
        performedBy: user.id,
        details: `Password reset successful for ${user.email}`,
      })
      .catch((err) => console.error('Audit Log Error:', err));

    return { success: true, message: 'Tu contraseña ha sido actualizada exitosamente' };
  }
}

export default new AuthService();

