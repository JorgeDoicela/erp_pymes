/**
 * @file index.js
 * @description Módulo de Integración con WhatsApp Cloud API (Meta) e IA de Norma ERP.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import router from './whatsapp.routes.js';
import whatsappController, { WhatsappController } from './whatsapp.controller.js';
import whatsappService, { WhatsappService } from './whatsapp.service.js';
import whatsappClientService, { WhatsappClientService } from './whatsappClient.service.js';
import whatsappSecurityService, { WhatsappSecurityService } from './whatsappSecurity.service.js';
import whatsappRepository, { WhatsappRepository } from './whatsapp.repository.js';
import whatsappAiService, { WhatsappAiService } from './whatsappAi.service.js';
import whatsappActionSessionRepository, {
  WhatsappActionSessionRepository,
  WHATSAPP_SESSION_STATUS,
} from './whatsappActionSession.repository.js';
import whatsappConfirmationService, {
  WhatsappConfirmationService,
} from './whatsappConfirmation.service.js';
import { WhatsappSkillRegistry } from './skills/whatsappSkill.registry.js';
import requestVacationSkill, { RequestVacationSkill } from './skills/requestVacation.skill.js';
import requestSalaryAdvanceSkill, {
  RequestSalaryAdvanceSkill,
} from './skills/requestSalaryAdvance.skill.js';
import requestPermissionSkill, {
  RequestPermissionSkill,
} from './skills/requestPermission.skill.js';
import reviewPendingRequestsSkill, {
  ReviewPendingRequestsSkill,
} from './skills/reviewPendingRequests.skill.js';
import * as whatsappConstants from './whatsapp.constants.js';

export {
  router as whatsappRoutes,
  whatsappController,
  WhatsappController,
  whatsappService,
  WhatsappService,
  whatsappClientService,
  WhatsappClientService,
  whatsappSecurityService,
  WhatsappSecurityService,
  whatsappRepository,
  WhatsappRepository,
  whatsappAiService,
  WhatsappAiService,
  whatsappActionSessionRepository,
  WhatsappActionSessionRepository,
  WHATSAPP_SESSION_STATUS,
  whatsappConfirmationService,
  WhatsappConfirmationService,
  WhatsappSkillRegistry,
  requestVacationSkill,
  RequestVacationSkill,
  requestSalaryAdvanceSkill,
  RequestSalaryAdvanceSkill,
  requestPermissionSkill,
  RequestPermissionSkill,
  reviewPendingRequestsSkill,
  ReviewPendingRequestsSkill,
  whatsappConstants,
};

export default router;
