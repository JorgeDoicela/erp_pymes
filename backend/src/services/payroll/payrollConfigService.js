import prisma from '../../database/db.js';

class PayrollConfigService {
    async getConfig(tenantId = null) {
        // Return the most recent active configuration for the tenant
        const config = await prisma.payrollConfig.findFirst({
            where: {
                isActive: true,
                ...(tenantId ? { tenantId } : {})
            },
            orderBy: { createdAt: 'desc' },
            include: { items: true }
        });

        // If no config exists, return default structure for frontend
        if (!config) {
            return {
                tenantId,
                workingDays: 30,
                currency: 'USD',
                items: [
                    {
                        name: 'Aporte Personal IESS',
                        type: 'DEDUCTION',
                        isMandatory: true,
                        percentage: 9.45,
                        fixedValue: null
                    }
                ]
            };
        }

        return config;
    }

    async createConfig(data, tenantId = null) {
        const { workingDays, items } = data;

        const parsedWorkingDays = parseInt(workingDays, 10);
        if (isNaN(parsedWorkingDays) || parsedWorkingDays < 1 || parsedWorkingDays > 31) {
            throw new Error('Los días laborables por mes deben ser un número válido entre 1 y 31.');
        }

        if (items && !Array.isArray(items)) {
            throw new Error('La lista de rubros debe ser un arreglo.');
        }

        const formattedItems = (items || []).map((item, idx) => {
            if (!item.name || typeof item.name !== 'string' || !item.name.trim()) {
                throw new Error(`El rubro #${idx + 1} debe tener un nombre válido.`);
            }
            if (!['DEDUCTION', 'EARNING'].includes(item.type)) {
                throw new Error(`El rubro "${item.name}" debe tener un tipo válido (Ingreso o Deducción).`);
            }

            const pct = item.percentage !== '' && item.percentage !== null && item.percentage !== undefined
                ? parseFloat(item.percentage)
                : null;
            const fix = item.fixedValue !== '' && item.fixedValue !== null && item.fixedValue !== undefined
                ? parseFloat(item.fixedValue)
                : null;

            if ((pct === null || isNaN(pct)) && (fix === null || isNaN(fix))) {
                throw new Error(`El rubro "${item.name}" debe tener un porcentaje o un valor fijo numérico.`);
            }
            if (pct !== null && (isNaN(pct) || pct < 0 || pct > 100)) {
                throw new Error(`El porcentaje del rubro "${item.name}" debe estar entre 0% y 100%.`);
            }
            if (fix !== null && (isNaN(fix) || fix < 0)) {
                throw new Error(`El valor fijo del rubro "${item.name}" debe ser un valor positivo.`);
            }

            return {
                name: item.name.trim(),
                type: item.type,
                isMandatory: Boolean(item.isMandatory),
                percentage: pct !== null ? pct : null,
                fixedValue: fix !== null ? fix : null
            };
        });

        return await prisma.$transaction(async (tx) => {
            // 1. Deactivate previous active config FOR THIS TENANT ONLY
            await tx.payrollConfig.updateMany({
                where: {
                    isActive: true,
                    ...(tenantId ? { tenantId } : {})
                },
                data: { isActive: false }
            });

            // 2. Create new config with tenantId
            return await tx.payrollConfig.create({
                data: {
                    tenantId,
                    workingDays: parsedWorkingDays,
                    items: {
                        create: formattedItems
                    }
                },
                include: { items: true }
            });
        });
    }
}

export default new PayrollConfigService();
