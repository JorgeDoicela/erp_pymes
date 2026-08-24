import employeeBenefitService from '../../services/payroll/employeeBenefitService.js';

class EmployeeBenefitController {
    async getAll(req, res) {
        try {
            const { page, limit, status, type, employeeId, search } = req.query;
            const tenantId = req.tenantId || req.user?.tenantId;

            const result = await employeeBenefitService.getBenefits({
                page: page ? parseInt(page, 10) : 1,
                limit: limit ? parseInt(limit, 10) : 20,
                status,
                type,
                employeeId,
                search,
                tenantId
            });

            return res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            console.error('Error en getAll benefits:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener el listado de beneficios'
            });
        }
    }

    async getStats(req, res) {
        try {
            const tenantId = req.tenantId || req.user?.tenantId;
            const stats = await employeeBenefitService.getStats(tenantId);
            return res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error en getStats benefits:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener estadísticas de beneficios'
            });
        }
    }

    async getByEmployee(req, res) {
        try {
            const { employeeId } = req.params;
            const tenantId = req.tenantId || req.user?.tenantId;

            const benefits = await employeeBenefitService.getByEmployee(employeeId, tenantId);
            return res.status(200).json({
                success: true,
                data: benefits
            });
        } catch (error) {
            console.error('Error en getByEmployee benefits:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener beneficios del empleado'
            });
        }
    }

    async create(req, res) {
        try {
            const { employeeId, name, amount, type, frequency } = req.body;
            const tenantId = req.tenantId || req.user?.tenantId;
            const adminId = req.user?.id;

            const benefit = await employeeBenefitService.createBenefit(
                { employeeId, name, amount, type, frequency },
                tenantId,
                adminId
            );

            return res.status(201).json({
                success: true,
                message: 'Beneficio asignado exitosamente',
                data: benefit
            });
        } catch (error) {
            console.error('Error en create benefit:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al asignar beneficio'
            });
        }
    }

    async bulkCreate(req, res) {
        try {
            const { employeeIds, name, amount, type, frequency, isSpecialCalculation } = req.body;
            const tenantId = req.tenantId || req.user?.tenantId;
            const adminId = req.user?.id;

            const result = await employeeBenefitService.bulkCreate(
                { employeeIds, name, amount, type, frequency, isSpecialCalculation },
                tenantId,
                adminId
            );

            return res.status(201).json({
                success: true,
                ...result
            });
        } catch (error) {
            console.error('Error en bulkCreate benefits:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Error en asignación masiva de beneficios'
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, amount, type, frequency } = req.body;
            const tenantId = req.tenantId || req.user?.tenantId;
            const adminId = req.user?.id;

            const updated = await employeeBenefitService.updateBenefit(
                id,
                { name, amount, type, frequency },
                tenantId,
                adminId
            );

            return res.status(200).json({
                success: true,
                message: 'Beneficio actualizado exitosamente',
                data: updated
            });
        } catch (error) {
            console.error('Error en update benefit:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al actualizar beneficio'
            });
        }
    }

    async deactivate(req, res) {
        try {
            const { id } = req.params;
            const tenantId = req.tenantId || req.user?.tenantId;
            const adminId = req.user?.id;

            const updated = await employeeBenefitService.deactivate(id, tenantId, adminId);

            return res.status(200).json({
                success: true,
                message: 'Beneficio cancelado exitosamente',
                data: updated
            });
        } catch (error) {
            console.error('Error en deactivate benefit:', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al cancelar beneficio'
            });
        }
    }
}

export default new EmployeeBenefitController();
