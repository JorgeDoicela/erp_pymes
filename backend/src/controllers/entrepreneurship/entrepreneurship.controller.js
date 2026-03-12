import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener todos los proyectos (con filtros opcionales)
export const getProjects = async (req, res) => {
    try {
        const { stage, status } = req.query;
        const projects = await prisma.entrepreneurship.findMany({
            where: {
                ...(stage && { stage }),
                ...(status && { status })
            },
            include: {
                owner: {
                    select: { firstName: true, lastName: true, email: true }
                },
                _count: {
                    select: { members: true, milestones: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener proyectos', details: error.message });
    }
};

// Crear un nuevo proyecto
export const createProject = async (req, res) => {
    try {
        const { title, description, industry, stage, ownerId, budget, innovationScore } = req.body;
        const project = await prisma.entrepreneurship.create({
            data: {
                title,
                description,
                industry,
                stage: stage || 'IDEATION',
                ownerId,
                budget: parseFloat(budget) || 0,
                innovationScore: parseFloat(innovationScore) || 0
            }
        });
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear proyecto', details: error.message });
    }
};

// Obtener detalles de un proyecto
export const getProjectDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await prisma.entrepreneurship.findUnique({
            where: { id },
            include: {
                owner: true,
                members: { include: { employee: true } },
                mentors: { include: { employee: true } },
                milestones: { orderBy: { dueDate: 'asc' } },
                documents: true,
                updates: { orderBy: { createdAt: 'desc' } },
                equities: { orderBy: { percentage: 'desc' } },
                fundingRounds: { orderBy: { date: 'desc' } },
                interviews: { orderBy: { createdAt: 'desc' } },
                targetMarket: true
            }
        });
        if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener detalles', details: error.message });
    }
};

// Actualizar proyecto
export const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const project = await prisma.entrepreneurship.update({
            where: { id },
            data
        });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar proyecto', details: error.message });
    }
};

// Gestionar Hitos
export const addMilestone = async (req, res) => {
    try {
        const { projectId, title, description, dueDate } = req.body;
        const milestone = await prisma.entrepreneurshipMilestone.create({
            data: { projectId, title, description, dueDate: new Date(dueDate) }
        });
        res.status(201).json(milestone);
    } catch (error) {
        res.status(500).json({ error: 'Error al añadir hito', details: error.message });
    }
};

export const updateMilestone = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, completedDate, kanbanColumn } = req.body;
        const milestone = await prisma.entrepreneurshipMilestone.update({
            where: { id },
            data: { 
                status, 
                completedDate: completedDate ? new Date(completedDate) : null,
                kanbanColumn
            }
        });
        res.json(milestone);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar hito', details: error.message });
    }
};

// Gestionar Actualizaciones/Bitácora
export const addUpdate = async (req, res) => {
    try {
        const { projectId, title, content, type } = req.body;
        const update = await prisma.entrepreneurshipUpdate.create({
            data: { projectId, title, content, type }
        });
        res.status(201).json(update);
    } catch (error) {
        res.status(500).json({ error: 'Error al añadir actualización', details: error.message });
    }
};

// Eliminar proyecto
export const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.entrepreneurship.delete({ where: { id } });
        res.json({ message: 'Proyecto eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar proyecto', details: error.message });
    }
};
