/**
 * @file whatsappAi.service.js
 * @description Orquestador de Inteligencia Artificial para WhatsApp con soporte para DeepSeek, Gemini,
 * RAG Legal Ecuatoriano y Habilidades Agénticas Multi-Tenant con confirmación 2FA.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import {
  WHATSAPP_INTENTS,
  WHATSAPP_SYSTEM_PROMPT,
  UNREGISTERED_PHONE_MESSAGE,
  RESET_CONVERSATION_FEEDBACK_MESSAGE,
  OUT_OF_SCOPE_MESSAGE,
  cleanTextForWhatsapp,
} from './whatsapp.constants.js';
import {
  classifyIntent,
  isCancellationCommand,
  formatGreetingMessage,
  formatPayrollAndRequestsMessage,
  formatEmployeeRequestsMessage,
  formatTenantMetricsMessage,
  formatEmployeeProfileFallback,
  formatSwitchTenantInfo,
  resolveAiProviderConfig,
} from './whatsappAi.utils.js';
import { llmProviderService, sustainabilityRagService } from '../sustainability/index.js';
import whatsappRepository from './whatsapp.repository.js';
import whatsappConfirmationService from './whatsappConfirmation.service.js';
import whatsappConsentService from './whatsappConsent.service.js';
import whatsappConversationHistoryService from './whatsappConversationHistory.service.js';
import { auditService } from '../audit/index.js';
import whatsappActionSessionRepository, {
  WHATSAPP_SESSION_STATUS,
} from './whatsappActionSession.repository.js';
import { WhatsappSkillRegistry } from './skills/whatsappSkill.registry.js';
import requestVacationSkill from './skills/requestVacation.skill.js';
import requestSalaryAdvanceSkill from './skills/requestSalaryAdvance.skill.js';
import requestPermissionSkill from './skills/requestPermission.skill.js';
import reviewPendingRequestsSkill from './skills/reviewPendingRequests.skill.js';

const defaultSkillRegistry = new WhatsappSkillRegistry([
  requestVacationSkill,
  requestSalaryAdvanceSkill,
  requestPermissionSkill,
  reviewPendingRequestsSkill,
]);

const INTENT_TO_SKILL_ID = {
  [WHATSAPP_INTENTS.VACATION_REQUEST_ACTION]: 'REQUEST_VACATION',
  [WHATSAPP_INTENTS.SALARY_ADVANCE_ACTION]: 'REQUEST_SALARY_ADVANCE',
  [WHATSAPP_INTENTS.PERMISSION_REQUEST_ACTION]: 'REQUEST_PERMISSION',
  [WHATSAPP_INTENTS.REVIEW_REQUESTS_ACTION]: 'REVIEW_PENDING_REQUESTS',
};

const INTERRUPT_COLLECTING_INTENTS = new Set([
  WHATSAPP_INTENTS.GENERAL_GREETING,
  WHATSAPP_INTENTS.RESET_CONVERSATION_COMMAND,
  WHATSAPP_INTENTS.SWITCH_TENANT_COMMAND,
  WHATSAPP_INTENTS.LOPDP_CONSENT_REVOKE,
  WHATSAPP_INTENTS.LOPDP_CONSENT_ACCEPT,
  WHATSAPP_INTENTS.PAYROLL_SLIP_QUERY,
  WHATSAPP_INTENTS.EMPLOYEE_REQUESTS_QUERY,
  WHATSAPP_INTENTS.TENANT_METRICS_QUERY,
]);

function shouldInterruptCollectingDraft(text, intent, currentSkillName) {
  if (INTERRUPT_COLLECTING_INTENTS.has(intent)) return true;
  const targetSkillId = INTENT_TO_SKILL_ID[intent];
  if (targetSkillId && targetSkillId !== currentSkillName) return true;
  const raw = String(text || '').trim();
  if (
    (intent === WHATSAPP_INTENTS.EMPLOYEE_QUERY || intent === WHATSAPP_INTENTS.LEGAL_QUERY) &&
    (raw.includes('?') ||
      /^(?:cuant[oa]s?|cual(?:es)?|como|que\s+|cuando|donde|quiero\s+(?:saber|consultar|ver)|quisiera\s+(?:saber|consultar))\b/i.test(
        raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      ))
  ) {
    return true;
  }
  return false;
}

export class WhatsappAiService {
  constructor(
    llmProvider = llmProviderService,
    ragService = sustainabilityRagService,
    repo = whatsappRepository,
    confirmationService = whatsappConfirmationService,
    skillRegistry = defaultSkillRegistry,
    sessionRepo = whatsappActionSessionRepository,
    consentService = whatsappConsentService,
    auditor = auditService,
    historyService = whatsappConversationHistoryService
  ) {
    Object.assign(this, {
      llmProvider,
      ragService,
      repo,
      confirmationService,
      skillRegistry,
      sessionRepo,
      consentService,
      auditor,
      historyService,
    });
  }

  resolveAiProviderConfig(overrides = {}) {
    return resolveAiProviderConfig(overrides);
  }
  classifyIntent(text, employee) {
    return classifyIntent(text, employee);
  }
  formatGreetingMessage(employee) {
    return formatGreetingMessage(employee);
  }
  cleanTextForWhatsapp(rawText) {
    return cleanTextForWhatsapp(rawText);
  }

  async resolveActiveSessionTurn({ text, employee, phoneKey, messageId, aiConfig, intent }) {
    if (
      !phoneKey ||
      !employee.tenantId ||
      !employee.id ||
      !this.sessionRepo ||
      !this.confirmationService
    )
      return null;
    const activeSession = await this.sessionRepo.findOpenSession({
      phoneKey,
      tenantId: employee.tenantId,
      employeeId: employee.id,
    });
    if (!activeSession) return null;
    if (activeSession.status === WHATSAPP_SESSION_STATUS.PENDING_CONFIRMATION) {
      return this.confirmationService.handlePendingConfirmation({
        text,
        employee,
        phoneKey,
        messageId,
        activeSession,
        skillRegistry: this.skillRegistry,
      });
    }
    if (activeSession.status !== WHATSAPP_SESSION_STATUS.COLLECTING_PARAMS) return null;

    const mark = (status) =>
      this.sessionRepo.markStatus({
        id: activeSession.id,
        tenantId: employee.tenantId,
        employeeId: employee.id,
        status,
      });
    if (isCancellationCommand(text)) {
      await mark(WHATSAPP_SESSION_STATUS.CANCELLED);
      return `Borrador de solicitud cancelado correctamente.`;
    }
    if (new Date(activeSession.expiresAt).getTime() <= Date.now()) {
      await mark(WHATSAPP_SESSION_STATUS.EXPIRED);
      return null;
    }
    if (shouldInterruptCollectingDraft(text, intent, activeSession.skillName)) {
      await mark(WHATSAPP_SESSION_STATUS.CANCELLED);
      return null;
    }
    return this.handleAgenticSkill({
      skillId: activeSession.skillName,
      text,
      employee,
      phoneKey,
      messageId,
      activeSession,
      aiConfig,
    });
  }

  async generateResponse({ text, employee, phoneKey = null, messageId = null, aiOverrides = {} }) {
    const aiConfig = this.resolveAiProviderConfig(aiOverrides);
    if (!employee) return UNREGISTERED_PHONE_MESSAGE;
    if (typeof this.consentService?.handleConsentFlow === 'function') {
      const consentReply = await this.consentService.handleConsentFlow({
        text,
        employee,
        phoneKey,
        sessionRepo: this.sessionRepo,
        auditor: this.auditor,
      });
      if (consentReply) return consentReply;
    }
    const intent = this.classifyIntent(text, employee);
    const sessionReply = await this.resolveActiveSessionTurn({
      text,
      employee,
      phoneKey,
      messageId,
      aiConfig,
      intent,
    });
    if (sessionReply) return sessionReply;
    if (intent === WHATSAPP_INTENTS.GENERAL_GREETING) return this.formatGreetingMessage(employee);
    if (intent === WHATSAPP_INTENTS.RESET_CONVERSATION_COMMAND) {
      if (phoneKey) await this.historyService.resetHistory({ phoneKey });
      return RESET_CONVERSATION_FEEDBACK_MESSAGE;
    }
    if (intent === WHATSAPP_INTENTS.SWITCH_TENANT_COMMAND) {
      if (phoneKey) await this.historyService.resetHistory({ phoneKey });
      return formatSwitchTenantInfo(employee);
    }
    if (INTENT_TO_SKILL_ID[intent]) {
      return this.handleAgenticSkill({
        skillId: INTENT_TO_SKILL_ID[intent],
        text,
        employee,
        phoneKey: phoneKey || employee.phone || employee.id,
        messageId,
        activeSession: null,
        aiConfig,
      });
    }
    if (intent === WHATSAPP_INTENTS.EMPLOYEE_REQUESTS_QUERY)
      return this.handleEmployeeRequestsQuery({ employee });
    if (intent === WHATSAPP_INTENTS.PAYROLL_SLIP_QUERY)
      return this.handlePayrollAndRequestsQuery({ employee });
    if (intent === WHATSAPP_INTENTS.TENANT_METRICS_QUERY)
      return this.handleTenantMetricsQuery({ employee });
    if (intent === WHATSAPP_INTENTS.OUT_OF_SCOPE_QUERY) return OUT_OF_SCOPE_MESSAGE;
    if (intent === WHATSAPP_INTENTS.EMPLOYEE_QUERY)
      return this.handleEmployeePersonalQuery({ text, employee, phoneKey, aiConfig });
    return this.handleLegalQuery({ text, employee, phoneKey, aiConfig });
  }

  async handleAgenticSkill({
    skillId,
    text,
    employee,
    phoneKey,
    messageId,
    activeSession,
    aiConfig,
  }) {
    if (!employee.tenantId)
      return `Su perfil no tiene una empresa activa asignada para ejecutar solicitudes operativas.`;
    const skill = this.skillRegistry?.getSkill(skillId);
    if (!skill) return `La accion solicitada no se encuentra habilitada en este momento.`;

    const prep = await skill.prepareDraft({ text, employee, activeSession, aiConfig });
    if (prep.status === 'NEED_MORE_INFO') {
      await this.confirmationService?.saveCollectingDraft({
        employee,
        phoneKey,
        skillName: skill.id,
        partialPayload: prep.partialPayload,
        activeSession,
        sourceMessageId: messageId,
      });
      return prep.promptMessage;
    }
    if (prep.status === 'DOMAIN_REJECTED') {
      if (activeSession) {
        await this.sessionRepo?.markStatus({
          id: activeSession.id,
          tenantId: employee.tenantId,
          employeeId: employee.id,
          status: WHATSAPP_SESSION_STATUS.CANCELLED,
        });
      }
      return prep.errorMessage;
    }
    if (prep.status === 'READY_FOR_CONFIRMATION' && this.confirmationService) {
      return this.confirmationService.initiateDualConfirmation({
        employee,
        phoneKey,
        skill,
        draftSummary: prep.draftSummary,
        sourceMessageId: messageId,
      });
    }
    return `No fue posible preparar la solicitud en este momento.`;
  }

  async getEmployeePayrollAndRequestsData(employee) {
    return typeof this.repo.getEmployeeLatestPayrollAndRequests === 'function'
      ? this.repo.getEmployeeLatestPayrollAndRequests(employee.id, employee.tenantId)
      : { latestPayrollDetail: null, recentAbsences: [], recentAdvances: [] };
  }

  async handleEmployeeRequestsQuery({ employee }) {
    return formatEmployeeRequestsMessage(
      employee,
      await this.getEmployeePayrollAndRequestsData(employee)
    );
  }
  async handlePayrollAndRequestsQuery({ employee }) {
    return formatPayrollAndRequestsMessage(
      employee,
      await this.getEmployeePayrollAndRequestsData(employee)
    );
  }

  async handleEmployeePersonalQuery({ text, employee, phoneKey = null, aiConfig }) {
    const todayAttendance = await this.repo.getEmployeeAttendanceToday(employee.id);
    const tzOpt = { hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil' };
    const checkIn = todayAttendance?.checkIn
      ? new Date(todayAttendance.checkIn).toLocaleTimeString('es-EC', tzOpt)
      : 'Sin entrada';
    const checkOut = todayAttendance?.checkOut
      ? new Date(todayAttendance.checkOut).toLocaleTimeString('es-EC', tzOpt)
      : 'Pendiente';

    const factsPrompt = `Datos del colaborador: ${employee.firstName} ${employee.lastName} (${employee.tenant?.name || 'N/A'}), Cargo: ${employee.position}, Dpto: ${employee.department}, Vacaciones: ${employee.vacationDays} días, Marcación hoy: Entrada ${checkIn}, Salida ${checkOut}.\nPregunta: "${text}"\nInstrucciones: Responde conciso en formato WhatsApp (*negrita*, guiones). No inventes datos.`;
    const history = phoneKey
      ? await this.historyService.getActiveHistory({ phoneKey, tenantId: employee.tenantId })
      : [];
    const messages = [
      ...history.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      { role: 'user', content: factsPrompt },
    ];

    try {
      const llmResult = await this.llmProvider.generateChatCompletion({
        systemPrompt: WHATSAPP_SYSTEM_PROMPT,
        messages,
        temperature: 0.0,
        providerOverrides: aiConfig,
      });
      if (llmResult?.content) {
        const formatted = cleanTextForWhatsapp(llmResult.content);
        if (phoneKey) {
          await this.historyService.recordTurn({
            phoneKey,
            tenantId: employee.tenantId,
            userText: text,
            assistantText: formatted,
          });
        }
        return formatted;
      }
    } catch (err) {
      console.error('[WhatsApp AI Error] Fallo al generar respuesta personal:', err.message);
    }
    return formatEmployeeProfileFallback(employee, checkIn, checkOut);
  }

  async handleLegalQuery({ text, employee, phoneKey = null, aiConfig }) {
    try {
      const history = phoneKey
        ? await this.historyService.getActiveHistory({ phoneKey, tenantId: employee.tenantId })
        : [];
      const ragResponse = await this.ragService.processQuery({
        query: text,
        conversationHistory: history,
        tenantId: employee.tenantId,
        userRole: employee.role,
        moduleContext: 'whatsapp',
        providerOverrides: aiConfig,
      });

      if (ragResponse?.answer) {
        let formatted = cleanTextForWhatsapp(ragResponse.answer);
        if (ragResponse.legalCitations?.length) {
          formatted += `\n\n*Fundamento Normativo Oficial:*`;
          ragResponse.legalCitations.slice(0, 5).forEach((c) => {
            formatted += `\n- *${c.articleCode}* (${c.documentTitle})`;
          });
        }
        if (phoneKey) {
          await this.historyService.recordTurn({
            phoneKey,
            tenantId: employee.tenantId,
            userText: text,
            assistantText: formatted,
          });
        }
        return formatted;
      }
    } catch (err) {
      console.error('[WhatsApp AI Error] Fallo al procesar consulta RAG:', err.message);
    }
    return (
      `No fue posible verificar con precisión la normativa para su consulta en este momento.\n\n` +
      `Por favor formule su pregunta especificando el tema laboral o artículo de interés (ej. *Art. 188 Código del Trabajo* o *horas extraordinarias*).`
    );
  }

  async handleTenantMetricsQuery({ employee }) {
    const allowedRoles = ['admin', 'manager', 'hr', 'accounting', 'entrepreneur', 'superadmin'];
    if (!allowedRoles.includes(employee.role?.toLowerCase())) {
      return `Estimado(a) ${employee.firstName}, su rol actual (${employee.role}) no dispone de autorizacion para consultar metricas generales de la empresa.\n\nPuede consultar su saldo de vacaciones, rol de pagos, registro de marcaciones y legislacion laboral.`;
    }
    const metrics = await this.repo.getTenantSummaryMetrics(employee.tenantId);
    return formatTenantMetricsMessage(employee, metrics);
  }
}

const whatsappAiService = new WhatsappAiService();
export default whatsappAiService;
