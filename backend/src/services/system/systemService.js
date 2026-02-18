import prisma from '../../database/db.js';

class SystemService {
    async getSettings() {
        // upsert guarantees the record always exists
        return await prisma.systemSetting.upsert({
            where: { id: 'default' },
            update: {},
            create: {
                id: 'default',
                maintenanceMode: false,
                biometricEnabled: false,
                maintenanceMessage: 'El sistema estará en mantenimiento brevemente.'
            }
        });
    }

    async updateSettings(data) {
        // upsert so it works even if the record doesn't exist yet
        return await prisma.systemSetting.upsert({
            where: { id: 'default' },
            update: data,
            create: {
                id: 'default',
                maintenanceMode: false,
                biometricEnabled: false,
                maintenanceMessage: 'El sistema estará en mantenimiento brevemente.',
                ...data
            }
        });
    }

    async checkHealth() {
        try {
            // Check DB connection
            await prisma.$queryRaw`SELECT 1`;
            return {
                status: 'UP',
                database: 'CONNECTED',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            };
        } catch (error) {
            return {
                status: 'DOWN',
                database: 'DISCONNECTED',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

export default new SystemService();
