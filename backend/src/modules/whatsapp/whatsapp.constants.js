/**
 * @file whatsapp.constants.js
 * @description Constantes operativas, plantillas y configuraciones para el Asistente WhatsApp de Norma ERP.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

export const META_GRAPH_API_VERSION = 'v21.0';
export const META_GRAPH_BASE_URL = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

export const WHATSAPP_INTENTS = {
  LEGAL_QUERY: 'LEGAL_QUERY',
  EMPLOYEE_QUERY: 'EMPLOYEE_QUERY',
  VACATION_REQUEST_ACTION: 'VACATION_REQUEST_ACTION',
  TENANT_METRICS_QUERY: 'TENANT_METRICS_QUERY',
  GENERAL_GREETING: 'GENERAL_GREETING',
  UNKNOWN_SENDER: 'UNKNOWN_SENDER',
};

export const WHATSAPP_SYSTEM_PROMPT = `Eres el Asistente Corporativo de Norma ERP para WhatsApp.
Tu misión es resolver consultas de colaboradores y directivos sobre:
1. Normativa laboral y tributaria de Ecuador (Código del Trabajo, IESS, SRI, Ley Orgánica de Protección de Datos).
2. Estado personal del colaborador dentro de la empresa (saldo de vacaciones, última marcación de asistencia, departamento y cargo).
3. Gestión agéntica segura de solicitudes de vacaciones (con validación de saldo, último 4 dígitos de cédula y código OTP por correo).
4. Indicadores empresariales (únicamente para directores o administradores autorizados).

Reglas de formato y estilo obligatorias para WhatsApp:
- Sé conciso, profesional y directo. Evita introducciones innecesarias o saludos redundantes.
- Utiliza formato nativo de WhatsApp: *negrita* para títulos o artículos, _cursiva_ para términos técnicos o notas, y guiones (-) para listas.
- NUNCA uses Markdown complejo como tablas con pipes (|) ni encabezados de tipo almohadilla (###), ya que WhatsApp no los renderiza adecuadamente.
- Prohibido el uso de emojis en todas las respuestas.
- Cuando cites leyes ecuatorianas, menciona siempre el número de artículo exacto y el cuerpo legal oficial.
- Responde siempre en español.`;

export const UNREGISTERED_PHONE_MESSAGE = `Estimado usuario, el numero telefonico desde el cual escribe no se encuentra registrado en el sistema Norma ERP.

Para acceder a las consultas de su empresa, solicite al departamento de Gestion del Talento Humano que registre o actualice su numero celular en su ficha de colaborador.`;

export const NON_TEXT_MEDIA_FALLBACK = `Por el momento, el Asistente Norma ERP procesa unicamente mensajes de texto. Por favor escriba su consulta por escrito.`;

export const RATE_LIMIT_EXCEEDED_MESSAGE = `Ha superado el limite de consultas por minuto. Por favor espere unos instantes antes de enviar un nuevo mensaje.`;

export const GENERAL_ERROR_MESSAGE = `En este momento el servicio de consultas de Norma ERP experimento una interrupcion temporal. Por favor intente nuevamente en unos minutos.`;

/**
 * Limpia y adapta Markdown a los estándares visuales de WhatsApp (*negrita*, _cursiva_, sin tablas ni ###).
 * @param {string} rawText
 * @returns {string}
 */
export function cleanTextForWhatsapp(rawText) {
  if (!rawText) return '';

  return rawText
    .replace(/^#{1,6}\s*(.+)$/gm, '*$1*')
    .replace(/\*\*(.+?)\*\*/g, '*$1*')
    .replace(/\|(.+)\|/g, (match) => {
      const parts = match
        .split('|')
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length === 0 || parts.every((p) => /^[-:]+$/.test(p))) return '';
      return `- ${parts.join(' : ')}`;
    })
    .replace(/```[a-z]*\n([\s\S]*?)```/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
