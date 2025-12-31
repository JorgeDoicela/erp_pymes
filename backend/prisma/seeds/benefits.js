export async function seedBenefits(prisma, employees) {
    console.log('[BENEFITS] Generando Beneficios...');

    for (const emp of employees) {
        if (!emp.isActive) continue;

        try {
            const count = await prisma.employeeBenefit.count({ where: { employeeId: emp.id } });
            if (count > 0) continue;

            await prisma.employeeBenefit.createMany({
                data: [
                    {
                        employeeId: emp.id,
                        name: 'Seguro Médico Privado',
                        amount: 150.00,
                        type: 'ALLOWANCE',
                        frequency: 'RECURRING',
                        status: 'ACTIVE'
                    },
                    {
                        employeeId: emp.id,
                        name: 'Bono Gimnasio',
                        amount: 30.00,
                        type: 'ALLOWANCE',
                        frequency: 'RECURRING',
                        status: 'ACTIVE'
                    }
                ]
            });
        } catch (e) { }
    }
}
