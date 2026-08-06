import { firstNames, lastNames, getRandomElement } from './utils.js';

export async function seedRecruitment(prisma, adminId) {
    if (!adminId) {
        console.log("⚠️ No admin ID provided for recruitment seed. Skipping.");
        return;
    }
    console.log('[RECRUITMENT] Creando Vacantes, Candidatos y Evaluaciones...');

    const admin = await prisma.employee.findUnique({
        where: { id: adminId },
        select: { tenantId: true }
    });
    const tenantId = admin?.tenantId || null;

    const titles = ['Desarrollador React Senior', 'Asistente de RRHH', 'Gerente de Ventas'];

    for (const title of titles) {
        try {
            let vacancy = await prisma.jobVacancy.findFirst({ where: { title } });
            if (!vacancy) {
                vacancy = await prisma.jobVacancy.create({
                    data: {
                        title,
                        tenantId,
                        department: title.includes('React') ? 'Tecnología' : title.includes('RRHH') ? 'Recursos Humanos' : 'Ventas',
                        description: 'Buscamos personas con talento y pasión por la excelencia para unirse a nuestro equipo en crecimiento.',
                        requirements: '- Experiencia sólida en el área\n- Excelentes habilidades de comunicación\n- Proactividad y compromiso',
                        status: 'OPEN',
                        postedById: adminId,
                        deadline: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                        location: 'Quito',
                        employmentType: 'Tiempo completo'
                    }
                });
            } else if (!vacancy.tenantId && tenantId) {
                vacancy = await prisma.jobVacancy.update({
                    where: { id: vacancy.id },
                    data: { tenantId }
                });
            }

            // Seed 3-4 Candidates per Vacancy
            const sampleCandidates = [
                { firstName: 'Carlos', lastName: 'Mendoza', email: `carlos.${vacancy.id.slice(-4)}@gmail.com`, phone: '0991112223', status: 'INTERVIEW' },
                { firstName: 'Sofía', lastName: 'Benítez', email: `sofia.${vacancy.id.slice(-4)}@gmail.com`, phone: '0982223334', status: 'REVIEWING' },
                { firstName: 'Martín', lastName: 'Guerrero', email: `martin.${vacancy.id.slice(-4)}@gmail.com`, phone: '0973334445', status: 'OFFER' },
                { firstName: 'Elena', lastName: 'Ríos', email: `elena.${vacancy.id.slice(-4)}@gmail.com`, phone: '0964445556', status: 'PENDING' },
            ];

            for (const cand of sampleCandidates) {
                let app = await prisma.jobApplication.findFirst({
                    where: { vacancyId: vacancy.id, email: cand.email }
                });

                if (!app) {
                    app = await prisma.jobApplication.create({
                        data: {
                            vacancyId: vacancy.id,
                            firstName: cand.firstName,
                            lastName: cand.lastName,
                            email: cand.email,
                            phone: cand.phone,
                            status: cand.status,
                            resumeUrl: 'https://example.com/cv.pdf',
                            coverLetter: 'Estimado equipo, me postulo con mucho entusiasmo a esta vacante.'
                        }
                    });
                }

                // 1. Interviews
                if (['INTERVIEW', 'OFFER', 'HIRED'].includes(app.status)) {
                    const existingInterview = await prisma.interview.findFirst({ where: { applicationId: app.id } });
                    if (!existingInterview) {
                        await prisma.interview.create({
                            data: {
                                applicationId: app.id,
                                date: new Date(Date.now() + 86400000),
                                type: 'VIRTUAL',
                                interviewerId: adminId,
                                status: 'COMPLETED',
                                notes: 'Entrevista técnica excelente. Candidato recomendado.'
                            }
                        }).catch(() => { });
                    }
                }

                // 2. Notes
                const existingNote = await prisma.applicationNote.findFirst({ where: { applicationId: app.id } });
                if (!existingNote) {
                    await prisma.applicationNote.create({
                        data: {
                            applicationId: app.id,
                            content: 'Candidato destacado con perfil alineado al puesto.',
                            createdBy: 'Sistema Admin',
                            createdById: adminId
                        }
                    }).catch(() => { });
                }

                // 3. Candidate Evaluations
                if (['OFFER', 'HIRED'].includes(app.status)) {
                    const existingEval = await prisma.candidateEvaluation.findFirst({ where: { applicationId: app.id } });
                    if (!existingEval) {
                        await prisma.candidateEvaluation.create({
                            data: {
                                applicationId: app.id,
                                evaluatorId: adminId,
                                ratings: JSON.stringify({ "Técnica": 9, "Cultura": 9 }),
                                comments: 'Excelente desempeño en la prueba técnica.',
                                recommendation: 'HIRE',
                                overallScore: 90
                            }
                        }).catch(() => { });
                    }
                }
            }
        } catch (e) {
            console.log("Recruitment seed step error: " + e.message);
        }
    }
}
