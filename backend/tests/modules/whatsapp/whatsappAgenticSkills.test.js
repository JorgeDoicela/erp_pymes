/**
 * @file whatsappAgenticSkills.test.js
 * @description Pruebas unitarias exhaustivas para habilidades agénticas (solicitud de vacaciones),
 * doble factor (últimos 4 dígitos de cédula + CONFIRMAR + OTP SMTP), idempotencia y aislamiento multi-tenant.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhatsappSecurityService } from '../../../src/modules/whatsapp/whatsappSecurity.service.js';
import { WhatsappRepository } from '../../../src/modules/whatsapp/whatsapp.repository.js';
import { WhatsappConfirmationService } from '../../../src/modules/whatsapp/whatsappConfirmation.service.js';
import { WHATSAPP_SESSION_STATUS } from '../../../src/modules/whatsapp/whatsappActionSession.repository.js';
import { WhatsappSkillRegistry } from '../../../src/modules/whatsapp/skills/whatsappSkill.registry.js';
import { RequestVacationSkill } from '../../../src/modules/whatsapp/skills/requestVacation.skill.js';
import { WhatsappAiService } from '../../../src/modules/whatsapp/whatsappAi.service.js';
import { WHATSAPP_INTENTS } from '../../../src/modules/whatsapp/whatsapp.constants.js';

describe('WhatsApp Agentic Skills, 2FA (Cédula + OTP) & Multi-Tenant Suite', () => {
  describe('1. Seguridad Criptográfica 2FA (WhatsappSecurityService)', () => {
    let security;

    beforeEach(() => {
      security = new WhatsappSecurityService();
    });

    it('debe normalizar claves telefónicas canónicas multi-formato Ecuador', () => {
      expect(security.getCanonicalPhoneKey('+593 96-967-7280')).toBe('593969677280');
      expect(security.getCanonicalPhoneKey('0969677280')).toBe('593969677280');
      expect(security.getCanonicalPhoneKey('969677280')).toBe('593969677280');
    });

    it('debe validar en tiempo constante los últimos 4 dígitos de la cédula', () => {
      expect(security.verifyIdentityLast4('1718293045', '3045')).toBe(true);
      expect(security.verifyIdentityLast4('1718293045', '3046')).toBe(false);
      expect(security.verifyIdentityLast4('1718293045', '304')).toBe(false);
      expect(security.verifyIdentityLast4('', '3045')).toBe(false);
    });

    it('debe generar OTP de 6 dígitos, hashearlo con salt de sesión y verificarlo correctamente', () => {
      const otp = security.generateNumericOtp(6);
      expect(otp).toMatch(/^\d{6}$/);

      const hash = security.hashOtp('sess-1', otp);
      expect(hash).not.toContain(otp);
      expect(security.verifyOtpHash('sess-1', otp, hash)).toBe(true);
      expect(security.verifyOtpHash('sess-2', otp, hash)).toBe(false);
      expect(security.verifyOtpHash('sess-1', '000000', hash)).toBe(false);
    });

    it('debe enmascarar correos electrónicos según LOPDP', () => {
      expect(security.maskEmail('jorge.doicela.m@gmail.com')).toBe('jo***@gmail.com');
      expect(security.maskEmail('a@empresa.ec')).toBe('a***@empresa.ec');
    });
  });

  describe('2. Resolución Multi-Tenant en WhatsappRepository', () => {
    it('debe evitar falsos positivos parciales y resolver empleado único activo', async () => {
      const mockPrisma = {
        employee: {
          findMany: vi.fn().mockResolvedValueOnce([
            {
              id: 'emp-1',
              phone: '0969677280',
              tenantId: 'tenant-1',
              isActive: true,
              tenant: { id: 'tenant-1', name: 'Empresa Uno' },
            },
            {
              id: 'emp-fake-collision',
              phone: '0969677289',
              tenantId: 'tenant-2',
              isActive: true,
              tenant: { id: 'tenant-2', name: 'Otra Empresa' },
            },
          ]),
        },
        whatsappConversationContext: {
          findUnique: vi.fn(),
        },
      };

      const repo = new WhatsappRepository(mockPrisma);
      const res = await repo.resolveEmployeeContext({
        phoneKey: '593969677280',
        phoneVariants: ['593969677280', '0969677280'],
      });

      expect(res.status).toBe('RESOLVED');
      expect(res.employee.id).toBe('emp-1');
    });

    it('debe requerir selección explícita cuando el mismo teléfono existe en dos empresas sin contexto previo', async () => {
      const mockPrisma = {
        employee: {
          findMany: vi.fn().mockResolvedValueOnce([
            {
              id: 'emp-1',
              phone: '0969677280',
              tenantId: 'tenant-a',
              isActive: true,
              tenant: { id: 'tenant-a', name: 'Empresa Alfa', ruc: '1790001112001' },
            },
            {
              id: 'emp-2',
              phone: '+593969677280',
              tenantId: 'tenant-b',
              isActive: true,
              tenant: { id: 'tenant-b', name: 'Empresa Beta', ruc: '0990003334001' },
            },
          ]),
        },
        whatsappConversationContext: {
          findUnique: vi.fn().mockResolvedValueOnce(null),
          upsert: vi.fn().mockResolvedValueOnce({}),
        },
      };

      const repo = new WhatsappRepository(mockPrisma);
      const res = await repo.resolveEmployeeContext({
        phoneKey: '593969677280',
        phoneVariants: ['593969677280', '0969677280'],
      });

      expect(res.status).toBe('MULTI_TENANT_SELECTION_REQUIRED');
      expect(res.candidates).toHaveLength(2);
      expect(mockPrisma.whatsappConversationContext.upsert).toHaveBeenCalled();
    });
  });

  describe('3. Flujo Dual 2FA + Idempotencia + Auditoría (WhatsappConfirmationService)', () => {
    let security;
    let mockSessionRepo;
    let mockEmail;
    let mockAudit;
    let confirmationService;
    let mockSkill;
    let registry;

    const baseEmployee = {
      id: 'emp-100',
      tenantId: 'tenant-alpha',
      firstName: 'Andrea',
      lastName: 'Morales',
      email: 'andrea.morales@empresa.ec',
      identityCard: '1720458912',
      vacationDays: 15,
      tenant: { id: 'tenant-alpha', name: 'TechSolutions Cía. Ltda.' },
    };

    beforeEach(() => {
      security = new WhatsappSecurityService();
      mockSessionRepo = {
        cancelOpenSessions: vi.fn().mockResolvedValue({ count: 0 }),
        createSession: vi.fn().mockResolvedValue({ id: 'sess-1' }),
        markStatus: vi.fn().mockResolvedValue({ count: 1 }),
        registerFailedAttempt: vi.fn(),
        claimForExecution: vi.fn().mockResolvedValue(true),
        markCompleted: vi.fn().mockResolvedValue({ count: 1 }),
      };
      mockEmail = {
        sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: '<msg-1@smtp>' }),
      };
      mockAudit = {
        log: vi.fn().mockResolvedValue({ id: 'audit-1' }),
      };
      mockSkill = {
        id: 'REQUEST_VACATION',
        formatDraftForWhatsapp: vi.fn().mockReturnValue('*Resumen Borrador*'),
        executeConfirmedAction: vi.fn().mockResolvedValue({
          entityName: 'AbsenceRequest',
          entityId: 'req-777',
          auditAction: 'WHATSAPP_VACATION_REQUEST_CREATED',
          request: { id: 'req-777', status: 'PENDING' },
          summary: {
            startDate: '2026-12-01',
            endDate: '2026-12-03',
            daysRequested: 3,
            reason: 'Viaje',
          },
        }),
        formatConfirmedResultForWhatsapp: vi
          .fn()
          .mockReturnValue('*Solicitud de Vacaciones Registrada* ID: req-777'),
      };
      registry = new WhatsappSkillRegistry([mockSkill]);
      confirmationService = new WhatsappConfirmationService(
        mockSessionRepo,
        security,
        mockEmail,
        mockAudit
      );
    });

    it('debe generar hash OTP, enviarlo por correo y responder formato CONFIRMAR con correo enmascarado', async () => {
      const reply = await confirmationService.initiateDualConfirmation({
        employee: baseEmployee,
        phoneKey: '593969677280',
        skill: mockSkill,
        draftSummary: {
          startDate: '2026-12-01',
          endDate: '2026-12-03',
          daysRequested: 3,
          reason: 'Viaje familiar',
        },
        sourceMessageId: 'wamid.SRC1',
      });

      expect(mockSessionRepo.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-alpha',
          employeeId: 'emp-100',
          status: WHATSAPP_SESSION_STATUS.PENDING_CONFIRMATION,
          otpSentToEmail: 'andrea.morales@empresa.ec',
        })
      );
      expect(mockEmail.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'andrea.morales@empresa.ec',
          subject: expect.stringContaining('TechSolutions Cía. Ltda.'),
        })
      );
      expect(reply).toContain('an***@empresa.ec');
      expect(reply).toContain('CONFIRMAR <4 ultimos digitos de su cedula> <codigo OTP>');
    });

    it('debe cancelar la sesión si falla el envío SMTP real del OTP', async () => {
      mockEmail.sendEmail.mockRejectedValueOnce(new Error('SMTP timeout'));

      const reply = await confirmationService.initiateDualConfirmation({
        employee: baseEmployee,
        phoneKey: '593969677280',
        skill: mockSkill,
        draftSummary: {
          startDate: '2026-12-01',
          endDate: '2026-12-03',
          daysRequested: 3,
          reason: 'Viaje',
        },
      });

      expect(mockSessionRepo.markStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-alpha',
          status: WHATSAPP_SESSION_STATUS.CANCELLED,
        })
      );
      expect(reply).toContain('No fue posible enviar el codigo OTP');
    });

    it('debe validar cédula + OTP, reclamar atómicamente, crear solicitud y registrar auditoría multi-tenant', async () => {
      const sessionId = 'sess-valid-1';
      const otpCode = '654321';
      const otpHash = security.hashOtp(sessionId, otpCode);

      const activeSession = {
        id: sessionId,
        tenantId: 'tenant-alpha',
        employeeId: 'emp-100',
        phoneKey: '593969677280',
        skillName: 'REQUEST_VACATION',
        status: WHATSAPP_SESSION_STATUS.PENDING_CONFIRMATION,
        payloadJson: {
          startDate: '2026-12-01',
          endDate: '2026-12-03',
          daysRequested: 3,
          reason: 'Viaje',
        },
        otpHash,
        otpSentToEmail: 'andrea.morales@empresa.ec',
        attempts: 0,
        maxAttempts: 3,
        expiresAt: new Date(Date.now() + 600000),
        sourceMessageId: 'wamid.SRC1',
      };

      const reply = await confirmationService.handlePendingConfirmation({
        text: 'CONFIRMAR 8912 654321',
        employee: baseEmployee,
        phoneKey: '593969677280',
        messageId: 'wamid.CONF1',
        activeSession,
        skillRegistry: registry,
      });

      expect(mockSessionRepo.claimForExecution).toHaveBeenCalledWith({
        id: sessionId,
        tenantId: 'tenant-alpha',
        employeeId: 'emp-100',
        confirmMessageId: 'wamid.CONF1',
      });
      expect(mockSkill.executeConfirmedAction).toHaveBeenCalledWith({
        payload: activeSession.payloadJson,
        employee: baseEmployee,
        tenantId: 'tenant-alpha',
      });
      expect(mockSessionRepo.markCompleted).toHaveBeenCalledWith({
        id: sessionId,
        tenantId: 'tenant-alpha',
        employeeId: 'emp-100',
        resultingEntityId: 'req-777',
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-alpha',
          entity: 'AbsenceRequest',
          entityId: 'req-777',
          action: 'WHATSAPP_VACATION_REQUEST_CREATED',
        })
      );
      expect(reply).toContain('req-777');
    });

    it('debe bloquear la sesión tras 3 intentos fallidos y registrar evento de seguridad en auditoría', async () => {
      const sessionId = 'sess-lock-1';
      const activeSession = {
        id: sessionId,
        tenantId: 'tenant-alpha',
        employeeId: 'emp-100',
        phoneKey: '593969677280',
        skillName: 'REQUEST_VACATION',
        status: WHATSAPP_SESSION_STATUS.PENDING_CONFIRMATION,
        payloadJson: {},
        otpHash: security.hashOtp(sessionId, '999999'),
        otpSentToEmail: 'andrea.morales@empresa.ec',
        attempts: 2,
        maxAttempts: 3,
        expiresAt: new Date(Date.now() + 600000),
      };

      mockSessionRepo.registerFailedAttempt.mockResolvedValueOnce({
        attempts: 3,
        maxAttempts: 3,
        locked: true,
      });

      const reply = await confirmationService.handlePendingConfirmation({
        text: 'CONFIRMAR 0000 111111',
        employee: baseEmployee,
        phoneKey: '593969677280',
        messageId: 'wamid.FAIL3',
        activeSession,
        skillRegistry: registry,
      });

      expect(mockSkill.executeConfirmedAction).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'WHATSAPP_ACTION_LOCKED_MAX_ATTEMPTS',
          tenantId: 'tenant-alpha',
        })
      );
      expect(reply).toContain('bloqueada por seguridad');
    });
  });

  describe('4. Habilidad REQUEST_VACATION e Intenciones Agénticas (WhatsappAiService)', () => {
    it('debe distinguir solicitudes de vacaciones vs consultas de saldo o legislación', () => {
      const ai = new WhatsappAiService(
        { generateChatCompletion: vi.fn() },
        { processQuery: vi.fn() },
        {},
        null,
        null,
        null
      );
      const emp = { id: 'e1', tenantId: 't1', role: 'employee' };

      expect(
        ai.classifyIntent('Quiero pedir vacaciones del 2026-12-01 al 2026-12-05 por viaje', emp)
      ).toBe(WHATSAPP_INTENTS.VACATION_REQUEST_ACTION);
      expect(ai.classifyIntent('Necesito solicitar vacaciones', emp)).toBe(
        WHATSAPP_INTENTS.VACATION_REQUEST_ACTION
      );
      expect(ai.classifyIntent('Cuantos dias de vacaciones tengo disponibles?', emp)).toBe(
        WHATSAPP_INTENTS.EMPLOYEE_QUERY
      );
      expect(ai.classifyIntent('Que dice el Codigo del Trabajo sobre las vacaciones?', emp)).toBe(
        WHATSAPP_INTENTS.LEGAL_QUERY
      );
    });

    it('debe manejar flujo multi-turno COLLECTING_PARAMS cuando faltan datos y luego pasar a 2FA', async () => {
      const mockAbsence = {
        previewVacationRequest: vi.fn().mockResolvedValueOnce({
          startDate: '2026-12-10',
          endDate: '2026-12-12',
          daysRequested: 3,
          reason: 'Descanso familiar',
          vacationDaysTotal: 15,
          pendingVacationDays: 0,
          netAvailableBefore: 15,
          projectedAvailableAfter: 12,
        }),
        createRequest: vi.fn(),
      };
      const mockLlm = {
        generateChatCompletion: vi
          .fn()
          .mockResolvedValueOnce({
            content: '{"startDate": null, "endDate": null, "reason": null}',
          })
          .mockResolvedValueOnce({
            content:
              '{"startDate": "2026-12-10", "endDate": "2026-12-12", "reason": "Descanso familiar"}',
          }),
      };

      const skill = new RequestVacationSkill(mockAbsence, mockLlm);
      const registry = new WhatsappSkillRegistry([skill]);

      const mockSessionRepo = {
        findOpenSession: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: 'draft-1',
            tenantId: 'tenant-1',
            employeeId: 'emp-1',
            skillName: 'REQUEST_VACATION',
            status: WHATSAPP_SESSION_STATUS.COLLECTING_PARAMS,
            payloadJson: { startDate: null, endDate: null, reason: null },
            expiresAt: new Date(Date.now() + 600000),
          }),
        markStatus: vi.fn(),
      };
      const mockConfirmation = {
        saveCollectingDraft: vi.fn().mockResolvedValueOnce('draft-1'),
        initiateDualConfirmation: vi
          .fn()
          .mockResolvedValueOnce('*Validacion de Seguridad Requerida* CONFIRMAR 3045 123456'),
      };

      const ai = new WhatsappAiService(
        mockLlm,
        { processQuery: vi.fn() },
        {},
        mockConfirmation,
        registry,
        mockSessionRepo
      );

      const employee = {
        id: 'emp-1',
        tenantId: 'tenant-1',
        firstName: 'Carlos',
        lastName: 'Mena',
        vacationDays: 15,
        tenant: { id: 'tenant-1', name: 'Empresa Demo' },
      };

      // Turno 1: Faltan fechas y motivo -> guarda borrador COLLECTING_PARAMS
      const turn1 = await ai.generateResponse({
        text: 'Quiero pedir vacaciones',
        employee,
        phoneKey: '593999000111',
        messageId: 'wamid.T1',
      });
      expect(mockConfirmation.saveCollectingDraft).toHaveBeenCalled();
      expect(turn1).toContain('Por favor indique');

      // Turno 2: Aporta fechas y motivo -> valida dominio e inicia 2FA
      const turn2 = await ai.generateResponse({
        text: 'Del 2026-12-10 al 2026-12-12 por Descanso familiar',
        employee,
        phoneKey: '593999000111',
        messageId: 'wamid.T2',
      });
      expect(mockAbsence.previewVacationRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: 'emp-1',
          tenantId: 'tenant-1',
          startDate: '2026-12-10',
          endDate: '2026-12-12',
          reason: 'Descanso familiar',
        })
      );
      expect(mockConfirmation.initiateDualConfirmation).toHaveBeenCalled();
      expect(turn2).toContain('Validacion de Seguridad Requerida');
    });
  });
});
