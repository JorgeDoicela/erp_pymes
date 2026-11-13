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
  cleanTextForWhatsapp,
} from './whatsapp.constants.js';
import {
  classifyIntent,
  formatGreetingMessage,
  formatPayrollAndRequestsMessage,
  formatTenantMetricsMessage,
} from './whatsappAi.utils.js';
import { llmProviderService, sustainabilityRagService } from '../sustainability/index.js';
import whatsappRepository from './whatsapp.repository.js';
import whatsappConfirmationService from './whatsappConfirmation.service.js';
import whatsappConsentService from './whatsappConsent.service.js';
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

export class WhatsappAiService {
  constructor(
    llmProvider = llmProviderService,
    ragService = sustainabilityRagService,
    repo = whatsappRepository,
    confirmationService = whatsappConfirmationService,
    skillRegistry = defaultSkillRegistry,
    sessionRepo = whatsappActionSessionRepository,
    consentService = whatsappConsentService,
    auditor = auditService
  ) {
    this.llmProvider = llmProvider;
    this.ragService = ragService;
    this.repo = repo;
    this.confirmationService = confirmationService;
    this.skillRegistry = skillRegistry;
    this.sessionRepo = sessionRepo;
    this.consentService = consentService;
    this.auditor = auditor;
  }

  /**
   * Resuelve el proveedor de IA activo para WhatsApp (DeepSeek o Gemini con fallbacks seguros).
   */
  resolveAiProviderConfig(overrides = {}) {
    const requestedProvider = (
      overrides.provider ||
      process.env.WHATSAPP_AI_PROVIDER ||
      process.env.AI_PROVIDER ||
      (process.env.DEEPSEEK_API_KEY ? 'deepseek' : '') ||
      (process.env.GEMINI_API_KEY ? 'gemini' : '') ||
      'deepseek'
    )
      .toLowerCase()
      .trim();

    if (requestedProvider === 'gemini') {
      return {
        provider: 'gemini',
        apiKey: overrides.apiKey || process.env.GEMINI_API_KEY,
        model: overrides.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        temperature: 0.0,
      };
    }

    return {
      provider: 'deepseek',
      apiKey: overrides.apiKey || process.env.DEEPSEEK_API_KEY,
      model: overrides.model || process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      temperature: 0.0,
    };
  }

  classifyIntent(text, employee) {
    return classifyIntent(text, employee);
  }

