export async function seedPerformance(prisma, employees) {
    console.log('[PERFORMANCE] Generando Evaluaciones y Recordatorios...');

    // Create Template
    let template = await prisma.evaluationTemplate.findFirst({ where: { period: '2024-Q1' } });
    if (!template) {
        template = await prisma.evaluationTemplate.create({
            data: {
                title: 'Evaluación Trimestral Q1',
                period: '2024-Q1',
                criteria: JSON.stringify([{ name: 'General', weight: 100 }]),
                scale: JSON.stringify({ min: 1, max: 5 }),
                isActive: true
            }
        });
    }

    // Helper dates
    const today = new Date();
    const in7Days = new Date(today); in7Days.setDate(today.getDate() + 7);
    const in3Days = new Date(today); in3Days.setDate(today.getDate() + 3);
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

    // Ensure we have Admin (to be the reviewer)
    const admin = employees.find(e => e.role === 'admin');
    if (!admin) return;

    // We need 3 employees to be the subjects
    // If not enough employees, reuse or skip
    const subjects = employees.filter(e => e.id !== admin.id).slice(0, 3);

    // 1. Evaluation Expiring in 7 Days
    if (subjects[0]) {
        await createEvaluation(prisma, template.id, subjects[0].id, admin.id, in7Days, 'PENDING');
        console.log(`Created Evaluation expiring in 7 days for ${subjects[0].email}`);
    }

    // 2. Evaluation Expiring in 3 Days
    if (subjects[1]) {
        await createEvaluation(prisma, template.id, subjects[1].id, admin.id, in3Days, 'PENDING');
        console.log(`Created Evaluation expiring in 3 days for ${subjects[1].email}`);
    }

    // 3. Expired Evaluation (Yesterday)
    if (subjects[2]) {
        await createEvaluation(prisma, template.id, subjects[2].id, admin.id, yesterday, 'PENDING'); // Still Pending -> Overdue
        console.log(`Created Expired Evaluation for ${subjects[2].email}`);
    }
}

async function createEvaluation(prisma, templateId, employeeId, reviewerId, endDate, status) {
    const existing = await prisma.employeeEvaluation.findFirst({
        where: {
            employeeId,
            templateId,
            endDate: endDate
        }
    });

    if (existing) return;

    const evaluation = await prisma.employeeEvaluation.create({
        data: {
            templateId,
            employeeId,
            startDate: new Date(),
            endDate: endDate,
            status: status
        }
    });

    // Add Admin as Reviewer (PENDING)
    await prisma.evaluationReviewer.create({
        data: {
            evaluationId: evaluation.id,
            reviewerId: reviewerId,
            status: 'PENDING'
        }
    });
}
