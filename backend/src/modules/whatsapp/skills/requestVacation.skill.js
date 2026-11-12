/**
 * @file requestVacation.skill.js
 * @description Habilidad agéntica REQUEST_VACATION: extracción NLP estructurada, pre-validación de dominio
 * multi-tenant y ejecución transaccional delegada a absenceService.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { absenceService, getEcuadorTodayIso } from '../../attendance/index.js';
import { llmProviderService } from '../../sustainability/index.js';

export const REQUEST_VACATION_SKILL_ID = 'REQUEST_VACATION';

export class RequestVacationSkill {
  constructor(absenceDomainService = absenceService, llmProvider = llmProviderService) {
    this.id = REQUEST_VACATION_SKILL_ID;
    this.name = 'Solicitar Vacaciones';
    this.description =
      'Registra una solicitud formal de vacaciones con validacion de saldo, solapamientos y confirmacion 2FA.';
    this.absenceService = absenceDomainService;
    this.llmProvider = llmProvider;
  }

  /**
   * Extrae fechas y motivo en formato estructurado combinando LLM y parser determinístico de respaldo.
   */
  async prepareDraft({ text, employee, activeSession = null, aiConfig = {} }) {
    const previousPayload =
      activeSession?.status === 'COLLECTING_PARAMS' && activeSession.payloadJson
        ? activeSession.payloadJson
        : {};

    const extracted = await this.extractStructuredParams({
      text,
      previousPayload,
      aiConfig,
    });

    const merged = {
      startDate: extracted.startDate || previousPayload.startDate || null,
      endDate: extracted.endDate || previousPayload.endDate || null,
      reason: extracted.reason || previousPayload.reason || null,
    };

    const missingFields = [];
    if (!merged.startDate) missingFields.push('fecha de inicio (YYYY-MM-DD)');
    if (!merged.endDate) missingFields.push('fecha de fin (YYYY-MM-DD)');
    if (!merged.reason || String(merged.reason).trim().length < 3) {
      missingFields.push('motivo de la solicitud');
    }

    if (missingFields.length > 0) {
      return {
        status: 'NEED_MORE_INFO',
        partialPayload: merged,
        promptMessage: this.buildMissingFieldsPrompt({ merged, missingFields, employee }),
      };
    }

    try {
      const validatedSummary = await this.absenceService.previewVacationRequest({
        employeeId: employee.id,
        tenantId: employee.tenantId,
        startDate: merged.startDate,
        endDate: merged.endDate,
        reason: merged.reason,
        allowPastDates: false,
      });

      return {
        status: 'READY_FOR_CONFIRMATION',
        draftSummary: {
          startDate: validatedSummary.startDate,
          endDate: validatedSummary.endDate,
          daysRequested: validatedSummary.daysRequested,
          reason: validatedSummary.reason,
          vacationDaysTotal: validatedSummary.vacationDaysTotal,
          pendingVacationDays: validatedSummary.pendingVacationDays,
          netAvailableBefore: validatedSummary.netAvailableBefore,
          projectedAvailableAfter: validatedSummary.projectedAvailableAfter,
        },
      };
    } catch (domainErr) {
      return {
        status: 'DOMAIN_REJECTED',
        errorMessage:
          `No es posible procesar su solicitud de vacaciones en *${employee.tenant?.name || 'Norma ERP'}*:\n` +
          `${domainErr.message}`,
      };
    }
  }

  /**
   * Ejecuta la creación oficial en AbsenceRequest únicamente tras pasar validación 2FA.
   */
  async executeConfirmedAction({ payload, employee, tenantId }) {
    const createdRequest = await this.absenceService.createRequest({
      employeeId: employee.id,
      tenantId,
      type: 'Vacaciones',
      startDate: payload.startDate,
      endDate: payload.endDate,
      reason: payload.reason,
      allowPastDates: false,
    });

    return {
      entityName: 'AbsenceRequest',
      entityId: createdRequest.id,
      auditAction: 'WHATSAPP_VACATION_REQUEST_CREATED',
      request: createdRequest,
      summary: payload,
    };
  }

  formatDraftForWhatsapp(summary, employee) {
    return (
      `*Resumen de Solicitud de Vacaciones*\n` +
      `- *Empresa:* ${employee.tenant?.name || 'Norma ERP'}\n` +
      `- *Colaborador:* ${employee.firstName} ${employee.lastName}\n` +
      `- *Desde:* ${summary.startDate}\n` +
      `- *Hasta:* ${summary.endDate}\n` +
      `- *Dias solicitados:* ${summary.daysRequested} dias\n` +
      `- *Motivo:* ${summary.reason}\n` +
      `- *Saldo neto disponible:* ${summary.netAvailableBefore} dias\n` +
      `- *Saldo proyectado si se aprueba:* ${summary.projectedAvailableAfter} dias`
    );
  }

  formatConfirmedResultForWhatsapp(result, employee) {
    const { request, summary } = result;
    return (
      `*Solicitud de Vacaciones Registrada*\n\n` +
      `- *ID de Solicitud:* ${request.id}\n` +
      `- *Empresa:* ${employee.tenant?.name || 'Norma ERP'}\n` +
      `- *Periodo:* ${summary.startDate} al ${summary.endDate} (${summary.daysRequested} dias)\n` +
      `- *Motivo:* ${summary.reason}\n` +
      `- *Estado actual:* ${request.status || 'PENDING'} (Pendiente de aprobacion)\n\n` +
      `Talento Humano y Administracion de su empresa ya fueron notificados en Norma ERP.`
    );
  }

  /**
   * Extrae fechas y motivo vía LLM con fallback determinístico seguro.
   * @private
   */
  async extractStructuredParams({ text, previousPayload = {}, aiConfig = {} }) {
    const todayIso = getEcuadorTodayIso();

    const deterministic = this.parseDeterministicParams(text);

    try {
      const prompt = `Hoy en Ecuador (America/Guayaquil) es ${todayIso}.
Estado previo del borrador: ${JSON.stringify(previousPayload)}
Mensaje del colaborador: "${text}"

Extrae unicamente los datos para solicitar vacaciones y responde SOLO un objeto JSON valido sin texto adicional ni bloques markdown:
{
  "startDate": "YYYY-MM-DD o null si no se menciono o no es deducible",
  "endDate": "YYYY-MM-DD o null si no se menciono (si indica un solo dia, igual a startDate)",
  "reason": "motivo breve y claro en español o null si no lo indico"
}`;

      const llmRes = await this.llmProvider.generateChatCompletion({
        systemPrompt:
          'Eres un extractor de entidades estricto. Responde exclusivamente JSON valido con las claves startDate, endDate y reason.',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        providerOverrides: aiConfig,
      });

      const parsedJson = this.safeParseJsonObject(llmRes?.content);
      if (parsedJson) {
        return {
          startDate: this.normalizeIsoCandidate(parsedJson.startDate) || deterministic.startDate,
          endDate: this.normalizeIsoCandidate(parsedJson.endDate) || deterministic.endDate,
          reason: this.cleanReason(parsedJson.reason) || deterministic.reason,
        };
      }
    } catch (err) {
      console.warn(
        '[RequestVacationSkill] Extractor LLM no disponible, usando parser deterministico:',
        err.message
      );
    }

    return deterministic;
  }

  /**
   * Parser determinístico para fechas explícitas (YYYY-MM-DD o DD/MM/YYYY) y motivo.
   * @private
   */
  parseDeterministicParams(text) {
    const raw = String(text || '').trim();
    const dates = [];

    const isoMatches = raw.match(/\b(\d{4}-\d{2}-\d{2})\b/g) || [];
    for (const m of isoMatches) {
      dates.push(m);
    }

    if (dates.length === 0) {
      const latMatches = [...raw.matchAll(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/g)];
      for (const m of latMatches) {
        const dd = m[1].padStart(2, '0');
        const mm = m[2].padStart(2, '0');
        dates.push(`${m[3]}-${mm}-${dd}`);
      }
    }

    let reason = null;
    const reasonMatch = raw.match(/(?:por|motivo[:\s]+|razon[:\s]+)\s+([^.\n]{3,160})/i);
    if (reasonMatch) {
      reason = this.cleanReason(reasonMatch[1]);
    } else if (dates.length === 0 && raw.length >= 4 && !/^(?:hola|cancelar)/i.test(raw)) {
      // Si está completando solo el motivo en un turno de recolección
      const withoutVerb = raw
        .replace(/^(?:quiero|deseo|solicito|pedir|mis)?\s*vacaciones\s*/i, '')
        .trim();
      if (withoutVerb.length >= 4 && !/\d{1,2}\s+de\s+[a-z]+/i.test(withoutVerb)) {
        reason = this.cleanReason(withoutVerb);
      }
    }

    const startDate = this.normalizeIsoCandidate(dates[0]) || null;
    const endDate = this.normalizeIsoCandidate(dates[1]) || (dates.length === 1 ? startDate : null);

    return { startDate, endDate, reason };
  }

  normalizeIsoCandidate(val) {
    if (!val || typeof val !== 'string') return null;
    const match = val.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match ? match[0] : null;
  }

  cleanReason(val) {
    if (!val || typeof val !== 'string') return null;
    const trimmed = val.trim();
    if (!trimmed || /^(null|undefined|n\/a|ninguno)$/i.test(trimmed)) return null;
    return trimmed.slice(0, 200);
  }

  safeParseJsonObject(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }

  buildMissingFieldsPrompt({ merged, missingFields, employee }) {
    const partialLines = [];
    if (merged.startDate) partialLines.push(`- *Inicio:* ${merged.startDate}`);
    if (merged.endDate) partialLines.push(`- *Fin:* ${merged.endDate}`);
    if (merged.reason) partialLines.push(`- *Motivo:* ${merged.reason}`);

    const partialSection =
      partialLines.length > 0
        ? `*Datos recibidos hasta ahora:*\n${partialLines.join('\n')}\n\n`
        : '';

    return (
      `Para preparar su solicitud de vacaciones en *${employee.tenant?.name || 'Norma ERP'}* ` +
      `(saldo actual: *${employee.vacationDays}* dias):\n\n` +
      `${partialSection}` +
      `Por favor indique: *${missingFields.join(', ')}*.\n` +
      `Ejemplo: _Del 2026-11-20 al 2026-11-24 por viaje familiar_\n\n` +
      `Si desea cancelar, responda *CANCELAR*.`
    );
  }
}

const requestVacationSkill = new RequestVacationSkill();
export default requestVacationSkill;
