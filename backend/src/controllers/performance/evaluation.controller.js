import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createEvaluationTemplate = async (req, res) => {
    try {
        const { title, description, period, instructions, criteria, scale } = req.body;

        // Ensure criteria and scale are strings if they came in as objects
        const criteriaString = typeof criteria === 'object' ? JSON.stringify(criteria) : criteria;
        const scaleString = typeof scale === 'object' ? JSON.stringify(scale) : scale;

        const template = await prisma.evaluationTemplate.create({
            data: {
                title,
                description,
                period,
                instructions,
                criteria: criteriaString,
                scale: scaleString
            }
        });

        res.status(201).json(template);
    } catch (error) {
        console.error("Error creating evaluation template:", error);
        res.status(500).json({ message: "Error al crear la plantilla de evaluación" });
    }
};

export const getEvaluationTemplates = async (req, res) => {
    try {
        const templates = await prisma.evaluationTemplate.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Parse JSON strings back to objects
        const parsedTemplates = templates.map(t => {
            try {
                return {
                    ...t,
                    criteria: JSON.parse(t.criteria),
                    scale: JSON.parse(t.scale)
                };
            } catch (e) {
                return t;
            }
        });

        res.json(parsedTemplates);
    } catch (error) {
        console.error("Error fetching templates:", error);
        res.status(500).json({ message: "Error al obtener plantillas" });
    }
};

export const assignEvaluation = async (req, res) => {
    try {
        const { templateId, employeeIds, evaluatorIds, startDate, endDate } = req.body;

        if (!templateId || !employeeIds || !employeeIds.length || !evaluatorIds || !evaluatorIds.length || !startDate || !endDate) {
            return res.status(400).json({ message: "Faltan datos requeridos (plantilla, empleados, evaluadores, fechas)" });
        }

        const assignments = [];

        // Transaction ensures atomicity
        await prisma.$transaction(async (tx) => {
            for (const empId of employeeIds) {
                // Create evaluation instance for employee
                const evaluation = await tx.employeeEvaluation.create({
                    data: {
                        templateId,
                        employeeId: empId,
                        startDate: new Date(startDate),
                        endDate: new Date(endDate),
                        status: 'PENDING',
                        reviewers: {
                            create: evaluatorIds.map(reviewerId => ({
                                reviewerId: reviewerId,
                                status: 'PENDING'
                            }))
                        }
                    },
                    include: {
                        reviewers: true
                    }
                });
                assignments.push(evaluation);
            }
        });

        res.status(201).json({
            message: `Se asignaron ${assignments.length} evaluaciones correctamente`,
            assignments
        });

    } catch (error) {
        console.error("Error signing evaluation:", error);
        res.status(500).json({ message: "Error al asignar evaluaciones" });
    }
};
