import { Router } from 'express';
import {
    createAnnouncement,
    getAnnouncements,
    markAnnouncementReadOrAcknowledge,
    getAnnouncementStats,
    getBirthdays
} from '../../controllers/communication/announcementController.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, getAnnouncements);
router.post('/', authenticate, authorize(['admin', 'hr']), createAnnouncement);
router.post('/:id/read', authenticate, markAnnouncementReadOrAcknowledge);
router.get('/:id/stats', authenticate, authorize(['admin', 'hr']), getAnnouncementStats);
router.get('/birthdays', authenticate, getBirthdays);

export default router;
