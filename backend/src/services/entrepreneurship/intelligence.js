import prisma from '../../database/db.js';

/**
 * Startup Intelligence Engine
 * Provee análisis predictivo y métricas BI para la incubadora.
 */

/**
 * Calcula el "Success Score" de una startup (0-100)
 * Basado en: Hitos, Equipo, Finanzas y Validación de Mercado.
 */
export async function calculateSuccessScore(projectId) {
    const project = await prisma.entrepreneurship.findUnique({
        where: { id: projectId },
        include: {
            milestones: true,
            members: true,
            mentors: true,
            fundingRounds: true,
            interviews: true,
            equities: true
        }
    });

    if (!project) return 0;

    let score = 0;
    const factors = [];

    // 1. Capacidad de Ejecución (30%) - Hitos completados
    const totalMilestones = project.milestones.length;
    const completedMilestones = project.milestones.filter(m => m.status === 'COMPLETED').length;
    const executionScore = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 30 : 0;
    score += executionScore;
    factors.push({ name: 'Ejecución', score: executionScore, weight: 30 });

    // 2. Validación de Mercado (25%) - Entrevistas y Feedback
    const totalInterviews = project.interviews.length;
    const positiveInterviews = project.interviews.filter(i => i.sentiment === 'POSITIVE').length;
    let validationScore = 0;
    if (totalInterviews > 0) {
        validationScore = (positiveInterviews / totalInterviews) * 25;
    }
    // Bonus por volumen de entrevistas (mínimo 10 para score completo)
    const volumeBonus = Math.min(totalInterviews / 10, 1) * 5; 
    validationScore = Math.min(validationScore + volumeBonus, 25);
    score += validationScore;
    factors.push({ name: 'Validación', score: validationScore, weight: 25 });

    // 3. Solidez del Equipo (20%) - Miembros y Mentores
    const teamSize = project.members.length + 1; // +1 por el owner
    const mentorSupport = project.mentors.length > 0 ? 10 : 0;
    const teamScore = Math.min((teamSize * 3) + mentorSupport, 20);
    score += teamScore;
    factors.push({ name: 'Equipo', score: teamScore, weight: 20 });

    // 4. Salud Financiera (15%) - Inversión y Capital
    const hasFunding = project.fundingRounds.length > 0 ? 10 : 0;
    const valuationScore = project.valuation > 100000 ? 5 : 0;
    const financialScore = hasFunding + valuationScore;
    score += financialScore;
    factors.push({ name: 'Finanzas', score: financialScore, weight: 15 });

    // 5. Innovación y Potencial (10%)
    const innovationScore = (project.innovationScore || 0) / 10; // Asumiendo que innovationScore es 0-100
    score += innovationScore;
    factors.push({ name: 'Innovación', score: innovationScore, weight: 10 });

    return {
        totalScore: Math.round(score),
        factors,
        level: score > 80 ? 'Tier 5 (Ready to Scale)' : 
               score > 60 ? 'Tier 4 (MVP Validated)' : 
               score > 40 ? 'Tier 3 (Validation Phase)' : 
               score > 20 ? 'Tier 2 (Ideation High)' : 'Tier 1 (Emerging)'
    };
}

/**
 * Análisis Financiero: Burn Rate y Runway
 */
export async function getFinancialAnalysis(projectId) {
    const project = await prisma.entrepreneurship.findUnique({
        where: { id: projectId },
        include: {
            fundingRounds: true
        }
    });

    if (!project) return null;

    const totalRaised = project.fundingRounds.reduce((acc, r) => acc + r.amountRaised, 0);
    const budget = project.budget || 0;
    const expenses = project.expenses || 0;
    
    // Burn Rate mensual estimado (asumiendo que los gastos son acumulados del mes)
    // En una app real, esto se calcularía sobre un periodo de tiempo.
    const burnRate = expenses > 0 ? expenses : 0;
    
    // Runway (meses de vida restante)
    const availableCash = (totalRaised + budget) - expenses;
    const runway = burnRate > 0 ? (availableCash / burnRate) : Infinity;

    return {
        totalRaised,
        availableCash,
        burnRate,
        runway: isFinite(runway) ? Math.round(runway * 10) / 10 : 'Unlimited',
        healthStatus: runway < 3 ? 'CRITICAL' : runway < 6 ? 'WARNING' : 'HEALTHY'
    };
}

/**
 * Matchmaking de Mentores (Basado en industria y faltantes)
 */
export async function getMentorRecommendations(projectId) {
    const project = await prisma.entrepreneurship.findUnique({
        where: { id: projectId }
    });

    if (!project) return [];

    // Buscar empleados que no sean del proyecto pero tengan experiencia en la industria
    // (Simulación basada en el departamento del empleado que coincida con la industria)
    const potentialMentors = await prisma.employee.findMany({
        where: {
            department: { contains: project.industry || '', mode: 'insensitive' },
            isActive: true,
            NOT: { id: project.ownerId }
        },
        take: 3
    });

    return potentialMentors.map(m => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
        position: m.position,
        department: m.department,
        matchScore: 85 // Heurística simple
    }));
}
