/**
 * @file index.js
 * @description Módulo de Gestión Documental de Colaboradores (Vertical Slice Bounded Context).
 * Expone la API pública, rutas, controlador, servicio, repositorio y tareas programadas.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import router from './document.routes.js';
import documentController, { DocumentController } from './document.controller.js';
import documentService, { DocumentService } from './document.service.js';
import documentRepository, { DocumentRepository } from './document.repository.js';
import { checkDocumentExpirations, initDocumentCronJob } from './document.jobs.js';

export {
  router as documentRoutes,
  documentController,
  DocumentController,
  documentService,
  DocumentService,
  documentRepository,
  DocumentRepository,
  checkDocumentExpirations,
  initDocumentCronJob,
};

export default router;
