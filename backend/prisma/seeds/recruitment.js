import { firstNames, lastNames, getRandomElement } from './utils.js';

export async function seedRecruitment(prisma, adminId) {
    if (!adminId) {
        console.log("⚠️ No admin ID provided for recruitment seed. Skipping.");
        return;
    }
    console.log('[RECRUITMENT] Creando Vacantes y Candidatos...');
    const vacancies = [];
    const titles = ['Senior React Developer', 'HR Assistant', 'Sales Manager'];

    for (const title of titles) {
        try {
            const v = await prisma.jobVacancy.create({
                data: {
                    title,
                    department: title.includes('Dev') ? 'IT' : title.includes('HR') ? 'HR' : 'Sales',
                    description: 'We are looking for talented people...',
                    requirements: '- Experience\n- Motivation',
                    status: 'OPEN',
                    postedById: adminId,
                    deadline: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                    location: 'Quito',
                    employmentType: 'Full-time'
                }
            });
            vacancies.push(v);
        } catch (e) { console.log("Vacancy skip: " + e.message); }
    }

    // Gather vacancies
    const postedVacancies = await prisma.jobVacancy.findMany();

    for (const vacancy of postedVacancies) {
        // Create Applications if not exist (handled partially above, but let's iterate created ones)
        // For simplicity, we just fetch what we created or exist
        const applications = await prisma.jobApplication.findMany({ where: { vacancyId: vacancy.id } });

        for (const app of applications) {
            // 1. Interviews
            if (['INTERVIEW', 'HIRED', 'REJECTED'].includes(app.status)) {
                await prisma.interview.create({
                    data: {
                        applicationId: app.id,
                        date: new Date(new Date().getTime() + 86400000), // Tomorrow
                        type: 'VIRTUAL',
                        interviewerId: adminId, // Use admin as interviewer
                        status: 'SCHEDULED',
                        notes: 'Initial screening interview.'
                    }
                }).catch(() => { });
            }

            // 2. Notes
            await prisma.applicationNote.create({
                data: {
                    applicationId: app.id,
                    content: 'Candidate looks promising based on CV.',
                    createdBy: 'Admin System',
                    createdById: adminId
                }
            }).catch(() => { });

            // 3. Evaluations (if processed)
            if (['HIRED', 'REJECTED'].includes(app.status)) {
                await prisma.candidateEvaluation.create({
                    data: {
                        applicationId: app.id,
                        evaluatorId: adminId,
                        ratings: { "Technical": 8, "Culture": 9 },
                        comments: 'Strong technical skills.',
                        recommendation: app.status === 'HIRED' ? 'HIRE' : 'NO_HIRE',
                        overallScore: 8.5
                    }
                }).catch(() => { });
            }
        }
    }
}
