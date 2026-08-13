export async function seedRecruitment(prisma) {
    console.log('[RECRUITMENT] Generando Procesos de Reclutamiento para ambas empresas...');

    const tenants = await prisma.tenant.findMany({
        where: { slug: { in: ['empresa-demo', 'tech-solutions'] } }
    });

    for (const tenant of tenants) {
        const adminUser = await prisma.employee.findFirst({
            where: { tenantId: tenant.id, role: { in: ['admin', 'employee'] } }
        });

        if (!adminUser) continue;

        const vacancyTemplates = tenant.slug === 'empresa-demo' ? [
            { title: 'Desarrollador Fullstack Senior', department: 'Tecnología', location: 'Quito' },
            { title: 'Coordinador de Selección y RRHH', department: 'Recursos Humanos', location: 'Quito' },
            { title: 'Ejecutivo Comercial B2B', department: 'Ventas', location: 'Guayaquil' }
        ] : [
            { title: 'Ingeniero Cloud & DevOps', department: 'Infraestructura', location: 'Remoto - Ecuador' },
            { title: 'QA Automation Lead', department: 'Calidad', location: 'Quito' },
            { title: 'Product Manager SaaS', department: 'Producto', location: 'Remoto' }
        ];

        for (const vData of vacancyTemplates) {
            try {
                const vacancy = await prisma.jobVacancy.create({
                    data: {
                        tenantId: tenant.id,
                        title: vData.title,
                        department: vData.department,
                        description: `Buscamos el mejor talento para sumarse a ${tenant.name} en nuestro equipo de ${vData.department}.`,
                        requirements: '- Al menos 3 años de experiencia comprobada\n- Proactividad y pensamiento analítico\n- Excelente trabajo en equipo',
                        status: 'OPEN',
                        postedById: adminUser.id,
                        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        location: vData.location,
                        employmentType: 'Tiempo completo'
                    }
                });

                const sampleCandidates = [
                    { firstName: 'David', lastName: 'Cevallos', email: `david.${vacancy.id.slice(-4)}@gmail.com`, phone: '0991118888', status: 'INTERVIEW' },
                    { firstName: 'María José', lastName: 'Paredes', email: `mariajose.${vacancy.id.slice(-4)}@gmail.com`, phone: '0982227777', status: 'OFFER' },
                    { firstName: 'Gabriel', lastName: 'Moncayo', email: `gabriel.${vacancy.id.slice(-4)}@gmail.com`, phone: '0973336666', status: 'REVIEWING' }
                ];

                for (const cand of sampleCandidates) {
                    const app = await prisma.jobApplication.create({
                        data: {
                            vacancyId: vacancy.id,
                            firstName: cand.firstName,
                            lastName: cand.lastName,
                            email: cand.email,
                            phone: cand.phone,
                            status: cand.status,
                            resumeUrl: 'https://example.com/cv.pdf',
                            coverLetter: `Estimado equipo de ${tenant.name}, me postulo con gran interés.`
                        }
                    });

                    if (['INTERVIEW', 'OFFER'].includes(app.status)) {
                        await prisma.interview.create({
                            data: {
                                applicationId: app.id,
                                date: new Date(Date.now() + 48 * 60 * 60 * 1000),
                                type: 'VIRTUAL',
                                interviewerId: adminUser.id,
                                status: 'COMPLETED',
                                notes: 'Entrevista técnica completada satisfactoriamente.'
                            }
                        }).catch(() => { });
                    }

                    await prisma.applicationNote.create({
                        data: {
                            applicationId: app.id,
                            content: 'Candidato con perfil sólido y alta recomendación.',
                            createdBy: 'Sistema Reclutamiento',
                            createdById: adminUser.id
                        }
                    }).catch(() => { });

                    if (app.status === 'OFFER') {
                        await prisma.candidateEvaluation.create({
                            data: {
                                applicationId: app.id,
                                evaluatorId: adminUser.id,
                                ratings: JSON.stringify({ "Técnica": 9, "Soft Skills": 9 }),
                                comments: 'Cumple con creces el perfil requerido.',
                                recommendation: 'HIRE',
                                overallScore: 92
                            }
                        }).catch(() => { });
                    }
                }
            } catch (e) {
                console.error(`Error reclutamiento ${tenant.name}: ${e.message}`);
            }
        }
        console.log(`Vacantes y candidatos creados para ${tenant.name}.`);
    }
}
