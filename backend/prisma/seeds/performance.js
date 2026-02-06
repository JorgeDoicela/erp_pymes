export async function seedPerformance(prisma, employees) {
    console.log('[PERFORMANCE] Generando Evaluaciones e Historial...');

    // 1. Crear Templates para Q3 y Q4 2023, Q1 2024
    const templates = [];
    const periods = ['2023-Q3', '2023-Q4', '2024-Q1'];

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
                    scale: JSON.stringify({ min: 1, max: 5 }),
                    isActive: period === '2024-Q1' // Solo la actual activa
                }
            });
        }
        templates.push(template);
    }

    // Ensure we have Admin (to be the reviewer)
    const admin = employees.find(e => e.role === 'admin');
    if (!admin) return;

    // Filter employees to generate data for
    const targetEmployees = employees.filter(e => e.role !== 'admin').slice(0, 15);

    // Helper para fechas
    const getDatesForPeriod = (period) => {
        if (period === '2023-Q3') return { start: new Date('2023-07-01'), end: new Date('2023-09-30') };
        if (period === '2023-Q4') return { start: new Date('2023-10-01'), end: new Date('2023-12-31') };
        return { start: new Date('2024-01-01'), end: new Date('2024-03-31') };
    };

    for (const emp of targetEmployees) {
        // Asignar perfil de desempeño aleatorio: 'HIGH', 'LOW', 'AVERAGE', 'DECLINING'
        const rand = Math.random();
        let profile = 'AVERAGE';
        if (rand < 0.2) profile = 'HIGH';
        else if (rand < 0.4) profile = 'LOW';
        else if (rand < 0.5) profile = 'DECLINING';

        for (const template of templates) {
            const { start, end } = getDatesForPeriod(template.period);

            // Si es futura (Q1 2024), dejar algunas pendientes
            let status = 'COMPLETED';
            if (template.period === '2024-Q1' && Math.random() > 0.5) {
                status = 'PENDING';
            }

            let score = 75; // Base
            if (status === 'COMPLETED') {
                if (profile === 'HIGH') score = 90 + Math.random() * 8;
                else if (profile === 'LOW') score = 55 + Math.random() * 10;
                else if (profile === 'DECLINING') {
                    // Q3 High, Q4 Mid, Q1 Low
                    if (template.period === '2023-Q3') score = 88;
                    if (template.period === '2023-Q4') score = 75;
                    if (template.period === '2024-Q1') score = 60;
                } else {
                    score = 70 + Math.random() * 15;
                }
            }

            // Evitar duplicados
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
                        feedback: status === 'COMPLETED' ? `Evaluación generada automáticamente para perfil ${profile}` : null,
                        createdAt: end // Simulate created in past
                    }
                });

                // Reviewer
                await prisma.evaluationReviewer.create({
                    data: {
                        evaluationId: evaluation.id,
                        reviewerId: admin.id,
                        status: status,
                        feedback: status === 'COMPLETED' ? 'Buen trabajo general' : null,
                        score: status === 'COMPLETED' ? parseFloat(score.toFixed(1)) : null
                    }
                });
            }
        }
    }
}
