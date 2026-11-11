/**
 * @file index.js
 * @description Módulo de Habilidades y Competencias (Vertical Slice Bounded Context).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import router from './skill.routes.js';
import skillController, { SkillController } from './skill.controller.js';
import skillService, { SkillService } from './skill.service.js';
import skillRepository, { SkillRepository } from './skill.repository.js';

export {
  router as skillRoutes,
  skillController,
  SkillController,
  skillService,
  SkillService,
  skillRepository,
  SkillRepository,
};

export default router;

