import prisma from '../database/db.js';

/**
 * Servicio de Inteligencia para Análisis de RRHH
 * Proporciona insights, predicciones y recomendaciones basadas en heurísticas
 */

// ==================== MÓDULO 1: ANÁLISIS DE RETENCIÓN ====================

/**
 * Calcula el score de riesgo de rotación para un empleado
 * @param {Object} employee - Datos del empleado con relaciones
 * @returns {Object} { score, level, factors }
 */
function calculateRetentionRiskScore(employee) {
    let score = 0;
    const factors = [];

    // Factor 1: Antigüedad baja (30%)
    const monthsInCompany = Math.floor(
        (new Date() - new Date(employee.hireDate)) / (1000 * 60 * 60 * 24 * 30)
    );

    let tenureScore = 0;
    if (monthsInCompany < 6) {
        tenureScore = 30;
        factors.push({ factor: 'Antigüedad muy baja (< 6 meses)', impact: 30 });
    } else if (monthsInCompany < 12) {
        tenureScore = 20;
        factors.push({ factor: 'Antigüedad baja (< 1 año)', impact: 20 });
    } else if (monthsInCompany < 24) {
        tenureScore = 10;
        factors.push({ factor: 'Antigüedad moderada (< 2 años)', impact: 10 });
    }
    score += tenureScore;

    // Factor 2: Ausencias frecuentes (25%)
    const absencesLast3Months = employee.absences?.filter(abs => {
        const monthsAgo = (new Date() - new Date(abs.createdAt)) / (1000 * 60 * 60 * 24 * 30);
        return monthsAgo <= 3;
    }).length || 0;

    let absenceScore = 0;
    if (absencesLast3Months >= 5) {
        absenceScore = 25;
        factors.push({ factor: 'Ausencias muy frecuentes (≥5 en 3 meses)', impact: 25 });
    } else if (absencesLast3Months >= 3) {
        absenceScore = 15;
        factors.push({ factor: 'Ausencias frecuentes (≥3 en 3 meses)', impact: 15 });
    } else if (absencesLast3Months >= 1) {
        absenceScore = 5;
        factors.push({ factor: 'Algunas ausencias (1-2 en 3 meses)', impact: 5 });
    }
    score += absenceScore;

    // Factor 3: Desempeño bajo (25%)
    const recentEvaluations = employee.evaluations?.filter(evaluation => {
        const monthsAgo = (new Date() - new Date(evaluation.createdAt)) / (1000 * 60 * 60 * 24 * 30);
        return monthsAgo <= 6;
    }) || [];

    let performanceScore = 0;
    if (recentEvaluations.length > 0) {
        const avgScore = recentEvaluations.reduce((sum, e) => sum + (e.finalScore || 0), 0) / recentEvaluations.length;
        if (avgScore < 50) {
            performanceScore = 25;
            factors.push({ factor: 'Desempeño muy bajo (< 50%)', impact: 25 });
        } else if (avgScore < 70) {
            performanceScore = 15;
            factors.push({ factor: 'Desempeño bajo (< 70%)', impact: 15 });
        }
    }
    score += performanceScore;

    // Factor 4: Salario bajo vs mercado (15%)
    // Asumimos que el salario promedio del departamento es el "mercado"
    // Este cálculo se hará en el análisis general

    // Factor 5: Falta de crecimiento (5%)
    const hasRecentPromotion = employee.contracts?.some(contract => {
        const monthsAgo = (new Date() - new Date(contract.createdAt)) / (1000 * 60 * 60 * 24 * 30);
        return monthsAgo <= 12;
    });

    if (!hasRecentPromotion && monthsInCompany > 24) {
        score += 5;
        factors.push({ factor: 'Sin promoción reciente (> 2 años)', impact: 5 });
    }

    // Clasificación
    let level = 'Bajo Riesgo';
    if (score > 60) level = 'Alto Riesgo';
    else if (score > 30) level = 'Riesgo Medio';

    return { score, level, factors };
}

/**
 * Obtiene análisis de riesgo de rotación para todos los empleados
 */
