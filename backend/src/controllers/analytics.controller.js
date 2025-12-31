import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardData = async (req, res) => {
    console.log("Analytics: Request received for dashboard data");
    try {
        // --- KPIs ---

        // 1. Total Employees
        const totalEmployees = await prisma.employee.count();
        console.log("Analytics: Total Employees:", totalEmployees);

        // 2. New Hires (Current Month)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newHires = await prisma.employee.count({
            where: { hireDate: { gte: startOfMonth } }
        });
        console.log("Analytics: New Hires:", newHires);

        // 3. Open Vacancies
        const openVacancies = await prisma.jobVacancy.count({
            where: { status: 'OPEN' }
        });
        console.log("Analytics: Open Vacancies:", openVacancies);

        // 4. Monthly Payroll Estimate
        const employees = await prisma.employee.findMany({
            select: { id: true, salary: true, department: true }
        });

        let payrollTotal = 0;
        employees.forEach(emp => {
            try {
                if (!emp.salary) return;
                // Mock Decryption: Remove "ENC:" prefix if present
                const rawSalary = emp.salary.replace('ENC:', '');
                const val = parseFloat(rawSalary);
                if (!isNaN(val)) {
                    payrollTotal += val;
                }
            } catch (err) {
                console.error(`Analytics: Error parsing salary for emp ${emp.id}`, err);
            }
        });
        console.log("Analytics: Payroll Total:", payrollTotal);


        // --- CHARTS ---

        // 1. Employees by Department
        const employeesByDept = await prisma.employee.groupBy({
            by: ['department'],
            _count: { id: true }
        });
        const deptChartData = employeesByDept.map(item => ({
            name: item.department || 'Sin Dept',
            value: item._count.id
        }));

        // 2. Vacancies by Department
        const vacanciesByDept = await prisma.jobVacancy.groupBy({
            by: ['department'],
            _count: { id: true },
            where: { status: 'OPEN' }
        });
        const vacancyChartData = vacanciesByDept.map(item => ({
            name: item.department || 'Sin Dept',
            value: item._count.id
        }));

        console.log("Analytics: Sending response");
        res.json({
            kpis: {
                totalEmployees,
                newHires,
                openVacancies,
                payrollTotal
            },
            charts: {
                deptChartData,
                vacancyChartData
            }
        });

    } catch (error) {
        console.error("Error fetching analytics (CRITICAL):", error);
        res.status(500).json({ message: "Error al obtener datos del dashboard", error: error.message });
    }
};
