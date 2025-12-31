import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// RF-REC-001: Create Vacancy
export const createVacancy = async (req, res) => {
    try {
        const { title, department, description, requirements, benefits, salaryMin, salaryMax, location, employmentType, deadline } = req.body;
        const userId = req.user.id;

        // Validation
        if (!title || !description || !requirements || !location || !deadline) {
            return res.status(400).json({ message: "Faltan campos obligatorios" });
        }

        const vacancy = await prisma.jobVacancy.create({
            data: {
                title,
                department,
                description,
                requirements,
                benefits,
                salaryMin: salaryMin ? parseFloat(salaryMin) : null,
                salaryMax: salaryMax ? parseFloat(salaryMax) : null,
                location,
                employmentType,
                deadline: new Date(deadline),
                status: 'OPEN',
                postedById: userId
            }
        });

        res.status(201).json(vacancy);
    } catch (error) {
        console.error("Error creating vacancy:", error);
        res.status(500).json({ message: "Error al crear la vacante" });
    }
};

export const getVacancies = async (req, res) => {
    try {
        const vacancies = await prisma.jobVacancy.findMany({
            orderBy: { createdAt: 'desc' },
            include: { postedBy: { select: { firstName: true, lastName: true } } }
        });
        res.json(vacancies);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener vacantes" });
    }
};

export const getPublicVacancies = async (req, res) => {
    try {
        const vacancies = await prisma.jobVacancy.findMany({
            where: { status: 'OPEN' },
            orderBy: { createdAt: 'desc' }
        });
        res.json(vacancies);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener ofertas" });
    }
};

export const getVacancyById = async (req, res) => {
    try {
        const { id } = req.params;
        const vacancy = await prisma.jobVacancy.findUnique({
            where: { id }
        });
        if (!vacancy) return res.status(404).json({ message: "Vacante no encontrada" });
        res.json(vacancy);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener vacante" });
    }
};

export const updateVacancyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const vacancy = await prisma.jobVacancy.update({
            where: { id },
            data: { status }
        });
        res.json(vacancy);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar estado" });
    }
};
