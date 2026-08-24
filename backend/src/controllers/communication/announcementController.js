import announcementService from '../../services/communication/announcementService.js';

export const createAnnouncement = async (req, res) => {
    try {
        const { title, content, category, priority, requiresAcknowledgment, attachmentUrl } = req.body;
        const authorId = req.user.employeeId || req.user.id;
        const tenantId = req.tenantId || req.user?.tenantId;

        const announcement = await announcementService.createAnnouncement({
            title, content, category, priority, requiresAcknowledgment, attachmentUrl, authorId, tenantId
        });

        return res.status(201).json({ success: true, message: 'Comunicado publicado exitosamente', data: announcement });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getBoardStats = async (req, res) => {
    try {
        const employeeId = req.user.employeeId || req.user.id;
        const tenantId = req.tenantId || req.user?.tenantId;

        const stats = await announcementService.getBoardStats(employeeId, tenantId);
        return res.json({ success: true, data: stats });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getAnnouncements = async (req, res) => {
    try {
        const employeeId = req.user.employeeId || req.user.id;
        const tenantId = req.tenantId || req.user?.tenantId;
        const { category, search, requiresAck, page, limit } = req.query;

        const result = await announcementService.getAnnouncementsForEmployee(employeeId, {
            category,
            search,
            requiresAck,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            tenantId
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
        const tenantId = req.tenantId || req.user?.tenantId;

        const readRecord = await announcementService.markAsReadOrAcknowledged(id, employeeId, { acknowledge: !!acknowledge }, tenantId);
        return res.json({ success: true, message: acknowledge ? 'Acuse de recibo digital registrado' : 'Lectura registrada', data: readRecord });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getAnnouncementStats = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId || req.user?.tenantId;
        const result = await announcementService.getAnnouncementStats(id, tenantId);
        return res.json({ success: true, data: result });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId || req.user?.tenantId;
        const userId = req.user.id;

        const result = await announcementService.deleteAnnouncement(id, tenantId, userId);
        return res.json({ success: true, ...result });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getBirthdays = async (req, res) => {
    try {
        const tenantId = req.tenantId || req.user?.tenantId;
        const birthdays = await announcementService.getBirthdaysOfMonth(tenantId);
        return res.json({ success: true, data: birthdays });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
