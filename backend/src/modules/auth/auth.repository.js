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
}

export default new AuthRepository();