export async function getRetentionRiskAnalysis() {
    const employees = await prisma.employee.findMany({
        where: { isActive: true },
        include: {
            absences: { orderBy: { createdAt: 'desc' }, take: 10 },
            evaluations: { orderBy: { createdAt: 'desc' }, take: 5 },
            contracts: { orderBy: { createdAt: 'desc' }, take: 3 },
        },
    });

    // Calcular salario promedio por departamento
    const departmentSalaries = {};
    employees.forEach(emp => {
        if (!departmentSalaries[emp.department]) {
            departmentSalaries[emp.department] = [];
        }
        // Desencriptar salario (asumiendo que está encriptado)
        const salary = parseFloat(emp.salary) || 0;
        departmentSalaries[emp.department].push(salary);
    });

    const departmentAvgSalaries = {};
    Object.keys(departmentSalaries).forEach(dept => {
        const salaries = departmentSalaries[dept];
        departmentAvgSalaries[dept] = salaries.reduce((a, b) => a + b, 0) / salaries.length;
    });

    // Analizar cada empleado
    const analysis = employees.map(employee => {
        const riskData = calculateRetentionRiskScore(employee);

        // Agregar factor de salario
        const empSalary = parseFloat(employee.salary) || 0;
        const avgSalary = departmentAvgSalaries[employee.department] || empSalary;
        const salaryRatio = empSalary / avgSalary;

        if (salaryRatio < 0.8) {
            riskData.score += 15;
            riskData.factors.push({ factor: 'Salario bajo vs departamento (< 80%)', impact: 15 });
        } else if (salaryRatio < 0.9) {
            riskData.score += 8;
            riskData.factors.push({ factor: 'Salario moderadamente bajo (< 90%)', impact: 8 });
        }

        // Reclasificar con el nuevo score
        if (riskData.score > 60) riskData.level = 'Alto Riesgo';
        else if (riskData.score > 30) riskData.level = 'Riesgo Medio';
        else riskData.level = 'Bajo Riesgo';

        return {
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            department: employee.department,
            position: employee.position,
            hireDate: employee.hireDate,
            ...riskData,
        };
    });

    // Ordenar por score descendente
    analysis.sort((a, b) => b.score - a.score);

    // Estadísticas con tendencias
    const stats = {
        total: analysis.length,
        highRisk: analysis.filter(a => a.level === 'Alto Riesgo').length,
        mediumRisk: analysis.filter(a => a.level === 'Riesgo Medio').length,
        lowRisk: analysis.filter(a => a.level === 'Bajo Riesgo').length,
    };

    // Calcular tendencia (comparar con hace 30 días)
    // Nota: Esto es una simulación simple. En producción, guardarías snapshots históricos
    const trend = {
        highRiskChange: 0, // Placeholder - en producción compararías con datos históricos
        avgRiskScore: analysis.reduce((sum, a) => sum + a.score, 0) / analysis.length,
        improving: stats.highRisk < stats.total * 0.15, // Menos del 15% en alto riesgo es bueno
    };

    return { analysis, stats, trend };
}

// ==================== MÓDULO 2: ANÁLISIS DE DESEMPEÑO ====================

/**
 * Obtiene insights de desempeño
 */
export async function getPerformanceInsights() {
    const employees = await prisma.employee.findMany({
        where: { isActive: true },
        include: {
            evaluations: {
                orderBy: { createdAt: 'desc' },
                take: 5,
            },
            goals: {
                orderBy: { createdAt: 'desc' },
                take: 10,
            },
        },
    });

    const insights = {
        declining: [],
        highPerformers: [],
        atRiskGoals: [],
        skillGaps: [],
    };

    employees.forEach(employee => {
        const evals = employee.evaluations || [];

        // Detectar tendencia descendente
        if (evals.length >= 2) {
            const recent = evals.slice(0, 2);
            if (recent[0].finalScore && recent[1].finalScore) {
                const decline = recent[1].finalScore - recent[0].finalScore;
                if (decline > 15) {
                    insights.declining.push({
                        employeeId: employee.id,
                        employeeName: `${employee.firstName} ${employee.lastName}`,
                        department: employee.department,
                        previousScore: recent[1].finalScore,
                        currentScore: recent[0].finalScore,
                        decline,
                    });
                }
            }
        }

        // Detectar alto desempeño consistente
        if (evals.length >= 3) {
            const avgScore = evals.slice(0, 3).reduce((sum, e) => sum + (e.finalScore || 0), 0) / 3;
            if (avgScore >= 85) {
                insights.highPerformers.push({
                    employeeId: employee.id,
                    employeeName: `${employee.firstName} ${employee.lastName}`,
                    department: employee.department,
                    position: employee.position,
                    avgScore,
                });
            }
        }

        // Objetivos en riesgo
        const goals = employee.goals || [];
        goals.forEach(goal => {
            const daysUntilDeadline = Math.floor(
                (new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)
            );

            if (daysUntilDeadline > 0 && daysUntilDeadline < 30 && goal.progress < 70) {
                insights.atRiskGoals.push({
                    employeeId: employee.id,
                    employeeName: `${employee.firstName} ${employee.lastName}`,
                    goalTitle: goal.title,
                    progress: goal.progress,
                    daysRemaining: daysUntilDeadline,
                    priority: goal.priority,
                });
            }
        });
    });

    return insights;
}

