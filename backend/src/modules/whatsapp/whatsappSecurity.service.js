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
   * Retorna la clave telefónica canónica (solo dígitos internacionales) para indexación multi-tenant en BD.
   * @param {string} rawPhone
   * @returns {string}
   */
  getCanonicalPhoneKey(rawPhone) {
    if (!rawPhone || typeof rawPhone !== 'string') return '';
    const digitsOnly = rawPhone.replace(/[^\d]/g, '');
    if (!digitsOnly) return '';

    if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
      return `593${digitsOnly.substring(1)}`;
    }
    if (digitsOnly.length === 9 && digitsOnly.startsWith('9')) {
      return `593${digitsOnly}`;
    }
    return digitsOnly;
  }

  /**
   * Verifica en tiempo constante el documento de identidad completo (cédula) del colaborador.
   * @param {string} identityCard
   * @param {string} providedCedula
   * @returns {boolean}
   */
  verifyIdentityCard(identityCard, providedCedula) {
    const docDigits = String(identityCard || '').replace(/[^\d]/g, '');
    const candidate = String(providedCedula || '')
      .replace(/[^\d]/g, '')
      .trim();

    if (docDigits.length < 10 || candidate.length < 10) {
      return false;
    }

    const expectedBuffer = Buffer.from(docDigits, 'utf8');
    const providedBuffer = Buffer.from(candidate, 'utf8');

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  }

  /**
   * @deprecated Usar verifyIdentityCard. Mantenido por compatibilidad regresiva.
   * Verifica en tiempo constante los últimos 4 dígitos del documento de identidad del colaborador.
   * @param {string} identityCard
   * @param {string} providedLast4
   * @returns {boolean}
   */
  verifyIdentityLast4(identityCard, providedLast4) {
    const docDigits = String(identityCard || '').replace(/[^\d]/g, '');
    const candidate = String(providedLast4 || '').trim();

    if (docDigits.length < 4 || !/^\d{4}$/.test(candidate)) {
      return false;
    }

    const expectedLast4 = docDigits.slice(-4);
    const expectedBuffer = Buffer.from(expectedLast4, 'utf8');
    const providedBuffer = Buffer.from(candidate, 'utf8');

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  }

  /**
   * Genera un código OTP numérico criptográficamente seguro.
   * @param {number} [length=6]
   * @returns {string}
   */
  generateNumericOtp(length = 6) {
    const min = 10 ** (length - 1);
    const max = 10 ** length;
    return crypto.randomInt(min, max).toString();
  }

  /**
   * Calcula el hash SHA-256 con salt único de sesión para almacenamiento seguro del OTP.
   * @param {string} sessionId
   * @param {string} otpCode
   * @returns {string}
   */
  hashOtp(sessionId, otpCode) {
    return crypto
      .createHash('sha256')
      .update(`whatsapp-otp:${String(sessionId)}:${String(otpCode).trim()}`)
      .digest('hex');
  }

  /**
   * Valida en tiempo constante un código OTP contra su hash almacenado en BD.
   * @param {string} sessionId
   * @param {string} providedOtp
   * @param {string} storedHash
   * @returns {boolean}
   */
  verifyOtpHash(sessionId, providedOtp, storedHash) {
    const candidate = String(providedOtp || '').trim();
    if (!sessionId || !storedHash || !/^\d{6}$/.test(candidate)) {
      return false;
    }

    const expectedHash = this.hashOtp(sessionId, candidate);
    const expectedBuffer = Buffer.from(expectedHash, 'utf8');
    const storedBuffer = Buffer.from(String(storedHash), 'utf8');

    if (expectedBuffer.length !== storedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, storedBuffer);
  }

  /**
   * Enmascara una dirección de correo electrónico para visualización segura (LOPDP).
   * @param {string} email
   * @returns {string}
   */
  maskEmail(email) {
    const value = String(email || '').trim();
    const parts = value.split('@');
    if (parts.length !== 2 || !parts[0]) return '***';

    const local = parts[0];
    const domain = parts[1];
    const visiblePrefix = local.slice(0, Math.min(2, local.length));
    return `${visiblePrefix}***@${domain}`;
  }

  /**
   * Calcula la firma HMAC-SHA256 con formato 'sha256=<hash>' para pruebas o verificación.
   * @param {Buffer|string} rawBody
   * @param {string} [appSecret]
   * @returns {string}
   */
  calculateSignature(rawBody, appSecret) {
    const secret = appSecret || process.env.WHATSAPP_APP_SECRET || '';
    const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return `sha256=${hash}`;
  }

  /**
   * Alias de verificación directa de firma HMAC.
   * @param {Buffer|string} rawBody
   * @param {string} signatureHeader
   * @param {string} [appSecret]
   * @returns {boolean}
   */
  validateSignature(rawBody, signatureHeader, appSecret) {
    return this.verifyWebhookSignature({ rawBody, signatureHeader, appSecret });
  }

  /**
   * Valida la firma criptográfica HMAC-SHA256 del webhook entrante de Meta.
   * Soporta tanto paso de objeto ({ rawBody, signatureHeader, appSecret }) como parámetros posicionales (rawBody, signatureHeader, appSecret).
   * @param {Object|Buffer|string} rawBodyOrParams Buffer/cadena cruda o destructured object.
   * @param {string} [signatureHeaderArg] Cabecera 'x-hub-signature-256' provista por Meta.
   * @param {string} [appSecretArg] Secreto de la aplicación Meta. Si no se provee, lee process.env.WHATSAPP_APP_SECRET.
   * @returns {boolean} True si la firma es válida.
   */
  verifyWebhookSignature(rawBodyOrParams, signatureHeaderArg, appSecretArg) {
    let rawBody;
    let signatureHeader;
    let appSecret;

    if (
      rawBodyOrParams &&
      typeof rawBodyOrParams === 'object' &&
      !Buffer.isBuffer(rawBodyOrParams) &&
      'rawBody' in rawBodyOrParams
    ) {
      rawBody = rawBodyOrParams.rawBody;
      signatureHeader = rawBodyOrParams.signatureHeader;
      appSecret = rawBodyOrParams.appSecret;
    } else {
      rawBody = rawBodyOrParams;
      signatureHeader = signatureHeaderArg;
      appSecret = appSecretArg;
    }

    const secret = appSecret || process.env.WHATSAPP_APP_SECRET;

    // Si no hay appSecret configurado en el entorno ni en argumentos, omitir validación estricta en dev
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
