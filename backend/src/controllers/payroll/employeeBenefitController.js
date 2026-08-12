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

    async bulkCreate(req, res) {
        try {
            const { employeeIds, name, amount, type, frequency, isSpecialCalculation } = req.body;

            if (!employeeIds || !Array.isArray(employeeIds)) {
                return res.status(400).json({ success: false, message: 'Se requiere una lista de empleados' });
            }

            let empMap = new Map();
            if (isSpecialCalculation === 'DECIMO_TERCERO') {
                const employees = await prisma.employee.findMany({
                    where: { id: { in: employeeIds } },
                    select: { id: true, salary: true }
                });
                empMap = new Map(employees.map(e => [e.id, e]));
            }

            const benefits = [];

            for (const empId of employeeIds) {
                let finalAmount = parseFloat(amount);

                if (isSpecialCalculation === 'DECIMO_TERCERO') {
                    const emp = empMap.get(empId);
                    if (emp && emp.salary) {
                        const baseSalary = parseFloat(emp.salary.replace(/[^0-9.]/g, '')) || 0;
                        finalAmount = baseSalary;
                    }
                } else if (isSpecialCalculation === 'DECIMO_CUARTO') {
                    finalAmount = 460.00;
                }

                benefits.push({
                    employeeId: empId,
                    name,
                    amount: finalAmount,
                    type: type || 'BONUS',
                    frequency: frequency || 'ONE_TIME',
                    status: 'ACTIVE'
                });
            }

            await prisma.employeeBenefit.createMany({
                data: benefits
            });

            res.status(201).json({ success: true, message: `${benefits.length} beneficios asignados correctamente` });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error en asignación masiva' });
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