// ==================== MÓDULO 3: ANÁLISIS DE ASISTENCIA ====================

/**
 * Detecta patrones de ausentismo
 */
export async function getAttendancePatterns() {
    const employees = await prisma.employee.findMany({
        where: { isActive: true },
        include: {
            attendance: {
                where: {
                    date: {
                        gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Últimos 90 días
                    },
                },
            },
            absences: {
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                    },
                },
            },
        },
    });

    const patterns = {
        suspiciousAbsences: [],
        frequentLateArrivals: [],
        departmentImpact: {},
    };

    employees.forEach(employee => {
        const absences = employee.absences || [];
        const attendance = employee.attendance || [];

        // Detectar patrones de ausencias (lunes/viernes)
        const mondayFridayAbsences = absences.filter(abs => {
            const day = new Date(abs.startDate).getDay();
            return day === 1 || day === 5; // 1 = Lunes, 5 = Viernes
        });

        const absenceRatio = absences.length > 0 ? mondayFridayAbsences.length / absences.length : 0;

        if (absenceRatio > 0.5 && absences.length >= 3) {
            patterns.suspiciousAbsences.push({
                employeeId: employee.id,
                employeeName: `${employee.firstName} ${employee.lastName}`,
                department: employee.department,
                totalAbsences: absences.length,
                mondayFridayAbsences: mondayFridayAbsences.length,
                pattern: 'Ausencias frecuentes en lunes/viernes',
            });
        }

        // Detectar tardanzas recurrentes
        const lateArrivals = attendance.filter(att => att.isLate).length;
        const lateRatio = attendance.length > 0 ? lateArrivals / attendance.length : 0;

        if (lateRatio > 0.3 && lateArrivals >= 5) {
            patterns.frequentLateArrivals.push({
                employeeId: employee.id,
                employeeName: `${employee.firstName} ${employee.lastName}`,
                department: employee.department,
                totalDays: attendance.length,
                lateDays: lateArrivals,
                latePercentage: (lateRatio * 100).toFixed(1),
            });
        }

        // Impacto por departamento
        if (!patterns.departmentImpact[employee.department]) {
            patterns.departmentImpact[employee.department] = {
                department: employee.department,
                totalEmployees: 0,
                totalAbsences: 0,
                totalLateDays: 0,
            };
        }

        patterns.departmentImpact[employee.department].totalEmployees++;
        patterns.departmentImpact[employee.department].totalAbsences += absences.length;
        patterns.departmentImpact[employee.department].totalLateDays += lateArrivals;
    });

    // Convertir departmentImpact a array
    patterns.departmentImpact = Object.values(patterns.departmentImpact);

    return patterns;
}

// ==================== MÓDULO 4: OPTIMIZACIÓN DE NÓMINA ====================

/**
 * Analiza la nómina para detectar anomalías y oportunidades
 */
