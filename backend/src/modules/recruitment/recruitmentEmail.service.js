/**
 * @file recruitmentEmail.service.js
 * @description Norma ERP - Servicio de notificaciones por correo para procesos de reclutamiento multi-tenant
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { emailService } from '../notifications/index.js';

const MODALITY_LABELS = {
  VIRTUAL: 'Entrevista Virtual (Videollamada)',
  PRESENTIAL: 'Entrevista Presencial',
  PHONE: 'Entrevista Telefónica',
};

const getCompanyName = (application) => application?.vacancy?.tenant?.name || 'la empresa';

const formatEcuadorDateTime = (dateValue) => {
  const dateObj = new Date(dateValue);
  const dateStr = dateObj.toLocaleDateString('es-EC', {
    timeZone: 'America/Guayaquil',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = dateObj.toLocaleTimeString('es-EC', {
    timeZone: 'America/Guayaquil',
    hour: '2-digit',
    minute: '2-digit',
  });
  return { dateStr, timeStr };
};

const wrapEmailLayout = ({ title, subtitle, companyName, bodyHtml }) => `
  <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 24px;">
    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
      <div style="padding: 24px 28px; border-bottom: 1px solid #e5e7eb; background-color: #ffffff;">
        <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280;">${companyName}</p>
        <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #111827;">${title}</h1>
        ${subtitle ? `<p style="margin: 6px 0 0 0; font-size: 13px; color: #4b5563;">${subtitle}</p>` : ''}
      </div>
      <div style="padding: 28px; color: #374151; font-size: 14px; line-height: 1.65;">
        ${bodyHtml}
      </div>
      <div style="padding: 16px 28px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
        ${companyName} · Gestión de Talento Humano con Norma ERP<br />
        Este es un mensaje automático, por favor no respondas a esta dirección.
      </div>
    </div>
  </div>
`;

export const recruitmentEmailService = {
  async sendApplicationReceivedEmail(application) {
    const companyName = getCompanyName(application);
    const fullName = `${application.firstName} ${application.lastName}`;
    const position = application.vacancy?.title || 'la vacante';

    const html = wrapEmailLayout({
      title: 'Postulación recibida',
      subtitle: `Proceso de selección para ${position}`,
      companyName,
      bodyHtml: `
        <p style="margin-top: 0;">Hola <strong>${fullName}</strong>,</p>
        <p>Confirmamos la recepción de tu postulación y hoja de vida para el cargo de <strong>${position}</strong> en <strong>${companyName}</strong>.</p>
        <p>Nuestro equipo de talento humano revisará tu perfil y se pondrá en contacto contigo por este medio ante cualquier avance en el proceso.</p>
        <p style="margin-bottom: 0; color: #111827; font-weight: 600;">Equipo de Selección<br /><span style="color: #4b5563; font-weight: 400;">${companyName}</span></p>
      `,
    });

    return emailService.sendEmail({
      to: application.email,
      subject: `Confirmación de postulación: ${position} — ${companyName}`,
      html,
    });
  },

  async sendInterviewScheduledEmail({ application, interview, interviewerName = null }) {
    const companyName = getCompanyName(application);
    const fullName = `${application.firstName} ${application.lastName}`;
    const position = application.vacancy?.title || 'el proceso de selección';
    const modalityLabel = MODALITY_LABELS[interview.type] || interview.type;
    const { dateStr, timeStr } = formatEcuadorDateTime(interview.date);

    const isVirtual = interview.type === 'VIRTUAL';
    const isPresential = interview.type === 'PRESENTIAL';
    const locationLabel = isVirtual
      ? 'Enlace de videollamada'
      : isPresential
        ? 'Dirección / Sala'
        : 'Teléfono / Extensión';

    const virtualCta =
      isVirtual && interview.location?.startsWith('http')
        ? `<div style="margin-top: 20px; text-align: center;">
            <a href="${interview.location}" style="background-color: #2563eb; color: #ffffff; padding: 10px 22px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 13px; display: inline-block;">Unirse a la Videollamada</a>
          </div>`
        : '';

    const presentialNote = isPresential
      ? '<p style="margin: 12px 0 0 0; font-size: 13px; color: #4b5563;">Te recomendamos presentarte con 10 minutos de anticipación y portar tu documento de identidad.</p>'
      : '';

    const html = wrapEmailLayout({
      title: 'Invitación a entrevista',
      subtitle: `${position} · ${modalityLabel}`,
      companyName,
      bodyHtml: `
        <p style="margin-top: 0;">Hola <strong>${fullName}</strong>,</p>
        <p>Nos complace invitarte a una entrevista para continuar en el proceso de selección del cargo <strong>${position}</strong> en <strong>${companyName}</strong>.</p>
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Modalidad:</strong> ${modalityLabel}</p>
          <p style="margin: 0 0 8px 0;"><strong>Fecha:</strong> ${dateStr}</p>
          <p style="margin: 0 0 8px 0;"><strong>Hora:</strong> ${timeStr} (Ecuador)</p>
          <p style="margin: 0 0 8px 0;"><strong>${locationLabel}:</strong> ${interview.location || 'Por confirmar'}</p>
          ${interviewerName ? `<p style="margin: 0 0 8px 0;"><strong>Entrevistador(a):</strong> ${interviewerName}</p>` : ''}
          ${interview.notes ? `<p style="margin: 8px 0 0 0; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #4b5563;"><strong>Indicaciones:</strong> ${interview.notes}</p>` : ''}
        </div>
        ${presentialNote}
        ${virtualCta}
      `,
    });

    return emailService.sendEmail({
      to: application.email,
      subject: `Invitación a entrevista (${modalityLabel}): ${position} — ${companyName}`,
      html,
    });
  },

  async sendInterviewCancelledEmail({ application, interview }) {
    const companyName = getCompanyName(application);
    const fullName = `${application.firstName} ${application.lastName}`;
    const position = application.vacancy?.title || 'el proceso de selección';
    const { dateStr, timeStr } = formatEcuadorDateTime(interview.date);

    const html = wrapEmailLayout({
      title: 'Actualización de entrevista',
      subtitle: position,
      companyName,
      bodyHtml: `
        <p style="margin-top: 0;">Hola <strong>${fullName}</strong>,</p>
        <p>Te informamos que la entrevista programada para el <strong>${dateStr}</strong> a las <strong>${timeStr}</strong> correspondiente al cargo de <strong>${position}</strong> en <strong>${companyName}</strong> ha sido cancelada.</p>
        <p>Nuestro equipo de selección se pondrá en contacto contigo en caso de reprogramar una nueva fecha.</p>
      `,
    });

    return emailService.sendEmail({
      to: application.email,
      subject: `Entrevista cancelada: ${position} — ${companyName}`,
      html,
    });
  },

  async sendHiringEmail(application, startDate) {
    const companyName = getCompanyName(application);
    const fullName = `${application.firstName} ${application.lastName}`;
    const position = application.vacancy?.title || 'nuestro equipo';
    const formattedDate = new Date(startDate).toLocaleDateString('es-EC', {
      timeZone: 'America/Guayaquil',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const loginUrl = process.env.FRONTEND_URL || process.env.ORIGIN || 'http://localhost:5173';

    const html = wrapEmailLayout({
      title: 'Bienvenido(a) al equipo',
      subtitle: `Incorporación al cargo de ${position}`,
      companyName,
      bodyHtml: `
        <p style="margin-top: 0;">Hola <strong>${fullName}</strong>,</p>
        <p>Nos complace informarte que has sido seleccionado(a) para el puesto de <strong>${position}</strong> en <strong>${companyName}</strong>.</p>
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Fecha de ingreso:</strong> ${formattedDate}</p>
          <p style="margin: 0;"><strong>Acceso al portal:</strong> Ingresa con tu correo electrónico y la contraseña temporal asignada por Talento Humano.</p>
        </div>
        <div style="margin-top: 24px; text-align: center;">
          <a href="${loginUrl}" style="background-color: #2563eb; color: #ffffff; padding: 10px 24px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 13px; display: inline-block;">Acceder al Portal</a>
        </div>
      `,
    });

    return emailService.sendEmail({
      to: application.email,
      subject: `Incorporación confirmada: ${position} — ${companyName}`,
      html,
    });
  },

  async sendRejectionEmail(application) {
    const companyName = getCompanyName(application);
    const fullName = `${application.firstName} ${application.lastName}`;
    const position = application.vacancy?.title || 'la vacante';

    const html = wrapEmailLayout({
      title: 'Actualización de tu postulación',
      subtitle: position,
      companyName,
      bodyHtml: `
        <p style="margin-top: 0;">Hola <strong>${fullName}</strong>,</p>
        <p>Agradecemos sinceramente el tiempo e interés que demostraste al postularte para el cargo de <strong>${position}</strong> en <strong>${companyName}</strong>.</p>
        <p>Tras revisar detenidamente las candidaturas, te informamos que en esta ocasión hemos decidido avanzar con otros perfiles para esta posición.</p>
        <p>Conservaremos tu hoja de vida para futuras oportunidades acordes a tu experiencia.</p>
        <p style="margin-bottom: 0; color: #111827; font-weight: 600;">Equipo de Selección<br /><span style="color: #4b5563; font-weight: 400;">${companyName}</span></p>
      `,
    });

    return emailService.sendEmail({
      to: application.email,
      subject: `Actualización sobre tu postulación: ${position} — ${companyName}`,
      html,
    });
  },
};

export default recruitmentEmailService;
