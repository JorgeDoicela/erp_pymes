import { getRandomElement, getRandomDate } from './utils.js';

export async function seedAbsences(prisma, employees) {
    console.log('[ABSENCES] Generando Solicitudes de Ausencia...');

    for (const emp of employees) {
        if (!emp.isActive) continue;

        try {
            const count = await prisma.absenceRequest.count({ where: { employeeId: emp.id } });
            if (count > 0) continue;

            // Generate 1-3 requests per employee
            const numRequests = Math.floor(Math.random() * 3) + 1;

            for (let i = 0; i < numRequests; i++) {
                const startDate = getRandomDate(new Date('2024-01-01'), new Date('2024-12-01'));
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 3) + 1);

                const status = getRandomElement(['APPROVED', 'PENDING', 'REJECTED']);

                await prisma.absenceRequest.create({
                    data: {
                        employeeId: emp.id,
                        type: getRandomElement(['Vacaciones', 'Enfermedad', 'Personal']),
                        startDate: startDate,
                        endDate: endDate,
                        reason: 'Solicitud de prueba generada por seeder',
                        status: status,
                        adminComment: status === 'REJECTED' ? 'No hay cupo en esas fechas' : status === 'APPROVED' ? 'Disfruta tus vacaciones' : null
                    }
                });
            }

        } catch (e) { }
    }
}
