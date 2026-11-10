/**
 * @file report.routes.js
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import reportController from '../../controllers/reports/reportController.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/attendance', authenticate, authorize(['admin']), reportController.getAttendanceReport);

export default router;