export async function getPayrollOptimization() {
    const payrolls = await prisma.payroll.findMany({
        orderBy: { period: 'desc' },
        take: 6,
        include: {
            details: {
                include: {
                    employee: true,
                },
            },
        },
    });

    const optimization = {
        overtimeAnomalies: [],
        costAlerts: [],
        savingOpportunities: [],
        benefitsDistribution: {},
    };

    if (payrolls.length === 0) return optimization;

    const latestPayroll = payrolls[0];
    const previousPayroll = payrolls[1];

    // Calcular estadísticas de horas extras
    const overtimeHours = latestPayroll.details.map(d => d.overtimeHours);
    const avgOvertime = overtimeHours.reduce((a, b) => a + b, 0) / overtimeHours.length;
    const stdDev = Math.sqrt(
        overtimeHours.reduce((sum, val) => sum + Math.pow(val - avgOvertime, 2), 0) / overtimeHours.length
    );

    // Detectar anomalías en horas extras (> 2 desviaciones estándar)
    latestPayroll.details.forEach(detail => {
        if (detail.overtimeHours > avgOvertime + 2 * stdDev) {
            optimization.overtimeAnomalies.push({
                employeeId: detail.employeeId,
                employeeName: `${detail.employee.firstName} ${detail.employee.lastName}`,
                department: detail.employee.department,
                overtimeHours: detail.overtimeHours,
                overtimeAmount: detail.overtimeAmount,
                avgOvertime: avgOvertime.toFixed(2),
            });
        }
    });

    // Alertas de costos
    if (previousPayroll) {
        const costIncrease = ((latestPayroll.totalAmount - previousPayroll.totalAmount) / previousPayroll.totalAmount) * 100;

        if (costIncrease > 20) {
            optimization.costAlerts.push({
                type: 'Incremento significativo',
                message: `Costo de nómina aumentó ${costIncrease.toFixed(1)}% vs mes anterior`,
                previousAmount: previousPayroll.totalAmount,
                currentAmount: latestPayroll.totalAmount,
                increase: costIncrease,
            });
        }
    }

    // Distribución de beneficios por departamento
    const benefits = await prisma.employeeBenefit.findMany({
        where: { status: 'ACTIVE' },
        include: { employee: true },
    });

    benefits.forEach(benefit => {
        const dept = benefit.employee.department;
        if (!optimization.benefitsDistribution[dept]) {
            optimization.benefitsDistribution[dept] = {
                department: dept,
                totalBenefits: 0,
                totalAmount: 0,
                employees: new Set(),
            };
        }
        optimization.benefitsDistribution[dept].totalBenefits++;
        optimization.benefitsDistribution[dept].totalAmount += benefit.amount;
        optimization.benefitsDistribution[dept].employees.add(benefit.employeeId);
    });

    // Convertir a array y calcular promedios
    optimization.benefitsDistribution = Object.values(optimization.benefitsDistribution).map(dept => ({
        department: dept.department,
        totalBenefits: dept.totalBenefits,
        totalAmount: dept.totalAmount,
        employeesWithBenefits: dept.employees.size,
        avgPerEmployee: dept.totalAmount / dept.employees.size,
    }));

    return optimization;
}

// ==================== MÓDULO 5: MATCHING DE RECLUTAMIENTO ====================

/**
 * Calcula el score de matching para un candidato y una vacante
 */
function calculateCandidateScore(application, vacancy) {
    let score = 0;
    const factors = [];

    // Factor 1: Evaluaciones (25%)
    const evaluations = application.evaluations || [];
    if (evaluations.length > 0) {
        const avgEvalScore = evaluations.reduce((sum, e) => sum + e.overallScore, 0) / evaluations.length;
        const evalPoints = (avgEvalScore / 100) * 25;
        score += evalPoints;
        factors.push({ factor: 'Evaluaciones', score: evalPoints.toFixed(1) });
    }

    // Factor 2: Entrevistas completadas (25%)
    const interviews = application.interviews || [];
    const completedInterviews = interviews.filter(i => i.status === 'COMPLETED').length;
    if (completedInterviews > 0) {
        const interviewPoints = Math.min(completedInterviews * 8, 25);
        score += interviewPoints;
        factors.push({ factor: 'Entrevistas completadas', score: interviewPoints });
    }

    // Factor 3: Rapidez de respuesta (10%)
    const daysToApply = Math.floor(
        (new Date(application.createdAt) - new Date(vacancy.createdAt)) / (1000 * 60 * 60 * 24)
    );

    if (daysToApply <= 3) {
        score += 10;
        factors.push({ factor: 'Aplicación temprana', score: 10 });
    } else if (daysToApply <= 7) {
        score += 5;
        factors.push({ factor: 'Aplicación oportuna', score: 5 });
    }

    // Factor 4: Notas positivas (15%)
    const notes = application.notes || [];
    const positiveNotes = notes.filter(n =>
        n.content.toLowerCase().includes('excelente') ||
        n.content.toLowerCase().includes('destacado') ||
        n.content.toLowerCase().includes('recomendado')
    ).length;

    if (positiveNotes > 0) {
        const notePoints = Math.min(positiveNotes * 5, 15);
        score += notePoints;
        factors.push({ factor: 'Notas positivas', score: notePoints });
    }

    // Factor 5: Estado de la aplicación (25%)
    const statusPoints = {
        'PENDING': 5,
        'REVIEWING': 10,
        'INTERVIEW': 15,
        'OFFER': 25,
        'REJECTED': 0,
    };

    const statusScore = statusPoints[application.status] || 0;
    score += statusScore;
    factors.push({ factor: `Estado: ${application.status}`, score: statusScore });

    return { score, factors };
}

