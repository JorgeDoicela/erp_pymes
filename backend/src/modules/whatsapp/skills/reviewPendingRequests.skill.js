/**
 * @file reviewPendingRequests.skill.js
 * @description Habilidad agéntica REVIEW_PENDING_REQUESTS: listado y aprobación/rechazo de solicitudes
 * pendientes (Vacaciones, Permisos y Anticipos) restringido por RBAC (admin, hr, manager) y tenantId con 2FA.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { absenceService } from '../../attendance/index.js';
import { salaryAdvanceService } from '../../payroll/index.js';
import whatsappRepository from '../whatsapp.repository.js';

export const REVIEW_PENDING_REQUESTS_SKILL_ID = 'REVIEW_PENDING_REQUESTS';
const AUTHORIZED_REVIEW_ROLES = new Set(['admin', 'hr', 'manager', 'superadmin']);

export class ReviewPendingRequestsSkill {
  constructor(
    absenceDomainService = absenceService,
    advanceDomainService = salaryAdvanceService,
    repo = whatsappRepository
  ) {
    this.id = REVIEW_PENDING_REQUESTS_SKILL_ID;
    this.name = 'Aprobar o Rechazar Solicitudes del Tenant';
    this.description =
      'Permite a directivos autorizados (admin, hr, manager) listar y aprobar o rechazar solicitudes pendientes de su empresa con 2FA.';
    this.absenceService = absenceDomainService;
    this.salaryAdvanceService = advanceDomainService;
    this.repo = repo;
  }

  async prepareDraft({ text, employee, activeSession = null }) {
    const role = String(employee?.role || '').toLowerCase();
    if (!AUTHORIZED_REVIEW_ROLES.has(role)) {
      return {
        status: 'DOMAIN_REJECTED',
        errorMessage: `Acceso denegado: su rol actual (*${employee?.role || 'employee'}*) no tiene permisos para aprobar o rechazar solicitudes en *${employee.tenant?.name || 'Norma ERP'}*.`,
      };
    }

    const previousPayload =
      activeSession?.status === 'COLLECTING_PARAMS' && activeSession.payloadJson
        ? activeSession.payloadJson
        : {};

    const candidates = await this.loadNormalizedCandidates(employee, previousPayload.candidates);
    if (!candidates.length) {
      return {
        status: 'DOMAIN_REJECTED',
        errorMessage: `No existen solicitudes pendientes de aprobacion en *${employee.tenant?.name || 'Norma ERP'}* en este momento.`,
      };
    }

    const parsed = this.parseReviewCommand(text, candidates, previousPayload);

    if (!parsed.action || !parsed.selectedItem) {
      return {
        status: 'NEED_MORE_INFO',
        partialPayload: {
          candidates,
          action: parsed.action || null,
          targetId: parsed.selectedItem?.id || null,
        },
        promptMessage: this.buildPendingListPrompt(candidates, employee),
      };
    }

    const defaultComment =
      parsed.action === 'APPROVED'
        ? `Aprobado via WhatsApp por ${employee.firstName} ${employee.lastName}`
        : `Rechazado via WhatsApp por ${employee.firstName} ${employee.lastName}`;

    const finalReason = parsed.reason || defaultComment;
    const actionLabel = parsed.action === 'APPROVED' ? 'APROBAR' : 'RECHAZAR';

    return {
      status: 'READY_FOR_CONFIRMATION',
      draftSummary: {
        action: parsed.action,
        actionLabel,
        targetKind: parsed.selectedItem.kind,
        targetId: parsed.selectedItem.id,
        targetLabel: parsed.selectedItem.label,
        employeeName: parsed.selectedItem.employeeName,
        reason: finalReason,
      },
    };
  }

  async executeConfirmedAction({ payload, employee, tenantId }) {
    if (payload.targetKind === 'ADVANCE') {
      const updatedAdvance =
        payload.action === 'APPROVED'
          ? await this.salaryAdvanceService.approveAdvance(payload.targetId, employee.id, tenantId)
          : await this.salaryAdvanceService.rejectAdvance(
              payload.targetId,
              payload.reason,
              employee.id,
              tenantId
            );

      return {
        entityName: 'SalaryAdvance',
        entityId: updatedAdvance.id,
        auditAction:
          payload.action === 'APPROVED' ? 'WHATSAPP_ADVANCE_APPROVED' : 'WHATSAPP_ADVANCE_REJECTED',
        record: updatedAdvance,
        summary: payload,
      };
    }

    const updatedAbsence = await this.absenceService.updateRequestStatus({
      id: payload.targetId,
      status: payload.action,
      adminComment: payload.reason,
      tenantId,
    });

    return {
      entityName: 'AbsenceRequest',
      entityId: updatedAbsence.id,
      auditAction:
        payload.action === 'APPROVED' ? 'WHATSAPP_ABSENCE_APPROVED' : 'WHATSAPP_ABSENCE_REJECTED',
      record: updatedAbsence,
      summary: payload,
    };
  }

  formatDraftForWhatsapp(summary, employee) {
    return (
      `*Resumen de Resolucion Gerencial (${summary.actionLabel})*\n` +
      `- *Empresa:* ${employee.tenant?.name || 'Norma ERP'}\n` +
      `- *Autorizador:* ${employee.firstName} ${employee.lastName} (${employee.role})\n` +
      `- *Accion:* *${summary.actionLabel}*\n` +
      `- *Colaborador solicitante:* ${summary.employeeName}\n` +
      `- *Detalle de solicitud:* ${summary.targetLabel}\n` +
      `- *Observacion:* ${summary.reason}`
    );
  }

  formatConfirmedResultForWhatsapp(result, employee) {
    const { summary } = result;
    return (
      `*Resolucion Registrada Exitosamente*\n\n` +
      `- *Empresa:* ${employee.tenant?.name || 'Norma ERP'}\n` +
      `- *Accion ejecutada:* *${summary.actionLabel}*\n` +
      `- *Solicitud:* ${summary.targetLabel} (${summary.employeeName})\n` +
      `- *ID:* ${summary.targetId}\n` +
      `- *Observacion:* ${summary.reason}\n\n` +
      `El colaborador y el registro de auditoria del tenant han sido actualizados.`
    );
  }

  async loadNormalizedCandidates(employee, cachedCandidates = null) {
    if (Array.isArray(cachedCandidates) && cachedCandidates.length > 0) {
      return cachedCandidates;
    }

    const deptFilter =
      String(employee.role || '').toLowerCase() === 'manager' ? employee.department : null;
    const { pendingAbsences = [], pendingAdvances = [] } =
      await this.repo.getPendingTenantRequestsForReview(employee.tenantId, deptFilter);

    const items = [];
    for (const abs of pendingAbsences) {
      const empName = `${abs.employee?.firstName || ''} ${abs.employee?.lastName || ''}`.trim();
      const startIso = new Date(abs.startDate).toISOString().slice(0, 10);
      const endIso = new Date(abs.endDate).toISOString().slice(0, 10);
      items.push({
        index: items.length + 1,
        kind: 'ABSENCE',
        id: abs.id,
        employeeName: empName || 'Colaborador',
        label: `${abs.type} (${startIso} al ${endIso})`,
        reason: abs.reason || 'Sin detalle',
      });
    }

    for (const adv of pendingAdvances) {
      const empName = `${adv.employee?.firstName || ''} ${adv.employee?.lastName || ''}`.trim();
      items.push({
        index: items.length + 1,
        kind: 'ADVANCE',
        id: adv.id,
        employeeName: empName || 'Colaborador',
        label: `Anticipo $${Number(adv.amount).toFixed(2)} (${adv.installments} cuota(s))`,
        reason: adv.reason || 'Sin detalle',
      });
    }

    return items;
  }

  parseReviewCommand(text, candidates, previousPayload = {}) {
    const raw = String(text || '').trim();
    let action = previousPayload.action || null;

    if (/\b(aprobar|apruebo|autorizar|autorizo|aceptar)\b/i.test(raw)) {
      action = 'APPROVED';
    } else if (/\b(rechazar|rechazo|denegar|negar)\b/i.test(raw)) {
      action = 'REJECTED';
    }

    let selectedItem = null;
    const explicitIndexMatch =
      raw.match(/(?:#|n[uú]mero\s+|solicitud\s+#?|item\s+#?|opci[oó]n\s+#?)(\d{1,2})\b/i) ||
      raw.match(
        /\b(?:aprobar|apruebo|autorizar|autorizo|aceptar|rechazar|rechazo|denegar|negar)\s+(?:la\s+|el\s+)?(?:solicitud\s+|item\s+|n[uú]mero\s+)?#?(\d{1,2})\b/i
      ) ||
      raw.match(/^\s*#?(\d{1,2})(?:\b|\s|$)/);

    if (explicitIndexMatch) {
      const idx = parseInt(explicitIndexMatch[1], 10);
      selectedItem = candidates.find((c) => c.index === idx) || null;
    }

    if (!selectedItem) {
      selectedItem =
        candidates.find((c) => raw.includes(c.id)) ||
        candidates.find((c) => c.id === previousPayload.targetId) ||
        null;
    }

    let reason = null;
    const reasonMatch = raw.match(
      /(?:porque|ya\s+que|debido\s+a|por|motivo[:\s]+|comentario[:\s]+|nota[:\s]+)\s+([^.\n]{3,160})/i
    );
    if (reasonMatch) {
      reason = reasonMatch[1].trim();
    }

    return { action, selectedItem, reason };
  }

  buildPendingListPrompt(candidates, employee) {
    const lines = candidates.map(
      (c) =>
        `*${c.index}.* [${c.kind === 'ADVANCE' ? 'Anticipo' : 'Ausencia'}] *${c.employeeName}* - ${c.label} (_Motivo: ${c.reason}_)`
    );

    return (
      `*Solicitudes Pendientes en ${employee.tenant?.name || 'Norma ERP'}:*\n\n` +
      `${lines.join('\n')}\n\n` +
      `Para aprobar o rechazar una solicitud, responda indicando la accion y el numero:\n` +
      `- Ejemplo: _Aprobar 1 por cobertura confirmada_\n` +
      `- Ejemplo: _Rechazar 2 por cierre de nomina_\n\n` +
      `Si desea salir sin cambios, responda *CANCELAR*.`
    );
  }
}

const reviewPendingRequestsSkill = new ReviewPendingRequestsSkill();
export default reviewPendingRequestsSkill;
