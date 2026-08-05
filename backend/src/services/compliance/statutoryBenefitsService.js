import prisma from '../../database/db.js';
import { financial } from '../../utils/financialUtils.js';

class StatutoryBenefitsService {
    // Sueldo Básico Unificado de referencia (Ecuador 2026 = $460.00)
    SBU = 460.00;

    /**
     * Matriz de Provisiones Mensuales y Beneficios Sociales Patronales de Ley.
     */
    async calculateStatutoryProvisions(month = new Date().getMonth() + 1, year = new Date().getFullYear(), tenantId = null) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const empWhere = {
            ...(tenantId ? { tenantId } : {}),
            contracts: {
                some: {
                    startDate: { lte: endDate },
                    OR: [{ endDate: null }, { endDate: { gte: startDate } }],
                    status: 'Active'
                }
            }
        };

        // Obtener todos los empleados activos con su contrato vigente
        const employees = await prisma.employee.findMany({
            where: empWhere,
            include: {
                contracts: {
                    where: {
                        startDate: { lte: endDate },
                        OR: [{ endDate: null }, { endDate: { gte: startDate } }],
                        status: 'Active'
                    },
                    orderBy: { startDate: 'desc' },
                    take: 1
                }
            }
        });

        const provisionsList = [];
        let totalCompanyProvisions = financial.from(0);
        const byDepartment = {};

        for (const emp of employees) {
            const contract = emp.contracts[0];
            if (!contract) continue;

            const baseSalary = financial.from(contract.salary);
            const empStartDate = new Date(contract.startDate);

            // Antigüedad en meses
            const diffDays = Math.ceil(Math.abs(endDate - empStartDate) / (1000 * 60 * 60 * 24));
            const monthsWorked = diffDays / 30.4375;

            // 1. Décimo Tercero (8.33% = 1/12 sueldo base)
            const thirteenthProvision = financial.multiply(baseSalary, 0.083333);

            // 2. Décimo Cuarto (SBU / 12 = $460 / 12 = $38.33 por mes)
            const fourteenthProvision = financial.divide(financial.from(this.SBU), 12);

            // 3. Fondos de Reserva (8.33% si tiene más de 1 año de trabajo = 12 meses)
            const hasReserveFund = monthsWorked >= 12;
            const reserveFundProvision = hasReserveFund ? financial.multiply(baseSalary, 0.083333) : financial.from(0);

            // 4. Provisión Vacaciones (4.17% = 15 días por año = 1.25 días/mes)
            const vacationProvision = financial.multiply(baseSalary, 0.041667);

            // Total Provisión Mensual Patronal por Empleado
            const empTotalProvision = thirteenthProvision
                .plus(fourteenthProvision)
                .plus(reserveFundProvision)
                .plus(vacationProvision);

            totalCompanyProvisions = totalCompanyProvisions.plus(empTotalProvision);

            const dept = emp.department || 'General';
            if (!byDepartment[dept]) {
                byDepartment[dept] = {
                    department: dept,
                    employeeCount: 0,
                    totalBaseSalary: 0,
                    thirteenth: 0,
                    fourteenth: 0,
                    reserveFund: 0,
                    vacation: 0,
                    totalProvisions: 0
                };
            }

            byDepartment[dept].employeeCount += 1;
            byDepartment[dept].totalBaseSalary += financial.round(baseSalary);
            byDepartment[dept].thirteenth += financial.round(thirteenthProvision);
            byDepartment[dept].fourteenth += financial.round(fourteenthProvision);
            byDepartment[dept].reserveFund += financial.round(reserveFundProvision);
            byDepartment[dept].vacation += financial.round(vacationProvision);
            byDepartment[dept].totalProvisions += financial.round(empTotalProvision);

            provisionsList.push({
                employee: {
                    id: emp.id,
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    identityCard: emp.identityCard,
                    department: emp.department,
                    position: emp.position
                },
                baseSalary: financial.round(baseSalary),
                monthsWorked: Number(monthsWorked.toFixed(1)),
                hasReserveFund,
                thirteenthProvision: financial.round(thirteenthProvision),
                fourteenthProvision: financial.round(fourteenthProvision),
                reserveFundProvision: financial.round(reserveFundProvision),
                vacationProvision: financial.round(vacationProvision),
                totalEmpProvision: financial.round(empTotalProvision)
            });
        }

        return {
            period: { month, year },
            summary: {
                totalEmployees: employees.length,
                sbuReference: this.SBU,
                totalBaseSalary: provisionsList.reduce((sum, p) => sum + p.baseSalary, 0),
                totalThirteenth: provisionsList.reduce((sum, p) => sum + p.thirteenthProvision, 0),
                totalFourteenth: provisionsList.reduce((sum, p) => sum + p.fourteenthProvision, 0),
                totalReserveFund: provisionsList.reduce((sum, p) => sum + p.reserveFundProvision, 0),
                totalVacation: provisionsList.reduce((sum, p) => sum + p.vacationProvision, 0),
                totalCompanyProvisions: financial.round(totalCompanyProvisions)
            },
            byDepartment: Object.values(byDepartment),
            provisionsList
        };
    }
}

export default new StatutoryBenefitsService();
