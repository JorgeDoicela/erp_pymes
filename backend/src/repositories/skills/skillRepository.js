import prisma from '../../database/db.js';

export class SkillRepository {
    async create(data) {
        return await prisma.skill.create({
            data
        });
    }

    async delete(id) {
        return await prisma.skill.delete({
            where: { id }
        });
    }

    async findById(id) {
        return await prisma.skill.findUnique({
            where: { id }
        });
    }
}

export default new SkillRepository();
