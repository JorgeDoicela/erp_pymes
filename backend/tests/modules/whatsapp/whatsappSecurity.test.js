/**
 * @file whatsappSecurity.test.js
 * @description Pruebas unitarias de seguridad, normalización telefónica, HMAC y control de idempotencia para WhatsApp.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import { WhatsappSecurityService } from '../../../src/modules/whatsapp/whatsappSecurity.service.js';

describe('WhatsApp Security & Utility Suite', () => {
  let securityService;

  beforeEach(() => {
    securityService = new WhatsappSecurityService();
  });

  describe('1. Normalización de Variantes Telefónicas', () => {
    it('debe generar variantes completas para número en formato internacional de Ecuador (5939XXXXXXXX)', () => {
      const variants = securityService.normalizePhoneNumberVariants('593987654321');

      expect(variants).toContain('593987654321');
      expect(variants).toContain('+593987654321');
      expect(variants).toContain('0987654321');
      expect(variants).toContain('987654321');
    });

    it('debe generar variantes a partir de formato nacional local (0987654321)', () => {
      const variants = securityService.normalizePhoneNumberVariants('0987654321');

      expect(variants).toContain('0987654321');
      expect(variants).toContain('593987654321');
      expect(variants).toContain('+593987654321');
      expect(variants).toContain('987654321');
    });

    it('debe limpiar caracteres especiales como espacios, guiones y paréntesis', () => {
      const variants = securityService.normalizePhoneNumberVariants('+593 (9) 876-54321');

      expect(variants).toContain('593987654321');
      expect(variants).toContain('0987654321');
    });

    it('debe retornar arreglo vacío ante entradas nulas o vacías', () => {
      expect(securityService.normalizePhoneNumberVariants('')).toEqual([]);
      expect(securityService.normalizePhoneNumberVariants(null)).toEqual([]);
      expect(securityService.normalizePhoneNumberVariants(undefined)).toEqual([]);
    });
  });

  describe('2. Validación Criptográfica de Firma HMAC-SHA256 de Meta', () => {
    const testSecret = 'secret_key_for_testing_meta_webhook_123';
    const testPayload = JSON.stringify({ object: 'whatsapp_business_account', test: true });

    it('debe validar exitosamente cuando la firma HMAC coincide con el payload y el secreto', () => {
      const signatureHash = crypto
        .createHmac('sha256', testSecret)
        .update(testPayload)
        .digest('hex');

      const isValid = securityService.verifyWebhookSignature({
        rawBody: testPayload,
        signatureHeader: `sha256=${signatureHash}`,
        appSecret: testSecret,
      });

      expect(isValid).toBe(true);
    });

    it('debe rechazar cuando el cuerpo fue alterado después de la firma', () => {
      const signatureHash = crypto
        .createHmac('sha256', testSecret)
        .update(testPayload)
        .digest('hex');

      const tamperedPayload = JSON.stringify({ object: 'whatsapp_business_account', test: false });

      const isValid = securityService.verifyWebhookSignature({
        rawBody: tamperedPayload,
        signatureHeader: `sha256=${signatureHash}`,
        appSecret: testSecret,
      });

      expect(isValid).toBe(false);
    });

    it('debe rechazar cuando la firma provista no tiene formato sha256=', () => {
      const isValid = securityService.verifyWebhookSignature({
        rawBody: testPayload,
        signatureHeader: 'invalid_format_without_prefix',
        appSecret: testSecret,
      });

      expect(isValid).toBe(false);
    });

    it('debe permitir la ejecución si no hay secreto de app configurado (modo desarrollo)', () => {
      const isValid = securityService.verifyWebhookSignature({
        rawBody: testPayload,
        signatureHeader: 'sha256=abcdef',
        appSecret: '',
      });

      expect(isValid).toBe(true);
    });
  });

  describe('3. Control de Idempotencia y Prevención de Duplicados', () => {
    it('debe marcar el primer intento como no duplicado y el segundo como duplicado', () => {
      const messageId = 'wamid.HBgLMzU1MTIzNDU2NxUCMRIA';

      const firstCheck = securityService.isDuplicateMessage(messageId);
      const secondCheck = securityService.isDuplicateMessage(messageId);

      expect(firstCheck).toBe(false);
      expect(secondCheck).toBe(true);
    });

    it('debe tratar mensajes con IDs distintos de forma independiente', () => {
      const msg1 = 'wamid.MSG1';
      const msg2 = 'wamid.MSG2';

      expect(securityService.isDuplicateMessage(msg1)).toBe(false);
      expect(securityService.isDuplicateMessage(msg2)).toBe(false);
    });
  });

  describe('4. Rate Limiting por Número Telefónico', () => {
    it('debe permitir peticiones dentro del límite establecido', () => {
      const phone = '593987654321';

      for (let i = 0; i < 5; i++) {
        expect(securityService.checkRateLimit(phone)).toBe(true);
      }
    });

    it('debe bloquear peticiones cuando se excede la tasa máxima por minuto', () => {
      const phone = '593999999999';

      // Agotar la cuota de 15 peticiones
      for (let i = 0; i < 15; i++) {
        securityService.checkRateLimit(phone);
      }

      // La petición 16 debe ser rechazada
      expect(securityService.checkRateLimit(phone)).toBe(false);
    });
  });

  describe('5. Verificación Criptográfica de Identidad por Cédula', () => {
    it('debe validar la cédula completa en tiempo constante ignorando caracteres no numéricos', () => {
      expect(securityService.verifyIdentityCard('1718293045', '1718293045')).toBe(true);
      expect(securityService.verifyIdentityCard('171829304-5', '1718293045')).toBe(true);
      expect(securityService.verifyIdentityCard('1718293045', '171829304-5')).toBe(true);
      expect(securityService.verifyIdentityCard('1718293045', '1718293046')).toBe(false);
      expect(securityService.verifyIdentityCard('1718293045', '3045')).toBe(false);
      expect(securityService.verifyIdentityCard(null, '1718293045')).toBe(false);
      expect(securityService.verifyIdentityCard('1718293045', null)).toBe(false);
    });

    it('debe mantener compatibilidad con verifyIdentityLast4', () => {
      expect(securityService.verifyIdentityLast4('1718293045', '3045')).toBe(true);
      expect(securityService.verifyIdentityLast4('1718293045', '9999')).toBe(false);
    });
  });
});
