/**
 * @file whatsappAi.utils.js
 * @description Funciones auxiliares de clasificación de intenciones y formateo de mensajes multi-tenant para WhatsApp AI.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { WHATSAPP_INTENTS } from './whatsapp.constants.js';
import {
  ECUADOR_LEGAL_DOMAIN_SIGNALS,
  NON_LABOR_EXCLUSION_PATTERNS,
} from '../sustainability/index.js';

/**
 * Determina si el texto representa una orden de cancelación o salida de flujo.
 * Soporta variantes móviles como "Cancelar.", "Quiero cancelar", "Cancelar solicitud", "No, cancelar".
 * @param {string} text
 * @returns {boolean}
 */
export function isCancellationCommand(text) {
  const clean = String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:_()-]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  if (!clean) return false;
  return /^(?:(?:hola|buenas|por\s+favor|quiero|deseo|mejor|no|ya\s+no)\s+)*(?:cancelar|anular|salir|abortar)(?:\s+(?:la\s+|el\s+|mi\s+|esta\s+)?(?:solicitud|operacion|proceso|borrador|tramite|todo|por\s+favor|ahora))?$/i.test(
    clean
  );
}

/**
 * Determina si el mensaje normalizado es únicamente un saludo o solicitud de menú/ayuda.
 * @param {string} unaccented
 * @returns {boolean}
 */
function isStandaloneGreetingOrHelp(unaccented) {
  if (
    /^(?:hola|buen(?:os?|as?)\s*(?:dias?|tardes?|noches?)|buenas|saludos|menu|ayuda|opciones|que\s*puedes\s*hacer|como\s*estas?|todo\s*bien)(?:[\s,.;:-]+(?:hola|buen(?:os?|as?)\s*(?:dias?|tardes?|noches?)|buenas|saludos|como\s*estas?|todo\s*bien|norma|asistente|bot|equipo|por\s+favor|gracias|me\s+ayudan?(?:\s+con\s+el\s+menu)?|ayuda|menu|opciones))*$/i.test(
      unaccented
    )
  ) {
    return true;
  }
  return /^(?:ver\s+(?:el\s+)?menu|mostrar\s+menu|necesito\s+ayuda|que\s+opciones\s+hay|que\s+puedes\s+hacer(?:\s+por\s+mi)?)$/i.test(
    unaccented
  );
}

/**
 * Determina si el mensaje corresponde a una consulta informativa (y no a una orden transaccional).
 * @param {string} raw
 * @param {string} coreText Texto sin saludo inicial ni tildes
 * @param {boolean} hasExplicitActionTrigger
 * @returns {boolean}
 */
function detectInformationalInquiry(raw, coreText, hasExplicitActionTrigger) {
  if (
    /\b(como\s+(?:puedo\s+|se\s+)?(?:pedir|solicitar|tramitar|sacar)|requisitos\s+para|puedo\s+(?:pedir|solicitar|sacar|tomar)|que\s+necesito\s+para\s+(?:pedir|solicitar))\b/i.test(
      coreText
    )
  ) {
    return true;
  }
  if (
    /\b(cuant[oa]s?\s+(?:dias|vacaciones|permisos)|saldo\s+de|dias\s+disponibles|vacaciones\s+disponibles|me\s+queda(?:n)?|me\s+corresponde(?:n)?|tengo\s+(?:disponibles?|acumulad[oa]s?|derecho|vacaciones\s+pendientes)|estado\s+de\s+mis?\s+solicitud(?:es)?)\b/i.test(
      coreText
    )
  ) {
    return true;
  }
  if (
    /^(?:cuant[oa]s?|cual(?:es)?|como|que\s+(?:es|son|dice|pasa|requisitos|debo|solicitudes|tramites)|cuando|donde|quisiera\s+(?:saber|consultar|conocer|ver|revisar)|quiero\s+(?:saber|consultar|conocer|ver|revisar|averiguar)|me\s+(?:pueden?|podrian?)\s+(?:decir|informar|indicar|confirmar)|puedo\s+(?:saber|consultar|ver))\b/i.test(
      coreText
    )
  ) {
    return true;
  }
  if (hasExplicitActionTrigger) return false;
  return (
    raw.includes('?') ||
    /\b(saber|consultar|conocer|averiguar|saldo|disponibles?)\b/i.test(coreText)
  );
}

