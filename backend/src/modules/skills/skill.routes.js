/**
 * @file skill.routes.js
 * @description Norma ERP - Enrutador de Habilidades del Colaborador
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { Router } from 'express';
import skillController from './skill.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, skillController.create);
router.delete('/:id', authenticate, skillController.delete);

export default router;

