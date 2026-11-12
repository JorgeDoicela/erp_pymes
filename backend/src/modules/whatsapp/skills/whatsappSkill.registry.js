/**
 * @file whatsappSkill.registry.js
 * @description Registro desacoplado de habilidades agénticas (Agent Skills) para el asistente WhatsApp de Norma ERP.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

export class WhatsappSkillRegistry {
  constructor(initialSkills = []) {
    this.skills = new Map();
    initialSkills.forEach((skill) => this.register(skill));
  }

  /**
   * Registra una nueva habilidad agéntica por su identificador único.
   * @param {Object} skill
   */
  register(skill) {
    if (!skill?.id) {
      throw new Error('[WhatsappSkillRegistry] Toda habilidad debe definir un "id".');
    }
    this.skills.set(skill.id, skill);
  }

  /**
   * Obtiene una habilidad registrada por su id.
   * @param {string} skillId
   * @returns {Object|null}
   */
  getSkill(skillId) {
    return this.skills.get(skillId) || null;
  }

  /**
   * Lista metadatos públicos de las habilidades disponibles para prompts e introspección.
   */
  listSkills() {
    return Array.from(this.skills.values()).map((skill) => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
    }));
  }
}

export default WhatsappSkillRegistry;
