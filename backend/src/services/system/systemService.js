import prisma from '../../database/db.js';
import { encryptCoordinate, decryptCoordinate } from '../../utils/encryption.js';

class SystemService {
    async getSettings() {
        // upsert guarantees the record always exists
        const settings = await prisma.systemSetting.upsert({
            where: { id: 'default' },
            update: {},
            create: {
                id: 'default',
                maintenanceMode: false,
                biometricEnabled: false,
                allowedIPs: null,
                globalLatitude: null,
                globalLongitude: null,
                globalRadius: 200,
                maintenanceMessage: 'El sistema estará en mantenimiento brevemente.'
            }
        });

        return {
            ...settings,
            globalLatitude: decryptCoordinate(settings.globalLatitude),
            globalLongitude: decryptCoordinate(settings.globalLongitude)
        };
    }

    async updateSettings(data) {
        const updateData = { ...data };
        if (data.globalLatitude !== undefined) {
            updateData.globalLatitude = encryptCoordinate(data.globalLatitude);
        }
        if (data.globalLongitude !== undefined) {
            updateData.globalLongitude = encryptCoordinate(data.globalLongitude);
        }

        // upsert so it works even if the record doesn't exist yet
        const settings = await prisma.systemSetting.upsert({
            where: { id: 'default' },
            update: updateData,
            create: {
                id: 'default',
                maintenanceMode: false,
                biometricEnabled: false,
                allowedIPs: null,
                globalLatitude: null,
                globalLongitude: null,
                globalRadius: 200,
                maintenanceMessage: 'El sistema estará en mantenimiento brevemente.',
                ...updateData
            }
        });

        return {
            ...settings,
            globalLatitude: decryptCoordinate(settings.globalLatitude),
            globalLongitude: decryptCoordinate(settings.globalLongitude)
        };
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

    async reverseGeocode(lat, lng) {
        try {
            // Validate coordinates
            if (!lat || !lng) throw new Error('Coordinates missing');

            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Emplifi-App/1.0 (internal-tool)'
                }
            });

            if (!response.ok) {
                throw new Error(`Nominatim API Error: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Geocoding Error:', error.message);
            return null; // Return null instead of crashing, frontend will handle it
        }
    }
}

export default new SystemService();
