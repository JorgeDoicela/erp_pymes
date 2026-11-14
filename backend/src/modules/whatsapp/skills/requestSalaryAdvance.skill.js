/**
 * @file requestSalaryAdvance.skill.js
 * @description Habilidad agéntica REQUEST_SALARY_ADVANCE: extracción NLP + determinística de monto, cuotas
 * y motivo, validación financiera Decimal.js (tope 50% sueldo mensual) y ejecución con confirmación 2FA.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { salaryAdvanceService } from '../../payroll/index.js';
import { llmProviderService } from '../../sustainability/index.js';
import { financial } from '../../../core/utils/financialUtils.js';
import whatsappRepository from '../whatsapp.repository.js';

export const REQUEST_SALARY_ADVANCE_SKILL_ID = 'REQUEST_SALARY_ADVANCE';

export class RequestSalaryAdvanceSkill {
  constructor(
    advanceDomainService = salaryAdvanceService,
    repo = whatsappRepository,
    llmProvider = llmProviderService
  ) {
    this.id = REQUEST_SALARY_ADVANCE_SKILL_ID;
    this.name = 'Solicitar Anticipo de Sueldo';
    this.description =
      'Solicita un anticipo de sueldo o prestamo corporativo validando el limite del 50% de cuota mensual y doble factor 2FA.';
    this.salaryAdvanceService = advanceDomainService;
    this.repo = repo;
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

    if (extracted.invalidNegativeAmount) {
      return {
        status: 'DOMAIN_REJECTED',
        errorMessage: `No es posible procesar su solicitud de anticipo: el monto solicitado debe ser un valor positivo mayor a $0.00.`,
      };
    }

    if (extracted.invalidInstallments) {
      return {
        status: 'DOMAIN_REJECTED',
        errorMessage: `No es posible procesar su solicitud de anticipo: el plazo de descuento debe estar entre 1 y 24 cuotas mensuales.`,
      };
    }

    const merged = {
      amount: extracted.amount ?? previousPayload.amount ?? null,
      installments: extracted.installments ?? previousPayload.installments ?? 1,
      reason: extracted.reason || previousPayload.reason || null,
    };

    const missingFields = [];
    if (!merged.amount || Number(merged.amount) <= 0) {
      missingFields.push('monto en dolares (ej. $150)');
    }
    if (!merged.reason || String(merged.reason).trim().length < 3) {
      missingFields.push('motivo del anticipo');
    }

    if (missingFields.length > 0) {
      return {
        status: 'NEED_MORE_INFO',
        partialPayload: merged,
        promptMessage: this.buildMissingFieldsPrompt({ merged, missingFields, employee }),
      };
    }

    const numAmount = Number(merged.amount);
    const numInstallments = Math.min(24, Math.max(1, parseInt(merged.installments, 10) || 1));

    const baseSalaryNum = await this.repo.getEmployeeActiveBaseSalary(
      employee.id,
      employee.tenantId
    );
    if (!baseSalaryNum || baseSalaryNum <= 0) {
      return {
        status: 'DOMAIN_REJECTED',
        errorMessage:
          `No es posible procesar su solicitud de anticipo en *${employee.tenant?.name || 'Norma ERP'}*:\n` +
          `No se encontro un contrato activo o sueldo base configurado en su ficha.`,
      };
    }

    const baseSalary = financial.from(baseSalaryNum);
    const requested = financial.from(numAmount);
    const monthlyDeduction = financial.divide(requested, numInstallments);
    const maxMonthlyQuota = financial.percentage(baseSalary, 50);

    if (monthlyDeduction.gt(maxMonthlyQuota)) {
      return {
        status: 'DOMAIN_REJECTED',
        errorMessage:
          `No es posible procesar su solicitud de anticipo en *${employee.tenant?.name || 'Norma ERP'}*:\n` +
          `La cuota mensual de *$${financial.round(monthlyDeduction).toFixed(2)}* supera el limite legal e interno del 50% de su sueldo base mensual (*$${financial.round(maxMonthlyQuota).toFixed(2)}*).`,
      };
    }

    return {
      status: 'READY_FOR_CONFIRMATION',
      draftSummary: {
        amount: financial.round(requested),
        installments: numInstallments,
        monthlyDeduction: financial.round(monthlyDeduction),
        baseSalary: financial.round(baseSalary),
        maxMonthlyQuota: financial.round(maxMonthlyQuota),
        reason: String(merged.reason).trim(),
      },
    };
  }

  async executeConfirmedAction({ payload, employee }) {
    const createdAdvance = await this.salaryAdvanceService.requestAdvance({
      employeeId: employee.id,
      amount: payload.amount,
      installments: payload.installments,
      reason: payload.reason,
    });

    return {
      entityName: 'SalaryAdvance',
      entityId: createdAdvance.id,
      auditAction: 'WHATSAPP_SALARY_ADVANCE_CREATED',
      advance: createdAdvance,
      summary: payload,
    };
  }

  formatDraftForWhatsapp(summary, employee) {
    return (
      `*Resumen de Solicitud de Anticipo de Sueldo*\n` +
      `- *Empresa:* ${employee.tenant?.name || 'Norma ERP'}\n` +
      `- *Colaborador:* ${employee.firstName} ${employee.lastName}\n` +
      `- *Monto solicitado:* $${Number(summary.amount).toFixed(2)}\n` +
      `- *Plazo de descuento:* ${summary.installments} cuota(s) mensual(es)\n` +
      `- *Descuento mensual en rol:* $${Number(summary.monthlyDeduction).toFixed(2)}\n` +
      `- *Cupo mensual maximo (50% sueldo):* $${Number(summary.maxMonthlyQuota).toFixed(2)}\n` +
      `- *Motivo:* ${summary.reason}`
    );
  }

  formatConfirmedResultForWhatsapp(result, employee) {
    const { advance, summary } = result;
    return (
      `*Solicitud de Anticipo Registrada*\n\n` +
      `- *ID de Solicitud:* ${advance.id}\n` +
      `- *Empresa:* ${employee.tenant?.name || 'Norma ERP'}\n` +
      `- *Monto:* $${Number(summary.amount).toFixed(2)} (${summary.installments} cuota(s) de $${Number(summary.monthlyDeduction).toFixed(2)})\n` +
      `- *Motivo:* ${summary.reason}\n` +
      `- *Estado actual:* ${advance.status || 'PENDING'} (Pendiente de aprobacion)\n\n` +
      `Administracion y Nomina de su empresa han recibido la solicitud para su revision.`
    );
  }

  async extractStructuredParams({ text, previousPayload = {}, aiConfig = {} }) {
    const deterministic = this.parseDeterministicParams(text);

    try {
      const prompt = `Estado previo del borrador: ${JSON.stringify(previousPayload)}
Mensaje del colaborador: "${text}"

Extrae los parametros para una solicitud de anticipo de sueldo y responde SOLO un objeto JSON valido:
{
  "amount": numero positivo en USD o null,
  "installments": numero entero de cuotas entre 1 y 24 (1 por defecto si no menciona cuotas),
  "reason": "motivo breve en español o null"
}`;

      const llmRes = await this.llmProvider.generateChatCompletion({
        systemPrompt:
          'Eres un extractor financiero estricto. Responde exclusivamente JSON valido con amount, installments y reason.',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        providerOverrides: aiConfig,
      });

      const parsed = this.safeParseJsonObject(llmRes?.content);
      if (parsed) {
        const parsedAmount = Number(parsed.amount);
        const parsedInstallments = parseInt(parsed.installments, 10);
        return {
          amount:
            Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : deterministic.amount,
          installments:
            Number.isFinite(parsedInstallments) &&
            parsedInstallments >= 1 &&
            parsedInstallments <= 24
              ? parsedInstallments
              : deterministic.installments,
          reason: this.cleanReason(parsed.reason) || deterministic.reason,
          invalidNegativeAmount: Boolean(deterministic.invalidNegativeAmount),
          invalidInstallments: Boolean(deterministic.invalidInstallments),
        };
      }
    } catch {
      // Fallback determinístico silencioso
    }

    return deterministic;
  }

  parseCurrencyAmountString(rawNum) {
    if (!rawNum) return null;
    const str = String(rawNum).trim();
    let normalized;
    if (/^\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?$/.test(str)) {
      normalized = str.replace(/,/g, '');
    } else if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(str)) {
      normalized = str.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = str.replace(',', '.');
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  parseDeterministicParams(text) {
    const raw = String(text || '').trim();

    if (
      /(?:-\s*\$\s*\d|\$\s*-\s*\d|\bmenos\s+\$?\s*\d|(?<!\d)-\d+(?:[.,]\d+)?\s*(?:dolares|usd))/i.test(
        raw
      )
    ) {
      return { amount: null, installments: null, reason: null, invalidNegativeAmount: true };
    }

    const numPattern = '(\\d{1,3}(?:[.,]\\d{3})+(?:[.,]\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?)';
    const explicitDollar = raw.match(new RegExp(`\\$\\s*${numPattern}`));
    const amountKeyword = raw.match(
      new RegExp(
        `(?:de|por|monto(?:\\s+de)?|anticipo(?:\\s+de)?|adelanto(?:\\s+de)?)\\s*\\$?\\s*${numPattern}\\s*(?:dolares|usd|\\b)`,
        'i'
      )
    );
    const standaloneNumber = raw.match(
      new RegExp(`^\\$?\\s*${numPattern}\\s*(?:dolares|usd)?$`, 'i')
    );

    const rawNum = explicitDollar?.[1] || amountKeyword?.[1] || standaloneNumber?.[1] || null;
    const amount = this.parseCurrencyAmountString(rawNum);

    let installments = null;
    let invalidInstallments = false;
    const instMatch = raw.match(/(\d{1,3})\s*(?:cuotas?|meses|pagos?)/i);
    if (instMatch) {
      const inst = parseInt(instMatch[1], 10);
      if (inst >= 1 && inst <= 24) {
        installments = inst;
      } else {
        invalidInstallments = true;
      }
    }

    let reason = null;
    const strippedForReason = raw
      .replace(/(?:por|de)\s*\$\s*\d[\d.,]*(?:\s*(?:dolares|usd))?/gi, ' ')
      .replace(/(?:por|de)\s+\d[\d.,]*\s*(?:dolares|usd)\b/gi, ' ')
      .replace(/(?:a|en|por|de)?\s*\d{1,3}\s*(?:cuotas?|meses|pagos?)\b/gi, ' ')
      .trim();

    const reasonMatch = strippedForReason.match(
      /(?:por\s+motivo\s+de|porque|ya\s+que|debido\s+a|por|para|motivo[:\s]+|razon[:\s]+)\s+([^.\n?]{3,160})/i
    );
    if (
      reasonMatch &&
      !/^\$?\s*\d+(?:[.,]\d+)?\s*(?:cuotas?|meses|dolares|usd)?$/i.test(reasonMatch[1].trim())
    ) {
      reason = this.cleanReason(reasonMatch[1]);
    } else if (
      !amount &&
      !raw.includes('?') &&
      raw.length >= 4 &&
      !/^(?:hola|cancelar|cuant|cual|como|que\b|cuando|donde)/i.test(raw)
    ) {
      const cleaned = raw
        .replace(
          /^(?:quiero|necesito|solicito|pedir|un)\s*(?:anticipo|adelanto)(?:\s+de\s+sueldo)?\s*/i,
          ''
        )
        .trim();
      if (cleaned.length >= 4) reason = this.cleanReason(cleaned);
    }

    return { amount, installments, reason, invalidInstallments };
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
    if (merged.amount) partialLines.push(`- *Monto:* $${Number(merged.amount).toFixed(2)}`);
    if (merged.installments) partialLines.push(`- *Cuotas:* ${merged.installments}`);
    if (merged.reason) partialLines.push(`- *Motivo:* ${merged.reason}`);

    const partialSection =
      partialLines.length > 0 ? `*Datos recibidos:*\n${partialLines.join('\n')}\n\n` : '';

    return (
      `Para preparar su solicitud de anticipo de sueldo en *${employee.tenant?.name || 'Norma ERP'}*:\n\n` +
      `${partialSection}` +
      `Por favor indique: *${missingFields.join(', ')}*.\n` +
      `Ejemplo: _Solicito anticipo de $200 a 2 cuotas por emergencia medica_\n\n` +
      `Si desea cancelar, responda *CANCELAR*.`
    );
  }
}

const requestSalaryAdvanceSkill = new RequestSalaryAdvanceSkill();
export default requestSalaryAdvanceSkill;
