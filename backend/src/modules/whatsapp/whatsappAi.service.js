/**
 * @file whatsappAi.service.js
 * @description Orquestador de Inteligencia Artificial para WhatsApp con soporte para DeepSeek, Gemini y RAG Legal Ecuatoriano.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import {
  WHATSAPP_INTENTS,
  WHATSAPP_SYSTEM_PROMPT,
  UNREGISTERED_PHONE_MESSAGE,
} from './whatsapp.constants.js';
import llmProviderService from '../sustainability/llmProvider.service.js';
import sustainabilityRagService from '../sustainability/sustainabilityRag.service.js';
import whatsappRepository from './whatsapp.repository.js';
import whatsappConfirmationService from './whatsappConfirmation.service.js';
import whatsappActionSessionRepository, {
  WHATSAPP_SESSION_STATUS,
} from './whatsappActionSession.repository.js';
import { WhatsappSkillRegistry } from './skills/whatsappSkill.registry.js';
import requestVacationSkill from './skills/requestVacation.skill.js';

const defaultSkillRegistry = new WhatsappSkillRegistry([requestVacationSkill]);

export class WhatsappAiService {
  constructor(
    llmProvider = llmProviderService,
    ragService = sustainabilityRagService,
    repo = whatsappRepository,
    confirmationService = whatsappConfirmationService,
    skillRegistry = defaultSkillRegistry,
    sessionRepo = whatsappActionSessionRepository
  ) {
    this.llmProvider = llmProvider;
    this.ragService = ragService;
    this.repo = repo;
    this.confirmationService = confirmationService;
    this.skillRegistry = skillRegistry;
    this.sessionRepo = sessionRepo;
  }

  /**
   * Resuelve el proveedor de IA activo para WhatsApp (DeepSeek o Gemini con fallbacks seguros).
   * @param {Object} [overrides]
   * @returns {Object} Configuración del proveedor
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
        temperature: 0.1,
      };
    }

    // Por defecto o si se especificó deepseek
    return {
      provider: 'deepseek',
      apiKey: overrides.apiKey || process.env.DEEPSEEK_API_KEY,
      model: overrides.model || process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      temperature: 0.1,
    };
  }

  /**
   * Clasifica la intención del mensaje del usuario a partir del texto y palabras clave.
   * @param {string} text
   * @param {Object|null} employee
   * @returns {string} Código de intención (WHATSAPP_INTENTS)
   */
  classifyIntent(text, employee) {
    if (!employee) {
      return WHATSAPP_INTENTS.UNKNOWN_SENDER;
    }

    const lower = text.toLowerCase().trim();

    // 1. Saludos y solicitudes de ayuda
    if (
      /^(hola|buen(os)?\s*(dias|tardes|noches)|saludos|menu|ayuda|opciones|que\s*puedes\s*hacer)\b/i.test(
        lower
      )
    ) {
      return WHATSAPP_INTENTS.GENERAL_GREETING;
    }

    // 2. Consultas sobre métricas empresariales (KPIs)
    if (
      /(metricas|kpis?|resumen\s+empresa|cuantos\s+empleados|asistencias\s+hoy|total\s+personal)/i.test(
        lower
      )
    ) {
      return WHATSAPP_INTENTS.TENANT_METRICS_QUERY;
    }

    // 3. Habilidad agéntica: solicitud transaccional de vacaciones (diferenciada de consultas de saldo o ley)
    const isLegalTopic =
      /(codigo\s+del\s+trabajo|ley\s+organica|constitucion|articulo|art\.|iess|sri|lopdp|segun\s+la\s+ley|que\s+dice\s+(?:el\s+codigo|la\s+ley))/i.test(
        lower
      );
    const isPersonalBalanceQuestion = /^(cuant[oa]s?|cual\s+es\s+mi|tengo)\b/i.test(lower);

    if (
      !isLegalTopic &&
      !isPersonalBalanceQuestion &&
      (/(?:solicitar|pedir|agendar|registrar|tomar|necesito|quiero|deseo|tramitar|solicitud\s+de)\b[^.\n]{0,45}\bvacacion(?:es)?\b/i.test(
        lower
      ) ||
        /\bvacacion(?:es)?\s+(?:del|desde|para\s+el|entre)\b/i.test(lower))
    ) {
      return WHATSAPP_INTENTS.VACATION_REQUEST_ACTION;
    }

    // 4. Consultas legales explícitas (prioridad sobre palabra clave 'vacaciones' cuando invoca norma/ley)
    if (isLegalTopic) {
      return WHATSAPP_INTENTS.LEGAL_QUERY;
    }

    // 5. Consultas personales del colaborador (vacaciones, marcación, etc.)
    if (
      /(vacacion|saldo|mis?\s+dias|asistencia|marque|marcar|entrada|salida|mi\s+perfil|mi\s+cargo|mi\s+departamento)/i.test(
        lower
      )
    ) {
      return WHATSAPP_INTENTS.EMPLOYEE_QUERY;
    }

    // 6. Consultas legales y normativas generales
    if (
      /(despido|renuncia|liquidacion|desahucio|horas?\s+extra|decimo|utilidades|jubilacion|maternidad|paternidad|finiquito)/i.test(
        lower
      )
    ) {
      return WHATSAPP_INTENTS.LEGAL_QUERY;
    }

    // Por defecto, evaluar como consulta de conocimiento general / legal
    return WHATSAPP_INTENTS.LEGAL_QUERY;
  }

  /**
   * Genera la respuesta apropiada para WhatsApp orquestando RAG, habilidades agénticas, datos del ERP y el LLM.
   * @param {Object} params
   * @param {string} params.text Mensaje recibido.
   * @param {Object|null} params.employee Registro del colaborador en base de datos.
   * @param {string|null} [params.phoneKey] Clave telefónica canónica para sesiones multi-turno y 2FA.
   * @param {string|null} [params.messageId] Identificador wamid del mensaje entrante.
   * @param {Object} [params.aiOverrides] Opciones opcionales para forzar proveedor (ej. { provider: 'gemini' }).
   * @returns {Promise<string>} Texto listo para ser enviado por WhatsApp.
   */
  async generateResponse({ text, employee, phoneKey = null, messageId = null, aiOverrides = {} }) {
    const aiConfig = this.resolveAiProviderConfig(aiOverrides);

    // Caso A: Remitente no registrado en la empresa
    if (!employee) {
      return UNREGISTERED_PHONE_MESSAGE;
    }

    // Caso B: Sesión agéntica activa (recolección de parámetros o doble factor pendiente)
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
          if (confirmationReply) {
            return confirmationReply;
          }
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

    // Caso C: Saludo general o menú de opciones
    if (intent === WHATSAPP_INTENTS.GENERAL_GREETING) {
      return this.formatGreetingMessage(employee);
    }

    // Caso D: Habilidad agéntica para solicitar vacaciones con validación dual (Cédula + OTP correo)
    if (intent === WHATSAPP_INTENTS.VACATION_REQUEST_ACTION) {
      return this.handleAgenticSkill({
        skillId: 'REQUEST_VACATION',
        text,
        employee,
        phoneKey: phoneKey || employee.phone || employee.id,
        messageId,
        activeSession: null,
        aiConfig,
      });
    }

    // Caso E: Métricas globales de empresa
    if (intent === WHATSAPP_INTENTS.TENANT_METRICS_QUERY) {
      return this.handleTenantMetricsQuery({ employee });
    }

    // Caso F: Consulta personal del colaborador (Vacaciones, Marcación de hoy)
    if (intent === WHATSAPP_INTENTS.EMPLOYEE_QUERY) {
      return this.handleEmployeePersonalQuery({ text, employee, aiConfig });
    }

    // Caso G: Consulta Jurídica / Normativa con RAG Legal Ecuatoriano
    return this.handleLegalQuery({ text, employee, aiConfig });
  }

  /**
   * Orquesta la preparación de una habilidad agéntica y su paso a doble confirmación.
   * @private
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

  /**
   * Maneja consultas personales del colaborador con datos deterministas de la base de datos.
   * @private
   */
  async handleEmployeePersonalQuery({ text, employee, aiConfig }) {
    const todayAttendance = await this.repo.getEmployeeAttendanceToday(employee.id);

    const checkInTime = todayAttendance?.checkIn
      ? new Date(todayAttendance.checkIn).toLocaleTimeString('es-EC', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Guayaquil',
        })
      : 'Sin registro de entrada hoy';

    const checkOutTime = todayAttendance?.checkOut
      ? new Date(todayAttendance.checkOut).toLocaleTimeString('es-EC', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Guayaquil',
        })
      : 'Pendiente';

    const factsPrompt = `Datos verificados del colaborador en Norma ERP:
- Colaborador: ${employee.firstName} ${employee.lastName}
- Empresa: ${employee.tenant?.name || 'N/A'}
- Cargo: ${employee.position || 'N/A'}
- Departamento: ${employee.department || 'N/A'}
- Saldo de Vacaciones Disponibles: ${employee.vacationDays} dias laborales
- Marcacion de hoy: Entrada (${checkInTime}), Salida (${checkOutTime})
- Estado de marcacion: ${todayAttendance?.status || 'SIN_MARCACION'}

Pregunta del colaborador: "${text}"

Instrucciones: Responde a la pregunta del colaborador de manera amable, ejecutiva y breve, utilizando UNICAMENTE los datos verificados arriba. Aplica formato WhatsApp (*negrita* y viñetas con guion). No inventes ningun dato.`;

    try {
      const llmResult = await this.llmProvider.generateChatCompletion({
        systemPrompt: WHATSAPP_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: factsPrompt }],
        temperature: 0.1,
        providerOverrides: aiConfig,
      });

      if (llmResult?.content) {
        return this.cleanTextForWhatsapp(llmResult.content);
      }
    } catch (err) {
      console.error('[WhatsApp AI Error] Fallo al generar respuesta personal:', err.message);
    }

    // Fallback determinista seguro sin depender del LLM
    return (
      `*Informacion de su perfil en Norma ERP:*\n\n` +
      `- *Colaborador:* ${employee.firstName} ${employee.lastName}\n` +
      `- *Empresa:* ${employee.tenant?.name || 'N/A'}\n` +
      `- *Departamento:* ${employee.department}\n` +
      `- *Cargo:* ${employee.position}\n` +
      `- *Saldo de Vacaciones:* ${employee.vacationDays} dias disponibles\n` +
      `- *Marcacion de hoy:* Entrada: ${checkInTime} | Salida: ${checkOutTime}`
    );
  }

  /**
   * Maneja consultas legales y de normativa utilizando el motor RAG integral existente.
   * @private
   */
  async handleLegalQuery({ text, employee, aiConfig }) {
    try {
      const ragResponse = await this.ragService.processQuery({
        query: text,
        tenantId: employee.tenantId,
        moduleContext: 'whatsapp',
        providerOverrides: aiConfig,
      });

      if (ragResponse?.answer) {
        let formatted = this.cleanTextForWhatsapp(ragResponse.answer);

        // Añadir citas legales relevantes al final en formato WhatsApp si existen
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

    // Fallback con el LLM directo si el RAG tuviera alguna eventualidad
    try {
      const fallbackResult = await this.llmProvider.generateChatCompletion({
        systemPrompt: WHATSAPP_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: text }],
        temperature: 0.1,
        providerOverrides: aiConfig,
      });

      if (fallbackResult?.content) {
        return this.cleanTextForWhatsapp(fallbackResult.content);
      }
    } catch (fallbackErr) {
      console.error('[WhatsApp AI Error] Fallo en fallback de LLM:', fallbackErr.message);
    }

    return `No fue posible procesar la consulta normativa en este momento. Por favor formule su pregunta especificando el tema laboral o articulo de interes.`;
  }

  /**
   * Maneja consultas de indicadores de empresa restringidas por RBAC.
   * @private
   */
  async handleTenantMetricsQuery({ employee }) {
    const allowedRoles = ['admin', 'manager', 'hr', 'entrepreneur', 'superadmin'];
    if (!allowedRoles.includes(employee.role?.toLowerCase())) {
      return `Estimado(a) ${employee.firstName}, su rol actual (${employee.role}) no dispone de autorizacion para consultar metricas generales de la empresa.\n\nPuede consultar su saldo de vacaciones, registro de marcaciones y legislacion laboral.`;
    }

    const metrics = await this.repo.getTenantSummaryMetrics(employee.tenantId);

    return (
      `*Resumen Operativo de la Empresa (${employee.tenant?.name || 'Norma ERP'}):*\n\n` +
      `- *Colaboradores Activos:* ${metrics.totalActiveEmployees || 0}\n` +
      `- *Marcaciones Registradas Hoy:* ${metrics.totalAttendancesToday || 0}\n` +
      `- *Solicitudes de Permiso Pendientes:* ${metrics.pendingAbsenceRequests || 0}\n\n` +
      `_Datos sincronizados en tiempo real con la base de datos empresarial._`
    );
  }

  /**
   * Formatea el mensaje de bienvenida y menú de opciones para WhatsApp.
   * @private
   */
  formatGreetingMessage(employee) {
    const companyName = employee.tenant?.name ? ` de *${employee.tenant.name}*` : '';
    return (
      `Hola ${employee.firstName}, bienvenido(a) al Asistente Corporativo de Norma ERP${companyName}.\n\n` +
      `Puede consultarme o gestionar directamente por este chat:\n` +
      `- *Mis vacaciones:* "¿Cuantos dias de vacaciones tengo disponibles?"\n` +
      `- *Pedir vacaciones:* "Quiero pedir vacaciones del 2026-11-20 al 2026-11-24 por viaje familiar"\n` +
      `- *Mi marcacion:* "¿A que hora marque hoy?"\n` +
      `- *Consultas legales:* "Como se calculan las horas extraordinarias segun el Art. 55?" o "¿Cual es la liquidacion por despido intempestivo?"\n` +
      `- *Seguridad Social:* "Requisitos para jubilacion ordinaria IESS."\n\n` +
      `Escriba su consulta en cualquier momento para responderle.`
    );
  }

  /**
   * Limpia y adapta Markdown a los estándares visuales de WhatsApp.
   * @private
   */
  cleanTextForWhatsapp(rawText) {
    if (!rawText) return '';

    return (
      rawText
        // Reemplazar encabezados markdown (### Título) por *Título*
        .replace(/^#{1,6}\s*(.+)$/gm, '*$1*')
        // Reemplazar negritas dobles markdown (**texto**) por formato WhatsApp (*texto*)
        .replace(/\*\*(.+?)\*\*/g, '*$1*')
        // Remover bloques de tablas markdown con pipes (| col | col |)
        .replace(/\|(.+)\|/g, (match) => {
          const parts = match
            .split('|')
            .map((p) => p.trim())
            .filter(Boolean);
          if (parts.length === 0 || parts.every((p) => /^[-:]+$/.test(p))) return '';
          return `- ${parts.join(' : ')}`;
        })
        // Remover triples backticks redundantes en texto conversacional
        .replace(/```[a-z]*\n([\s\S]*?)```/g, '$1')
        // Normalizar saltos de línea excesivos
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    );
  }
}

const whatsappAiService = new WhatsappAiService();
export default whatsappAiService;
