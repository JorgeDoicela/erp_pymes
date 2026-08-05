export async function seedPerformance(prisma, employees) {
    console.log('[PERFORMANCE] Generando Evaluaciones e Historial Determinístico...');

    const year = new Date().getFullYear();
    const activePeriod = `${year}-Q2`;
    const periods = [`${year - 1}-Q3`, `${year - 1}-Q4`, `${year}-Q1`, activePeriod];
    const templates = [];

    for (const period of periods) {
        let template = await prisma.evaluationTemplate.findFirst({ where: { period } });
        if (!template) {
            template = await prisma.evaluationTemplate.create({
                data: {
                    title: `Evaluación Trimestral ${period}`,
                    period: period,
                    criteria: JSON.stringify([
                        { name: 'Objetivos', weight: 40 },
                        { name: 'Competencias', weight: 30 },
                        { name: 'Cultura', weight: 30 }
                    ]),
                    scale: JSON.stringify({ min: 1, max: 100 }),
                    isActive: period === activePeriod
                }
            });
        }
        if (template && template.id) {
            templates.push(template);
        }
    }

    const admin = employees.find(e => e.role === 'admin');
    if (!admin) return;

    const targetEmployees = employees.filter(e => e.role !== 'admin');

    // Mapeo determinístico de puntuación por empleado y período
    const getScoreForEmployeeAndPeriod = (email, periodIndex) => {
        // periodIndex: 0 = Q3 (hace 3Q), 1 = Q4 (hace 2Q), 2 = Q1 (hace 1Q), 3 = Q2 (Actual)
        switch (email) {
            case 'andres.morales@emplifi.com':
                // Declive severo: 92 -> 78 -> 55 -> 41
                return [92, 78, 55, 41][periodIndex];

            case 'kevin.arismendi@emplifi.com':
                // Bajo rendimiento crítico: 45 -> 38 -> 30 -> 25
                return [45, 38, 30, 25][periodIndex];

            case 'lucia.paz@emplifi.com':
                // Declive sostenido: 52 -> 48 -> 44 -> 40
                return [52, 48, 44, 40][periodIndex];

            case 'gabriela.torres@emplifi.com':
                // Declive leve: 68 -> 65 -> 60 -> 58
                return [68, 65, 60, 58][periodIndex];

            case 'camila.rodriguez@emplifi.com':
                // Declive comercial: 60 -> 55 -> 50 -> 48
                return [60, 55, 50, 48][periodIndex];

            case 'valeria.espinoza@emplifi.com':
                // Top Performer constante: 88 -> 89 -> 90 -> 92
                return [88, 89, 90, 92][periodIndex];

            case 'sebastian.herrera@emplifi.com':
                // Top Performer ascendente: 88 -> 91 -> 94 -> 96
                return [88, 91, 94, 96][periodIndex];

            case 'roberto.guzman@emplifi.com':
                // Top Performer Ejecutivo: 90 -> 88 -> 91 -> 93
                return [90, 88, 91, 93][periodIndex];

            case 'felipe.castillo@emplifi.com':
                // Alto potencial en ascenso: 72 -> 78 -> 82 -> 86
                return [72, 78, 82, 86][periodIndex];

            case 'isabel.fuentes@emplifi.com':
                // Crecimiento constante: 70 -> 74 -> 79 -> 83
                return [70, 74, 79, 83][periodIndex];

            case 'daniela.salazar@emplifi.com':
                // Bueno ascendente: 80 -> 82 -> 84 -> 85
                return [80, 82, 84, 85][periodIndex];

            case 'mateo.jimenez@emplifi.com':
                // Estable medio: 75 -> 76 -> 74 -> 77
                return [75, 76, 74, 77][periodIndex];

            case 'diego.vasquez@emplifi.com':
                // Estable consistente: 78 -> 79 -> 80 -> 81
                return [78, 79, 80, 81][periodIndex];

            case 'paola.mendoza@emplifi.com':
                // Estable alto: 82 -> 83 -> 82 -> 84
                return [82, 83, 82, 84][periodIndex];

            default:
                return 75;
        }
    };

    const getDatesForPeriod = (period) => {
        if (period.endsWith('-Q3')) return { start: new Date(`${year - 1}-07-01`), end: new Date(`${year - 1}-09-30`) };
        if (period.endsWith('-Q4')) return { start: new Date(`${year - 1}-10-01`), end: new Date(`${year - 1}-12-31`) };
        if (period.endsWith('-Q1')) return { start: new Date(`${year}-01-01`), end: new Date(`${year}-03-31`) };
        return { start: new Date(`${year}-04-01`), end: new Date(`${year}-06-30`) };
    };

    for (const emp of targetEmployees) {
        for (let idx = 0; idx < templates.length; idx++) {
            const template = templates[idx];
            const { start, end } = getDatesForPeriod(template.period);

            let status = 'COMPLETED';
            // Para el trimestre actual (Q2), dejamos pendientes solo Kevin y Lucía para generar alertas
            if (template.period === activePeriod && (emp.email === 'kevin.arismendi@emplifi.com' || emp.email === 'lucia.paz@emplifi.com')) {
                status = 'PENDING';
            }

            const score = getScoreForEmployeeAndPeriod(emp.email, idx);

            const existing = await prisma.employeeEvaluation.findFirst({
                where: { employeeId: emp.id, templateId: template.id }
            });

            if (!existing) {
                const evaluation = await prisma.employeeEvaluation.create({
                    data: {
                        templateId: template.id,
                        employeeId: emp.id,
                        startDate: start,
                        endDate: end,
                        status: status,
                        finalScore: status === 'COMPLETED' ? parseFloat(score.toFixed(1)) : null,
                        feedback: status === 'COMPLETED' ? `Evaluación trimestral finalizada. Puntuación: ${score}` : 'Evaluación pendiente de revisión.',
                        createdAt: end
                    }
                });

                await prisma.evaluationReviewer.create({
                    data: {
                        evaluationId: evaluation.id,
                        reviewerId: admin.id,
                        status: status,
                        comments: status === 'COMPLETED' ? 'Revisión técnica aprobada.' : null,
                        score: status === 'COMPLETED' ? parseFloat(score.toFixed(1)) : null
                    }
                });
            }
        }
    }
    console.log('[PERFORMANCE] Evaluaciones determinísticas generadas exitosamente.');
}
