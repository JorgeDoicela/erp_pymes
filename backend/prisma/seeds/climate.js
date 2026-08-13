import { getRandomElement, departments } from './utils.js';

export async function seedClimate(prisma) {
    console.log('[CLIMATE] Generando Encuestas de Clima Laboral para ambas empresas...');

    const tenants = await prisma.tenant.findMany({
        where: { slug: { in: ['empresa-demo', 'tech-solutions'] } }
    });

    const currentYear = new Date().getFullYear();

    for (const tenant of tenants) {
        try {
            let survey = await prisma.climateSurvey.findFirst({
                where: { tenantId: tenant.id, title: `Clima Q4 ${currentYear} - ${tenant.name}` }
            });

            if (!survey) {
                survey = await prisma.climateSurvey.create({
                    data: {
                        tenantId: tenant.id,
                        title: `Clima Q4 ${currentYear} - ${tenant.name}`,
                        startDate: new Date(`${currentYear}-10-01`),
                        endDate: new Date(`${currentYear}-12-31`),
                        isActive: true,
                        description: `Medición anual de clima laboral y eNPS de ${tenant.name}`
                    }
                });
            }

            const surveyComments = [
                'Excelente ambiente laboral y buena cultura de equipo',
                'Oportunidad de mejora en herramientas de trabajo',
                'Liderazgo empático y comunicación clara',
                'Buen balance vida-trabajo y beneficios competitivos',
                'Empresa estable con proyección de crecimiento profesional'
            ];

            const count = await prisma.climateResponse.count({ where: { surveyId: survey.id } });
            if (count < 25) {
                for (let i = 0; i < (25 - count); i++) {
                    const ratings = {
                        'Liderazgo': Math.floor(Math.random() * 2) + 4,
                        'Ambiente Laboral': Math.floor(Math.random() * 2) + 4,
                        'Compensación & Beneficios': Math.floor(Math.random() * 3) + 3,
                        'Comunicación Interna': Math.floor(Math.random() * 2) + 4
                    };
                    await prisma.climateResponse.create({
                        data: {
                            surveyId: survey.id,
                            department: getRandomElement(departments),
                            ratings: JSON.stringify(ratings),
                            npsScore: Math.floor(Math.random() * 3) + 8,
                            comments: Math.random() > 0.4 ? getRandomElement(surveyComments) : null
                        }
                    });
                }
            }
            console.log(`Encuesta de clima y respuestas listas para ${tenant.name}.`);
        } catch (e) {
            console.error(`Error en clima ${tenant.name}: ${e.message}`);
        }
    }
}