function matchCommandOrGreetingIntent(unaccented) {
  const strippedGreetings = unaccented
    .replace(
      /^(?:hola|buenas|buenos\s+dias|buenas\s+tardes|por\s+favor|estimad[oa]s?|disculpe)\s*[,.:;]?\s*/i,
      ''
    )
    .trim();
  const isRevoke =
    /^(?:revocar(?:\s+(?:consentimiento|lopdp|autorizacion|datos))?|revoco|no\s+acepto|cancelar\s+consentimiento)$/i;
  const isAccept =
    /^(?:acepto|si\s+acepto|acepto\s+(?:terminos|politicas|lopdp|tratamiento)|autorizo(?:\s+el\s+tratamiento)?|de\s+acuerdo)$/i;
  const isSwitch = /^(cambiar\s+(?:de\s+)?empresa|mis\s+empresas|empresas|mi\s+empresa\s+activa)$/i;

  if (isRevoke.test(unaccented) || isRevoke.test(strippedGreetings))
    return WHATSAPP_INTENTS.LOPDP_CONSENT_REVOKE;
  if (isAccept.test(unaccented) || isAccept.test(strippedGreetings))
    return WHATSAPP_INTENTS.LOPDP_CONSENT_ACCEPT;
  if (isSwitch.test(unaccented) || isSwitch.test(strippedGreetings))
    return WHATSAPP_INTENTS.SWITCH_TENANT_COMMAND;
  if (
    /\b(?:nueva\s+consulta|nuevo\s+tema|reiniciar(?:\s+(?:chat|conversacion|contexto))?|olvida(?:r)?\s+(?:lo\s+anterior|el\s+contexto)|borrar\s+(?:historial|contexto)|empezar\s+de\s+nuevo|limpiar\s+contexto)\b/i.test(
      unaccented
    )
  ) {
    return WHATSAPP_INTENTS.RESET_CONVERSATION_COMMAND;
  }
  if (isStandaloneGreetingOrHelp(unaccented)) return WHATSAPP_INTENTS.GENERAL_GREETING;
  if (
    /(?:aprobar|apruebo|rechazar|rechazo|revisar|gestionar)\s+(?:la\s+|el\s+|las\s+|los\s+)?(?:solicitud(?:es)?|pendientes|permisos?|vacaciones|anticipos?)|\b(?:solicitudes\s+pendientes\s+por\s+aprobar|pendientes\s+de\s+aprobacion)\b/i.test(
      unaccented
    )
  ) {
    return WHATSAPP_INTENTS.REVIEW_REQUESTS_ACTION;
  }
  if (
    /(metricas|kpis?|resumen\s+empresa|cuantos\s+empleados|asistencias\s+hoy|total\s+personal)/i.test(
      unaccented
    )
  ) {
    return WHATSAPP_INTENTS.TENANT_METRICS_QUERY;
  }
  return null;
}

/**
 * Evalúa si el texto dispara una habilidad agéntica transaccional (anticipo, permiso o vacaciones).
 */
