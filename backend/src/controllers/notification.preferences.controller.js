import prisma from '../database/db.js';

export const getPreferences = async (req, res) => {
    try {
        const { id: employeeId } = req.user; // Assumes Auth Middleware populates req.user

        let prefs = await prisma.notificationPreference.findUnique({
            where: { employeeId }
        });

        if (!prefs) {
            // Return default structure if no prefs exist
            return res.json({
                employeeId,
                preferences: {} // Empty means "All Enabled" by default usually, or client handles defaults
            });
        }

        res.json(prefs);
    } catch (error) {
        console.error('Error fetching preferences:', error);
        res.status(500).json({ message: 'Error al obtener preferencias' });
    }
};

export const updatePreferences = async (req, res) => {
    try {
        const { id: employeeId } = req.user;
        const { preferences } = req.body;

        const prefs = await prisma.notificationPreference.upsert({
            where: { employeeId },
            update: { preferences },
            create: {
                employeeId,
                preferences
            }
        });

        res.json(prefs);
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({ message: 'Error al guardar preferencias' });
    }
};
