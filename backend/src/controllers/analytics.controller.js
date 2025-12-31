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

export const getTurnoverReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate) : new Date();

        // 1. Turnover Rate Calculation
        // Formula: (Exits / Avg Employees) * 100

        const exits = await prisma.employee.findMany({
            where: {
                isActive: false,
                exitDate: {
                    gte: start,
                    lte: end
                }
            }
        });

        const activeEmployees = await prisma.employee.count({
            where: { isActive: true }
        });

        // Simplified Avg: Existing + Exits (Roughly)
        const totalExits = exits.length;
        const avgEmployees = activeEmployees + totalExits; // Approximation for period
        const turnoverRate = avgEmployees > 0 ? ((totalExits / avgEmployees) * 100).toFixed(2) : 0;

        // 2. Exits by Type
        const exitsByType = exits.reduce((acc, curr) => {
            const type = curr.exitType || 'N/A';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        // 3. Exits by Reason
        const exitsByReason = exits.reduce((acc, curr) => {
            const reason = curr.exitReason || 'N/S';
            acc[reason] = (acc[reason] || 0) + 1;
            return acc;
        }, {});

        res.json({
            turnoverRate,
            totalExits,
            exitsByType: Object.keys(exitsByType).map(key => ({ name: key, value: exitsByType[key] })),
            exitsByReason: Object.keys(exitsByReason).map(key => ({ name: key, value: exitsByReason[key] })),
            exitsList: exits.map(e => ({
                id: e.id,
                name: `${e.firstName} ${e.lastName}`,
                department: e.department,
                exitDate: e.exitDate,
                type: e.exitType,
                reason: e.exitReason
            }))
        });

    } catch (error) {
        console.error("Error generating turnover report:", error);
        res.status(500).json({ message: "Error al generar reporte de rotación" });
    }
};

export const getPerformanceReport = async (req, res) => {
    try {
        const { startDate, endDate, department } = req.query;

        console.log("Analytics: Generating Performance Report", { startDate, endDate, department });

        // Filters
        const whereClause = {
            status: 'COMPLETED',
            // If date range provided, filter by evaluation end date (completion)
            ...(startDate && endDate ? {
                endDate: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            } : {})
        };

        // If department filtered, we need to filter employees first or use nested check
        // Prisma doesn't support deep filtering easily in aggregations, so we might fetch and process or use includes
        if (department) {
            whereClause.employee = {
                department: department
            };
        }

        const evaluations = await prisma.employeeEvaluation.findMany({
            where: whereClause,
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        department: true,
                        position: true
                    }
                }
            }
        });

        // 1. Avg Score by Department
        const deptScores = {};
        const deptCounts = {};

        evaluations.forEach(ev => {
            const dept = ev.employee.department || 'Sin Dept';
            const score = ev.finalScore || 0;

            deptScores[dept] = (deptScores[dept] || 0) + score;
            deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        });

        const avgScoreByDept = Object.keys(deptScores).map(dept => ({
            department: dept,
            average: parseFloat((deptScores[dept] / deptCounts[dept]).toFixed(2))
        }));

        // 2. Rankings (Top & Bottom)
        // Sort by finalScore
        const sortedEvaluations = [...evaluations].sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));

        const topPerformers = sortedEvaluations.slice(0, 5).map(ev => ({
            id: ev.employee.id,
            name: `${ev.employee.firstName} ${ev.employee.lastName}`,
            department: ev.employee.department,
            score: ev.finalScore
        }));

        const lowPerformers = [...sortedEvaluations].reverse().slice(0, 5).map(ev => ({
            id: ev.employee.id,
            name: `${ev.employee.firstName} ${ev.employee.lastName}`,
            department: ev.employee.department,
            score: ev.finalScore
        }));

        // 3. Distribution (Bell Curve)
        const distribution = {
            '0-2 (Bajo)': 0,
            '2-3 (Regular)': 0,
            '3-4 (Bueno)': 0,
            '4-5 (Excelente)': 0
        };

        evaluations.forEach(ev => {
            const score = ev.finalScore || 0;
            if (score < 2) distribution['0-2 (Bajo)']++;
            else if (score < 3) distribution['2-3 (Regular)']++;
            else if (score < 4) distribution['3-4 (Bueno)']++;
            else distribution['4-5 (Excelente)']++;
        });

        const distributionChartData = Object.keys(distribution).map(key => ({
            range: key,
            count: distribution[key]
        }));


        // 4. Recommendations for List
        const formatRecommendation = (score) => {
            if (score >= 4.5) return 'Promoción / Bono';
            if (score >= 3.5) return 'Felicitar / Mantener';
            if (score >= 2.5) return 'Capacitación';
            return 'Plan de Mejora (PIP)';
        };

        const detailedList = evaluations.map(ev => ({
            id: ev.id,
            employeeName: `${ev.employee.firstName} ${ev.employee.lastName}`,
            department: ev.employee.department,
            position: ev.employee.position,
            score: ev.finalScore,
            recommendation: formatRecommendation(ev.finalScore || 0),
            date: ev.endDate
        }));

        res.json({
            avgScoreByDept,
            topPerformers,
            lowPerformers,
            distributionChartData,
            detailedList
        });

    } catch (error) {
        console.error("Error generating performance report:", error);
        res.status(500).json({ message: "Error al generar reporte de desempeño" });
    }
};