function matchTransactionalActionIntent(unaccented, isLegalTopic, isInformationalInquiry) {
  if (isLegalTopic || isInformationalInquiry) return null;

  if (
    /(?:solicitar|solicito|pedir|pido|necesito|quiero|deseo|tramitar|tramito|registrar|registro|solicitud\s+de)\b[^.\n]{0,45}\b(?:anticipo|adelanto)\b|\b(?:anticipo|adelanto)\s+(?:de\s+sueldo\s+)?(?:de|por)\s*\$?\s*\d+/i.test(
      unaccented
    )
  ) {
    return WHATSAPP_INTENTS.SALARY_ADVANCE_ACTION;
  }
  if (
    /(?:solicitar|solicito|pedir|pido|reportar|reporto|registrar|registro|necesito|quiero|justificar|justifico)\b[^.\n]{0,45}\b(?:permiso|calamidad|cita\s+medica|licencia)\b|\b(?:permiso\s+medico|calamidad\s+domestica|permiso\s+personal)\s+(?:para|del|el|por|hoy|manana)\b/i.test(
      unaccented
    )
  ) {
    return WHATSAPP_INTENTS.PERMISSION_REQUEST_ACTION;
  }
  if (
    /(?:solicitar|solicito|solicitare|pedir|pido|agendar|agendo|registrar|registro|tomar|tomo|necesito|quiero|deseo|tramitar|tramito|solicitud\s+de)\b[^.\n]{0,45}\bvacacion(?:es)?\b|\bvacacion(?:es)?\s+(?:del|desde|para(?:\s+el|\s+la)?|entre|por\s+\d+\s+dias)\b/i.test(
      unaccented
    )
  ) {
    return WHATSAPP_INTENTS.VACATION_REQUEST_ACTION;
  }
  return null;
}

/**
 * Clasifica la intención del mensaje del usuario a partir del texto y contexto del colaborador.
 * @param {string} text
 * @param {Object|null} employee
 * @returns {string} Código de intención (WHATSAPP_INTENTS)
 */
