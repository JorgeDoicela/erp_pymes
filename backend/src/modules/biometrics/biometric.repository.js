/**
 * @file biometric.repository.js
 * @description Norma ERP - Repositorio de Credenciales Biométricas WebAuthn / FIDO2
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../database/db.js';

export class BiometricRepository {
  async countCredentialsByEmployee(employeeId) {
    return prisma.biometricCredential.count({
      where: { employeeId },
    });
  }

  async findEmployeeWithCredentialsById(employeeId) {
    return prisma.employee.findUnique({
      where: { id: employeeId },
      include: { biometricCredentials: true },
    });
  }

  async findEmployeeById(employeeId) {
    return prisma.employee.findUnique({
      where: { id: employeeId },
    });
  }

  async findEmployeeWithCredentialsByIdentifier(identifier) {
    return prisma.employee.findFirst({
      where: {
        OR: [{ id: identifier }, { identityCard: identifier }, { email: identifier }],
      },
      include: { biometricCredentials: true },
    });
  }

  async updateChallenge(employeeId, challenge) {
    return prisma.employee.update({
      where: { id: employeeId },
      data: { currentChallenge: challenge },
    });
  }

  async deleteCredentialsByCredentialId(credentialId) {
    return prisma.biometricCredential.deleteMany({
      where: { credentialId },
    });
  }

  async deleteCredentialsByEmployee(employeeId) {
    return prisma.biometricCredential.deleteMany({
      where: { employeeId },
    });
  }

  async createCredential(data) {
    return prisma.biometricCredential.create({ data });
  }

  async updateCredentialVerification(id, counter) {
    return prisma.biometricCredential.update({
      where: { id },
      data: { counter, lastVerified: new Date() },
    });
  }
}

export default new BiometricRepository();

