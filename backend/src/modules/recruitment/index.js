/**
 * @file index.js
 * @description Módulo de Atracción, Selección y Reclutamiento de Talento (Vertical Slice Bounded Context).
 * Expone la API pública, rutas, controlador, servicio y repositorio para gestión de vacantes, postulaciones y entrevistas.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import router from './recruitment.routes.js';
import * as recruitmentController from './recruitment.controller.js';
import { recruitmentService } from './recruitment.service.js';
import recruitmentRepository from './recruitment.repository.js';

export {
  router as recruitmentRoutes,
  recruitmentController,
  recruitmentService,
  recruitmentRepository,
};

export default router;
