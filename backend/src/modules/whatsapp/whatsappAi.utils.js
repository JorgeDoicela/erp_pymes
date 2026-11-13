/**
 * @file whatsappAi.utils.js
 * @description Funciones auxiliares de clasificación de intenciones y formateo de mensajes multi-tenant para WhatsApp AI.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { WHATSAPP_INTENTS } from './whatsapp.constants.js';

/**
 * Clasifica la intención del mensaje del usuario a partir del texto y contexto del colaborador.
 * @param {string} text
 * @param {Object|null} employee
 * @returns {string} Código de intención (WHATSAPP_INTENTS)
 */
export function classifyIntent(text, employee) {
  if (!employee) {
    return WHATSAPP_INTENTS.UNKNOWN_SENDER;
  }

  const raw = String(text || '').trim();
  const lower = raw.toLowerCase();
  const unaccented = lower
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!]/g, '')
    .trim();

  // 0. Comandos de consentimiento y revocatoria LOPDP (Ecuador Arts. 8 y 15)
  if (
    /^(?:revocar(?:\s+(?:consentimiento|lopdp|autorizacion|datos))?|revoco|no\s+acepto|cancelar\s+consentimiento)$/i.test(
      unaccented
    )
  ) {
    return WHATSAPP_INTENTS.LOPDP_CONSENT_REVOKE;
  }
  if (
    /^(?:acepto|si\s+acepto|acepto\s+(?:terminos|politicas|lopdp|tratamiento)|autorizo(?:\s+el\s+tratamiento)?|de\s+acuerdo)$/i.test(
      unaccented
    )
  ) {
    return WHATSAPP_INTENTS.LOPDP_CONSENT_ACCEPT;
  }

  // 1. Comando explícito de cambio/consulta de empresa activa (Multi-Tenant)
  if (
    /^(cambiar\s+(?:de\s+)?empresa|mis\s+empresas|empresas|mi\s+empresa\s+activa)$/i.test(
      unaccented
    )
  ) {
    return WHATSAPP_INTENTS.SWITCH_TENANT_COMMAND;
  }

  // 2. Saludos y solicitudes de ayuda
  if (
    /^(hola|buen(?:os?|as?)\s*(?:dias?|tardes?|noches?)|buenas\b|saludos|menu|ayuda|opciones|que\s*puedes\s*hacer)\b/i.test(
      unaccented
    )
  ) {
    return WHATSAPP_INTENTS.GENERAL_GREETING;
  }

  // 3. Habilidad agéntica gerencial: aprobar/rechazar/revisar solicitudes pendientes del tenant
  if (
    /(?:aprobar|rechazar|revisar|gestionar)\s+(?:solicitud(?:es)?|pendientes|permisos?|vacaciones|anticipos?)/i.test(
      unaccented
    ) ||
    /\b(?:solicitudes\s+pendientes\s+por\s+aprobar|pendientes\s+de\s+aprobacion)\b/i.test(
      unaccented
    )
  ) {
    return WHATSAPP_INTENTS.REVIEW_REQUESTS_ACTION;
  }

  // 4. Consultas sobre métricas empresariales (KPIs)
  if (
    /(metricas|kpis?|resumen\s+empresa|cuantos\s+empleados|asistencias\s+hoy|total\s+personal)/i.test(
      unaccented
    )
  ) {
    return WHATSAPP_INTENTS.TENANT_METRICS_QUERY;
  }

  const isLegalTopic =
    /(codigo\s+del\s+trabajo|ley\s+organica|constitucion|articulo|art\.|sri|lopdp|segun\s+la\s+ley|por\s+ley|que\s+dice\s+(?:el\s+codigo|la\s+ley))/i.test(
      unaccented
    );

  const isInformationalInquiry =
    /\b(cuant[oa]s?|cual(es)?|como|que|cuando|donde|saber|consultar|conocer|averiguar|revisar|ver|saldo|disponible(s)?|tengo|me queda(n)?|me corresponde(n)?)\b/i.test(
      unaccented
    ) ||
    /\b(como\s+(?:puedo\s+|se\s+)?(?:pedir|solicitar|tramitar)|requisitos|puedo\s+(?:pedir|solicitar))\b/i.test(
      unaccented
    );

  // 5. Habilidad agéntica: solicitud transaccional de anticipo de sueldo
  if (
    !isLegalTopic &&
    !isInformationalInquiry &&
    (/(?:solicitar|solicito|pedir|pido|necesito|quiero|deseo|tramitar|tramito|registrar|registro|solicitud\s+de)\b[^.\n]{0,45}\b(?:anticipo|adelanto)\b/i.test(
      unaccented
    ) ||
      /\b(?:anticipo|adelanto)\s+(?:de\s+sueldo\s+)?(?:de|por)\s*\$?\s*\d+/i.test(unaccented))
  ) {
    return WHATSAPP_INTENTS.SALARY_ADVANCE_ACTION;
  }

  // 6. Habilidad agéntica: solicitud de permiso médico, calamidad doméstica o licencia
  if (
    !isLegalTopic &&
    !isInformationalInquiry &&
    (/(?:solicitar|solicito|pedir|pido|reportar|reporto|registrar|registro|necesito|quiero|justificar|justifico)\b[^.\n]{0,45}\b(?:permiso|calamidad|cita\s+medica|licencia)\b/i.test(
      unaccented
    ) ||
      /\b(?:permiso\s+medico|calamidad\s+domestica|permiso\s+personal)\s+(?:para|del|el|por)\b/i.test(
        unaccented
      ))
  ) {
    return WHATSAPP_INTENTS.PERMISSION_REQUEST_ACTION;
  }

  // 7. Habilidad agéntica: solicitud transaccional de vacaciones
  if (
    !isLegalTopic &&
    !isInformationalInquiry &&
    (/(?:solicitar|solicito|solicitare|pedir|pido|agendar|agendo|registrar|registro|tomar|tomo|necesito|quiero|deseo|tramitar|tramito|solicitud\s+de)\b[^.\n]{0,45}\bvacacion(?:es)?\b/i.test(
      unaccented
    ) ||
      /\bvacacion(?:es)?\s+(?:del|desde|para(?:\s+el|\s+la)?|entre)\b/i.test(unaccented))
  ) {
    return WHATSAPP_INTENTS.VACATION_REQUEST_ACTION;
  }

  // 8. Consulta de rol de pagos / estado de solicitudes personales
  if (
    !isLegalTopic &&
    /(mi\s+rol|rol\s+de\s+pagos|ultimo\s+rol|cuanto\s+cobre|neto\s+a\s+recibir|estado\s+de\s+mis?\s+solicitud|mis\s+solicitudes|mis\s+anticipos)/i.test(
      unaccented
    )
  ) {
    return WHATSAPP_INTENTS.PAYROLL_SLIP_QUERY;
  }

  // 9. Consultas legales explícitas
  if (isLegalTopic) {
    return WHATSAPP_INTENTS.LEGAL_QUERY;
  }

  // 10. Consultas personales del colaborador
  if (
    /(vacacion|saldo|mis?\s+dias|asistencia|marque|marcar|entrada|salida|mi\s+perfil|mi\s+cargo|mi\s+departamento)/i.test(
      unaccented
    )
  ) {
    return WHATSAPP_INTENTS.EMPLOYEE_QUERY;
  }

  return WHATSAPP_INTENTS.LEGAL_QUERY;
}

