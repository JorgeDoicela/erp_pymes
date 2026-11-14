/**
 * @file auth.repository.js
 * @description Norma ERP - Repositorio de Autenticación
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../database/db.js';

export class AuthRepository {
  async findUserByIdentifierWithTenant(identifier) {
    const isEmail = identifier.includes('@');
    return prisma.employee.findFirst({
      where: isEmail ? { email: identifier } : { identityCard: identifier },
      include: { tenant: true },
    });
  }

  async findUserByEmail(email) {
    return prisma.employee.findUnique({ where: { email } });
  }

  async setResetPasswordToken(userId, token, expires) {
    return prisma.employee.update({
      where: { id: userId },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      },
    });
  }

  async findUserByValidResetToken(token) {
    return prisma.employee.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });
  }

  async updatePasswordAndClearResetToken(userId, hashedPassword) {
    return prisma.employee.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
  }

  async recordUserConsent({ userId, tenantId, version = '2026.1', ip = null, userAgent = null }) {
    const now = new Date();
    return prisma.$transaction(async (tx) => {
      const updatedUser = await tx.employee.update({
        where: { id: userId },
        data: {
          termsAccepted: true,
          termsAcceptedAt: now,
          termsVersion: version,
          privacyAccepted: true,
          privacyAcceptedAt: now,
          privacyVersion: version,
        },
        include: { tenant: true },
      });

      await tx.legalConsent.createMany({
        data: [
          {
            tenantId,
            employeeId: userId,
            consentType: 'TERMS_OF_SERVICE',
            version,
            accepted: true,
            ipAddress: ip,
            userAgent,
            metadata: JSON.stringify({ source: 'WEB_MODAL', timestamp: now.toISOString() }),
          },
          {
            tenantId,
            employeeId: userId,
            consentType: 'PRIVACY_POLICY_LOPDP',
            version,
            accepted: true,
            ipAddress: ip,
            userAgent,
            metadata: JSON.stringify({ source: 'WEB_MODAL', timestamp: now.toISOString() }),
          },
        ],
      });

      return updatedUser;
    });
  }
}

export default new AuthRepository();
