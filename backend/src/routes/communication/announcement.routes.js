import { Router } from 'express';
import {
    createAnnouncement,
    getBoardStats,
    getAnnouncements,
    markAnnouncementReadOrAcknowledge,
    getAnnouncementStats,
    deleteAnnouncement,
    getBirthdays
} from '../../controllers/communication/announcementController.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/board-stats', getBoardStats);
router.get('/birthdays', getBirthdays);
router.get('/', getAnnouncements);
router.post('/', authorize(['admin', 'hr']), createAnnouncement);
router.delete('/:id', authorize(['admin', 'hr']), deleteAnnouncement);
router.post('/:id/read', markAnnouncementReadOrAcknowledge);
router.get('/:id/stats', authorize(['admin', 'hr']), getAnnouncementStats);

export default router;