/**
 * Formatea el mensaje de bienvenida y menú de opciones adaptado al rol del colaborador en su tenant.
 * @param {Object} employee
 * @returns {string}
 */
export function formatGreetingMessage(employee) {
  const companyName = employee.tenant?.name ? ` de *${employee.tenant.name}*` : '';
  const role = String(employee.role || '').toLowerCase();
  const isManagerial = ['admin', 'hr', 'manager', 'entrepreneur', 'superadmin'].includes(role);

  let managerSection = '';
  if (isManagerial) {
    managerSection =
      `\n*Funciones Directivas (${employee.role}):*\n` +
      `- *Aprobar solicitudes:* "Revisar solicitudes pendientes"\n` +
      `- *KPIs del tenant:* "Metricas de la empresa"\n`;
  }

  return (
    `Hola ${employee.firstName}, bienvenido(a) al Asistente Corporativo de Norma ERP${companyName}.\n\n` +
    `*Autogestion Agéntica (con 2FA):*\n` +
    `- *Pedir vacaciones:* "Quiero pedir vacaciones del 2026-11-20 al 2026-11-24 por viaje familiar"\n` +
    `- *Pedir anticipo:* "Solicito anticipo de $150 a 2 cuotas por emergencia"\n` +
    `- *Reportar permiso/calamidad:* "Solicitar permiso medico para el 2026-11-22 por cita IESS"\n\n` +
    `*Consultas Personales y Legales:*\n` +
    `- *Rol y solicitudes:* "Ver mi ultimo rol de pagos y mis solicitudes"\n` +
    `- *Mis vacaciones y marcacion:* "¿Cuantos dias de vacaciones tengo y a que hora marque hoy?"\n` +
    `- *Consultas legales:* "¿Como se calculan las horas extraordinarias segun el Art. 55?"\n` +
    `- *Multi-empresa:* Escriba *CAMBIAR EMPRESA* si opera en varios RUC.` +
    managerSection
  );
}

