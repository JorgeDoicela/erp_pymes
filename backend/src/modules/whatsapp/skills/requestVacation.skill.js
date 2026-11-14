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

    if (this.hasExplicitInvalidDate(text)) {
      return {
        status: 'DOMAIN_REJECTED',
        errorMessage: `No es posible procesar su solicitud de vacaciones: la fecha indicada no existe en el calendario oficial (ej. 29 de febrero en año no bisiesto o mes inválido).`,
      };
    }

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
    const deterministic = this.parseDeterministicParams(text, todayIso);

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

  addDaysToIso(isoDate, daysToAdd) {
    const validIso = this.normalizeIsoCandidate(isoDate);
    if (!validIso || !Number.isFinite(daysToAdd)) return validIso;
    const [y, m, d] = validIso.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + daysToAdd));
    return dt.toISOString().slice(0, 10);
  }

  /**
   * Parser determinístico para fechas explícitas (YYYY-MM-DD, DD/MM/YYYY, relativas) y motivo.
   * @private
   */
  parseDeterministicParams(text, todayIso = new Date().toISOString().slice(0, 10)) {
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

    if (dates.length === 0) {
      if (/\bpasado\s+ma[ñn]ana\b/i.test(raw)) {
        dates.push(this.addDaysToIso(todayIso, 2));
      } else if (/\bma[ñn]ana\b/i.test(raw)) {
        dates.push(this.addDaysToIso(todayIso, 1));
      } else if (/\b(?:desde\s+hoy|a\s+partir\s+de\s+hoy|para\s+hoy)\b/i.test(raw)) {
        dates.push(todayIso);
      }
    }

    const startDate = this.normalizeIsoCandidate(dates[0]) || null;
    let endDate = this.normalizeIsoCandidate(dates[1]) || (dates.length === 1 ? startDate : null);

    if (startDate && dates.length === 1) {
      const durationMatch = raw.match(/\b(?:por|durante|de)\s+(\d{1,2})\s*d[ií]as?\b/i);
      if (durationMatch) {
        const numDays = parseInt(durationMatch[1], 10);
        if (numDays >= 1 && numDays <= 60) {
          endDate = this.addDaysToIso(startDate, numDays - 1);
        }
      }
    }

    let reason = null;
    const strippedForReason = raw.replace(/\b(?:por|durante)\s+\d{1,2}\s*d[ií]as?\b/gi, ' ').trim();
    const reasonMatch = strippedForReason.match(
      /(?:porque|ya\s+que|debido\s+a|por\s+motivo\s+de|motivo[:\s]+|razon[:\s]+|por)\s+([^.\n?]{3,160})/i
    );
    if (reasonMatch) {
      reason = this.cleanReason(reasonMatch[1]);
    } else if (
      dates.length === 0 &&
      !raw.includes('?') &&
      raw.length >= 4 &&
      !/^(?:hola|cancelar|cuant|cual|como|que\b|cuando|donde)/i.test(raw)
    ) {
      const withoutVerb = raw
        .replace(
          /^(?:(?:hola|buenos?\s+(?:dias|tardes|noches))[\s,.;:-]*)?(?:quiero|deseo|solicito|pedir|mis)?\s*(?:pedir\s+|solicitar\s+)?vacaciones\s*/i,
          ''
        )
        .trim();
      if (withoutVerb.length >= 4 && !/\d{1,2}\s+de\s+[a-z]+/i.test(withoutVerb)) {
        reason = this.cleanReason(withoutVerb);
      }
    }

    return { startDate, endDate, reason };
  }

  hasExplicitInvalidDate(text) {
    const raw = String(text || '').trim();
    const isoMatches = [...raw.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)];
    for (const m of isoMatches) {
      if (!this.normalizeIsoCandidate(m[0])) return true;
    }
    const latMatches = [...raw.matchAll(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/g)];
    for (const m of latMatches) {
      const dd = m[1].padStart(2, '0');
      const mm = m[2].padStart(2, '0');
      if (!this.normalizeIsoCandidate(`${m[3]}-${mm}-${dd}`)) return true;
    }
    return false;
  }

  normalizeIsoCandidate(val) {
    if (!val || typeof val !== 'string') return null;
    const match = val.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const [, yStr, mStr, dStr] = match;
    const y = Number(yStr);
    const m = Number(mStr);
    const d = Number(dStr);
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
      return null;
    }
    return match[0];
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
