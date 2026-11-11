/**
 * @file skill.repository.js
 * @description Norma ERP - Repositorio de Habilidades del Colaborador
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import prisma from '../../database/db.js';

export class SkillRepository {
  async create(data) {
    return await prisma.skill.create({
      data,
    });
  }

  async delete(id) {
    return await prisma.skill.delete({
      where: { id },
    });
  }

  async findById(id) {
    return await prisma.skill.findUnique({
      where: { id },
    });
  }
}

export default new SkillRepository();

