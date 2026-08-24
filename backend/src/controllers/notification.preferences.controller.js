import prisma from '../database/db.js';
import auditRepository from '../repositories/audit/auditRepository.js';

export const getPreferences = async (req, res) => {
    try {
        const employeeId = req.user?.employeeId || req.user?.id;
        if (!employeeId) {
            return res.status(401).json({ message: 'Usuario no identificado' });
        }

        let prefs = await prisma.notificationPreference.findUnique({
            where: { employeeId }
        });

        if (!prefs) {
            return res.json({
                employeeId,
                preferences: {}
            });
        }

        res.json(prefs);
    } catch (error) {
        console.error('Error fetching preferences:', error);
        res.status(500).json({ message: 'Error al obtener preferencias de notificación' });
    }
};

export const updatePreferences = async (req, res) => {
    try {
        const employeeId = req.user?.employeeId || req.user?.id;
        const tenantId = req.tenantId || req.user?.tenantId;
        const { preferences } = req.body;

        if (!employeeId) {
            return res.status(401).json({ message: 'Usuario no identificado' });
        }

        const prefs = await prisma.notificationPreference.upsert({
            where: { employeeId },
            update: { preferences },
            create: {
                employeeId,
                preferences
            }
        });

        // Audit Log
        await auditRepository.log({
            tenantId: tenantId || null,
            entity: 'NotificationPreference',
            entityId: prefs.id,
            action: 'UPDATE_NOTIFICATION_PREFERENCES',
            userId: employeeId,
            details: { updatedEventKeys: Object.keys(preferences || {}) }
        }).catch(err => console.error('[Audit Error] updatePreferences:', err));

        res.json({
            success: true,
            message: 'Preferencias guardadas exitosamente',
            data: prefs
        });
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({ success: false, message: 'Error al guardar preferencias de notificación' });
    }
};
