export async function seedGoals(prisma, employees) {
    console.log('[GOALS] Generando Objetivos (Goals)...');

    for (const emp of employees) {
        if (!emp.isActive) continue;

        try {
            const count = await prisma.employeeGoal.count({ where: { employeeId: emp.id } });
            if (count > 0) continue;

            const currentYear = new Date().getFullYear();
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
                        deadline: new Date(`${currentYear}-12-31`),
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
                        deadline: new Date(`${currentYear}-09-30`),
                        priority: 'MEDIUM',
                        status: 'PENDING',
                        progress: 0
                    },
                    {
                        employeeId: emp.id,
                        title: 'Optimización de API Crítica',
                        description: 'Reducir tiempos de respuesta en 200ms',
                        metric: 'ms',
                        targetValue: 200,
                        currentValue: 40,
                        unit: 'ms',
                        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // En 15 días (En riesgo)
                        priority: 'HIGH',
                        status: 'IN_PROGRESS',
                        progress: 20 // < 70%
                    }
                ]
            });
        } catch (e) { }
    }
}
