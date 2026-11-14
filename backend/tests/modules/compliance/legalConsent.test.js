/**
 * @file legalConsent.test.js
 * @description Pruebas unitarias de consentimiento legal obligatorio (Términos de Servicio y Privacidad LOPDP)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../../src/modules/auth/auth.service.js';

describe('Legal Consent Service Suite (Norma ERP - LOPDP Compliance)', () => {
  let authService;
  let mockAuthRepository;

  beforeEach(() => {
    mockAuthRepository = {
      recordUserConsent: vi.fn(),
      findUserByIdentifierWithTenant: vi.fn(),
    };
    authService = new AuthService();
  });

  it('debe rechazar la solicitud si acceptTerms o acceptPrivacy no son true', async () => {
    await expect(
      authService.recordConsent({
        userId: 'emp_123',
        tenantId: 'tenant_abc',
        acceptTerms: false,
        acceptPrivacy: true,
      })
    ).rejects.toThrow(
      'Debe aceptar tanto los Términos y Condiciones como la Política de Privacidad LOPDP'
    );

    await expect(
      authService.recordConsent({
        userId: 'emp_123',
        tenantId: 'tenant_abc',
        acceptTerms: true,
        acceptPrivacy: false,
      })
    ).rejects.toThrow(
      'Debe aceptar tanto los Términos y Condiciones como la Política de Privacidad LOPDP'
    );
  });

  it('debe rechazar la solicitud si el usuario no está autenticado', async () => {
    await expect(
      authService.recordConsent({
        userId: null,
        tenantId: 'tenant_abc',
        acceptTerms: true,
        acceptPrivacy: true,
      })
    ).rejects.toThrow('Usuario no autenticado');
  });
});
