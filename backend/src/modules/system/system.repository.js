/**
 * @file system.repository.js
 * @description Repositorio de persistencia para la configuración del sistema y verificaciones de salud (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../database/db.js';

export class SystemRepository {
  async findByTenantId(tenantId) {
    return prisma.systemSetting.findFirst({
      where: { tenantId },
    });
  }

  async findGlobalDefault() {
    return prisma.systemSetting.findFirst({
      where: { tenantId: null },
    });
  }

  // Alias legado mantenido por compatibilidad, siempre restringido a tenantId: null
  async findFirst() {
    return this.findGlobalDefault();
  }

  async upsertDefault(createData) {
    return prisma.systemSetting.upsert({
      where: { id: 'default' },
      update: {},
      create: createData,
    });
  }

  async updateById(id, data) {
    return prisma.systemSetting.update({
      where: { id },
      data,
    });
  }

  async create(data) {
    return prisma.systemSetting.create({ data });
  }

  async upsertById(id, updateData, createData) {
    return prisma.systemSetting.upsert({
      where: { id },
      update: updateData,
      create: createData,
    });
  }

  async checkDatabaseConnection() {
    return prisma.$queryRaw`SELECT 1`;
  }
}

export const systemRepository = new SystemRepository();
export default systemRepository;
