/**
 * @file skill.service.js
 * @description Norma ERP - Servicio de Habilidades del Colaborador
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import skillRepository from './skill.repository.js';

export class SkillService {
  async createSkill(data) {
    if (!data.name || !data.level) {
      throw new Error('Nombre y nivel son requeridos');
    }
    return await skillRepository.create(data);
  }

  async deleteSkill(id, _userId) {
    return await skillRepository.delete(id);
  }
}

export default new SkillService();

