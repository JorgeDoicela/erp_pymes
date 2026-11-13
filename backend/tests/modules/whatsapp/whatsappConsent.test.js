/**
 * @file whatsappConsent.test.js
 * @description Pruebas unitarias de consentimiento LOPDP, aceptación obligatoria, revocatoria y auditoría para WhatsApp.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhatsappConsentService } from '../../../src/modules/whatsapp/whatsappConsent.service.js';
import { WHATSAPP_PRIVACY_POLICY_URL } from '../../../src/modules/whatsapp/whatsapp.constants.js';

describe('WhatsApp LOPDP Consent & Revocation Suite (Arts. 8, 12 y 15)', () => {
  let consentService;
  let mockRepo;
  let mockSessionRepo;
  let mockAuditor;

  const baseEmployee = {
    id: 'emp-lopdp-01',
    tenantId: 'tenant-omega',
    firstName: 'Esteban',
    lastName: 'Quishpe',
    email: 'esteban.quishpe@omega.ec',
    phone: '0987654321',
    whatsappConsent: false,
    whatsappConsentDate: null,
    tenant: { name: 'Omega Soluciones S.A.S.' },
  };

  beforeEach(() => {
    mockRepo = {
      updateEmployeeWhatsappConsent: vi.fn().mockImplementation(async ({ consent }) => ({
        id: 'emp-lopdp-01',
        whatsappConsent: Boolean(consent),
        whatsappConsentDate: consent ? new Date() : null,
      })),
    };

    mockSessionRepo = {
      cancelOpenSessions: vi.fn().mockResolvedValue({ count: 1 }),
    };

    mockAuditor = {
      log: vi.fn().mockResolvedValue({ id: 'audit-log-1' }),
    };

    consentService = new WhatsappConsentService(mockRepo, mockSessionRepo, mockAuditor);
  });

  describe('1. Detección y Normalización de Comandos', () => {
    it('debe reconocer variantes de aceptación (ACEPTO)', () => {
      expect(consentService.isAcceptCommand('ACEPTO')).toBe(true);
      expect(consentService.isAcceptCommand('acepto')).toBe(true);
      expect(consentService.isAcceptCommand('Si acepto')).toBe(true);
      expect(consentService.isAcceptCommand('acepto politicas')).toBe(true);
      expect(consentService.isAcceptCommand('acepto terminos')).toBe(true);
      expect(consentService.isAcceptCommand('acepto lopdp')).toBe(true);
      expect(consentService.isAcceptCommand('autorizo')).toBe(true);
      expect(consentService.isAcceptCommand('de acuerdo')).toBe(true);
      expect(consentService.isAcceptCommand('hola')).toBe(false);
      expect(consentService.isAcceptCommand('rechazo')).toBe(false);
    });

    it('debe reconocer variantes de revocatoria (REVOCAR)', () => {
      expect(consentService.isRevokeCommand('REVOCAR')).toBe(true);
      expect(consentService.isRevokeCommand('revocar')).toBe(true);
      expect(consentService.isRevokeCommand('revocar consentimiento')).toBe(true);
      expect(consentService.isRevokeCommand('revocar lopdp')).toBe(true);
      expect(consentService.isRevokeCommand('revoco')).toBe(true);
      expect(consentService.isRevokeCommand('no acepto')).toBe(true);
      expect(consentService.isRevokeCommand('cancelar consentimiento')).toBe(true);
      expect(consentService.isRevokeCommand('cancelar')).toBe(false);
    });
  });

  describe('2. Bloqueo Preventivo ante Falta de Consentimiento', () => {
    it('debe bloquear cualquier mensaje operativo y solicitar ACEPTO con enlace a politicas', async () => {
      const emp = { ...baseEmployee, whatsappConsent: false };

      const reply = await consentService.handleConsentFlow({
        text: 'Quiero consultar mis vacaciones',
        employee: emp,
        phoneKey: '593987654321',
      });

      expect(reply).toContain('*Consentimiento de Datos Personales Requerido (LOPDP Ecuador)*');
      expect(reply).toContain('Esteban Quishpe');
      expect(reply).toContain('Omega Soluciones S.A.S.');
      expect(reply).toContain(WHATSAPP_PRIVACY_POLICY_URL);
      expect(reply).toContain('*ACEPTO*');
      expect(reply).toContain('REVOCAR');
      expect(mockRepo.updateEmployeeWhatsappConsent).not.toHaveBeenCalled();
    });
  });

  describe('3. Registro de Consentimiento Expreso (ACEPTO)', () => {
    it('debe registrar el consentimiento en BD y auditoría al enviar ACEPTO', async () => {
      const emp = { ...baseEmployee, whatsappConsent: false };

      const reply = await consentService.handleConsentFlow({
        text: 'ACEPTO',
        employee: emp,
        phoneKey: '593987654321',
      });

      expect(reply).toContain('*Consentimiento Registrado Exitosamente — LOPDP Ecuador*');
      expect(reply).toContain('Omega Soluciones S.A.S.');
      expect(reply).toContain(WHATSAPP_PRIVACY_POLICY_URL);
      expect(emp.whatsappConsent).toBe(true);
      expect(emp.whatsappConsentDate).toBeInstanceOf(Date);

      expect(mockRepo.updateEmployeeWhatsappConsent).toHaveBeenCalledWith({
        employeeId: emp.id,
        tenantId: emp.tenantId,
        consent: true,
      });

      expect(mockAuditor.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-omega',
          entity: 'Employee',
          action: 'WHATSAPP_LOPDP_CONSENT_GRANTED',
        })
      );
    });

    it('debe informar si el consentimiento ya se encontraba activo previamente', async () => {
      const emp = { ...baseEmployee, whatsappConsent: true, whatsappConsentDate: new Date() };

      const reply = await consentService.handleConsentFlow({
        text: 'ACEPTO',
        employee: emp,
        phoneKey: '593987654321',
      });

      expect(reply).toContain('*Consentimiento LOPDP Activo*');
      expect(reply).toContain('ya se encuentra registrada y vigente');
      expect(mockRepo.updateEmployeeWhatsappConsent).not.toHaveBeenCalled();
    });
  });

  describe('4. Revocatoria de Consentimiento (REVOCAR)', () => {
    it('debe revocar consentimiento, cancelar sesiones activas y registrar auditoria', async () => {
      const emp = { ...baseEmployee, whatsappConsent: true, whatsappConsentDate: new Date() };

      const reply = await consentService.handleConsentFlow({
        text: 'REVOCAR',
        employee: emp,
        phoneKey: '593987654321',
      });

      expect(reply).toContain(
        '*Consentimiento Revocado — Ley Organica de Proteccion de Datos Personales (LOPDP)*'
      );
      expect(reply).toContain('Omega Soluciones S.A.S.');
      expect(reply).toContain(WHATSAPP_PRIVACY_POLICY_URL);
      expect(emp.whatsappConsent).toBe(false);
      expect(emp.whatsappConsentDate).toBeNull();

      expect(mockRepo.updateEmployeeWhatsappConsent).toHaveBeenCalledWith({
        employeeId: emp.id,
        tenantId: emp.tenantId,
        consent: false,
      });

      expect(mockSessionRepo.cancelOpenSessions).toHaveBeenCalledWith({
        phoneKey: '593987654321',
        tenantId: 'tenant-omega',
        employeeId: emp.id,
      });

      expect(mockAuditor.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-omega',
          entity: 'Employee',
          action: 'WHATSAPP_LOPDP_CONSENT_REVOKED',
        })
      );
    });

    it('debe informar que el consentimiento no esta activo si se intenta revocar sin haber aceptado', async () => {
      const emp = { ...baseEmployee, whatsappConsent: false };

      const reply = await consentService.handleConsentFlow({
        text: 'REVOCAR',
        employee: emp,
        phoneKey: '593987654321',
      });

      expect(reply).toContain('*Consentimiento LOPDP No Activo*');
      expect(mockRepo.updateEmployeeWhatsappConsent).not.toHaveBeenCalled();
      expect(mockSessionRepo.cancelOpenSessions).not.toHaveBeenCalled();
    });
  });

  describe('5. Continuidad de Flujo Operativo', () => {
    it('debe retornar null cuando el empleado cuenta con consentimiento activo', async () => {
      const emp = { ...baseEmployee, whatsappConsent: true, whatsappConsentDate: new Date() };

      const reply = await consentService.handleConsentFlow({
        text: 'Cual es mi saldo de vacaciones?',
        employee: emp,
        phoneKey: '593987654321',
      });

      expect(reply).toBeNull();
    });
  });
});
