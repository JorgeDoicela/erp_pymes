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

export const getMyEvaluations = async (req, res) => {
    try {
        const userId = req.user.id;

        const reviews = await prisma.evaluationReviewer.findMany({
            where: {
                reviewerId: userId,
                evaluation: {
                    status: { in: ['PENDING', 'IN_PROGRESS'] }
                }
            },
            include: {
                evaluation: {
                    include: {
                        template: true,
                        employee: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const parsedReviews = reviews.map(r => {
            try {
                return {
                    ...r,
                    evaluation: {
                        ...r.evaluation,
                        template: {
                            ...r.evaluation.template,
                            criteria: JSON.parse(r.evaluation.template.criteria),
                            scale: JSON.parse(r.evaluation.template.scale)
                        }
                    }
                };
            } catch (e) { return r; }
        });

        res.json(parsedReviews);

    } catch (error) {
        console.error("Error fetching my evaluations:", error);
        res.status(500).json({ message: "Error al obtener mis evaluaciones" });
    }
};

export const submitAssessment = async (req, res) => {
    try {
        const { reviewerId, responses, comments, status } = req.body;
        const userId = req.user.id;

        const review = await prisma.evaluationReviewer.findUnique({
            where: { id: reviewerId },
            include: { evaluation: true }
        });

        if (!review) {
            return res.status(404).json({ message: "Evaluación no encontrada" });
        }

        if (review.reviewerId !== userId) {
            return res.status(403).json({ message: "No tienes permiso para realizar esta evaluación" });
        }

        let calculatedScore = null;
        try {
            const values = Object.values(responses).map(v => parseFloat(v)).filter(v => !isNaN(v));
            if (values.length > 0) {
                calculatedScore = values.reduce((a, b) => a + b, 0) / values.length;
            }
        } catch (e) { }

        const updatedReview = await prisma.evaluationReviewer.update({
            where: { id: reviewerId },
            data: {
                responses: JSON.stringify(responses),
                comments: comments,
                status: status || 'COMPLETED',
                score: calculatedScore,
                completedAt: status === 'COMPLETED' ? new Date() : undefined
            }
        });

        res.json(updatedReview);

    } catch (error) {
        console.error("Error submitting assessment:", error);
        res.status(500).json({ message: "Error al enviar la evaluación" });
    }
};
