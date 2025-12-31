import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Climate Survey Data...');

    // Create one active survey
    const survey = await prisma.climateSurvey.create({
        data: {
            title: 'Encuesta Anual de Clima 2024',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
            description: 'Evaluación general del ambiente laboral - Q4',
            isActive: true,
        }
    });

    const departments = ['IT', 'HR', 'Sales', 'Marketing', 'Finance'];
    const comments = [
        'El ambiente es muy colaborativo.',
        'Necesitamos mejores herramientas de trabajo.',
        'Excelente liderazgo del manager.',
        'El salario podría ser más competitivo.',
        'Me siento muy valorado en la empresa.',
        'Falta comunicación entre departamentos.',
        'Buenas oportunidades de crecimiento.',
    ];

    // Generate 50 random responses
    for (let i = 0; i < 50; i++) {
        const dept = departments[Math.floor(Math.random() * departments.length)];
        const nps = Math.floor(Math.random() * 5) + 6; // Skew towards 6-10

        // Ratings
        const ratings = {
            'Liderazgo': Math.floor(Math.random() * 2) + 4, // 4-5 mostly
            'Ambiente': Math.floor(Math.random() * 3) + 3, // 3-5
            'Salario': Math.floor(Math.random() * 4) + 2, // 2-5
            'Comunicación': Math.floor(Math.random() * 3) + 3,
            'Beneficios': Math.floor(Math.random() * 3) + 3
        };

        const hasComment = Math.random() > 0.7;
        const comment = hasComment ? comments[Math.floor(Math.random() * comments.length)] : null;

        await prisma.climateResponse.create({
            data: {
                surveyId: survey.id,
                department: dept,
                ratings: JSON.stringify(ratings),
                npsScore: nps,
                comments: comment,
                createdAt: new Date(new Date().getTime() - Math.floor(Math.random() * 1000000000)) // Random past date
            }
        });
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
