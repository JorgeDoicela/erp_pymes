/**
 * @file whatsappClient.test.js
 * @description Pruebas unitarias para el cliente HTTP de Meta WhatsApp Cloud API.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhatsappClientService } from '../../../src/modules/whatsapp/whatsappClient.service.js';

describe('WhatsApp Client Service Suite', () => {
  let mockHttpClient;
  let clientService;

  beforeEach(() => {
    mockHttpClient = {
      post: vi.fn(),
    };
    clientService = new WhatsappClientService(mockHttpClient);
  });

  describe('1. Resolución de Configuración', () => {
    it('debe detectar correctamente cuando las credenciales no están presentes', () => {
      const config = clientService.resolveConfig({
        phoneNumberId: '',
        accessToken: '',
      });

      expect(config.isConfigured).toBe(false);
    });

    it('debe resolver credenciales válidas cuando se proveen explícitamente', () => {
      const config = clientService.resolveConfig({
        phoneNumberId: '10987654321',
        accessToken: 'EAATestToken123',
      });

      expect(config.isConfigured).toBe(true);
      expect(config.phoneNumberId).toBe('10987654321');
      expect(config.accessToken).toBe('EAATestToken123');
    });
  });

  describe('2. Despacho de Mensajes de Texto', () => {
    it('debe retornar error amigable si las credenciales no están configuradas', async () => {
      const result = await clientService.sendTextMessage({
        to: '593987654321',
        text: 'Hola',
        configOverrides: { phoneNumberId: '', accessToken: '' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('CREDENTIALS_NOT_CONFIGURED');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('debe llamar a Meta Graph API con payload estructurado y headers de autorización', async () => {
      mockHttpClient.post.mockResolvedValueOnce({
        data: {
          messaging_product: 'whatsapp',
          messages: [{ id: 'wamid.HBgLTEST123' }],
        },
      });

      const result = await clientService.sendTextMessage({
        to: '+593-987-654-321',
        text: 'Consulta recibida en Norma ERP.',
        configOverrides: {
          phoneNumberId: '123456789',
          accessToken: 'EAA_TEST_TOKEN',
        },
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('wamid.HBgLTEST123');

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'https://graph.facebook.com/v21.0/123456789/messages',
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: '593987654321',
          type: 'text',
          text: {
            preview_url: false,
            body: 'Consulta recibida en Norma ERP.',
          },
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer EAA_TEST_TOKEN',
          }),
        })
      );
    });

    it('debe fragmentar mensajes que superan 4000 caracteres respetando los bloques de texto', async () => {
      mockHttpClient.post.mockResolvedValue({
        data: {
          messaging_product: 'whatsapp',
          messages: [{ id: 'wamid.PART' }],
        },
      });

      // Crear un texto de 8500 caracteres con párrafos
      const longText = 'Primer parrafo de prueba con contenido legal ecuatoriano.\n\n'.repeat(150);

      const result = await clientService.sendTextMessage({
        to: '593987654321',
        text: longText,
        configOverrides: {
          phoneNumberId: '123456789',
          accessToken: 'EAA_TEST_TOKEN',
        },
      });

      expect(result.success).toBe(true);
      // Debe haber realizado al menos 2 peticiones separadas por exceder 4000 caracteres
      expect(mockHttpClient.post.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('3. Confirmación de Lectura (Read Receipt)', () => {
    it('debe enviar estado read para marcar mensaje como visto', async () => {
      mockHttpClient.post.mockResolvedValueOnce({ data: { success: true } });

      const success = await clientService.markMessageAsRead({
        messageId: 'wamid.INCOMING_MSG',
        configOverrides: {
          phoneNumberId: '123456789',
          accessToken: 'EAA_TEST_TOKEN',
        },
      });

      expect(success).toBe(true);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'https://graph.facebook.com/v21.0/123456789/messages',
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: 'wamid.INCOMING_MSG',
        },
        expect.any(Object)
      );
    });
  });
});
