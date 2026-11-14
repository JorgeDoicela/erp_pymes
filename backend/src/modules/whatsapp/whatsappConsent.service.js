/**
 * @file whatsappConsent.service.js
 * @description Servicio de gobernanza de consentimiento previo y revocatoria para el canal WhatsApp
 * en estricto cumplimiento de los Arts. 8, 12 y 15 de la Ley Orgánica de Protección de Datos Personales (LOPDP) de Ecuador.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import whatsappRepository from './whatsapp.repository.js';
import whatsappActionSessionRepository from './whatsappActionSession.repository.js';
import { auditService } from '../audit/index.js';
import { WHATSAPP_PRIVACY_POLICY_URL } from './whatsapp.constants.js';

export class WhatsappConsentService {
  constructor(
    repo = whatsappRepository,
    sessionRepo = whatsappActionSessionRepository,
    auditor = auditService
  ) {
    this.repo = repo;
    this.sessionRepo = sessionRepo;
    this.auditor = auditor;
  }

  /**
   * Normaliza texto para evaluar comandos de consentimiento.
   * @param {string} text
   * @returns {string}
   */
  normalizeText(text) {
    const raw = String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[¿?¡!.,;:_-]/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');

    return raw
      .replace(
        /^(?:(?:hola|buenas\s+(?:tardes|noches)?|buenos\s+dias|buenas|por\s+favor|estimad[oa]s?|disculpe|quiero|deseo)\s+)+/i,
        ''
      )
      .trim();
  }

  /**
   * Evalúa si el mensaje constituye una aceptación expresa de consentimiento LOPDP.
   * @param {string} text
   * @returns {boolean}
   */
  isAcceptCommand(text) {
    const clean = this.normalizeText(text);
    return /^(?:acepto|si\s+acepto|acepto\s+(?:terminos|politicas|lopdp|tratamiento)|autorizo(?:\s+el\s+tratamiento)?|de\s+acuerdo)$/i.test(
      clean
    );
  }

  /**
   * Evalúa si el mensaje constituye una revocatoria expresa de consentimiento LOPDP.
   * @param {string} text
   * @returns {boolean}
   */
  isRevokeCommand(text) {
    const clean = this.normalizeText(text);
    return /^(?:revocar(?:\s+(?:consentimiento|lopdp|autorizacion|datos))?|revoco|no\s+acepto|cancelar\s+consentimiento)$/i.test(
      clean
    );
  }

  /**
   * Orquesta la verificación de consentimiento LOPDP, registro de aceptación o revocatoria.
   * Retorna una cadena si el flujo fue manejado o si el consentimiento está pendiente,
   * o null si el colaborador cuenta con consentimiento activo y puede continuar con sus consultas.
   * @param {Object} params
   * @param {string} params.text
   * @param {Object} params.employee
   * @param {string} params.phoneKey
   * @param {Object} [params.sessionRepo]
   * @param {Object} [params.auditor]
   * @returns {Promise<string|null>}
   */
  async handleConsentFlow({
    text,
    employee,
    phoneKey,
    sessionRepo = this.sessionRepo,
    auditor = this.auditor,
  }) {
    if (!employee) return null;

    const companyName = employee.tenant?.name || 'Norma ERP';
    const privacyUrl = WHATSAPP_PRIVACY_POLICY_URL;

    // 1. Manejo de REVOCATORIA de consentimiento
    if (this.isRevokeCommand(text)) {
      if (!employee.whatsappConsent) {
        return (
          `*Consentimiento LOPDP No Activo*\n\n` +
          `Estimado(a) *${employee.firstName} ${employee.lastName}*:\n` +
          `Actualmente no registra un consentimiento activo para el tratamiento de datos personales por WhatsApp en *${companyName}*.\n\n` +
          `Sus datos no estan siendo procesados en este canal. Para autorizar el tratamiento en cualquier momento, responda *ACEPTO*.\n\n` +
          `Politicas de privacidad: ${privacyUrl}`
        );
      }

      if (typeof this.repo?.updateEmployeeWhatsappConsent === 'function') {
        await this.repo.updateEmployeeWhatsappConsent({
          employeeId: employee.id,
          tenantId: employee.tenantId,
          consent: false,
        });
      }
      employee.whatsappConsent = false;
      employee.whatsappConsentDate = null;

      if (sessionRepo && phoneKey && employee.tenantId) {
        await sessionRepo.cancelOpenSessions({
          phoneKey,
          tenantId: employee.tenantId,
          employeeId: employee.id,
        });
      }

      if (auditor && typeof auditor.log === 'function') {
        await auditor.log({
          tenantId: employee.tenantId,
          entity: 'Employee',
          entityId: employee.id,
          action: 'WHATSAPP_LOPDP_CONSENT_REVOKED',
          performedBy: employee.email || employee.phone || phoneKey,
          details: {
            channel: 'WHATSAPP_CLOUD_API',
            phoneKey,
            revocationDate: new Date().toISOString(),
            regulation: 'LOPDP_ECUADOR_ART_8_15',
          },
        });
      }

      return (
        `*Consentimiento Revocado — Ley Organica de Proteccion de Datos Personales (LOPDP)*\n\n` +
        `Estimado(a) *${employee.firstName} ${employee.lastName}*:\n` +
        `Se ha revocado correctamente su autorizacion para el tratamiento de datos personales en el canal WhatsApp de *${companyName}*.\n\n` +
        `Conforme a los Arts. 8 y 15 de la LOPDP:\n` +
        `- Sus consultas, asistencias y solicitudes operativas ya no seran procesadas a traves de WhatsApp.\n` +
        `- Puede consultar nuestras politicas de privacidad en:\n` +
        `${privacyUrl}\n\n` +
        `Si en el futuro decide volver a interactuar con el asistente corporativo, solo responda con la palabra *ACEPTO*.`
      );
    }

    // 2. Manejo de ACEPTACIÓN de consentimiento
    if (this.isAcceptCommand(text)) {
      if (employee.whatsappConsent) {
        return (
          `*Consentimiento LOPDP Activo*\n\n` +
          `Estimado(a) *${employee.firstName} ${employee.lastName}*:\n` +
          `Su autorizacion para el tratamiento de datos personales en *${companyName}* ya se encuentra registrada y vigente conforme a la LOPDP.\n\n` +
          `Puede realizar sus consultas laborales (saldo de vacaciones, marcaciones de asistencia, roles de pago o normativas).\n\n` +
          `Politicas de privacidad: ${privacyUrl}\n` +
          `Si desea revocar su autorizacion en cualquier momento, escriba *REVOCAR*.`
        );
      }

      const consentDate = new Date();
      if (typeof this.repo?.updateEmployeeWhatsappConsent === 'function') {
        await this.repo.updateEmployeeWhatsappConsent({
          employeeId: employee.id,
          tenantId: employee.tenantId,
          consent: true,
        });
      }
      employee.whatsappConsent = true;
      employee.whatsappConsentDate = consentDate;

      if (auditor && typeof auditor.log === 'function') {
        await auditor.log({
          tenantId: employee.tenantId,
          entity: 'Employee',
          entityId: employee.id,
          action: 'WHATSAPP_LOPDP_CONSENT_GRANTED',
          performedBy: employee.email || employee.phone || phoneKey,
          details: {
            channel: 'WHATSAPP_CLOUD_API',
            phoneKey,
            consentDate: consentDate.toISOString(),
            regulation: 'LOPDP_ECUADOR_ART_8_12',
          },
        });
      }

      return (
        `*Consentimiento Registrado Exitosamente — LOPDP Ecuador*\n\n` +
        `Estimado(a) *${employee.firstName} ${employee.lastName}*:\n` +
        `Hemos registrado su autorizacion expresa para el tratamiento de datos personales en el canal WhatsApp corporativo de *${companyName}*, en estricto cumplimiento de los Arts. 8 y 12 de la Ley Organica de Proteccion de Datos Personales (LOPDP).\n\n` +
        `Ahora puede realizar sus consultas laborales:\n` +
        `- *Consultas operativas:* "Cual es mi saldo de vacaciones", "Ver marcaciones de hoy", "Ultimo rol de pagos".\n` +
        `- *Habilidades agenticas:* "Solicitar vacaciones del 2026-12-01 al 2026-12-05", "Solicitar anticipo de sueldo".\n` +
        `- *Normativa laboral:* "Que dice el Codigo del Trabajo sobre despido intempestivo".\n\n` +
        `Nuestras politicas de privacidad se encuentran siempre disponibles en:\n` +
        `${privacyUrl}\n\n` +
        `_(Para revocar su consentimiento en cualquier momento, responda REVOCAR)_`
      );
    }

    // 3. Si el colaborador NO ha otorgado consentimiento, se bloquea la interacción
    if (!employee.whatsappConsent) {
      return (
        `*Consentimiento de Datos Personales Requerido (LOPDP Ecuador)*\n\n` +
        `Estimado(a) *${employee.firstName} ${employee.lastName}*:\n` +
        `Para poder interactuar con el Asistente Corporativo de *${companyName}* y procesar sus consultas laborales (asistencias, saldo de vacaciones, anticipos o normativas), requerimos su autorizacion expresa para el tratamiento de sus datos personales conforme a los Arts. 8 y 12 de la Ley Organica de Proteccion de Datos Personales (LOPDP).\n\n` +
        `Revise nuestras politicas de privacidad en:\n` +
        `${privacyUrl}\n\n` +
        `Para aceptar y comenzar a utilizar el servicio, responda con la palabra:\n` +
        `*ACEPTO*\n\n` +
        `_(Podra revocar su consentimiento en cualquier momento escribiendo REVOCAR)_`
      );
    }

    // 4. Consentimiento válido y activo: continúa el flujo regular
    return null;
  }
}

const whatsappConsentService = new WhatsappConsentService();
export default whatsappConsentService;
