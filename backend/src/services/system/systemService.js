import prisma from '../../database/db.js';
import { encryptCoordinate, decryptCoordinate } from '../../utils/encryption.js';

class SystemService {
    async getSettings(tenantId = null) {
        try {
            let settings = null;
            if (tenantId) {
                settings = await prisma.systemSetting.findFirst({
                    where: { tenantId }
                });
            }

            if (!settings) {
                // Si no existe para el tenant, buscar 'default' o crearlo
                settings = await prisma.systemSetting.upsert({
                    where: { id: 'default' },
                    update: {},
                    create: {
                        id: 'default',
                        tenantId: tenantId || null,
                        maintenanceMode: false,
                        biometricEnabled: false,
                        allowedIPs: null,
                        globalLatitude: null,
                        globalLongitude: null,
                        globalRadius: 200,
                        maintenanceMessage: 'El sistema estará en mantenimiento brevemente.'
                    }
                });
            }

            return {
                ...settings,
                globalLatitude: decryptCoordinate(settings.globalLatitude),
                globalLongitude: decryptCoordinate(settings.globalLongitude)
            };
        } catch (error) {
            console.error('Error fetching settings:', error);
            return {
                id: 'default',
                tenantId: tenantId || null,
                maintenanceMode: false,
                biometricEnabled: false,
                allowedIPs: null,
                globalLatitude: null,
                globalLongitude: null,
                globalRadius: 200,
                maintenanceMessage: 'El sistema estará en mantenimiento brevemente.'
            };
        }
    }

    async updateSettings(data, tenantId = null) {
        const updateData = { ...data };
        if (data.globalLatitude !== undefined) {
            updateData.globalLatitude = encryptCoordinate(data.globalLatitude);
        }
        if (data.globalLongitude !== undefined) {
            updateData.globalLongitude = encryptCoordinate(data.globalLongitude);
        }

        let settings = null;
        if (tenantId) {
            const existing = await prisma.systemSetting.findFirst({ where: { tenantId } });
            if (existing) {
                settings = await prisma.systemSetting.update({
                    where: { id: existing.id },
                    data: updateData
                });
            } else {
                settings = await prisma.systemSetting.create({
                    data: {
                        tenantId,
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
            }
        } else {
            settings = await prisma.systemSetting.upsert({
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
        }

        return {
            ...settings,
            globalLatitude: decryptCoordinate(settings.globalLatitude),
            globalLongitude: decryptCoordinate(settings.globalLongitude)
        };
    }

    async checkHealth() {
        try {
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
            if (!lat || !lng) throw new Error('Coordinates missing');

            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'RecursosHumanos-App/1.0 (internal-tool)'
                }
            });

            if (!response.ok) {
                throw new Error(`Nominatim API Error: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Geocoding Error:', error.message);
            return null;
        }
    }
}

export default new SystemService();
