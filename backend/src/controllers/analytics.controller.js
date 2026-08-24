import prisma from '../database/db.js';
import { financial } from '../utils/financialUtils.js';

export const getDashboardData = async (req, res) => {
    console.log("Analytics: Request received for dashboard data");
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        const isSuperAdmin = req.user?.role === 'superadmin' || req.user?.role === 'SUPERADMIN';

        if (!tenantId && !isSuperAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Contexto de empresa (tenantId) no especificado.',
                code: 'TENANT_ID_REQUIRED'
            });
        }

        const tenantWhere = tenantId ? { tenantId } : {};

        // --- KPIs ---

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Run independent KPI & Chart queries concurrently via Promise.all
        const [
            totalEmployees,
            newHires,
            openVacancies,
            employeesByDept,
            vacanciesByDept,
            activeContractsByDept,
            activeEmployees
        ] = await Promise.all([
            prisma.employee.count({ where: tenantWhere }),
            prisma.employee.count({
                where: {
                    ...tenantWhere,
                    hireDate: { gte: startOfMonth }
                }
            }),
            prisma.jobVacancy.count({
                where: {
                    status: 'OPEN',
                    ...tenantWhere
                }
            }),
            prisma.employee.groupBy({
                by: ['department'],
                where: tenantWhere,
                _count: { id: true }
            }),
            prisma.jobVacancy.groupBy({
                by: ['department'],
                _count: { id: true },
                where: {
                    status: 'OPEN',
                    ...tenantWhere
                }
            }),
            prisma.contract.findMany({
                where: {
                    status: 'Active',
                    ...(tenantId ? { employee: { tenantId } } : {})
                },
                select: {
                    salary: true,
                    employee: {
                        select: {
                            department: true
                        }
                    }
                }
            }),
            prisma.employee.findMany({
                where: { ...tenantWhere, isActive: true },
                select: { department: true, salary: true }
            })
        ]);

        const deptChartData = (employeesByDept || []).map(item => ({
            name: item.department || 'Sin Dept',
            value: item._count.id
        }));

        const vacancyChartData = (vacanciesByDept || []).map(item => ({
            name: item.department || 'Sin Dept',
            value: item._count.id
        }));

        let payrollTotal = 0;
        const deptSalaryMap = {};

        if (activeContractsByDept && activeContractsByDept.length > 0) {
            activeContractsByDept.forEach(c => {
                const dept = c.employee?.department || 'Sin Dept';
                const sal = Number(c.salary) || 0;
                deptSalaryMap[dept] = (deptSalaryMap[dept] || 0) + sal;
                payrollTotal += sal;
            });
        } else if (activeEmployees && activeEmployees.length > 0) {
            // Fallback usando los salarios en ficha de empleado
            activeEmployees.forEach(emp => {
                const dept = emp.department || 'Sin Dept';
                const sal = parseFloat(emp.salary) || 0;
                deptSalaryMap[dept] = (deptSalaryMap[dept] || 0) + sal;
                payrollTotal += sal;
            });
        }

        const payrollByDeptChartData = Object.keys(deptSalaryMap).map(dept => ({
            name: dept,
            salary: financial.round(deptSalaryMap[dept] || 0)
        })).sort((a, b) => b.salary - a.salary);

        console.log("Analytics: Sending response successfully");
        res.json({
            kpis: {
                totalEmployees: totalEmployees || 0,
                newHires: newHires || 0,
                openVacancies: openVacancies || 0,
                payrollTotal: financial.round(payrollTotal || 0)
            },
            charts: {
                deptChartData,
                vacancyChartData,
                payrollByDeptChartData
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
        const tenantId = req.tenantId || req.user?.tenantId;
        const tenantWhere = tenantId ? { tenantId } : {};

        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate) : new Date();

        // 1. Turnover Rate Calculation
        // Formula: (Exits / Avg Employees) * 100

        // Run turnover queries concurrently with selective column fields
        const [exits, activeEmployees] = await Promise.all([
            prisma.employee.findMany({
                where: {
                    ...tenantWhere,
                    isActive: false,
                    exitDate: {
                        gte: start,
                        lte: end
                    }
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    department: true,
                    exitDate: true,
                    exitType: true,
                    exitReason: true
                }
            }),
            prisma.employee.count({
                where: {
                    ...tenantWhere,
                    isActive: true
                }
            })
        ]);

        // Simplified Avg: Existing + Exits (Roughly)
        const totalExits = exits.length;
        const avgEmployees = activeEmployees + totalExits; // Approximation for period
        const turnoverRate = avgEmployees > 0 ? parseFloat(((totalExits / avgEmployees) * 100).toFixed(2)) : 0;

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
        const tenantId = req.tenantId || req.user?.tenantId;

        console.log("Analytics: Generating Performance Report", { startDate, endDate, department });

        // Filters
        const whereClause = {
            status: 'COMPLETED',
            ...(tenantId ? { employee: { tenantId } } : {}),
            ...(startDate && endDate ? {
                endDate: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            } : {})
        };

        if (department) {
            whereClause.employee = {
                ...(whereClause.employee || {}),
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
        const tenantId = req.tenantId || req.user?.tenantId;
        console.log("Analytics: Generating Payroll Cost Report", { startDate, endDate });

        const whereClause = {
            ...(tenantId ? { tenantId } : {}),
            ...(startDate && endDate ? {
                createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            } : {})
        };

        const payrolls = await prisma.payroll.findMany({
            where: whereClause,
            select: {
                id: true,
                paymentDate: true,
                details: {
                    select: {
                        baseSalary: true,
                        overtimeAmount: true,
                        bonuses: true,
                        employee: {
                            select: { department: true }
                        }
                    }
                }
            },
            orderBy: { paymentDate: 'asc' }
        });

        // 1. Cost Breakdown (Total)
        let totalBaseSalary = financial.from(0);
        let totalOvertime = financial.from(0);
        let totalBonuses = financial.from(0);
        // Gross Cost = Base + Overtime + Bonuses + Benefits(if any)

        // 2. Costs by Department
        const deptCosts = {};

        // 3. Trend Data (Monthly)
        const trendMap = {};

        payrolls.forEach(payroll => {
            const date = new Date(payroll.paymentDate);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!trendMap[monthKey]) {
                trendMap[monthKey] = { name: monthKey, total: 0, salary: 0, overtime: 0, extras: 0 };
            }

            payroll.details.forEach(detail => {
                const base = financial.from(detail.baseSalary || 0);
                // Parse Overtime
                const ot = financial.from(detail.overtimeAmount || 0);

                // Parse Bonuses JSON
                let bonuses = financial.from(0);
                try {
                    const bonusList = JSON.parse(detail.bonuses || '[]');
                    if (Array.isArray(bonusList)) {
                        bonuses = bonusList.reduce((sum, b) => sum.plus(parseFloat(b.amount) || 0), financial.from(0));
                    }
                } catch (e) { console.error("Error parsing bonuses JSON", e); }

                const totalDetailCost = base.plus(ot).plus(bonuses);

                // Aggregates
                totalBaseSalary = totalBaseSalary.plus(base);
                totalOvertime = totalOvertime.plus(ot);
                totalBonuses = totalBonuses.plus(bonuses);

                // Dept
                const dept = detail.employee?.department || 'Sin Dept';
                deptCosts[dept] = financial.from(deptCosts[dept] || 0).plus(totalDetailCost);

                // Trend
                trendMap[monthKey].total = financial.from(trendMap[monthKey].total).plus(totalDetailCost);
                trendMap[monthKey].salary = financial.from(trendMap[monthKey].salary).plus(base);
                trendMap[monthKey].overtime = financial.from(trendMap[monthKey].overtime).plus(ot);
                trendMap[monthKey].extras = financial.from(trendMap[monthKey].extras).plus(bonuses);
            });
        });

        // Format Charts
        const totalCost = totalBaseSalary.plus(totalOvertime).plus(totalBonuses);

        const breakdownChartData = [
            { name: 'Salario Base', value: financial.round(totalBaseSalary) },
            { name: 'Horas Extras', value: financial.round(totalOvertime) },
            { name: 'Bonificaciones', value: financial.round(totalBonuses) }
        ];

        const deptChartData = Object.keys(deptCosts).map(dept => ({
            name: dept,
            value: financial.round(deptCosts[dept])
        }));

        const trendChartData = Object.values(trendMap).map(m => ({
            ...m,
            total: financial.round(m.total),
            salary: financial.round(m.salary),
            overtime: financial.round(m.overtime),
            extras: financial.round(m.extras)
        })).sort((a, b) => a.name.localeCompare(b.name));

        res.json({
            metrics: {
                totalCost: financial.round(totalCost),
                avgMonthlyCost: trendChartData.length ? financial.round(financial.divide(totalCost, trendChartData.length)) : financial.round(totalCost),
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
        const tenantId = req.tenantId || req.user?.tenantId;
        const survey = await prisma.climateSurvey.findFirst({
            where: tenantId ? { tenantId } : {},
            orderBy: { createdAt: 'desc' },
            include: { responses: true }
        });

        if (!survey) {
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

            if (resp.npsScore !== null) {
                if (resp.npsScore >= 9) promoters++;
                else if (resp.npsScore <= 6) detractors++;
                npsCount++;
            }

            if (resp.comments) {
                comments.push({
                    text: resp.comments,
                    dept: resp.department || 'General'
                });
            }
        });

        const dimensions = Object.keys(dimensionSums).map(dim => ({
            subject: dim,
            A: parseFloat((dimensionSums[dim] / dimensionCounts[dim]).toFixed(1)),
            fullMark: 5
        }));

        const avgScore = totalScoreCount > 0 ? (totalScoreSum / totalScoreCount) : 0;
        const index = Math.round((avgScore / 5) * 100);
        const nps = npsCount > 0 ? Math.round(((promoters - detractors) / npsCount) * 100) : 0;

        res.json({
            surveyTitle: survey.title,
            index,
            nps,
            dimensions,
            participation: responses.length,
            comments: comments.slice(0, 10)
        });

    } catch (error) {
        console.error("Error generating satisfaction report:", error);
        res.status(500).json({ message: "Error al generar reporte de satisfacción" });
    }
};

export const getCustomReport = async (req, res) => {
    try {
        const { module, fields, filters } = req.body;
        const tenantId = req.tenantId || req.user?.tenantId;
        console.log("Analytics: Custom Report Request", { module, fields, filters, tenantId });

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

        let select = undefined;
        if (fields && fields.length > 0) {
            select = {};
            fields.forEach(f => select[f] = true);
        }

        const where = {};
        if (tenantId) {
            if (module === 'employees' || module === 'payrolls') {
                where.tenantId = tenantId;
            } else if (module === 'evaluations') {
                where.employee = { tenantId };
            } else if (module === 'job_applications') {
                where.vacancy = { tenantId };
            }
        }

        if (filters) {
            if (filters.department) where.department = filters.department;
            if (filters.status) where.status = filters.status;
            if (filters.dateRange && filters.dateField) {
                where[filters.dateField] = {
                    gte: new Date(filters.dateRange.start),
                    lte: new Date(filters.dateRange.end)
                };
            }
        }

        const maxTake = req.body.limit ? parseInt(req.body.limit) : 1000;

        const data = await delegate.findMany({
            where,
            select: select,
            take: maxTake
        });

        res.json(data);

    } catch (error) {
        console.error("Error generating custom report:", error);
        res.status(500).json({ message: "Error al generar reporte personalizado" });
    }
};
