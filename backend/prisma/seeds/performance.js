export async function seedPerformance(prisma, employees) {
    console.log('[PERFORMANCE] Generando Evaluaciones de Desempeño 360° en Lote para ambas empresas...');

    const year = new Date().getFullYear();
    const activePeriod = `${year}-Q2`;
    const periods = [`${year - 1}-Q3`, `${year - 1}-Q4`, `${year}-Q1`, activePeriod];

    const tenants = await prisma.tenant.findMany({
        where: { slug: { in: ['empresa-demo', 'tech-solutions'] } }
    });

    for (const tenant of tenants) {
        const tenantEmployees = employees.filter(e => e.tenantId === tenant.id);
        const adminUser = tenantEmployees.find(e => e.role === 'admin') || tenantEmployees[0];
        if (!adminUser) continue;

        const templates = [];
        for (const period of periods) {
            let template = await prisma.evaluationTemplate.findFirst({
                where: { tenantId: tenant.id, period }
            });
            if (!template) {
                template = await prisma.evaluationTemplate.create({
                    data: {
                        tenantId: tenant.id,
                        title: `Evaluación Trimestral ${period} - ${tenant.name}`,
                        period: period,
                        criteria: JSON.stringify([
                            { name: 'Objetivos SMART', weight: 40 },
                            { name: 'Competencias Técnicas', weight: 30 },
                            { name: 'Trabajo en Equipo y Cultura', weight: 30 }
                        ]),
                        scale: JSON.stringify({ min: 1, max: 100 }),
                        isActive: period === activePeriod
                    }
                });
            }
            templates.push(template);
        }

        const targetEmployees = tenantEmployees.filter(e => e.role !== 'admin' && e.role !== 'superadmin');

        const getDatesForPeriod = (period) => {
            if (period.endsWith('-Q3')) return { start: new Date(`${year - 1}-07-01`), end: new Date(`${year - 1}-09-30`) };
            if (period.endsWith('-Q4')) return { start: new Date(`${year - 1}-10-01`), end: new Date(`${year - 1}-12-31`) };
            if (period.endsWith('-Q1')) return { start: new Date(`${year}-01-01`), end: new Date(`${year}-03-31`) };
            return { start: new Date(`${year}-04-01`), end: new Date(`${year}-06-30`) };
        };

        const evalsBatch = [];

        for (const emp of targetEmployees) {
            for (let idx = 0; idx < templates.length; idx++) {
                const template = templates[idx];
                const { start, end } = getDatesForPeriod(template.period);

                let status = 'COMPLETED';
                if (template.period === activePeriod && (emp.email.includes('kevin') || emp.email.includes('lucia'))) {
                    status = 'PENDING';
                }

                // Generación de puntajes con patrones realistas para análisis de IA:
                let score = 78;
                if (emp.email.includes('kevin.arismendi') || emp.email.includes('esteban.suarez')) {
                    // Curva descendente real (para disparar insights de retroceso de desempeño >12 pts)
                    const declineScores = [84, 80, 72, 60];
                    score = declineScores[idx % declineScores.length];
                } else if (emp.email.includes('andres.morales') || emp.email.includes('ricardo.almeida') || emp.email.includes('valeria.espinoza')) {
                    // Top performers (>88 pts constantes)
                    const highScores = [90, 92, 94, 91];
                    score = highScores[idx % highScores.length];
                } else if (emp.email.includes('gabriela.torres') || emp.email.includes('diego.vasquez')) {
                    // Rendimiento promedio-alto
                    score = 80 + ((emp.id.charCodeAt(0) + idx * 5) % 10);
                } else {
                    // Rendimiento estándar normalizado entre 70 y 86
                    score = 72 + ((emp.id.charCodeAt(0) + idx * 7) % 15);
                }

                evalsBatch.push({
                    templateId: template.id,
                    employeeId: emp.id,
                    startDate: start,
                    endDate: end,
                    status: status,
                    finalScore: status === 'COMPLETED' ? parseFloat(score.toFixed(1)) : null,
                    feedback: status === 'COMPLETED' ? `Evaluación de desempeño trimestral: ${score}/100. Objetivos y competencias evaluados.` : 'Pendiente de revisión por liderazgo.',
                    createdAt: end
                });
            }
        }

        if (evalsBatch.length > 0) {
            await prisma.employeeEvaluation.createMany({
                data: evalsBatch,
                skipDuplicates: true
            });

            const createdEvals = await prisma.employeeEvaluation.findMany({
                where: { template: { tenantId: tenant.id } }
            });

            const reviewersBatch = createdEvals.map(ev => ({
                evaluationId: ev.id,
                reviewerId: adminUser.id,
                status: ev.status,
                comments: ev.status === 'COMPLETED' ? 'Revisión técnica aprobada.' : null,
                score: ev.finalScore
            }));

            if (reviewersBatch.length > 0) {
                await prisma.evaluationReviewer.createMany({
                    data: reviewersBatch,
                    skipDuplicates: true
                });
            }
        }

        console.log(`Evaluaciones 360° generadas en lote para ${tenant.name}.`);
    }
}
