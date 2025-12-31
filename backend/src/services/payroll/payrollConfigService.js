import prisma from '../../database/db.js';

class PayrollConfigService {
    async getConfig() {
        // Return the most recent active configuration
        const config = await prisma.payrollConfig.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            include: { items: true }
        });

        // If no config exists, return default/empty structure for frontend
        if (!config) {
            return {
                workingDays: 30,
                currency: 'USD',
                items: []
            };
        }

        return config;
    }

    async createConfig(data) {
        // 1. Deactivate previous active config
        await prisma.payrollConfig.updateMany({
            where: { isActive: true },
            data: { isActive: false }
        });

        // 2. Create new config
        // Data expected: { workingDays, items: [{ name, type, percentage, fixedValue, isMandatory }] }
        const { workingDays, items } = data;

        const newConfig = await prisma.payrollConfig.create({
            data: {
                workingDays: parseInt(workingDays),
                items: {
                    create: items.map(item => ({
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
