/**
 * @file documentRepository.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../database/db.js';

class DocumentRepository {
  async create(data) {
    return await prisma.document.create({
      data,
    });
  }

  async findByEmployeeId(employeeId) {
    return await prisma.document.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id) {
    return await prisma.document.findUnique({
      where: { id },
    });
  }

  async delete(id) {
    return await prisma.document.delete({
      where: { id },
    });
  }
}

export default new DocumentRepository();
