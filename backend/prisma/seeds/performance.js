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
        // Asignar perfil de desempeño aleatorio o específico
        let profile = 'AVERAGE';
        if (emp.email === 'kevin.arismendi@emplifi.com' || emp.email === 'lucia.paz@emplifi.com') {
            profile = 'LOW';
        } else if (emp.email === 'andres.morales@emplifi.com') {
            profile = 'DECLINING';
        } else if (emp.email === 'sebastian.herrera@emplifi.com') {
            profile = 'HIGH';
        } else {
            const rand = Math.random();
            if (rand < 0.2) profile = 'HIGH';
            else if (rand < 0.4) profile = 'LOW';
        }

        for (const template of templates) {
            const { start, end } = getDatesForPeriod(template.period);

            // Si es futura (Q1 2024), dejar algunas pendientes
            let status = 'COMPLETED';
            if (template.period === '2024-Q1' && Math.random() > 0.5) {
                status = 'PENDING';
            }

            let score = 70; // Base score on a 0-100 scale
            if (status === 'COMPLETED') {
                if (profile === 'HIGH') score = 85 + (Math.random() * 15);
                else if (profile === 'LOW') score = 30 + (Math.random() * 30);
                else if (profile === 'DECLINING') {
                    // 2023-Q3 High, 2023-Q4 Mid, 2024-Q1 Low
                    if (template.period === '2023-Q3') score = 92;
                    if (template.period === '2023-Q4') score = 75;
                    if (template.period === '2024-Q1') score = 48;
                } else {
                    // AVERAGE
                    score = 65 + (Math.random() * 25);
                }
            }

            // Evitar duplicados
            const existing = await prisma.employeeEvaluation.findFirst({
                where: { employeeId: emp.id, templateId: template.id }
            });

            if (!existing) {
                // Determine status and forced pending for admin
                let currentStatus = status;

                // For Q1 2024, force some to be PENDING so admin has work to do
                if (template.period === '2024-Q1') {
                    if (emp.email === 'kevin.arismendi@emplifi.com' || emp.email === 'lucia.paz@emplifi.com') {
                        currentStatus = 'PENDING';
                    }
                }

                const evaluation = await prisma.employeeEvaluation.create({
                    data: {
                        templateId: template.id,
                        employeeId: emp.id,
                        startDate: start,
                        endDate: end,
                        status: currentStatus,
                        finalScore: currentStatus === 'COMPLETED' ? parseFloat(score.toFixed(1)) : null,
                        feedback: currentStatus === 'COMPLETED' ? `Evaluación generada automáticamente para perfil ${profile}` : null,
                        createdAt: end
                    }
                });

                // Reviewer
                await prisma.evaluationReviewer.create({
                    data: {
                        evaluationId: evaluation.id,
                        reviewerId: admin.id,
                        status: currentStatus,
                        feedback: currentStatus === 'COMPLETED' ? 'Buen trabajo general' : null,
                        score: currentStatus === 'COMPLETED' ? parseFloat(score.toFixed(1)) : null
                    }
                });
            }
        }
    }
}
