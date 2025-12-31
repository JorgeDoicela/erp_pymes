import prisma from '../../database/db.js';

class EmployeeBenefitController {
    async create(req, res) {
        try {
            const { employeeId, name, amount, type, frequency } = req.body;

            const benefit = await prisma.employeeBenefit.create({
                data: {
                    employeeId,
                    name,
                    amount: parseFloat(amount),
                    type, // BONUS, INCENTIVE
                    frequency, // ONE_TIME, RECURRING
                    status: 'ACTIVE'
                }
            });

            res.status(201).json({ success: true, data: benefit });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error al asignar beneficio' });
        }
    }

    async getByEmployee(req, res) {
        try {
            const { employeeId } = req.params;
            const benefits = await prisma.employeeBenefit.findMany({
                where: { employeeId },
                orderBy: { createdAt: 'desc' }
            });
            res.status(200).json({ success: true, data: benefits });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error al obtener beneficios' });
        }
    }

    async deactivate(req, res) {
        try {
            const { id } = req.params;
            await prisma.employeeBenefit.update({
                where: { id },
                data: { status: 'CANCELLED' }
            });
            res.status(200).json({ success: true, message: 'Beneficio cancelado' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error al cancelar beneficio' });
        }
    }
}

export default new EmployeeBenefitController();
