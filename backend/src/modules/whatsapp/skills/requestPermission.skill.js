/**
 * @file requestPermission.skill.js
 * @description Habilidad agéntica REQUEST_PERMISSION: registro de permisos médicos, calamidad doméstica
 * (Art. 42 num. 30 CT), licencias de paternidad/maternidad y permisos personales sin afectar vacaciones.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import {
  absenceService,
  getEcuadorTodayIso,
  calculateCalendarDays,
} from '../../attendance/index.js';
import { llmProviderService } from '../../sustainability/index.js';

export const REQUEST_PERMISSION_SKILL_ID = 'REQUEST_PERMISSION';

export const PERMISSION_TYPES = {
  MEDICAL: 'Permiso Médico',
  DOMESTIC_CALAMITY: 'Calamidad Doméstica',
  PARENTAL: 'Licencia Paternidad/Maternidad',
  PERSONAL: 'Permiso Personal',
};

export class RequestPermissionSkill {
  constructor(absenceDomainService = absenceService, llmProvider = llmProviderService) {
    this.id = REQUEST_PERMISSION_SKILL_ID;
    this.name = 'Solicitar Permiso o Justificacion';
    this.description =
      'Registra permisos medicos IESS, calamidad domestica o licencias justificadas sin descontar saldo de vacaciones.';
    this.absenceService = absenceDomainService;
    this.llmProvider = llmProvider;
  }

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
      permissionType:
        extracted.permissionType || previousPayload.permissionType || PERMISSION_TYPES.PERSONAL,
      startDate: extracted.startDate || previousPayload.startDate || null,
      endDate: extracted.endDate || previousPayload.endDate || null,
      reason: extracted.reason || previousPayload.reason || null,
    };

    if (merged.startDate && !merged.endDate) {
      merged.endDate = merged.startDate;
    }

    const missingFields = [];
    if (!merged.startDate) missingFields.push('fecha de inicio (YYYY-MM-DD)');
    if (!merged.endDate) missingFields.push('fecha de fin (YYYY-MM-DD)');
    if (!merged.reason || String(merged.reason).trim().length < 3) {
      missingFields.push('motivo o detalle del permiso');
    }

    if (missingFields.length > 0) {
      return {
        status: 'NEED_MORE_INFO',
        partialPayload: merged,
        promptMessage: this.buildMissingFieldsPrompt({ merged, missingFields, employee }),
      };
    }

    if (merged.endDate < merged.startDate) {
      return {
        status: 'DOMAIN_REJECTED',
        errorMessage:
          `No es posible procesar su solicitud de permiso en *${employee.tenant?.name || 'Norma ERP'}*:\n` +
          `La fecha de fin (${merged.endDate}) no puede ser anterior a la fecha de inicio (${merged.startDate}).`,
      };
    }

    const daysRequested = calculateCalendarDays(merged.startDate, merged.endDate);
    if (!daysRequested || daysRequested > 30) {
      return {
        status: 'DOMAIN_REJECTED',
        errorMessage:
          `No es posible procesar su solicitud en *${employee.tenant?.name || 'Norma ERP'}*:\n` +
          `El rango solicitado (${daysRequested || 0} dias) supera el maximo permitido por solicitud (30 dias).`,
      };
    }

    return {
      status: 'READY_FOR_CONFIRMATION',
      draftSummary: {
        permissionType: merged.permissionType,
        startDate: merged.startDate,
        endDate: merged.endDate,
        daysRequested,
        reason: String(merged.reason).trim(),
      },
    };
  }

  async executeConfirmedAction({ payload, employee, tenantId }) {
    const createdRequest = await this.absenceService.createRequest({
      employeeId: employee.id,
      tenantId,
      type: payload.permissionType,
      startDate: payload.startDate,
      endDate: payload.endDate,
      reason: payload.reason,
      allowPastDates: true,
    });

    return {
      entityName: 'AbsenceRequest',
      entityId: createdRequest.id,
      auditAction: 'WHATSAPP_PERMISSION_REQUEST_CREATED',
      request: createdRequest,
      summary: payload,
    };
  }

  formatDraftForWhatsapp(summary, employee) {
    return (
      `*Resumen de Solicitud de ${summary.permissionType}*\n` +
      `- *Empresa:* ${employee.tenant?.name || 'Norma ERP'}\n` +
      `- *Colaborador:* ${employee.firstName} ${employee.lastName}\n` +
      `- *Tipo de Permiso:* ${summary.permissionType}\n` +
      `- *Desde:* ${summary.startDate}\n` +
      `- *Hasta:* ${summary.endDate} (${summary.daysRequested} dia(s))\n` +
      `- *Impacto en Vacaciones:* 0 dias (No descuenta de su saldo de vacaciones)\n` +
      `- *Motivo:* ${summary.reason}`
    );
  }

  formatConfirmedResultForWhatsapp(result, employee) {
    const { request, summary } = result;
    return (
      `*Solicitud de ${summary.permissionType} Registrada*\n\n` +
      `- *ID de Solicitud:* ${request.id}\n` +
      `- *Empresa:* ${employee.tenant?.name || 'Norma ERP'}\n` +
      `- *Tipo:* ${summary.permissionType}\n` +
      `- *Periodo:* ${summary.startDate} al ${summary.endDate} (${summary.daysRequested} dia(s))\n` +
      `- *Motivo:* ${summary.reason}\n` +
      `- *Estado actual:* ${request.status || 'PENDING'} (Pendiente de validacion por RRHH)\n\n` +
      `Recuerde entregar o cargar el justificativo de respaldo en su expediente digital si aplica.`
    );
  }

  async extractStructuredParams({ text, previousPayload = {}, aiConfig = {} }) {
    const todayIso = getEcuadorTodayIso();
    const deterministic = this.parseDeterministicParams(text, todayIso);

    try {
      const prompt = `Hoy en Ecuador es ${todayIso}.
Estado previo: ${JSON.stringify(previousPayload)}
Mensaje del colaborador: "${text}"

Extrae los datos del permiso laboral y responde SOLO JSON valido:
{
  "permissionType": "Permiso Médico" | "Calamidad Doméstica" | "Licencia Paternidad/Maternidad" | "Permiso Personal",
  "startDate": "YYYY-MM-DD o null",
  "endDate": "YYYY-MM-DD o null",
  "reason": "motivo claro en español o null"
}`;

      const llmRes = await this.llmProvider.generateChatCompletion({
        systemPrompt:
          'Eres un extractor de permisos laborales. Responde exclusivamente JSON valido.',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        providerOverrides: aiConfig,
      });

      const parsed = this.safeParseJsonObject(llmRes?.content);
      if (parsed) {
        return {
          permissionType:
            this.normalizePermissionType(parsed.permissionType) || deterministic.permissionType,
          startDate: this.normalizeIsoCandidate(parsed.startDate) || deterministic.startDate,
          endDate: this.normalizeIsoCandidate(parsed.endDate) || deterministic.endDate,
          reason: this.cleanReason(parsed.reason) || deterministic.reason,
        };
      }
    } catch {
      // Fallback determinístico silencioso
    }

    return deterministic;
  }

  parseDeterministicParams(text, todayIso) {
    const raw = String(text || '').trim();
    const permissionType = this.detectPermissionType(raw);

    const dates = [];
    const isoMatches = raw.match(/\b(\d{4}-\d{2}-\d{2})\b/g) || [];
    for (const m of isoMatches) dates.push(m);

    if (dates.length === 0) {
      const latMatches = [...raw.matchAll(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/g)];
      for (const m of latMatches) {
        dates.push(`${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`);
      }
    }

    if (dates.length === 0 && /\bhoy\b/i.test(raw)) {
      dates.push(todayIso);
    }

    let reason = null;
    const reasonMatch = raw.match(/(?:por|motivo[:\s]+|razon[:\s]+|debido\s+a)\s+([^.\n]{3,160})/i);
    if (reasonMatch) {
      reason = this.cleanReason(reasonMatch[1]);
    } else if (permissionType === PERMISSION_TYPES.MEDICAL && /cita\s+medica|iess/i.test(raw)) {
      reason = 'Atencion medica / cita IESS';
    } else if (permissionType === PERMISSION_TYPES.DOMESTIC_CALAMITY) {
      reason = 'Calamidad domestica amparada en Art. 42 num. 30 CT';
    }

    const startDate = this.normalizeIsoCandidate(dates[0]) || null;
    const endDate = this.normalizeIsoCandidate(dates[1]) || (dates.length === 1 ? startDate : null);

    return { permissionType, startDate, endDate, reason };
  }

  detectPermissionType(rawText) {
    const lower = String(rawText || '').toLowerCase();
    if (/(calamidad|fallecimiento|duelo|luto|hospitalizacion\s+familiar)/i.test(lower)) {
      return PERMISSION_TYPES.DOMESTIC_CALAMITY;
    }
    if (/(medic[oa]|iess|cita\s+medica|reposo|salud|enfermedad|odontolog)/i.test(lower)) {
      return PERMISSION_TYPES.MEDICAL;
    }
    if (/(maternidad|paternidad|nacimiento|lactancia)/i.test(lower)) {
      return PERMISSION_TYPES.PARENTAL;
    }
    return PERMISSION_TYPES.PERSONAL;
  }

  normalizePermissionType(val) {
    if (!val) return null;
    return this.detectPermissionType(val);
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
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }

  buildMissingFieldsPrompt({ merged, missingFields, employee }) {
    const partialLines = [];
    if (merged.permissionType) partialLines.push(`- *Tipo:* ${merged.permissionType}`);
    if (merged.startDate) partialLines.push(`- *Inicio:* ${merged.startDate}`);
    if (merged.endDate) partialLines.push(`- *Fin:* ${merged.endDate}`);
    if (merged.reason) partialLines.push(`- *Motivo:* ${merged.reason}`);

    const partialSection =
      partialLines.length > 0 ? `*Datos recibidos:*\n${partialLines.join('\n')}\n\n` : '';

    return (
      `Para registrar su solicitud de permiso en *${employee.tenant?.name || 'Norma ERP'}*:\n\n` +
      `${partialSection}` +
      `Por favor indique: *${missingFields.join(', ')}*.\n` +
      `Ejemplo: _Permiso medico para el 2026-11-22 por cita en el IESS_\n\n` +
      `Si desea cancelar, responda *CANCELAR*.`
    );
  }
}

const requestPermissionSkill = new RequestPermissionSkill();
export default requestPermissionSkill;
