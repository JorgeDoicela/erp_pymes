import prisma from '../../database/db.js';

class PayrollCalculationService {
    async generatePayroll(month, year) {
        // 1. Check if payroll already exists for this period
        // Period is 1st day of the month
        const periodDate = new Date(year, month - 1, 1);
        const existingPayroll = await prisma.payroll.findFirst({
            where: {
                period: periodDate
            }
        });

        if (existingPayroll) {
            throw new Error(`Ya existe una nómina para el período ${month}/${year}`);
        }

        // 2. Get Configuration
        const config = await prisma.payrollConfig.findFirst({
            where: { isActive: true },
            include: { items: true }
        });

        if (!config) {
            throw new Error("No hay configuración de nómina activa. Configure los parámetros primero.");
        }

        // 3. Get Active Employees with Contracts
        const employees = await prisma.employee.findMany({
            where: {
                // Ensure they have at least one active contract
                contracts: {
                    some: {
                        status: 'Active'
                    }
                }
            },
            include: {
                contracts: {
                    where: { status: 'Active' },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        const payrollDetails = [];
        let totalPayrollAmount = 0;

        // 4. Calculate for each employee
        for (const emp of employees) {
            const contract = emp.contracts[0];
            if (!contract) continue; // Skip if no active contract

            const baseSalary = contract.salary;

            // A. Attendance Data (Mocked or Real)
            // Ideally we query Attendance model for count of 'Late', 'Absent', 'WorkedHours'
            // For now, we assume 30 days unless absent
            // Logic: Get 'Absent' count in the date range
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0); // Last day of month

            const absences = await prisma.attendance.count({
                where: {
                    employeeId: emp.id,
                    status: 'Falta',
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });

            // Fetch attendance records for overtime calc

            // Fetch attendance records for overtime calc
            const records = await prisma.attendance.findMany({
                where: {
                    employeeId: emp.id,
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });

            let workedDays = config.workingDays - absences; // Default 30 - absences
            if (workedDays < 0) workedDays = 0;

            let totalOvertimeHours = 0;
            records.forEach(rec => {
                if (rec.workedHours > 8) {
                    totalOvertimeHours += (rec.workedHours - 8);
                }
            });

            // B. Calculations
            // Proportional Salary
            const salaryPerDay = baseSalary / config.workingDays; // 30
            const earnedSalary = salaryPerDay * workedDays;

            // Overtime Cost (1.5x)
            const overtimeRate = (baseSalary / 240) * 1.5; // 240 hours = 30 * 8
            const overtimeAmount = totalOvertimeHours * overtimeRate;

            // Items (Bonuses/Deductions)
            const employeeBonuses = [];
            const employeeDeductions = [];

            config.items.forEach(item => {
                let amount = 0;
                if (item.fixedValue) {
                    amount = item.fixedValue;
                } else if (item.percentage) {
                    amount = (earnedSalary * item.percentage) / 100;
                }

                if (item.type === 'EARNING') {
                    employeeBonuses.push({ name: item.name, amount });
                } else {
                    employeeDeductions.push({ name: item.name, amount });
                }
            });

            const totalBonuses = employeeBonuses.reduce((acc, curr) => acc + curr.amount, 0);
            const totalDeductions = employeeDeductions.reduce((acc, curr) => acc + curr.amount, 0);

            let netSalary = earnedSalary + overtimeAmount + totalBonuses - totalDeductions;
            if (netSalary < 0) netSalary = 0;

            payrollDetails.push({
                employeeId: emp.id,
                baseSalary: baseSalary,
                workedDays: workedDays,
                overtimeHours: parseFloat(totalOvertimeHours.toFixed(2)),
                overtimeAmount: parseFloat(overtimeAmount.toFixed(2)),
                bonuses: JSON.stringify(employeeBonuses),
                deductions: JSON.stringify(employeeDeductions),
                netSalary: parseFloat(netSalary.toFixed(2))
            });

            totalPayrollAmount += netSalary;
        }

        // 5. Save to DB
        const payroll = await prisma.payroll.create({
            data: {
                period: periodDate,
                endDate: new Date(year, month, 0),
                totalAmount: parseFloat(totalPayrollAmount.toFixed(2)),
                status: 'DRAFT',
                details: {
                    create: payrollDetails
                }
            },
            include: {
                details: {
                    include: { employee: true }
                }
            }
        });

        return payroll;
    }

    async getPayrolls() {
        return await prisma.payroll.findMany({
            orderBy: { period: 'desc' }
        });
    }

    async getPayrollById(id) {
        return await prisma.payroll.findUnique({
            where: { id },
            include: {
                details: {
                    include: { employee: true }
                }
            }
        });
    }

    async confirmPayroll(id) {
        return await prisma.payroll.update({
            where: { id },
            data: { status: 'APPROVED' }
        });
    }
}

export default new PayrollCalculationService();