export function classifyIntent(text, employee) {
  if (!employee) return WHATSAPP_INTENTS.UNKNOWN_SENDER;

  const raw = String(text || '').trim();
  const unaccented = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!]/g, '')
    .trim();

  const commandIntent = matchCommandOrGreetingIntent(unaccented);
  if (commandIntent) return commandIntent;

  const coreText = unaccented
    .replace(
      /^(?:(?:hola|buen(?:os?|as?)\s*(?:dias?|tardes?|noches?)|buenas|saludos|disculp[ae]|estimad[oa]s?|por\s+favor)[\s,.;:-]*)+/i,
      ''
    )
    .trim();

  const hasExplicitActionTrigger =
    /\b(?:solicitar|solicito|solicitare|pedir|pido|agendar|agendo|registrar|registro|tramitar|tramito|reportar|reporto|justificar|justifico|(?:quiero|deseo|necesito|requiero)\s+(?:pedir|solicitar|sacar|tomar|registrar|tramitar|reportar|justificar|un\s+permiso|un\s+anticipo|un\s+adelanto|vacaciones|permiso|licencia))\b/i.test(
      coreText
    );
  const isStrictStatutoryCitation =
    /(codigo\s+del\s+trabajo|ley\s+organica|constitucion|articulo\s+\d|art\.\s*\d|sri\b|lopdp|segun\s+la\s+ley|que\s+dice\s+(?:el\s+codigo|la\s+ley))/i.test(
      unaccented
    );
  const isLegalTopic =
    isStrictStatutoryCitation || (!hasExplicitActionTrigger && /\bpor\s+ley\b/i.test(unaccented));
  const isInformationalInquiry = detectInformationalInquiry(
    raw,
    coreText,
    hasExplicitActionTrigger
  );

  const isExcludedNonLabor = NON_LABOR_EXCLUSION_PATTERNS.test(unaccented);
  if (isExcludedNonLabor) return WHATSAPP_INTENTS.OUT_OF_SCOPE_QUERY;

  const actionIntent = matchTransactionalActionIntent(
    unaccented,
    isLegalTopic,
    isInformationalInquiry
  );
  if (actionIntent) return actionIntent;

  if (
    !isLegalTopic &&
    /(mi\s+rol|rol\s+de\s+pagos|ultimo\s+rol|cuanto\s+cobre|neto\s+a\s+recibir|mi\s+recibo\s+de\s+pago)/i.test(
      unaccented
    )
  ) {
    return WHATSAPP_INTENTS.PAYROLL_SLIP_QUERY;
  }
  if (
    !isLegalTopic &&
    /\b(?:que\s+solicitud(?:es)?\s+tengo|solicitud(?:es)?\s+(?:tengo|activas?|pendientes?|realizadas?)|(?:mi|mis|mis\s+ultim[ao]s?)\s+solicitud(?:es)?|^solicitudes$|estado\s+de\s+(?:mis?\s+)?(?:solicitud(?:es)?|tramites?)|mis\s+tramites?|tramites?\s+(?:activos?|pendientes?))\b/i.test(
      unaccented
    )
  ) {
    return WHATSAPP_INTENTS.EMPLOYEE_REQUESTS_QUERY;
  }
  if (
    !isLegalTopic &&
    /\b(?:mis?\s+(?:dias\s+de\s+)?vacaciones|(?:tengo\s+)?vacaciones\s+(?:tengo|me\s+quedan|disponibles?|pendientes?|acumulad[oa]s?)|cuant[oa]s?\s+(?:dias\s+de\s+)?vacaciones|saldo\s+de\s+vacaciones|cuantos?\s+dias\s+(?:de\s+vacaciones\s+)?(?:tengo|me\s+quedan)|mi\s+asistencia|marque\s+(?:hoy|entrada|salida)|hora\s+de\s+(?:entrada|salida)|mi\s+perfil|mi\s+cargo|mi\s+departamento)\b/i.test(
      unaccented
    )
  ) {
    return WHATSAPP_INTENTS.EMPLOYEE_QUERY;
  }

  const isLaborTopic =
    isLegalTopic ||
    ECUADOR_LEGAL_DOMAIN_SIGNALS.test(unaccented) ||
    /\b(despido|liquidacion|finiquito|indemnizacion(?:es)?|desahucio|bonificacion(?:es)?|remuneracion(?:es)?|visto\s+bueno|horas?\s+extras?|horas?\s+suplementarias?|recargo\s+nocturno|decimo\s+tercer[oa]?|decimo\s+cuart[oa]?|utilidades|fondos?\s+de\s+reserva|jubilacion|pension|maternidad|paternidad|lactancia|jornada\s+laboral|renuncia|acoso\s+laboral|salario\s+basico|sbu|descuentos?\s+de\s+ley|iess|seguro\s+social|seguridad\s+social|contrato\s+laboral|contrato\s+de\s+trabajo|afiliacion|patronal|empleador|trabajador|me\s+pueden\s+despedir|puedo\s+renunciar|que\s+pasa\s+si\s+falto|que\s+pasa\s+si\s+me\s+enfermo|cuantas\s+horas\s+debo\s+trabajar|tengo\s+derecho|derechos?\s+del\s+trabajador|obligaciones\s+del\s+empleador|como\s+se\s+calcula\s+la\s+liquidacion|prueba\s+de\s+trabajo|periodo\s+de\s+prueba)\b/i.test(
      unaccented
    );

  if (isLaborTopic) return WHATSAPP_INTENTS.LEGAL_QUERY;
  if (
    /(vacacion|saldo|mis?\s+dias|asistencia|marque|marcar|entrada|salida|mi\s+perfil|mi\s+cargo|mi\s+departamento)/i.test(
      unaccented
    )
  ) {
    return WHATSAPP_INTENTS.EMPLOYEE_QUERY;
  }
  return WHATSAPP_INTENTS.OUT_OF_SCOPE_QUERY;
}

