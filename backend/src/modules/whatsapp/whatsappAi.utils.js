/**
 * @file whatsappAi.utils.js
 * @description Funciones auxiliares de clasificación de intenciones y formateo de mensajes para WhatsApp AI.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { WHATSAPP_INTENTS } from './whatsapp.constants.js';

/**
 * Clasifica la intención del mensaje del usuario a partir del texto y palabras clave.
 * @param {string} text
 * @param {Object|null} employee
 * @returns {string} Código de intención (WHATSAPP_INTENTS)
 */
export function classifyIntent(text, employee) {
  if (!employee) {
    return WHATSAPP_INTENTS.UNKNOWN_SENDER;
  }

  const lower = String(text || '')
    .toLowerCase()
    .trim();

  // 1. Saludos y solicitudes de ayuda
  if (
    /^(hola|buen(os)?\s*(dias|tardes|noches)|saludos|menu|ayuda|opciones|que\s*puedes\s*hacer)\b/i.test(
      lower
    )
  ) {
    return WHATSAPP_INTENTS.GENERAL_GREETING;
  }

  // 2. Consultas sobre métricas empresariales (KPIs)
  if (
    /(metricas|kpis?|resumen\s+empresa|cuantos\s+empleados|asistencias\s+hoy|total\s+personal)/i.test(
      lower
    )
  ) {
    return WHATSAPP_INTENTS.TENANT_METRICS_QUERY;
  }

  // 3. Habilidad agéntica: solicitud transaccional de vacaciones
  const isLegalTopic =
    /(codigo\s+del\s+trabajo|ley\s+organica|constitucion|articulo|art\.|iess|sri|lopdp|segun\s+la\s+ley|que\s+dice\s+(?:el\s+codigo|la\s+ley))/i.test(
      lower
    );
  const isPersonalBalanceQuestion = /^(cuant[oa]s?|cual\s+es\s+mi|tengo)\b/i.test(lower);

  if (
    !isLegalTopic &&
    !isPersonalBalanceQuestion &&
    (/(?:solicitar|pedir|agendar|registrar|tomar|necesito|quiero|deseo|tramitar|solicitud\s+de)\b[^.\n]{0,45}\bvacacion(?:es)?\b/i.test(
      lower
    ) ||
      /\bvacacion(?:es)?\s+(?:del|desde|para\s+el|entre)\b/i.test(lower))
  ) {
    return WHATSAPP_INTENTS.VACATION_REQUEST_ACTION;
  }

  // 4. Consultas legales explícitas
  if (isLegalTopic) {
    return WHATSAPP_INTENTS.LEGAL_QUERY;
  }

  // 5. Consultas personales del colaborador
  if (
    /(vacacion|saldo|mis?\s+dias|asistencia|marque|marcar|entrada|salida|mi\s+perfil|mi\s+cargo|mi\s+departamento)/i.test(
      lower
    )
  ) {
    return WHATSAPP_INTENTS.EMPLOYEE_QUERY;
  }

  // 6. Consultas legales y normativas generales
  if (
    /(despido|renuncia|liquidacion|desahucio|horas?\s+extra|decimo|utilidades|jubilacion|maternidad|paternidad|finiquito)/i.test(
      lower
    )
  ) {
    return WHATSAPP_INTENTS.LEGAL_QUERY;
  }

  return WHATSAPP_INTENTS.LEGAL_QUERY;
}

/**
 * Formatea el mensaje de bienvenida y menú de opciones para WhatsApp.
 * @param {Object} employee
 * @returns {string}
 */
export function formatGreetingMessage(employee) {
  const companyName = employee.tenant?.name ? ` de *${employee.tenant.name}*` : '';
  return (
    `Hola ${employee.firstName}, bienvenido(a) al Asistente Corporativo de Norma ERP${companyName}.\n\n` +
    `Puede consultarme o gestionar directamente por este chat:\n` +
    `- *Mis vacaciones:* "¿Cuantos dias de vacaciones tengo disponibles?"\n` +
    `- *Pedir vacaciones:* "Quiero pedir vacaciones del 2026-11-20 al 2026-11-24 por viaje familiar"\n` +
    `- *Mi marcacion:* "¿A que hora marque hoy?"\n` +
    `- *Consultas legales:* "Como se calculan las horas extraordinarias segun el Art. 55?" o "¿Cual es la liquidacion por despido intempestivo?"\n` +
    `- *Seguridad Social:* "Requisitos para jubilacion ordinaria IESS."\n\n` +
    `Escriba su consulta en cualquier momento para responderle.`
  );
}
