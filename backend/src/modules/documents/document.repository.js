/**
 * @file document.repository.js
 * @description Repositorio de persistencia para documentos de colaboradores (Norma ERP).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../database/db.js';

export class DocumentRepository {
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
