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

        // 1. Deactivate previous active config FOR THIS TENANT ONLY
        await prisma.payrollConfig.updateMany({
            where: {
                isActive: true,
                ...(tenantId ? { tenantId } : {})
            },
            data: { isActive: false }
        });

        // 2. Create new config with tenantId
        const newConfig = await prisma.payrollConfig.create({
            data: {
                tenantId,
                workingDays: parseInt(workingDays) || 30,
                items: {
                    create: (items || []).map(item => ({
                        name: item.name,
                        type: item.type,
                        isMandatory: item.isMandatory || false,
                        percentage: item.percentage ? parseFloat(item.percentage) : null,
                        fixedValue: item.fixedValue ? parseFloat(item.fixedValue) : null
                    }))
                }
            },
            include: { items: true }
        });

        return newConfig;
    }
}

export default new PayrollConfigService();
