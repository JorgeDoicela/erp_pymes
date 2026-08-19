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
            const contractEnd = contract.endDate ? new Date(contract.endDate) : null;

            // Antigüedad total acumulada en días y meses
            const diffDays = Math.max(0, Math.ceil((endDate - empStartDate) / (1000 * 60 * 60 * 24)) + 1);
            const monthsWorked = diffDays / 30.0;

            // Proporcionalidad para ingresos o salidas a mitad de mes (30 días comerciales)
            const effectiveStart = empStartDate > startDate ? empStartDate : startDate;
            const effectiveEnd = (contractEnd && contractEnd < endDate) ? contractEnd : endDate;
            const isFullMonth = effectiveStart.getTime() <= startDate.getTime() && (!contractEnd || contractEnd >= endDate);
            const daysInMonth = isFullMonth ? 30 : Math.min(30, Math.max(0, Math.ceil((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)) + 1));

            // Remuneración base computable para el período
            const earnedSalaryInMonth = isFullMonth ? baseSalary : financial.divide(financial.multiply(baseSalary, daysInMonth), 30);

            // 1. Décimo Tercero (1/12 de la remuneración mensual = 8.333...%)
            const thirteenthProvision = financial.divide(earnedSalaryInMonth, 12);

            // 2. Décimo Cuarto (SBU / 12 = $460 / 12 = $38.33 por mes completo, proporcional si ingresó a medio mes)
            const fourteenthProvision = isFullMonth
                ? financial.divide(financial.from(this.SBU), 12)
                : financial.divide(financial.multiply(financial.from(this.SBU), daysInMonth), 360);

            // 3. Fondos de Reserva (8.333...% = 1/12 de la remuneración a partir de 1 año / 365 días de servicio)
            const hasReserveFund = diffDays >= 365 || monthsWorked >= 12;
            const reserveFundProvision = hasReserveFund ? financial.divide(earnedSalaryInMonth, 12) : financial.from(0);

            // 4. Provisión Vacaciones (15 días anuales / 360 días = 1/24 de la remuneración = 4.1666...%)
            const vacationProvision = financial.divide(earnedSalaryInMonth, 24);

            const rThirteenth = financial.round(thirteenthProvision);
            const rFourteenth = financial.round(fourteenthProvision);
            const rReserveFund = financial.round(reserveFundProvision);
            const rVacation = financial.round(vacationProvision);

            // Total Provisión Mensual Patronal por Empleado
            const empTotalProvision = financial.from(rThirteenth)
                .plus(rFourteenth)
                .plus(rReserveFund)
                .plus(rVacation);

            totalCompanyProvisions = totalCompanyProvisions.plus(empTotalProvision);

            const dept = emp.department || 'General';
            if (!byDepartment[dept]) {
                byDepartment[dept] = {
                    department: dept,
                    employeeCount: 0,
                    totalBaseSalary: financial.from(0),
                    thirteenth: financial.from(0),
                    fourteenth: financial.from(0),
                    reserveFund: financial.from(0),
                    vacation: financial.from(0),
                    totalProvisions: financial.from(0)
                };
            }

            byDepartment[dept].employeeCount += 1;
            byDepartment[dept].totalBaseSalary = byDepartment[dept].totalBaseSalary.plus(financial.round(earnedSalaryInMonth));
            byDepartment[dept].thirteenth = byDepartment[dept].thirteenth.plus(rThirteenth);
            byDepartment[dept].fourteenth = byDepartment[dept].fourteenth.plus(rFourteenth);
            byDepartment[dept].reserveFund = byDepartment[dept].reserveFund.plus(rReserveFund);
            byDepartment[dept].vacation = byDepartment[dept].vacation.plus(rVacation);
            byDepartment[dept].totalProvisions = byDepartment[dept].totalProvisions.plus(empTotalProvision);

            provisionsList.push({
                employee: {
                    id: emp.id,
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    identityCard: emp.identityCard,
                    department: emp.department,
                    position: emp.position
                },
                baseSalary: financial.round(earnedSalaryInMonth),
                daysWorkedInMonth: daysInMonth,
                monthsWorked: Number(monthsWorked.toFixed(1)),
                hasReserveFund,
                thirteenthProvision: rThirteenth,
                fourteenthProvision: rFourteenth,
                reserveFundProvision: rReserveFund,
                vacationProvision: rVacation,
                totalEmpProvision: financial.round(empTotalProvision)
            });
        }

        const formattedByDept = Object.values(byDepartment).map(d => ({
            department: d.department,
            employeeCount: d.employeeCount,
            totalBaseSalary: financial.round(d.totalBaseSalary),
            thirteenth: financial.round(d.thirteenth),
            fourteenth: financial.round(d.fourteenth),
            reserveFund: financial.round(d.reserveFund),
            vacation: financial.round(d.vacation),
            totalProvisions: financial.round(d.totalProvisions)
        }));

        const totalBaseSalary = provisionsList.reduce((sum, p) => sum.plus(p.baseSalary), financial.from(0));
        const totalThirteenth = provisionsList.reduce((sum, p) => sum.plus(p.thirteenthProvision), financial.from(0));
        const totalFourteenth = provisionsList.reduce((sum, p) => sum.plus(p.fourteenthProvision), financial.from(0));
        const totalReserveFund = provisionsList.reduce((sum, p) => sum.plus(p.reserveFundProvision), financial.from(0));
        const totalVacation = provisionsList.reduce((sum, p) => sum.plus(p.vacationProvision), financial.from(0));

        const finalTotalCompanyProvisions = totalThirteenth
            .plus(totalFourteenth)
            .plus(totalReserveFund)
            .plus(totalVacation);

        return {
            period: { month, year },
            summary: {
                totalEmployees: employees.length,
                sbuReference: this.SBU,
                totalBaseSalary: financial.round(totalBaseSalary),
                totalThirteenth: financial.round(totalThirteenth),
                totalFourteenth: financial.round(totalFourteenth),
                totalReserveFund: financial.round(totalReserveFund),
                totalVacation: financial.round(totalVacation),
                totalCompanyProvisions: financial.round(finalTotalCompanyProvisions)
            },
            byDepartment: formattedByDept,
            provisionsList
        };
    }
}

export default new StatutoryBenefitsService();
