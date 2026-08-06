import prisma from '../../database/db.js';

export const recruitmentRepository = {
    // Vacancies
    async createVacancy(data) {
        return prisma.jobVacancy.create({ data });
    },

    async getVacancies(where = {}, include = {}) {
        return prisma.jobVacancy.findMany({
            where,
            include,
            orderBy: { createdAt: 'desc' }
        });
    },

    async getVacancyById(id, include = {}) {
        return prisma.jobVacancy.findUnique({
            where: { id },
            include
        });
    },

    async updateVacancy(id, data) {
        return prisma.jobVacancy.update({
            where: { id },
            data
        });
    },

    async deleteVacancy(id) {
        return prisma.jobVacancy.delete({
            where: { id }
        });
    },

    // Applications
    async createApplication(data) {
        return prisma.jobApplication.create({ data });
    },

    async getApplications(where = {}, include = {}) {
        return prisma.jobApplication.findMany({
            where,
            include,
            orderBy: { createdAt: 'desc' }
        });
    },

    async getApplicationById(id, include = {}) {
        return prisma.jobApplication.findUnique({
            where: { id },
            include
        });
    },

    async updateApplication(id, data) {
        return prisma.jobApplication.update({
            where: { id },
            data
        });
    },

    async deleteApplication(id) {
        return prisma.jobApplication.delete({
            where: { id }
        });
    },

    // Notes
    async createNote(data) {
        return prisma.applicationNote.create({ data });
    },

    // Interviews
    async createInterview(data) {
        return prisma.interview.create({ data });
    },

    // Evaluations
    async createEvaluation(data) {
        return prisma.candidateEvaluation.create({ data });
    },

    // Transactions
    async executeTransaction(callback) {
        return prisma.$transaction(callback);
    }
};

export default recruitmentRepository;