  /**
   * Genera la respuesta apropiada para WhatsApp orquestando RAG, habilidades agénticas, datos del ERP y el LLM.
   */
  async generateResponse({ text, employee, phoneKey = null, messageId = null, aiOverrides = {} }) {
    const aiConfig = this.resolveAiProviderConfig(aiOverrides);

    if (!employee) {
      return UNREGISTERED_PHONE_MESSAGE;
    }

    if (this.consentService && typeof this.consentService.handleConsentFlow === 'function') {
      const consentReply = await this.consentService.handleConsentFlow({
        text,
        employee,
        phoneKey,
        sessionRepo: this.sessionRepo,
        auditor: this.auditor,
      });
      if (consentReply) return consentReply;
    }

    // Sesión agéntica activa (recolección de parámetros o doble factor pendiente)
    if (
      phoneKey &&
      employee.tenantId &&
      employee.id &&
      this.sessionRepo &&
      this.confirmationService
    ) {
      const activeSession = await this.sessionRepo.findOpenSession({
        phoneKey,
        tenantId: employee.tenantId,
        employeeId: employee.id,
      });

      if (activeSession) {
        if (activeSession.status === WHATSAPP_SESSION_STATUS.PENDING_CONFIRMATION) {
          const confirmationReply = await this.confirmationService.handlePendingConfirmation({
            text,
            employee,
            phoneKey,
            messageId,
            activeSession,
            skillRegistry: this.skillRegistry,
          });
          if (confirmationReply) return confirmationReply;
        }

        if (activeSession.status === WHATSAPP_SESSION_STATUS.COLLECTING_PARAMS) {
          if (/^(cancelar|anular|salir|abortar)$/i.test(String(text || '').trim())) {
            await this.sessionRepo.markStatus({
              id: activeSession.id,
              tenantId: employee.tenantId,
              employeeId: employee.id,
              status: WHATSAPP_SESSION_STATUS.CANCELLED,
            });
            return `Borrador de solicitud cancelado correctamente.`;
          }

          if (new Date(activeSession.expiresAt).getTime() <= Date.now()) {
            await this.sessionRepo.markStatus({
              id: activeSession.id,
              tenantId: employee.tenantId,
              employeeId: employee.id,
              status: WHATSAPP_SESSION_STATUS.EXPIRED,
            });
          } else {
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
        }
      }
    }

    const intent = this.classifyIntent(text, employee);

    if (intent === WHATSAPP_INTENTS.GENERAL_GREETING) {
      return this.formatGreetingMessage(employee);
    }

    if (intent === WHATSAPP_INTENTS.SWITCH_TENANT_COMMAND) {
      return (
        `*Empresa Activa Actual:* ${employee.tenant?.name || 'Norma ERP'}${employee.tenant?.ruc ? ` (RUC: ${employee.tenant.ruc})` : ''}\n` +
        `- *Rol en esta empresa:* ${employee.role || 'employee'}\n` +
        `- *Departamento:* ${employee.department || 'General'}\n\n` +
        `Su numero telefonico opera actualmente sobre esta empresa. Si su telefono esta vinculado a mas de un RUC activo, el selector multi-empresa le mostrara la lista numerada automaticamente.`
      );
    }

    const targetSkillId = INTENT_TO_SKILL_ID[intent];
    if (targetSkillId) {
      return this.handleAgenticSkill({
        skillId: targetSkillId,
        text,
        employee,
        phoneKey: phoneKey || employee.phone || employee.id,
        messageId,
        activeSession: null,
        aiConfig,
      });
    }

    if (intent === WHATSAPP_INTENTS.PAYROLL_SLIP_QUERY) {
      return this.handlePayrollAndRequestsQuery({ employee });
    }

    if (intent === WHATSAPP_INTENTS.TENANT_METRICS_QUERY) {
      return this.handleTenantMetricsQuery({ employee });
    }

    if (intent === WHATSAPP_INTENTS.EMPLOYEE_QUERY) {
      return this.handleEmployeePersonalQuery({ text, employee, aiConfig });
    }

    return this.handleLegalQuery({ text, employee, aiConfig });
  }

  /**
   * Orquesta la preparación de una habilidad agéntica y su paso a doble confirmación.
   */
  async handleAgenticSkill({
    skillId,
    text,
    employee,
    phoneKey,
    messageId,
    activeSession,
    aiConfig,
  }) {
    if (!employee.tenantId) {
      return `Su perfil no tiene una empresa activa asignada para ejecutar solicitudes operativas.`;
    }

    const skill = this.skillRegistry?.getSkill(skillId);
    if (!skill) {
      return `La accion solicitada no se encuentra habilitada en este momento.`;
    }

    const prep = await skill.prepareDraft({
      text,
      employee,
      activeSession,
      aiConfig,
    });

    if (prep.status === 'NEED_MORE_INFO') {
      if (this.confirmationService) {
        await this.confirmationService.saveCollectingDraft({
          employee,
          phoneKey,
          skillName: skill.id,
          partialPayload: prep.partialPayload,
          activeSession,
          sourceMessageId: messageId,
        });
      }
      return prep.promptMessage;
    }

    if (prep.status === 'DOMAIN_REJECTED') {
      if (activeSession && this.sessionRepo) {
        await this.sessionRepo.markStatus({
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

  async handlePayrollAndRequestsQuery({ employee }) {
    const data =
      typeof this.repo.getEmployeeLatestPayrollAndRequests === 'function'
        ? await this.repo.getEmployeeLatestPayrollAndRequests(employee.id, employee.tenantId)
        : { latestPayrollDetail: null, recentAbsences: [], recentAdvances: [] };

    return formatPayrollAndRequestsMessage(employee, data);
  }

  async handleEmployeePersonalQuery({ text, employee, aiConfig }) {
    const todayAttendance = await this.repo.getEmployeeAttendanceToday(employee.id);
    const tzOpt = { hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil' };
    const checkIn = todayAttendance?.checkIn
      ? new Date(todayAttendance.checkIn).toLocaleTimeString('es-EC', tzOpt)
      : 'Sin entrada';
    const checkOut = todayAttendance?.checkOut
      ? new Date(todayAttendance.checkOut).toLocaleTimeString('es-EC', tzOpt)
      : 'Pendiente';

    const factsPrompt = `Datos del colaborador: ${employee.firstName} ${employee.lastName} (${employee.tenant?.name || 'N/A'}), Cargo: ${employee.position}, Dpto: ${employee.department}, Vacaciones: ${employee.vacationDays} días, Marcación hoy: Entrada ${checkIn}, Salida ${checkOut}.\nPregunta: "${text}"\nInstrucciones: Responde conciso en formato WhatsApp (*negrita*, guiones). No inventes datos.`;

    try {
      const llmResult = await this.llmProvider.generateChatCompletion({
        systemPrompt: WHATSAPP_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: factsPrompt }],
        temperature: 0.0,
        providerOverrides: aiConfig,
      });
      if (llmResult?.content) return cleanTextForWhatsapp(llmResult.content);
    } catch (err) {
      console.error('[WhatsApp AI Error] Fallo al generar respuesta personal:', err.message);
    }

    return (
      `*Información de su perfil en Norma ERP:*\n\n` +
      `- *Colaborador:* ${employee.firstName} ${employee.lastName}\n` +
      `- *Empresa:* ${employee.tenant?.name || 'N/A'}\n` +
      `- *Departamento:* ${employee.department}\n` +
      `- *Cargo:* ${employee.position}\n` +
      `- *Saldo de Vacaciones:* ${employee.vacationDays} días disponibles\n` +
      `- *Marcación de hoy:* Entrada: ${checkIn} | Salida: ${checkOut}`
    );
  }

  async handleLegalQuery({ text, employee, aiConfig }) {
    try {
      const ragResponse = await this.ragService.processQuery({
        query: text,
        tenantId: employee.tenantId,
        userRole: employee.role,
        moduleContext: 'whatsapp',
        providerOverrides: aiConfig,
      });

      if (ragResponse?.answer) {
        let formatted = cleanTextForWhatsapp(ragResponse.answer);
        if (ragResponse.legalCitations?.length) {
          const topCitations = ragResponse.legalCitations.slice(0, 3);
          formatted += `\n\n*Fundamento Normativo Oficial:*`;
          topCitations.forEach((c) => {
            formatted += `\n- *${c.articleCode}* (${c.documentTitle})`;
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

  formatGreetingMessage(employee) {
    return formatGreetingMessage(employee);
  }

  cleanTextForWhatsapp(rawText) {
    return cleanTextForWhatsapp(rawText);
  }
}

const whatsappAiService = new WhatsappAiService();
export default whatsappAiService;