/**
 * Obtiene matching inteligente para una vacante
 */
export async function getRecruitmentMatching(vacancyId) {
    const vacancy = await prisma.jobVacancy.findUnique({
        where: { id: vacancyId },
        include: {
            applications: {
                include: {
                    evaluations: true,
                    interviews: true,
                    notes: true,
                },
            },
        },
    });

    if (!vacancy) {
        throw new Error('Vacante no encontrada');
    }

    // Calcular score para cada candidato
    const candidates = vacancy.applications.map(app => {
        const scoreData = calculateCandidateScore(app, vacancy);

        return {
            applicationId: app.id,
            candidateName: `${app.firstName} ${app.lastName}`,
            email: app.email,
            phone: app.phone,
            status: app.status,
            appliedAt: app.createdAt,
            ...scoreData,
        };
    });

    // Ordenar por score descendente
    candidates.sort((a, b) => b.score - a.score);

    // Top 3 candidatos
    const topCandidates = candidates.slice(0, 3);

    return {
        vacancyId: vacancy.id,
        vacancyTitle: vacancy.title,
        totalApplications: candidates.length,
        topCandidates,
        allCandidates: candidates,
    };
}

// ==================== DASHBOARD PRINCIPAL ====================

/**
 * Obtiene el dashboard completo con todos los insights
 */
export async function getIntelligenceDashboard() {
    const [retention, performance, attendance, payroll] = await Promise.all([
        getRetentionRiskAnalysis(),
        getPerformanceInsights(),
        getAttendancePatterns(),
        getPayrollOptimization(),
    ]);

    // Generar recomendaciones basadas en los análisis
    const recommendations = generateRecommendations({
        retention,
        performance,
        attendance,
        payroll,
    });

    return {
        retention,
        performance,
        attendance,
        payroll,
        recommendations,
        generatedAt: new Date(),
    };
}

/**
 * Genera recomendaciones priorizadas
 */
