import recruitmentRepository from '../../repositories/recruitment/recruitmentRepository.js';
import prisma from '../../database/db.js';
import bcrypt from 'bcryptjs';

export const recruitmentService = {
    async createVacancy(data, userId) {
        const { title, description, requirements, location, deadline, salaryMin, salaryMax } = data;

        if (!title || !description || !requirements || !location || !deadline) {
            throw new Error("Faltan campos obligatorios");
        }

        return recruitmentRepository.createVacancy({
            ...data,
            salaryMin: salaryMin ? parseFloat(salaryMin) : null,
            salaryMax: salaryMax ? parseFloat(salaryMax) : null,
            deadline: new Date(deadline),
            status: 'OPEN',
            postedById: userId
        });
    },

    async getVacancies() {
        return recruitmentRepository.getVacancies({}, {
            postedBy: { select: { firstName: true, lastName: true } }
        });
    },

    async getPublicVacancies() {
        return recruitmentRepository.getVacancies({ status: 'OPEN' });
    },

    async getVacancyById(id) {
        const vacancy = await recruitmentRepository.getVacancyById(id);
        if (!vacancy) throw new Error("Vacante no encontrada");
        return vacancy;
    },

    async updateVacancyStatus(id, status) {
        return recruitmentRepository.updateVacancy(id, { status });
    },

    async applyToVacancy(id, applicantData, resumeUrl) {
        if (!resumeUrl) {
            throw new Error("El CV es obligatorio (PDF)");
        }

        const { email } = applicantData;
        const existingApplication = await recruitmentRepository.getApplications({
            vacancyId: id,
            email: email
        });

        if (existingApplication.length > 0) {
            throw new Error("Ya te has postulado a esta vacante con este correo electrónico.");
        }

        return recruitmentRepository.createApplication({
            ...applicantData,
            vacancyId: id,
            resumeUrl,
            status: 'PENDING'
        });
    },

    async getApplicationsByVacancy(vacancyId) {
        return recruitmentRepository.getApplications(
            { vacancyId },
            { notes: true }
        );
    },

    async getApplicationDetails(id) {
        const application = await recruitmentRepository.getApplicationById(id, {
            vacancy: true,
            notes: { orderBy: { createdAt: 'desc' } },
            interviews: { orderBy: { date: 'asc' } },
            evaluations: { include: { evaluator: { select: { firstName: true, lastName: true } } } }
        });

        if (!application) throw new Error("Postulación no encontrada");
        return application;
    },

    async updateApplicationStatus(id, status) {
        return recruitmentRepository.updateApplication(id, { status });
    },

    async addNote(applicationId, content, userId, userName) {
        return recruitmentRepository.createNote({
            applicationId,
            content,
            createdById: userId,
            createdBy: userName
        });
    },

    async scheduleInterview(applicationId, interviewData, interviewerId) {
        const { date, type, location, notes } = interviewData;

        return recruitmentRepository.executeTransaction(async (tx) => {
            const interview = await tx.interview.create({
                data: {
                    applicationId,
                    date: new Date(date),
                    type,
                    location,
                    notes,
                    interviewerId
                }
            });

            await tx.jobApplication.update({
                where: { id: applicationId },
                data: { status: 'INTERVIEW' }
            });

            return interview;
        });
    },

    async evaluateCandidate(applicationId, evaluationData, evaluatorId) {
        return recruitmentRepository.createEvaluation({
            ...evaluationData,
            applicationId,
            evaluatorId
        });
    },

    async hireCandidate(applicationId, hireData) {
        const {
            identityCard, birthDate, address, civilStatus,
            contractType, salary, startDate, closeVacancy
        } = hireData;

        const application = await recruitmentRepository.getApplicationById(applicationId, { vacancy: true });
        if (!application) throw new Error("Postulación no encontrada");

        return recruitmentRepository.executeTransaction(async (tx) => {
            // 1. Update Application Status
            await tx.jobApplication.update({
                where: { id: applicationId },
                data: { status: 'HIRED' }
            });

            // 2. Create Employee
            const hashedPassword = await bcrypt.hash(identityCard, 10);
            const newEmployee = await tx.employee.create({
                data: {
                    firstName: application.firstName,
                    lastName: application.lastName,
                    email: application.email,
                    phone: application.phone,
                    department: application.vacancy.department,
                    position: application.vacancy.title,
                    identityCard,
                    birthDate: new Date(birthDate),
                    address,
                    civilStatus,
                    contractType,
                    hireDate: new Date(startDate),
                    salary: `ENC:${salary}`, // Mock encryption (kept for compatibility with legacy systems)
                    password: hashedPassword,
                    role: 'employee'
                }
            });

            // 3. Create initial Contract (Critical for payroll system)
            await tx.contract.create({
                data: {
                    employeeId: newEmployee.id,
                    type: contractType,
                    startDate: new Date(startDate),
                    salary: parseFloat(salary),
                    status: 'Active',
                    clauses: 'Contrato generado automáticamente desde proceso de reclutamiento.'
                }
            });

            // 4. Close Vacancy if requested
            if (closeVacancy) {
                await tx.jobVacancy.update({
                    where: { id: application.vacancyId },
                    data: { status: 'CLOSED' }
                });
            }

            return newEmployee;
        });
    }
};

export default recruitmentService;
