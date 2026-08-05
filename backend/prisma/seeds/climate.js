import { getRandomElement, departments } from './utils.js';

export async function seedClimate(prisma) {
    console.log('[CLIMATE] Generando Encuesta de Clima...');
    try {
        const currentYear = new Date().getFullYear();
        let survey = await prisma.climateSurvey.findFirst({ where: { title: `Clima Q4 ${currentYear}` } });

        if (!survey) {
            survey = await prisma.climateSurvey.create({
                data: {
                    title: `Clima Q4 ${currentYear}`,
                    startDate: new Date(`${currentYear}-10-01`),
                    endDate: new Date(`${currentYear}-12-31`),
                    isActive: true,
                    description: 'Medición de clima laboral anual'
                }
            });
        }

        const surveyComments = ['Buen ambiente', 'Necesitamos más herramientas', 'Jefes excelentes', 'Salario bajo', 'Empresa estable'];

        // Add responses if not full
        const count = await prisma.climateResponse.count({ where: { surveyId: survey.id } });
        if (count < 40) {
            for (let i = 0; i < (40 - count); i++) {
                const ratings = {
                    'Liderazgo': Math.floor(Math.random() * 2) + 4,
                    'Ambiente': Math.floor(Math.random() * 3) + 3,
                    'Salario': Math.floor(Math.random() * 4) + 2,
                    'Comunicación': Math.floor(Math.random() * 3) + 3
                };
                await prisma.climateResponse.create({
                    data: {
                        surveyId: survey.id,
                        department: getRandomElement(departments),
                        ratings: JSON.stringify(ratings),
                        npsScore: Math.floor(Math.random() * 5) + 6,
                        comments: Math.random() > 0.5 ? getRandomElement(surveyComments) : null
                    }
                });
            }
        }
    } catch (e) { }
}
