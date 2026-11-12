/**
 * @file whatsappSecurity.service.js
 * @description Capa de seguridad, normalización telefónica, idempotencia y validación criptográfica de webhooks de Meta.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import crypto from 'crypto';

export class WhatsappSecurityService {
  constructor() {
    // Cache de idempotencia en memoria: messageId -> timestamp
    this.processedMessageIds = new Map();
    // Cache de rate limit: phone -> [timestamps]
    this.rateLimitMap = new Map();
    // Periodo de retención de idempotencia (15 minutos)
    this.IDEMPOTENCY_TTL_MS = 15 * 60 * 1000;
    // Límite de mensajes por ventana: 15 mensajes por minuto por teléfono
    this.MAX_REQUESTS_PER_MINUTE = 15;
    this.RATE_LIMIT_WINDOW_MS = 60 * 1000;

    // Limpieza periódica cada 10 minutos
    this.cleanupTimer = setInterval(() => this.cleanupExpiredEntries(), 10 * 60 * 1000);
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Normaliza un número telefónico a variantes canónicas de búsqueda en base de datos.
   * Por ejemplo: '593987654321' produce variantes ['593987654321', '+593987654321', '0987654321', '987654321'].
   * @param {string} rawPhone
   * @returns {string[]} Lista de variantes ordenadas para búsqueda en base de datos.
   */
  normalizePhoneNumberVariants(rawPhone) {
    if (!rawPhone || typeof rawPhone !== 'string') {
      return [];
    }

    // Remover caracteres no numéricos excepto el prefijo '+'
    const clean = rawPhone.trim().replace(/[^\d+]/g, '');
    const digitsOnly = clean.replace(/\+/g, '');

    const variants = new Set();
    if (clean) variants.add(clean);
    if (digitsOnly) variants.add(digitsOnly);

    // Detección de formato Ecuador (código de país 593)
    if (digitsOnly.startsWith('593') && digitsOnly.length >= 11) {
      const nationalWithoutCountry = digitsOnly.substring(3); // ej: 987654321
      variants.add(nationalWithoutCountry);
      variants.add(`0${nationalWithoutCountry}`); // ej: 0987654321
      variants.add(`+${digitsOnly}`); // ej: +593987654321
    } else if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
      const nationalWithoutZero = digitsOnly.substring(1); // ej: 987654321
      variants.add(nationalWithoutZero);
      variants.add(`593${nationalWithoutZero}`);
      variants.add(`+593${nationalWithoutZero}`);
    } else if (digitsOnly.length === 9 && digitsOnly.startsWith('9')) {
      variants.add(`0${digitsOnly}`);
      variants.add(`593${digitsOnly}`);
      variants.add(`+593${digitsOnly}`);
    }

    return Array.from(variants);
  }

  /**
   * Valida la firma criptográfica HMAC-SHA256 del webhook entrante de Meta.
   * @param {Object} params
   * @param {Buffer|string} params.rawBody Buffer o cadena cruda del cuerpo HTTP.
   * @param {string} params.signatureHeader Cabecera 'x-hub-signature-256' provista por Meta.
   * @param {string} [params.appSecret] Secreto de la aplicación Meta. Si no se provee, lee process.env.WHATSAPP_APP_SECRET.
   * @returns {boolean} True si la firma es válida o si no se requiere verificación estricta.
   */
  verifyWebhookSignature({ rawBody, signatureHeader, appSecret }) {
    const secret = appSecret || process.env.WHATSAPP_APP_SECRET;

    // Si no hay appSecret configurado en el entorno, omitir validación estricta permitiendo desarrollo flexible
    if (!secret) {
      return true;
    }

    if (!signatureHeader || !rawBody) {
      return false;
    }

    try {
      const parts = signatureHeader.split('=');
      if (parts.length !== 2 || parts[0] !== 'sha256') {
        return false;
      }

      const receivedHash = parts[1];
      const expectedHash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

      const receivedBuffer = Buffer.from(receivedHash, 'utf8');
      const expectedBuffer = Buffer.from(expectedHash, 'utf8');

      if (receivedBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Comprueba si un ID de mensaje ya fue procesado para garantizar idempotencia.
   * @param {string} messageId Identificador único del mensaje de Meta (wamid).
   * @returns {boolean} True si el mensaje ya fue procesado previamente.
   */
  isDuplicateMessage(messageId) {
    if (!messageId) return false;

    const now = Date.now();
    if (this.processedMessageIds.has(messageId)) {
      return true;
    }

    this.processedMessageIds.set(messageId, now);
    return false;
  }

  /**
   * Aplica control de tasa de peticiones (Rate Limit) por número de teléfono.
   * @param {string} phone
   * @returns {boolean} True si está dentro del límite permitido; False si ha excedido la tasa.
   */
  checkRateLimit(phone) {
    if (!phone) return true;

    const now = Date.now();
    const timestamps = this.rateLimitMap.get(phone) || [];
    const validTimestamps = timestamps.filter((t) => now - t < this.RATE_LIMIT_WINDOW_MS);

    if (validTimestamps.length >= this.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }

    validTimestamps.push(now);
    this.rateLimitMap.set(phone, validTimestamps);
    return true;
  }

  /**
   * Limpia registros vencidos de la memoria.
   * @private
   */
  cleanupExpiredEntries() {
    const now = Date.now();

    for (const [id, timestamp] of this.processedMessageIds.entries()) {
      if (now - timestamp > this.IDEMPOTENCY_TTL_MS) {
        this.processedMessageIds.delete(id);
      }
    }

    for (const [phone, timestamps] of this.rateLimitMap.entries()) {
      const valid = timestamps.filter((t) => now - t < this.RATE_LIMIT_WINDOW_MS);
      if (valid.length === 0) {
        this.rateLimitMap.delete(phone);
      } else {
        this.rateLimitMap.set(phone, valid);
      }
    }
  }
}

const whatsappSecurityService = new WhatsappSecurityService();
export default whatsappSecurityService;
