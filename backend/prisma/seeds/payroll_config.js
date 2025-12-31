export async function seedPayrollConfig(prisma) {
    console.log('⚙️ Generando Configuración de Nómina...');

    try {
        // 1. Check/Create Config
        let config = await prisma.payrollConfig.findFirst({ where: { isActive: true } });

        if (!config) {
            config = await prisma.payrollConfig.create({
                data: {
                    workingDays: 30,
                    currency: 'USD',
                    validFrom: new Date('2024-01-01'),
                    isActive: true
                }
            });
        }

        // 2. Create Standard Items (Ecuador/General Context)
        const items = [
            { name: 'Sueldo Base', type: 'EARNING', isMandatory: true, percentage: null, fixedValue: null },
            { name: 'Horas Extras', type: 'EARNING', isMandatory: false, percentage: null, fixedValue: null },
            { name: 'Bono Desempeño', type: 'EARNING', isMandatory: false, percentage: null, fixedValue: null },
            { name: 'Aporte IESS Personal', type: 'DEDUCTION', isMandatory: true, percentage: 9.45, fixedValue: null },
            { name: 'Impuesto Renta', type: 'DEDUCTION', isMandatory: false, percentage: null, fixedValue: null },
            { name: 'Préstamo Quirografario', type: 'DEDUCTION', isMandatory: false, percentage: null, fixedValue: null }
        ];

        for (const item of items) {
            const exists = await prisma.payrollItem.findFirst({
                where: { configId: config.id, name: item.name }
            });

            if (!exists) {
                await prisma.payrollItem.create({
                    data: {
                        configId: config.id,
                        name: item.name,
                        type: item.type,
                        isMandatory: item.isMandatory || false,
                        percentage: item.percentage,
                        fixedValue: item.fixedValue
                    }
                });
            }
        }
        console.log('✅ Configuración de Nómina creada.');

    } catch (e) {
        console.log(`Payroll Config Error: ${e.message}`);
    }
}