/**
 * Formatea el resumen del último rol de pagos y solicitudes recientes del colaborador en su tenant.
 */
export function formatPayrollAndRequestsMessage(employee, data = {}) {
  const { latestPayrollDetail, recentAbsences = [], recentAdvances = [] } = data;
  const company = employee.tenant?.name || 'Norma ERP';
  const lines = [`*Estado de Nomina y Solicitudes en ${company}:*`];

  if (latestPayrollDetail) {
    const periodStr = latestPayrollDetail.payroll?.period
      ? new Date(latestPayrollDetail.payroll.period).toISOString().slice(0, 7)
      : 'Reciente';
    lines.push(
      `\n*Ultimo Rol de Pagos (${periodStr}):*`,
      `- *Sueldo Base:* $${Number(latestPayrollDetail.baseSalary || 0).toFixed(2)}`,
      `- *Dias Trabajados:* ${latestPayrollDetail.workedDays || 30}`,
      `- *Horas Extra:* $${Number(latestPayrollDetail.overtimeAmount || 0).toFixed(2)}`,
      `- *Liquido a Recibir:* *$${Number(latestPayrollDetail.netSalary || 0).toFixed(2)}*`,
      `- *Estado del Rol:* ${latestPayrollDetail.payroll?.status || 'PROCESSED'}`
    );
  } else {
    lines.push(`\n*Ultimo Rol de Pagos:* No registra roles procesados aun en esta empresa.`);
  }

  if (recentAbsences.length > 0) {
    lines.push(`\n*Solicitudes de Ausencia/Vacaciones Recientes:*`);
    for (const abs of recentAbsences) {
      const start = new Date(abs.startDate).toISOString().slice(0, 10);
      const end = new Date(abs.endDate).toISOString().slice(0, 10);
      lines.push(`- ${abs.type} (${start} al ${end}): *${abs.status}*`);
    }
  }

  if (recentAdvances.length > 0) {
    lines.push(`\n*Anticipos de Sueldo Recientes:*`);
    for (const adv of recentAdvances) {
      lines.push(
        `- $${Number(adv.amount).toFixed(2)} (${adv.installments} cuota(s)): *${adv.status}*`
      );
    }
  }

  return lines.join('\n');
}

/**
 * Formatea las métricas ejecutivas enriquecidas del tenant.
 */
export function formatTenantMetricsMessage(employee, metrics = {}) {
  return (
    `*Resumen Operativo de la Empresa (${employee.tenant?.name || 'Norma ERP'}):*\n\n` +
    `- *Colaboradores Activos:* ${metrics.totalActiveEmployees || 0}\n` +
    `- *Contratos Vigentes:* ${metrics.activeContracts || 0}\n` +
    `- *Marcaciones Registradas Hoy:* ${metrics.totalAttendancesToday || 0}\n` +
    `- *Solicitudes de Ausencia Pendientes:* ${metrics.pendingAbsenceRequests || 0}\n` +
    `- *Anticipos de Sueldo por Aprobar:* ${metrics.pendingSalaryAdvances || 0}\n\n` +
    `_Si desea aprobar o rechazar pendientes desde aqui, escriba:_ *Revisar solicitudes pendientes*`
  );
}
