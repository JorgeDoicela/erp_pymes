import skillRepository from '../../repositories/skills/skillRepository.js';

export class SkillService {
    async createSkill(data) {
        if (!data.name || !data.level) {
            throw new Error('Nombre y nivel son requeridos');
        }
        return await skillRepository.create(data);
    }

    async deleteSkill(id, userId) {
        // Optional: Check ownership if strict security needed, 
        // but for now relying on Controller to check/pass userId if logical ownership needed.
        // In this MVP, any authorized user (checked by route) can delete if they have access.
        // Ideally we verify the skill belongs to the employee who is deleting it (if self-service).

        // For now simple delete.
        return await skillRepository.delete(id);
    }
}

export default new SkillService();
