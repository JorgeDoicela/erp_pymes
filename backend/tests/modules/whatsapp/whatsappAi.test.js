/**
 * @file whatsappAi.test.js
 * @description Pruebas unitarias para el orquestador de IA de WhatsApp, clasificación de intención y adaptación de formato.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhatsappAiService } from '../../../src/modules/whatsapp/whatsappAi.service.js';
import {
  WHATSAPP_INTENTS,
  OUT_OF_SCOPE_MESSAGE,
} from '../../../src/modules/whatsapp/whatsapp.constants.js';

describe('WhatsApp AI Orchestrator Suite', () => {
  let mockLlmProvider;
  let mockRagService;
  let mockRepo;
  let aiService;

  beforeEach(() => {
    mockLlmProvider = {
      generateChatCompletion: vi.fn(),
    };
    mockRagService = {
      processQuery: vi.fn(),
    };
    mockRepo = {
      getEmployeeAttendanceToday: vi.fn(),
      getTenantSummaryMetrics: vi.fn(),
    };

    aiService = new WhatsappAiService(mockLlmProvider, mockRagService, mockRepo);
  });

  describe('1. Clasificación de Intenciones', () => {
    const mockEmployee = {
      id: 'emp-1',
      firstName: 'Carlos',
      lastName: 'Andrade',
      role: 'employee',
      tenantId: 'tenant-1',
    };

    it('debe clasificar saludos y solicitudes de ayuda como GENERAL_GREETING', () => {
      expect(aiService.classifyIntent('Hola, buenos dias', mockEmployee)).toBe(
        WHATSAPP_INTENTS.GENERAL_GREETING
      );
      expect(aiService.classifyIntent('que puedes hacer?', mockEmployee)).toBe(
        WHATSAPP_INTENTS.GENERAL_GREETING
      );
    });

    it('debe clasificar preguntas sobre vacaciones o asistencias como EMPLOYEE_QUERY', () => {
      expect(
        aiService.classifyIntent('cuantos dias de vacaciones tengo disponibles?', mockEmployee)
      ).toBe(WHATSAPP_INTENTS.EMPLOYEE_QUERY);
      expect(aiService.classifyIntent('a que hora marque hoy en la entrada?', mockEmployee)).toBe(
        WHATSAPP_INTENTS.EMPLOYEE_QUERY
      );
    });

    it('debe clasificar preguntas sobre solicitudes personales o trámites como EMPLOYEE_REQUESTS_QUERY', () => {
      expect(aiService.classifyIntent('Que solicitudes tengo activas?', mockEmployee)).toBe(
        WHATSAPP_INTENTS.EMPLOYEE_REQUESTS_QUERY
      );
      expect(aiService.classifyIntent('cuales son mis solicitudes?', mockEmployee)).toBe(
        WHATSAPP_INTENTS.EMPLOYEE_REQUESTS_QUERY
      );
      expect(aiService.classifyIntent('tengo alguna solicitud pendiente?', mockEmployee)).toBe(
        WHATSAPP_INTENTS.EMPLOYEE_REQUESTS_QUERY
      );
      expect(aiService.classifyIntent('ver mis tramites activos', mockEmployee)).toBe(
        WHATSAPP_INTENTS.EMPLOYEE_REQUESTS_QUERY
      );
    });

    it('debe clasificar consultas sobre el Código del Trabajo o IESS como LEGAL_QUERY', () => {
      expect(
        aiService.classifyIntent(
          'Como se calcula la liquidacion por despido intempestivo segun el Art 188?',
          mockEmployee
        )
      ).toBe(WHATSAPP_INTENTS.LEGAL_QUERY);
      expect(
        aiService.classifyIntent(
          'cuales son los requisitos de jubilacion patronal en el IESS?',
          mockEmployee
        )
      ).toBe(WHATSAPP_INTENTS.LEGAL_QUERY);
    });

    it('debe clasificar peticiones fuera de dominio corporativo como OUT_OF_SCOPE_QUERY', () => {
      expect(aiService.classifyIntent('hazme una factura por favor', mockEmployee)).toBe(
        WHATSAPP_INTENTS.OUT_OF_SCOPE_QUERY
      );
      expect(aiService.classifyIntent('como esta el clima hoy en Quito?', mockEmployee)).toBe(
        WHATSAPP_INTENTS.OUT_OF_SCOPE_QUERY
      );
      expect(aiService.classifyIntent('cuentame un chiste', mockEmployee)).toBe(
        WHATSAPP_INTENTS.OUT_OF_SCOPE_QUERY
      );
      expect(aiService.classifyIntent('quien gano el partido de futbol ayer?', mockEmployee)).toBe(
        WHATSAPP_INTENTS.OUT_OF_SCOPE_QUERY
      );
      expect(aiService.classifyIntent('dame una receta de cocina', mockEmployee)).toBe(
        WHATSAPP_INTENTS.OUT_OF_SCOPE_QUERY
      );
    });

    it('debe clasificar como UNKNOWN_SENDER si el colaborador no existe en base de datos', () => {
      expect(aiService.classifyIntent('Hola quiero consultar mis vacaciones', null)).toBe(
        WHATSAPP_INTENTS.UNKNOWN_SENDER
      );
    });
  });

  describe('2. Adaptación de Formato para WhatsApp', () => {
    it('debe transformar encabezados tipo ### a *negritas* nativas de WhatsApp', () => {
      const input = '### Calculo de Horas Extras\nContenido explicativo.';
      const output = aiService.cleanTextForWhatsapp(input);

      expect(output).toContain('*Calculo de Horas Extras*');
      expect(output).not.toContain('###');
    });

    it('debe convertir markdown **negrita** a *negrita* de WhatsApp', () => {
      const input = 'El **Articulo 55** del Codigo del Trabajo establece el recargo.';
      const output = aiService.cleanTextForWhatsapp(input);

      expect(output).toBe('El *Articulo 55* del Codigo del Trabajo establece el recargo.');
    });

    it('debe convertir tablas markdown con pipes a listas legibles con guiones', () => {
      const input = '| Rubro | Monto |\n|-------|-------|\n| Decimo Tercero | 460.00 |';
      const output = aiService.cleanTextForWhatsapp(input);

      expect(output).not.toContain('|-------|');
      expect(output).toContain('Decimo Tercero : 460.00');
    });
  });

  describe('3. Generación de Respuestas', () => {
    it('debe retornar mensaje de número no registrado si employee es null', async () => {
      const response = await aiService.generateResponse({
        text: 'Cual es mi sueldo?',
        employee: null,
      });

      expect(response).toContain('no se encuentra registrado en el sistema Norma ERP');
    });

    it('debe responder con menú de bienvenida ante un saludo si tiene consentimiento activo', async () => {
      const response = await aiService.generateResponse({
        text: 'Hola',
        employee: {
          id: 'emp-1',
          firstName: 'Lorena',
          tenant: { name: 'Comercial Andina S.A.' },
          whatsappConsent: true,
        },
      });

      expect(response).toContain('Hola Lorena');
      expect(response).toContain('Comercial Andina S.A.');
      expect(response).toContain('Mis vacaciones');
      expect(response).toContain('Consultas legales');
    });

    it('debe delegar consultas normativas al motor RAG ecuatoriano con citas legales oficiales', async () => {
      mockRagService.processQuery.mockResolvedValueOnce({
        answer:
          'Segun el Art. 188, el despido intempestivo indemniza con un mes de remuneracion por cada ano de servicio.',
        legalCitations: [
          {
            articleCode: 'Art. 188',
            documentTitle: 'Codigo del Trabajo del Ecuador',
          },
        ],
      });

      const response = await aiService.generateResponse({
        text: 'Como es la indemnizacion por despido intempestivo?',
        employee: {
          id: 'emp-1',
          firstName: 'Juan',
          tenantId: 'tenant-123',
          whatsappConsent: true,
        },
      });

      expect(mockRagService.processQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'Como es la indemnizacion por despido intempestivo?',
          tenantId: 'tenant-123',
          moduleContext: 'whatsapp',
        })
      );

      expect(response).toContain('Art. 188');
      expect(response).toContain('*Fundamento Normativo Oficial:*');
    });

    it('debe consultar la base de datos de marcaciones y responder ante preguntas de vacaciones', async () => {
      mockRepo.getEmployeeAttendanceToday.mockResolvedValueOnce({
        checkIn: new Date('2026-11-11T08:30:00Z'),
        checkOut: null,
        status: 'ON_TIME',
      });

      mockLlmProvider.generateChatCompletion.mockResolvedValueOnce({
        content:
          '*Hola Pedro*, actualmente tienes *12 dias* de vacaciones disponibles y tu registro de entrada fue a las *08:30*.',
      });

      const response = await aiService.generateResponse({
        text: 'cuantos dias de vacaciones me quedan y a que hora llegue hoy?',
        employee: {
          id: 'emp-2',
          firstName: 'Pedro',
          lastName: 'Mendoza',
          vacationDays: 12,
          department: 'Operaciones',
          position: 'Supervisor de Logistica',
          tenantId: 'tenant-1',
          whatsappConsent: true,
        },
      });

      expect(mockRepo.getEmployeeAttendanceToday).toHaveBeenCalledWith('emp-2');
      expect(mockLlmProvider.generateChatCompletion).toHaveBeenCalled();
      expect(response).toContain('12 dias');
    });

    it('debe responder con las solicitudes del colaborador ante "Que solicitudes tengo activas?"', async () => {
      mockRepo.getEmployeeLatestPayrollAndRequests = vi.fn().mockResolvedValueOnce({
        latestPayrollDetail: null,
        recentAbsences: [
          {
            type: 'Vacaciones',
            startDate: new Date('2026-11-20T00:00:00Z'),
            endDate: new Date('2026-11-25T00:00:00Z'),
            daysRequested: 5,
            status: 'PENDING',
          },
        ],
        recentAdvances: [
          {
            amount: 150,
            installments: 2,
            status: 'APPROVED',
          },
        ],
      });

      const response = await aiService.generateResponse({
        text: 'Que solicitudes tengo activas?',
        employee: {
          id: 'emp-3',
          firstName: 'Elena',
          tenantId: 'tenant-1',
          tenant: { name: 'Comercial Andina S.A.' },
          whatsappConsent: true,
        },
      });

      expect(mockRepo.getEmployeeLatestPayrollAndRequests).toHaveBeenCalledWith(
        'emp-3',
        'tenant-1'
      );
      expect(response).toContain('*Estado de Solicitudes en Comercial Andina S.A.:*');
      expect(response).toContain('*Vacaciones* (2026-11-20 al 2026-11-25) (5 días): *PENDING*');
      expect(response).toContain('*Anticipo de $150.00* (2 cuota(s)): *APPROVED*');
    });

    it('debe informar claramente si no tiene solicitudes activas ni pendientes', async () => {
      mockRepo.getEmployeeLatestPayrollAndRequests = vi.fn().mockResolvedValueOnce({
        latestPayrollDetail: null,
        recentAbsences: [],
        recentAdvances: [],
      });

      const response = await aiService.generateResponse({
        text: 'Que solicitudes tengo activas?',
        employee: {
          id: 'emp-4',
          firstName: 'Marco',
          tenantId: 'tenant-1',
          tenant: { name: 'Comercial Andina S.A.' },
          whatsappConsent: true,
        },
      });

      expect(response).toContain('*Estado de Solicitudes en Comercial Andina S.A.:*');
      expect(response).toContain('No registra solicitudes activas ni pendientes en este momento.');
      expect(response).toContain('Quiero pedir vacaciones');
    });

    it('debe responder con OUT_OF_SCOPE_MESSAGE delimitando capacidades ante peticiones fuera de alcance', async () => {
      const response = await aiService.generateResponse({
        text: 'hazme una factura electronica por favor',
        employee: {
          id: 'emp-5',
          firstName: 'Patricia',
          tenantId: 'tenant-1',
          tenant: { name: 'Comercial Andina S.A.' },
          whatsappConsent: true,
        },
      });

      expect(response).toBe(OUT_OF_SCOPE_MESSAGE);
      expect(response).toContain(
        'Esa consulta o accion no forma parte de mis capacidades en este canal'
      );
      expect(response).toContain('Como Asistente Corporativo de Norma ERP');
      expect(response).toContain('Gestion de Solicitudes (2FA)');
      expect(response).toContain('Consultas Personales');
      expect(response).toContain('Legislacion Laboral');
      expect(response).toContain('*AYUDA*');
    });
  });
});
