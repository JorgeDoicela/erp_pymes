import announcementService from '../../services/communication/announcementService.js';

export const createAnnouncement = async (req, res) => {
    try {
        const { title, content, category, priority, requiresAcknowledgment, attachmentUrl } = req.body;
        const authorId = req.user.employeeId || req.user.id;

        const announcement = await announcementService.createAnnouncement({
            title, content, category, priority, requiresAcknowledgment, attachmentUrl, authorId
        });

        return res.status(201).json({ success: true, message: 'Comunicado publicado exitosamente', data: announcement });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getAnnouncements = async (req, res) => {
    try {
        const employeeId = req.user.employeeId || req.user.id;
        const { category, search, page, limit } = req.query;

        const result = await announcementService.getAnnouncementsForEmployee(employeeId, {
            category,
            search,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20
        });

        return res.json({ success: true, ...result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const markAnnouncementReadOrAcknowledge = async (req, res) => {
    try {
        const { id } = req.params;
        const { acknowledge } = req.body;
        const employeeId = req.user.employeeId || req.user.id;

        const readRecord = await announcementService.markAsReadOrAcknowledged(id, employeeId, { acknowledge: !!acknowledge });
        return res.json({ success: true, message: acknowledge ? 'Acuse de recibo registrado' : 'Lectura registrada', data: readRecord });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getAnnouncementStats = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await announcementService.getAnnouncementStats(id);
        return res.json({ success: true, data: result });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getBirthdays = async (req, res) => {
    try {
        const birthdays = await announcementService.getBirthdaysOfMonth();
        return res.json({ success: true, data: birthdays });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
