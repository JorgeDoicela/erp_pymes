export async function seedBenefits(prisma, employees) {
    console.log('[BENEFITS] Generando Beneficios...');

    const benefitsBatch = [];
    for (const emp of employees) {
        if (!emp.isActive) continue;
        benefitsBatch.push(
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
        );
    }

    if (benefitsBatch.length > 0) {
        await prisma.employeeBenefit.createMany({ data: benefitsBatch, skipDuplicates: true });
    }
}
