export async function seedGoals(prisma, employees) {
    console.log('🎯 Generando Objetivos (Goals)...');

    for (const emp of employees) {
        if (!emp.isActive) continue;

        try {
            const count = await prisma.employeeGoal.count({ where: { employeeId: emp.id } });
            if (count > 0) continue;

            await prisma.employeeGoal.createMany({
                data: [
                    {
                        employeeId: emp.id,
                        title: 'Aumentar cobertura de tests',
                        description: 'Llegar al 80% de coverage en backend',
                        metric: 'Coverage %',
                        targetValue: 80,
                        currentValue: 65,
                        unit: '%',
                        deadline: new Date('2024-12-31'),
                        priority: 'HIGH',
                        status: 'IN_PROGRESS',
                        progress: 65
                    },
                    {
                        employeeId: emp.id,
                        title: 'Completar capacitación de seguridad',
                        description: 'Curso anual obligatorio',
                        metric: 'Certificado',
                        targetValue: 1,
                        currentValue: 0,
                        unit: 'Bool',
                        deadline: new Date('2024-06-30'),
                        priority: 'MEDIUM',
                        status: 'PENDING',
                        progress: 0
                    }
                ]
            });
        } catch (e) { }
    }
}