export const getPayrollCostReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log("Analytics: Generating Payroll Cost Report", { startDate, endDate });

        // Filter by Payroll Payment Date (or CreatedAt if not paid yet, but usually we report on Paid)
        // Adjust status filter as needed (e.g., 'PAID' or 'ISSUED')
        const whereClause = {
            // status: 'PAID', // Optional: Check if we only want paid
            ...(startDate && endDate ? {
                createdAt: { // Using createdAt or paymentDate
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            } : {})
        };

        const payrolls = await prisma.payroll.findMany({
            where: whereClause,
            include: {
                details: {
                    include: {
                        employee: {
                            select: { department: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // 1. Cost Breakdown (Total)
        let totalBaseSalary = 0;
        let totalOvertime = 0;
        let totalBonuses = 0;
        let totalDeductions = 0; // If tracked separately for company cost? Usually internal cost is Gross.
        // Gross Cost = Base + Overtime + Bonuses + Benefits(if any)

        // 2. Costs by Department
        const deptCosts = {};

        // 3. Trend Data (Monthly)
        const trendMap = {};

        payrolls.forEach(payroll => {
            const date = new Date(payroll.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!trendMap[monthKey]) {
                trendMap[monthKey] = { name: monthKey, total: 0, salary: 0, overtime: 0, extras: 0 };
            }

            payroll.details.forEach(detail => {
                const base = detail.baseSalary || 0;
                // Parse Overtime
                const ot = detail.overtimeAmount || 0;

                // Parse Bonuses JSON
                let bonuses = 0;
                try {
                    const bonusList = JSON.parse(detail.bonuses || '[]');
                    if (Array.isArray(bonusList)) {
                        bonuses = bonusList.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
                    }
                } catch (e) { console.error("Error parsing bonuses JSON", e); }

                const totalDetailCost = base + ot + bonuses;

                // Aggregates
                totalBaseSalary += base;
                totalOvertime += ot;
                totalBonuses += bonuses;

                // Dept
                const dept = detail.employee?.department || 'Sin Dept';
                deptCosts[dept] = (deptCosts[dept] || 0) + totalDetailCost;

                // Trend
                trendMap[monthKey].total += totalDetailCost;
                trendMap[monthKey].salary += base;
                trendMap[monthKey].overtime += ot;
                trendMap[monthKey].extras += bonuses;
            });
        });

        // Format Charts
        const totalCost = totalBaseSalary + totalOvertime + totalBonuses;

        const breakdownChartData = [
            { name: 'Salario Base', value: totalBaseSalary },
            { name: 'Horas Extras', value: totalOvertime },
            { name: 'Bonificaciones', value: totalBonuses }
        ];

        const deptChartData = Object.keys(deptCosts).map(dept => ({
            name: dept,
            value: deptCosts[dept]
        }));

        const trendChartData = Object.values(trendMap).sort((a, b) => a.name.localeCompare(b.name));

        res.json({
            metrics: {
                totalCost,
                avgMonthlyCost: trendChartData.length ? (totalCost / trendChartData.length) : totalCost,
                headcount: payrolls.reduce((acc, p) => acc + p.details.length, 0) // Naive headcount sum (sum of payroll records)
            },
            charts: {
                breakdown: breakdownChartData,
                byDepartment: deptChartData,
                trend: trendChartData
            },
            raw: trendChartData // Or monthly list
        });

    } catch (error) {
        console.error("Error generating payroll cost report:", error);
        res.status(500).json({ message: "Error al generar reporte de costos" });
    }
};

export const getSatisfactionReport = async (req, res) => {
    try {
        console.log("Analytics: Generating Satisfaction Report");
        // For MVP, we fetch the latest active or most recent survey
        const survey = await prisma.climateSurvey.findFirst({
            orderBy: { createdAt: 'desc' },
            include: { responses: true }
        });

        if (!survey) {
            // Need to Seed Data if empty?
            // Let's check count. If 0 surveys, maybe we return empty structure or auto-seed here heavily discouraged but...
            // Let's just return empty structure. Frontend will handle "No active survey".
            return res.json({
                index: 0,
                nps: 0,
                dimensions: [],
                participation: 0,
                comments: []
            });
        }

        const responses = survey.responses;
        if (responses.length === 0) {
            return res.json({
                index: 0,
                nps: 0,
                dimensions: [],
                participation: 0,
                comments: []
            });
        }

        // 1. Dimensions Analysis
        const dimensionSums = {};
        const dimensionCounts = {};
        let totalScoreSum = 0;
        let totalScoreCount = 0;

        // 2. NPS Calculation
        let promoters = 0;
        let detractors = 0;
        let npsCount = 0;

        // 3. Comments
        const comments = [];

        responses.forEach(resp => {
            // Ratings JSON
            try {
                const ratings = JSON.parse(resp.ratings || '{}');
                Object.keys(ratings).forEach(dim => {
                    const score = ratings[dim];
                    dimensionSums[dim] = (dimensionSums[dim] || 0) + score;
                    dimensionCounts[dim] = (dimensionCounts[dim] || 0) + 1;

                    totalScoreSum += score;
                    totalScoreCount++;
                });
            } catch (e) { }

            // NPS
            if (resp.npsScore !== null) {
                if (resp.npsScore >= 9) promoters++;
                else if (resp.npsScore <= 6) detractors++;
                npsCount++;
            }

            // Comments
            if (resp.comments) {
                comments.push({
                    text: resp.comments,
                    dept: resp.department || 'General'
                });
            }
        });

        // Calculate Averages
        const dimensions = Object.keys(dimensionSums).map(dim => ({
            subject: dim,
            A: parseFloat((dimensionSums[dim] / dimensionCounts[dim]).toFixed(1)), // Radar chart expects value often as A or value
            fullMark: 5
        }));

        // Overall Index (0-100%) based on 5-point scale
        const avgScore = totalScoreCount > 0 ? (totalScoreSum / totalScoreCount) : 0;
        const index = Math.round((avgScore / 5) * 100);

        // NPS
        const nps = npsCount > 0 ? Math.round(((promoters - detractors) / npsCount) * 100) : 0;

        res.json({
            surveyTitle: survey.title,
            index,
            nps,
            dimensions,
            participation: responses.length,
            comments: comments.slice(0, 10) // Top 10 recent
        });

    } catch (error) {
        console.error("Error generating satisfaction report:", error);
        res.status(500).json({ message: "Error al generar reporte de satisfacción" });
    }
};

export const getCustomReport = async (req, res) => {
    try {
        const { module, fields, filters } = req.body;
        console.log("Analytics: Custom Report Request", { module, fields, filters });

        // Map safe module names to prisma delegates
        const modelMap = {
            'employees': prisma.employee,
            'payrolls': prisma.payroll,
            'job_applications': prisma.jobApplication,
            'evaluations': prisma.employeeEvaluation
        };

        const delegate = modelMap[module];
        if (!delegate) {
            return res.status(400).json({ message: "Módulo no válido" });
        }

        // Construct Select
        let select = undefined;
        if (fields && fields.length > 0) {
            select = {};
            fields.forEach(f => select[f] = true);
            // Always ensure ID is selected to be safe? Or stick to user request.
            // If fields are nested (e.g. employee.department), Prisma handles it differently.
            // For MVP, we assume flat fields or handle specific relations manually if needed.
            // Let's assume fields are top-level for now.

            // Check for relation fields request
            // e.g. if module is 'evaluations', user wants 'employee.firstName'
            // This simple builder might struggle with deep relations without sophisticated parsing.
            // We will stick to flat fields of the main model for V1.
        }

        // Construct Where
        const where = {};
        if (filters) {
            if (filters.department) where.department = filters.department;
            if (filters.status) where.status = filters.status;
            // Date handling generic path
            if (filters.dateRange && filters.dateField) {
                where[filters.dateField] = {
                    gte: new Date(filters.dateRange.start),
                    lte: new Date(filters.dateRange.end)
                };
            }
        }

        // Execute
        const data = await delegate.findMany({
            where,
            select: select // undefined means all fields
        });

        res.json(data);

    } catch (error) {
        console.error("Error generating custom report:", error);
        res.status(500).json({ message: "Error al generar reporte personalizado" });
    }
};
