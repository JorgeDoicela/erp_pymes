export async function seedPerformance(prisma, employees) {
    console.log('📊 Generando Evaluaciones...');
    let template;
    try {
        const existing = await prisma.evaluationTemplate.findFirst({ where: { period: '2024' } });
        if (!existing) {
            template = await prisma.evaluationTemplate.create({
                data: {
                    title: 'Evaluación Anual 2024',
                    period: '2024',
                    criteria: JSON.stringify([
                        { name: 'Objetivos', weight: 40 },
                        { name: 'Competencias', weight: 30 },
                        { name: 'Valores', weight: 30 }
                    ]),
                    scale: JSON.stringify({ min: 1, max: 5 }),
                    isActive: true
                }
            });
        } else {
            template = existing;
        }
    } catch (e) { }

    if (template && employees.length > 0) {
        for (const emp of employees) {
            if (!emp.isActive) continue;
            try {
                // Check if already exists to allow re-runs
                const existingEval = await prisma.employeeEvaluation.findFirst({
                    where: { employeeId: emp.id, templateId: template.id }
                });

                if (existingEval) continue;

                const isCompleted = Math.random() > 0.3;
                const score = isCompleted ? (Math.random() * 2 + 3).toFixed(1) : null;

                const evaluation = await prisma.employeeEvaluation.create({
                    data: {
                        templateId: template.id,
                        employeeId: emp.id,
                        startDate: new Date('2024-01-01'),
                        endDate: new Date('2024-01-31'),
                        status: isCompleted ? 'COMPLETED' : 'PENDING',
                        finalScore: isCompleted ? parseFloat(score) : null,
                        feedback: isCompleted ? 'Buen desempeño general.' : null
                    }
                });

                // Add Reviewers (Self + Manager/Admin)
                // 1. Self Review
                await prisma.evaluationReviewer.create({
                    data: {
                        evaluationId: evaluation.id,
                        reviewerId: emp.id,
                        status: isCompleted ? 'COMPLETED' : 'PENDING',
                        score: isCompleted ? parseFloat(score) : null,
                        comments: 'Me he esforzado mucho este año.'
                    }
                });

            } catch (e) { }
        }
    }
}