function generateRecommendations(data) {
    const recommendations = [];

    // Recomendaciones de retención
    const highRiskEmployees = data.retention.analysis.filter(e => e.level === 'Alto Riesgo');
    if (highRiskEmployees.length > 0) {
        recommendations.push({
            priority: 'ALTA',
            category: 'Retención',
            title: `${highRiskEmployees.length} empleado(s) en alto riesgo de rotación`,
            description: 'Revisar casos individuales y considerar acciones de retención',
            action: 'Ver empleados en riesgo',
            impact: 'Alto',
            employees: highRiskEmployees.slice(0, 5).map(e => e.employeeName),
        });
    }

    // Recomendaciones de desempeño
    if (data.performance.declining.length > 0) {
        recommendations.push({
            priority: 'ALTA',
            category: 'Desempeño',
            title: `${data.performance.declining.length} empleado(s) con desempeño descendente`,
            description: 'Programar reuniones 1-on-1 y planes de mejora',
            action: 'Revisar evaluaciones',
            impact: 'Medio',
            employees: data.performance.declining.slice(0, 3).map(e => e.employeeName),
        });
    }

    if (data.performance.atRiskGoals.length > 0) {
        recommendations.push({
            priority: 'MEDIA',
            category: 'Objetivos',
            title: `${data.performance.atRiskGoals.length} objetivo(s) en riesgo`,
            description: 'Objetivos próximos a vencer con bajo progreso',
            action: 'Revisar objetivos',
            impact: 'Medio',
        });
    }

    // Recomendaciones de asistencia
    if (data.attendance.suspiciousAbsences.length > 0) {
        recommendations.push({
            priority: 'MEDIA',
            category: 'Asistencia',
            title: `${data.attendance.suspiciousAbsences.length} patrón(es) sospechoso(s) de ausencias`,
            description: 'Investigar ausencias frecuentes en lunes/viernes',
            action: 'Ver patrones',
            impact: 'Bajo',
        });
    }

    // Recomendaciones de nómina
    if (data.payroll.overtimeAnomalies.length > 0) {
        recommendations.push({
            priority: 'MEDIA',
            category: 'Nómina',
            title: `${data.payroll.overtimeAnomalies.length} anomalía(s) en horas extras`,
            description: 'Revisar horas extras excesivas para optimizar costos',
            action: 'Ver detalles',
            impact: 'Medio',
        });
    }

    // Ordenar por prioridad
    const priorityOrder = { 'ALTA': 1, 'MEDIA': 2, 'BAJA': 3 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
}

/**
 * Obtiene solo las recomendaciones
 */
export async function getRecommendations() {
    const dashboard = await getIntelligenceDashboard();
    return dashboard.recommendations;
}

// ==================== COMPARATIVA DE DEPARTAMENTOS ====================

/**
 * Obtiene comparativa de métricas por departamento
 */
export async function getDepartmentComparison() {
    const [retention, performance, attendance, payroll] = await Promise.all([
        getRetentionRiskAnalysis(),
        getPerformanceInsights(),
        getAttendancePatterns(),
        getPayrollOptimization(),
    ]);

    // Agrupar datos por departamento
    const departments = {};

    // Métricas de retención por departamento
    retention.analysis.forEach(emp => {
        if (!departments[emp.department]) {
            departments[emp.department] = {
                department: emp.department,
                employeeCount: 0,
                highRiskCount: 0,
                avgRiskScore: 0,
                riskScores: [],
                decliningPerformance: 0,
                highPerformers: 0,
                absences: 0,
                lateDays: 0,
            };
        }
        departments[emp.department].employeeCount++;
        if (emp.level === 'Alto Riesgo') departments[emp.department].highRiskCount++;
        departments[emp.department].riskScores.push(emp.score);
    });

    // Métricas de desempeño por departamento
    performance.declining.forEach(emp => {
        if (departments[emp.department]) {
            departments[emp.department].decliningPerformance++;
        }
    });

    performance.highPerformers.forEach(emp => {
        if (departments[emp.department]) {
            departments[emp.department].highPerformers++;
        }
    });

    // Métricas de asistencia por departamento
    attendance.departmentImpact.forEach(dept => {
        if (departments[dept.department]) {
            departments[dept.department].absences = dept.totalAbsences;
            departments[dept.department].lateDays = dept.totalLateDays;
        }
    });

    // Calcular promedios y scores
    const comparison = Object.values(departments).map(dept => {
        // Score promedio de riesgo
        dept.avgRiskScore = dept.riskScores.length > 0
            ? dept.riskScores.reduce((a, b) => a + b, 0) / dept.riskScores.length
            : 0;

        // Porcentajes
        dept.highRiskPercentage = dept.employeeCount > 0
            ? (dept.highRiskCount / dept.employeeCount) * 100
            : 0;

        dept.highPerformerPercentage = dept.employeeCount > 0
            ? (dept.highPerformers / dept.employeeCount) * 100
            : 0;

        // Score general del departamento (0-100, menor es mejor)
        // Combina: riesgo de rotación (40%), desempeño descendente (30%), asistencia (30%)
        const riskComponent = (dept.avgRiskScore / 100) * 40;
        const performanceComponent = dept.employeeCount > 0
            ? (dept.decliningPerformance / dept.employeeCount) * 30
            : 0;
        const attendanceComponent = dept.employeeCount > 0
            ? ((dept.absences + dept.lateDays) / (dept.employeeCount * 10)) * 30 // Normalizado
            : 0;

        dept.overallScore = riskComponent + performanceComponent + attendanceComponent;

        // Clasificación
        if (dept.overallScore < 20) dept.health = 'Excelente';
        else if (dept.overallScore < 40) dept.health = 'Bueno';
        else if (dept.overallScore < 60) dept.health = 'Regular';
        else dept.health = 'Crítico';

        // Limpiar datos temporales
        delete dept.riskScores;

        return dept;
    });

    // Ordenar por score general (mejor primero)
    comparison.sort((a, b) => a.overallScore - b.overallScore);

    // Agregar ranking
    comparison.forEach((dept, index) => {
        dept.ranking = index + 1;
    });

    return {
        departments: comparison,
        summary: {
            totalDepartments: comparison.length,
            excellent: comparison.filter(d => d.health === 'Excelente').length,
            good: comparison.filter(d => d.health === 'Bueno').length,
            regular: comparison.filter(d => d.health === 'Regular').length,
            critical: comparison.filter(d => d.health === 'Crítico').length,
            bestDepartment: comparison[0]?.department,
            worstDepartment: comparison[comparison.length - 1]?.department,
        },
    };
}