export function formatGreetingMessage(employee) {
  const companyName = employee.tenant?.name ? ` de *${employee.tenant.name}*` : '';
  const role = String(employee.role || '').toLowerCase();
  const isManagerial = ['admin', 'hr', 'manager', 'entrepreneur', 'superadmin'].includes(role);
  const managerSection = isManagerial
    ? `\n*Funciones Directivas (${employee.role}):*\n- *Aprobar solicitudes:* "Revisar solicitudes pendientes"\n- *KPIs del tenant:* "Metricas de la empresa"\n`
    : '';

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

export function formatPayrollAndRequestsMessage(employee, data = {}) {
  const { latestPayrollDetail, recentAbsences = [], recentAdvances = [] } = data;
  const lines = [`*Estado de Nomina y Solicitudes en ${employee.tenant?.name || 'Norma ERP'}:*`];

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
      lines.push(
        `- ${abs.type} (${new Date(abs.startDate).toISOString().slice(0, 10)} al ${new Date(abs.endDate).toISOString().slice(0, 10)}): *${abs.status}*`
      );
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

export function formatEmployeeRequestsMessage(employee, data = {}) {
  const { recentAbsences = [], recentAdvances = [] } = data;
  const lines = [`*Estado de Solicitudes en ${employee.tenant?.name || 'Norma ERP'}:*`];

  if (!recentAbsences.length && !recentAdvances.length) {
    lines.push(
      `\nNo registra solicitudes activas ni pendientes en este momento.`,
      `\nPuede solicitar vacaciones escribiendo: *"Quiero pedir vacaciones"* o un anticipo con: *"Solicito anticipo de $100"*`
    );
    return lines.join('\n');
  }
  if (recentAbsences.length > 0) {
    lines.push(`\n*Solicitudes de Ausencia / Vacaciones:*`);
    for (const abs of recentAbsences) {
      const daysNote = abs.daysRequested ? ` (${abs.daysRequested} días)` : '';
      lines.push(
        `- *${abs.type}* (${new Date(abs.startDate).toISOString().slice(0, 10)} al ${new Date(abs.endDate).toISOString().slice(0, 10)})${daysNote}: *${abs.status}*`
      );
    }
  }
  if (recentAdvances.length > 0) {
    lines.push(`\n*Anticipos de Sueldo:*`);
    for (const adv of recentAdvances) {
      lines.push(
        `- *Anticipo de $${Number(adv.amount).toFixed(2)}* (${adv.installments} cuota(s)): *${adv.status}*`
      );
    }
  }
  return lines.join('\n');
}

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

export function formatEmployeeProfileFallback(employee, checkIn, checkOut) {
  return (
    `*Información de su perfil en Norma ERP:*\n\n` +
    `- *Colaborador:* ${employee.firstName} ${employee.lastName}\n` +
    `- *Empresa:* ${employee.tenant?.name || 'N/A'}\n` +
    `- *Departamento:* ${employee.department}\n` +
    `- *Cargo:* ${employee.position}\n` +
    `- *Saldo de Vacaciones:* ${employee.vacationDays} días disponibles\n` +
    `- *Marcación de hoy:* Entrada: ${checkIn} | Salida: ${checkOut}`
  );
}

export function formatSwitchTenantInfo(employee) {
  const rucInfo = employee.tenant?.ruc ? ` (RUC: ${employee.tenant.ruc})` : '';
  return `*Empresa Activa Actual:* ${employee.tenant?.name || 'Norma ERP'}${rucInfo}\n- *Rol:* ${employee.role || 'employee'} | *Dpto:* ${employee.department || 'General'}\n\nSu numero telefonico opera sobre esta empresa. Si opera en multiples RUC, escriba *CAMBIAR EMPRESA*.`;
}

export function resolveAiProviderConfig(overrides = {}) {
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

  const isGemini = requestedProvider === 'gemini';
  return {
    provider: isGemini ? 'gemini' : 'deepseek',
    apiKey:
      overrides.apiKey || (isGemini ? process.env.GEMINI_API_KEY : process.env.DEEPSEEK_API_KEY),
    model:
      overrides.model ||
      (isGemini
        ? process.env.GEMINI_MODEL || 'gemini-2.5-flash'
        : process.env.DEEPSEEK_MODEL || 'deepseek-chat'),
    temperature: 0.0,
  };
}
