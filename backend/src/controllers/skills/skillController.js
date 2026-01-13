import skillService from '../../services/skills/skillService.js';

export class SkillController {
    async create(req, res) {
        try {
            const { name, level, employeeId } = req.body;
            const result = await skillService.createSkill({ name, level, employeeId });
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await skillService.deleteSkill(id);
            res.status(200).json({ success: true, message: 'Habilidad eliminada' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

export default new SkillController();
