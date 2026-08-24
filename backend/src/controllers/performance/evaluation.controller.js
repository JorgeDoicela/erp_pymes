import performanceService from '../../services/performance/performanceService.js';
import prisma from '../../database/db.js';

export const createEvaluationTemplate = async (req, res) => {
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        const userId = req.user?.id;

        const template = await performanceService.createEvaluationTemplate(req.body, userId, tenantId);
        return res.status(201).json(template);
    } catch (error) {
        console.error('Error creating evaluation template:', error);
        return res.status(400).json({ message: error.message || 'Error al crear la plantilla de evaluación' });
    }
};

export const getEvaluationTemplates = async (req, res) => {
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        const templates = await performanceService.getEvaluationTemplates(tenantId);
        return res.status(200).json(templates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        return res.status(500).json({ message: 'Error al obtener plantillas' });
    }
};

export const getEmployeeEvaluations = async (req, res) => {
    try {
        const { page, limit, status, search, period, templateId } = req.query;
        const tenantId = req.tenantId || req.user?.tenantId;

        const result = await performanceService.getEmployeeEvaluations({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 15,
            status,
            search,
            period,
            templateId,
            tenantId
        });

        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error fetching employee evaluations:', error);
        return res.status(500).json({ message: error.message || 'Error al obtener evaluaciones del personal' });
    }
};

export const getPerformanceStats = async (req, res) => {
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        const stats = await performanceService.getPerformanceStats(tenantId);
        return res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching performance stats:', error);
        return res.status(500).json({ message: 'Error al obtener estadísticas de desempeño' });
    }
};

export const assignEvaluation = async (req, res) => {
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        const userId = req.user?.id;

        const result = await performanceService.assignEvaluation(req.body, userId, tenantId);
        return res.status(201).json(result);
    } catch (error) {
        console.error('Error assigning evaluation:', error);
        return res.status(400).json({ message: error.message || 'Error al asignar evaluaciones' });
    }
};

export const getMyEvaluations = async (req, res) => {
    try {
        const userId = req.user.employeeId || req.user.id;
        const reviews = await performanceService.getMyEvaluations(userId, req.user);
        return res.status(200).json(reviews);
    } catch (error) {
        console.error('Error fetching my evaluations:', error);
        return res.status(500).json({ message: 'Error al obtener mis evaluaciones' });
    }
};

export const submitAssessment = async (req, res) => {
    try {
        const userId = req.user.id;
        const tenantId = req.tenantId || req.user?.tenantId;

        const updatedReview = await performanceService.submitAssessment(req.body, userId, tenantId);
        return res.status(200).json(updatedReview);
    } catch (error) {
        console.error('Error submitting assessment:', error);
        return res.status(400).json({ message: error.message || 'Error al enviar la evaluación' });
    }
};

export const getEvaluationResults = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;
        const tenantId = req.tenantId || req.user?.tenantId;

        const data = await performanceService.getEvaluationResults(id, userId, userRole, tenantId);
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error calculating results:', error);
        return res.status(400).json({ message: error.message || 'Error al calcular resultados' });
    }
};

export const getMyResultsList = async (req, res) => {
    try {
        const userId = req.user.employeeId || req.user.id;
        let actualEmployeeId = userId;
        const emp = await prisma.employee.findFirst({
            where: {
                OR: [
                    ...(userId ? [{ id: userId }] : []),
                    ...(req.user?.employeeId ? [{ id: req.user.employeeId }] : []),
                    ...(req.user?.email ? [{ email: req.user.email }] : [])
                ],
                ...(req.user?.tenantId ? { tenantId: req.user.tenantId } : {})
            },
            select: { id: true }
        });
        if (emp) actualEmployeeId = emp.id;

        const results = await prisma.employeeEvaluation.findMany({
            where: { employeeId: actualEmployeeId },
            include: { template: true },
            orderBy: { endDate: 'desc' }
        });
        return res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching my results:', error);
        return res.status(500).json({ message: 'Error al obtener mis resultados' });
    }
};
