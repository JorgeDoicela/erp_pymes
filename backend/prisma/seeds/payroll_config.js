export async function seedPayrollConfig(prisma) {
    console.log('[PAYROLL_CONFIG] Generando Configuración de Nómina Ecuatoriana para ambas empresas...');

    try {
        const tenants = await prisma.tenant.findMany({
            where: { slug: { in: ['empresa-demo', 'tech-solutions'] } }
        });

        for (const tenant of tenants) {
            let config = await prisma.payrollConfig.findFirst({
                where: { tenantId: tenant.id, isActive: true }
            });

            if (!config) {
                config = await prisma.payrollConfig.create({
                    data: {
                        tenantId: tenant.id,
                        workingDays: 30,
                        currency: 'USD',
                        validFrom: new Date('2024-01-01'),
                        isActive: true
                    }
                });
            }

            const items = [
                { name: 'Sueldo Base', type: 'EARNING', isMandatory: true, percentage: null, fixedValue: null },
                { name: 'Horas Extras 50%', type: 'EARNING', isMandatory: false, percentage: null, fixedValue: null },
                { name: 'Horas Extras 100%', type: 'EARNING', isMandatory: false, percentage: null, fixedValue: null },
                { name: 'Bono por Desempeño', type: 'EARNING', isMandatory: false, percentage: null, fixedValue: null },
                { name: 'Aporte IESS Personal', type: 'DEDUCTION', isMandatory: true, percentage: 9.45, fixedValue: null },
                { name: 'Impuesto a la Renta', type: 'DEDUCTION', isMandatory: false, percentage: null, fixedValue: null },
                { name: 'Préstamo Quirografario IESS', type: 'DEDUCTION', isMandatory: false, percentage: null, fixedValue: null }
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
            console.log(`Configuración de nómina lista para ${tenant.name}.`);
        }
    } catch (e) {
        console.error(`❌ Error en PayrollConfig: ${e.message}`);
    }
}
