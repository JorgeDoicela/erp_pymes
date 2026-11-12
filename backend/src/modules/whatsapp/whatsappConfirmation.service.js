/**
 * @file whatsappConfirmation.service.js
 * @description Servicio de seguridad transaccional (Doble Factor: últimos 4 dígitos de cédula + OTP SMTP)
 * para habilidades agénticas multi-tenant en WhatsApp Cloud API.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import crypto from 'crypto';
import whatsappActionSessionRepository, {
  WHATSAPP_SESSION_STATUS,
} from './whatsappActionSession.repository.js';
import whatsappSecurityService from './whatsappSecurity.service.js';
import { emailService } from '../notifications/index.js';
import { auditService } from '../audit/index.js';

const ACTION_SESSION_TTL_MS = 10 * 60 * 1000;
const MAX_CONFIRMATION_ATTEMPTS = 3;

export class WhatsappConfirmationService {
  constructor(
    sessionRepo = whatsappActionSessionRepository,
    security = whatsappSecurityService,
    emailSender = emailService,
    auditor = auditService
  ) {
    this.sessionRepo = sessionRepo;
    this.security = security;
    this.emailSender = emailSender;
    this.auditor = auditor;
  }

  /**
   * Crea o actualiza un borrador incompleto mientras el colaborador aporta parámetros faltantes.
   */
  async saveCollectingDraft({
    employee,
    phoneKey,
    skillName,
    partialPayload,
    activeSession = null,
    sourceMessageId = null,
  }) {
    const expiresAt = new Date(Date.now() + ACTION_SESSION_TTL_MS);

    if (
      activeSession &&
      activeSession.status === WHATSAPP_SESSION_STATUS.COLLECTING_PARAMS &&
      activeSession.skillName === skillName
    ) {
      await this.sessionRepo.updateSessionScoped({
        id: activeSession.id,
        tenantId: employee.tenantId,
        employeeId: employee.id,
        data: {
          payloadJson: partialPayload,
          expiresAt,
        },
      });
      return activeSession.id;
    }

    await this.sessionRepo.cancelOpenSessions({
      phoneKey,
      tenantId: employee.tenantId,
      employeeId: employee.id,
    });

    const created = await this.sessionRepo.createSession({
      id: crypto.randomUUID(),
      tenantId: employee.tenantId,
      employeeId: employee.id,
      phoneKey,
      skillName,
      status: WHATSAPP_SESSION_STATUS.COLLECTING_PARAMS,
      payloadJson: partialPayload,
      expiresAt,
      sourceMessageId,
    });

    return created.id;
  }

  /**
   * Inicia el flujo de doble validación (Cédula últimos 4 dígitos + CONFIRMAR + OTP por correo).
   */
  async initiateDualConfirmation({
    employee,
    phoneKey,
    skill,
    draftSummary,
    sourceMessageId = null,
  }) {
    if (!employee?.tenantId || !employee?.id) {
      throw new Error('Contexto multi-tenant inválido para iniciar confirmación.');
    }

    const docDigits = String(employee.identityCard || '').replace(/[^\d]/g, '');
    if (docDigits.length < 4) {
      return (
        `No es posible iniciar la solicitud porque su ficha en *${employee.tenant?.name || 'Norma ERP'}* ` +
        `no tiene registrada una cedula o identificacion valida (minimo 4 digitos).\n\n` +
        `Solicite a Talento Humano actualizar su numero de identificacion.`
      );
    }

    if (!employee.email || !employee.email.includes('@')) {
      return (
        `No es posible enviar el codigo OTP de seguridad porque su ficha no registra un correo electronico valido.\n\n` +
        `Solicite a Talento Humano actualizar su correo corporativo.`
      );
    }

    await this.sessionRepo.cancelOpenSessions({
      phoneKey,
      tenantId: employee.tenantId,
      employeeId: employee.id,
    });

    const sessionId = crypto.randomUUID();
    const otpCode = this.security.generateNumericOtp(6);
    const otpHash = this.security.hashOtp(sessionId, otpCode);
    const expiresAt = new Date(Date.now() + ACTION_SESSION_TTL_MS);

    await this.sessionRepo.createSession({
      id: sessionId,
      tenantId: employee.tenantId,
      employeeId: employee.id,
      phoneKey,
      skillName: skill.id,
      status: WHATSAPP_SESSION_STATUS.PENDING_CONFIRMATION,
      payloadJson: draftSummary,
      otpHash,
      otpSentToEmail: employee.email,
      attempts: 0,
      maxAttempts: MAX_CONFIRMATION_ATTEMPTS,
      expiresAt,
      sourceMessageId,
    });

    try {
      await this.sendOtpEmail({
        employee,
        otpCode,
        draftSummary,
        skillName: skill.name || skill.id,
        ttlMinutes: Math.round(ACTION_SESSION_TTL_MS / 60000),
      });
    } catch (emailErr) {
      console.error(
        '[WhatsApp Confirmation Error] Fallo enviando OTP por correo:',
        emailErr.message
      );
      await this.sessionRepo.markStatus({
        id: sessionId,
        tenantId: employee.tenantId,
        employeeId: employee.id,
        status: WHATSAPP_SESSION_STATUS.CANCELLED,
      });

      return (
        `No fue posible enviar el codigo OTP de verificacion a su correo registrado (${this.security.maskEmail(employee.email)}).\n\n` +
        `La solicitud no fue creada. Por favor intente nuevamente en unos minutos o registre su solicitud desde el portal web.`
      );
    }

    const maskedEmail = this.security.maskEmail(employee.email);
    const summaryText = skill.formatDraftForWhatsapp(draftSummary, employee);

    return (
      `${summaryText}\n\n` +
      `*Validacion de Seguridad Requerida (vigencia 10 minutos):*\n` +
      `Se envio un codigo OTP de 6 digitos a su correo *${maskedEmail}*.\n\n` +
      `Para registrar la operacion definitivamente, responda con:\n` +
      `- *CONFIRMAR <4 ultimos digitos de su cedula> <codigo OTP>*\n` +
      `Ejemplo: _CONFIRMAR 1234 849201_\n\n` +
      `Si desea anular esta operacion, responda *CANCELAR*.`
    );
  }

  /**
   * Procesa mensajes entrantes cuando existe una sesión agéntica activa para este usuario y tenant.
   */
  async handlePendingConfirmation({
    text,
    employee,
    phoneKey,
    messageId,
    activeSession,
    skillRegistry,
  }) {
    if (!activeSession) return null;
    const clean = String(text || '').trim();

    if (/^(cancelar|anular|salir|abortar)$/i.test(clean)) {
      await this.sessionRepo.markStatus({
        id: activeSession.id,
        tenantId: employee.tenantId,
        employeeId: employee.id,
        status: WHATSAPP_SESSION_STATUS.CANCELLED,
      });
      return `Operacion cancelada correctamente. No se registro ninguna solicitud en *${employee.tenant?.name || 'Norma ERP'}*.`;
    }

    if (new Date(activeSession.expiresAt).getTime() <= Date.now()) {
      await this.sessionRepo.markStatus({
        id: activeSession.id,
        tenantId: employee.tenantId,
        employeeId: employee.id,
        status: WHATSAPP_SESSION_STATUS.EXPIRED,
      });
      return `La sesion de solicitud expiro por seguridad (limite de 10 minutos). Escriba nuevamente su solicitud si desea iniciar un nuevo proceso.`;
    }

    if (activeSession.status !== WHATSAPP_SESSION_STATUS.PENDING_CONFIRMATION) {
      return null;
    }

    const confirmMatch = clean.match(/^(?:confirmar|confirmo)[\s:,-]+(\d{4})[\s:,-]+(\d{6})$/i);
    if (!confirmMatch) {
      if (/^(?:confirmar|confirmo)\b/i.test(clean)) {
        return (
          `Formato de confirmacion incompleto.\n\n` +
          `Debe enviar los *4 ultimos digitos de su cedula* y el *codigo OTP de 6 digitos* enviado a su correo:\n` +
          `Ejemplo: _CONFIRMAR 1234 849201_\n\n` +
          `O responda *CANCELAR* para anular.`
        );
      }

      return (
        `Tiene una confirmacion pendiente en *${employee.tenant?.name || 'Norma ERP'}*.\n\n` +
        `Para completarla responda:\n` +
        `*CONFIRMAR <4 ultimos digitos cedula> <OTP 6 digitos>*\n\n` +
        `O responda *CANCELAR* para descartar la solicitud y realizar otra consulta.`
      );
    }

    const [, providedLast4, providedOtp] = confirmMatch;
    const isLast4Valid = this.security.verifyIdentityLast4(employee.identityCard, providedLast4);
    const isOtpValid = this.security.verifyOtpHash(
      activeSession.id,
      providedOtp,
      activeSession.otpHash
    );

    if (!isLast4Valid || !isOtpValid) {
      const attemptState = await this.sessionRepo.registerFailedAttempt({
        id: activeSession.id,
        tenantId: employee.tenantId,
        employeeId: employee.id,
        maxAttempts: activeSession.maxAttempts || MAX_CONFIRMATION_ATTEMPTS,
      });

      if (attemptState.locked) {
        await this.auditor.log({
          tenantId: employee.tenantId,
          entity: 'WhatsappActionSession',
          entityId: activeSession.id,
          action: 'WHATSAPP_ACTION_LOCKED_MAX_ATTEMPTS',
          performedBy: employee.email,
          details: {
            skillName: activeSession.skillName,
            employeeId: employee.id,
            phoneKey,
            attempts: attemptState.attempts,
          },
        });
        return `Solicitud bloqueada por seguridad tras ${attemptState.maxAttempts} intentos fallidos de verificacion.\n\nDebera iniciar una nueva solicitud.`;
      }

      const remaining = Math.max(1, attemptState.maxAttempts - attemptState.attempts);
      return (
        `Los ultimos 4 digitos de cedula o el codigo OTP no coinciden.\n` +
        `Intentos restantes: *${remaining}*.\n\n` +
        `Verifique el codigo enviado a *${this.security.maskEmail(activeSession.otpSentToEmail)}* e intente nuevamente, o responda *CANCELAR*.`
      );
    }

    const claimed = await this.sessionRepo.claimForExecution({
      id: activeSession.id,
      tenantId: employee.tenantId,
      employeeId: employee.id,
      confirmMessageId: messageId || null,
    });
    if (!claimed) {
      return `Esta confirmacion ya fue procesada o ya no se encuentra vigente.`;
    }

    const skill = skillRegistry.getSkill(activeSession.skillName);
    if (!skill) {
      await this.sessionRepo.markStatus({
        id: activeSession.id,
        tenantId: employee.tenantId,
        employeeId: employee.id,
        status: WHATSAPP_SESSION_STATUS.CANCELLED,
      });
      return `La habilidad solicitada no esta disponible en este momento.`;
    }

    try {
      const executionResult = await skill.executeConfirmedAction({
        payload: activeSession.payloadJson,
        employee,
        tenantId: activeSession.tenantId,
      });

      await this.sessionRepo.markCompleted({
        id: activeSession.id,
        tenantId: employee.tenantId,
        employeeId: employee.id,
        resultingEntityId: executionResult.entityId,
      });

      await this.auditor.log({
        tenantId: employee.tenantId,
        entity: executionResult.entityName || 'AbsenceRequest',
        entityId: executionResult.entityId,
        action: executionResult.auditAction || 'WHATSAPP_AGENTIC_ACTION_EXECUTED',
        performedBy: employee.email,
        details: {
          channel: 'WHATSAPP_CLOUD_API',
          verificationMethod: 'DUAL_FACTOR_CEDULA_LAST4_AND_EMAIL_OTP',
          sessionId: activeSession.id,
          sourceMessageId: activeSession.sourceMessageId,
          confirmMessageId: messageId || null,
          employeeId: employee.id,
          payload: activeSession.payloadJson,
        },
      });

      return skill.formatConfirmedResultForWhatsapp(executionResult, employee);
    } catch (execErr) {
      console.error(
        '[WhatsApp Confirmation Error] Fallo al ejecutar accion confirmada:',
        execErr.message
      );
      await this.sessionRepo.markStatus({
        id: activeSession.id,
        tenantId: employee.tenantId,
        employeeId: employee.id,
        status: WHATSAPP_SESSION_STATUS.CANCELLED,
      });
      return `No se pudo completar el registro de su solicitud:\n${execErr.message}\n\nLa sesion fue cerrada; si desea ajustar los datos puede enviar una nueva solicitud.`;
    }
  }

  /**
   * Envía el código OTP de 6 dígitos al correo registrado del colaborador reutilizando EmailService.
   * @private
   */
  async sendOtpEmail({
    employee,
    otpCode,
    draftSummary = {},
    skillName = 'Operacion',
    ttlMinutes,
  }) {
    const companyName = employee.tenant?.name || 'Norma ERP';
    const subject = `[Norma ERP] Codigo OTP para ${skillName} - ${companyName}`;
    const detailRows = [];
    if (draftSummary.permissionType) detailRows.push(['Tipo', draftSummary.permissionType]);
    if (draftSummary.startDate) detailRows.push(['Desde', draftSummary.startDate]);
    if (draftSummary.endDate) detailRows.push(['Hasta', draftSummary.endDate]);
    if (draftSummary.daysRequested)
      detailRows.push(['Dias solicitados', `${draftSummary.daysRequested} dias`]);
    if (draftSummary.amount)
      detailRows.push(['Monto solicitado', `$${Number(draftSummary.amount).toFixed(2)}`]);
    if (draftSummary.installments)
      detailRows.push(['Cuotas', `${draftSummary.installments} mes(es)`]);
    if (draftSummary.targetLabel) detailRows.push(['Solicitud objetivo', draftSummary.targetLabel]);
    if (draftSummary.actionLabel) detailRows.push(['Resolucion', draftSummary.actionLabel]);
    if (draftSummary.reason) detailRows.push(['Motivo / Comentario', draftSummary.reason]);

    const rowsHtml = detailRows
      .map(
        ([label, val]) =>
          `<tr><td style="padding: 6px 0; color: #6b7280;">${label}:</td><td style="padding: 6px 0; font-weight: 600;">${val}</td></tr>`
      )
      .join('');

    const html = `
      <div style="font-family: Inter, system-ui, -apple-system, sans-serif; background: #f9fafb; padding: 24px; color: #111827;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 28px;">
          <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #111827;">Confirmacion de ${skillName} via WhatsApp</h2>
          <p style="margin: 0 0 18px 0; font-size: 13px; color: #4b5563;">Empresa: <strong>${companyName}</strong></p>
          <p style="font-size: 14px; color: #374151;">Hola <strong>${employee.firstName} ${employee.lastName}</strong>,</p>
          <p style="font-size: 14px; color: #374151;">Se inicio una operacion (<strong>${skillName}</strong>) desde tu WhatsApp corporativo:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">${rowsHtml}</table>
          <div style="background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; padding: 16px; text-align: center; margin: 20px 0;">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #4b5563;">Codigo OTP de verificacion</div>
            <div style="font-size: 28px; font-weight: 700; letter-spacing: 0.25em; color: #111827; margin-top: 6px;">${otpCode}</div>
          </div>
          <p style="font-size: 13px; color: #4b5563; margin-bottom: 0;">Este codigo expira en <strong>${ttlMinutes} minutos</strong> y permite un maximo de 3 intentos. Si no reconoces esta operacion, responde <strong>CANCELAR</strong> en el chat y notifica a Talento Humano.</p>
        </div>
      </div>`;

    return this.emailSender.sendEmail({ to: employee.email, subject, html });
  }
}

const whatsappConfirmationService = new WhatsappConfirmationService();
export default whatsappConfirmationService;
