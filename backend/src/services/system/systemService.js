import prisma from '../../database/db.js';

class SystemService {
    async getSettings() {
        return await prisma.systemSetting.findUnique({
            where: { id: 'default' }
        });
    }

    async updateSettings(data) {
        return await prisma.systemSetting.update({
            where: { id: 'default' },
            data
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
