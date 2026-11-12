/**
 * @file whatsappService.test.js
 * @description Pruebas unitarias para el servicio orquestador de WhatsApp y Webhooks de Meta.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhatsappService } from '../../../src/modules/whatsapp/whatsapp.service.js';

describe('WhatsApp Service & Webhook Orchestrator Suite', () => {
  let mockClient;
  let mockSecurity;
  let mockRepo;
  let mockAi;
  let service;

  beforeEach(() => {
    mockClient = {
      sendTextMessage: vi.fn().mockResolvedValue({ success: true }),
      markMessageAsRead: vi.fn().mockResolvedValue(true),
      resolveConfig: vi.fn().mockReturnValue({ isConfigured: true, phoneNumberId: '123456789' }),
    };
    mockSecurity = {
      verifyWebhookSignature: vi.fn().mockReturnValue(true),
      normalizePhoneNumberVariants: vi.fn().mockReturnValue(['593987654321', '0987654321']),
      isDuplicateMessage: vi.fn().mockReturnValue(false),
      checkRateLimit: vi.fn().mockReturnValue(true),
    };
    mockRepo = {
      findEmployeeByPhoneVariants: vi.fn(),
      getEmployeeAttendanceToday: vi.fn(),
      getTenantSummaryMetrics: vi.fn(),
    };
    mockAi = {
      generateResponse: vi.fn().mockResolvedValue('Respuesta generada por IA.'),
      resolveAiProviderConfig: vi
        .fn()
        .mockReturnValue({ provider: 'deepseek', model: 'deepseek-chat' }),
    };

    service = new WhatsappService(mockClient, mockSecurity, mockRepo, mockAi);
  });

  describe('1. Verificación del Desafío de Webhook (Meta GET Handshake)', () => {
    it('debe responder con el challenge cuando el token coincide', () => {
      const originalEnv = process.env.WHATSAPP_VERIFY_TOKEN;
      process.env.WHATSAPP_VERIFY_TOKEN = 'secret_verify_token_123';

      const result = service.verifyWebhookChallenge({
        mode: 'subscribe',
        token: 'secret_verify_token_123',
        challenge: 'meta_challenge_code_999',
      });

      expect(result.success).toBe(true);
      expect(result.challenge).toBe('meta_challenge_code_999');

      process.env.WHATSAPP_VERIFY_TOKEN = originalEnv;
    });

    it('debe rechazar cuando el token no coincide', () => {
      const originalEnv = process.env.WHATSAPP_VERIFY_TOKEN;
      process.env.WHATSAPP_VERIFY_TOKEN = 'secret_verify_token_123';

      const result = service.verifyWebhookChallenge({
        mode: 'subscribe',
        token: 'wrong_token',
        challenge: 'meta_challenge_code_999',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('VERIFICATION_TOKEN_MISMATCH');

      process.env.WHATSAPP_VERIFY_TOKEN = originalEnv;
    });
  });

  describe('2. Procesamiento de Eventos de Mensajes Entrantes (Meta POST Webhook)', () => {
    it('debe ignorar eventos que no sean de tipo mensaje (ej. confirmación de entrega)', async () => {
      const deliveryPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                field: 'messages',
                value: {
                  statuses: [{ id: 'wamid.123', status: 'delivered' }],
                },
              },
            ],
          },
        ],
      };

      const result = await service.processWebhookEvent({ body: deliveryPayload });

      expect(result.success).toBe(true);
      expect(result.messageCount).toBe(0);
      expect(mockAi.generateResponse).not.toHaveBeenCalled();
    });

    it('debe procesar un mensaje entrante de texto, buscar al colaborador y responder por WhatsApp', async () => {
      const incomingPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                field: 'messages',
                value: {
                  messages: [
                    {
                      from: '593987654321',
                      id: 'wamid.MSG_100',
                      timestamp: '1710000000',
                      type: 'text',
                      text: { body: 'Hola, cuantos dias de vacaciones tengo?' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const mockEmployee = {
        id: 'emp-10',
        firstName: 'Diana',
        lastName: 'Perez',
        phone: '0987654321',
        vacationDays: 15,
      };

      mockRepo.findEmployeeByPhoneVariants.mockResolvedValueOnce(mockEmployee);
      mockAi.generateResponse.mockResolvedValueOnce(
        '*Hola Diana*, tienes 15 dias de vacaciones disponibles.'
      );

      const result = await service.processWebhookEvent({ body: incomingPayload });

      expect(result.success).toBe(true);
      expect(result.messageCount).toBe(1);

      // Esperar brevemente a que las promesas asíncronas se resuelvan
      await new Promise((r) => setTimeout(r, 50));

      expect(mockSecurity.isDuplicateMessage).toHaveBeenCalledWith('wamid.MSG_100');
      expect(mockSecurity.normalizePhoneNumberVariants).toHaveBeenCalledWith('593987654321');
      expect(mockRepo.findEmployeeByPhoneVariants).toHaveBeenCalledWith([
        '593987654321',
        '0987654321',
      ]);
      expect(mockAi.generateResponse).toHaveBeenCalledWith({
        text: 'Hola, cuantos dias de vacaciones tengo?',
        employee: mockEmployee,
      });
      expect(mockClient.sendTextMessage).toHaveBeenCalledWith({
        to: '593987654321',
        text: '*Hola Diana*, tienes 15 dias de vacaciones disponibles.',
      });
    });

    it('debe rechazar el procesamiento si la firma HMAC es inválida', async () => {
      mockSecurity.verifyWebhookSignature.mockReturnValueOnce(false);

      const result = await service.processWebhookEvent({
        body: { object: 'whatsapp_business_account' },
        rawBody: '{"tampered":true}',
        signatureHeader: 'sha256=invalid',
      });

      expect(result.success).toBe(false);
      expect(result.reason).toBe('INVALID_SIGNATURE');
    });
  });

  describe('3. Diagnóstico de Estado del Módulo', () => {
    it('debe devolver un resumen del estado de configuración de WhatsApp y de los modelos de IA', () => {
      const status = service.getDiagnosticStatus();

      expect(status).toHaveProperty('whatsapp');
      expect(status).toHaveProperty('ai');
      expect(status.whatsapp.isConfigured).toBe(true);
      expect(status.ai.activeProvider).toBe('deepseek');
    });
  });
});
