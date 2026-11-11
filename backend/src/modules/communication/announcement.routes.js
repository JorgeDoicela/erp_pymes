/**
 * @file announcement.routes.js
 * @description Norma ERP - Enrutador de Comunicados Internos
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import {
  createAnnouncement,
  getBoardStats,
  getAnnouncements,
  markAnnouncementReadOrAcknowledge,
  getAnnouncementStats,
  deleteAnnouncement,
  getBirthdays,
} from './announcement.controller.js';
import { authenticate, authorize } from '../auth/auth.middleware.js';

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
