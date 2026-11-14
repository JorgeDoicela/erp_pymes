/**
 * @file TermsConsentModal.test.jsx
 * @description Pruebas unitarias para TermsConsentModal (Cumplimiento LOPDP y Términos de Servicio)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TermsConsentModal from '../components/TermsConsentModal';
import { httpClient } from '@core/api/httpClient';

vi.mock('@core/api/httpClient', () => ({
  httpClient: {
    post: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('TermsConsentModal Unit Test Suite (LOPDP & Terms Acceptance)', () => {
  const mockUser = {
    id: 'emp_test_1',
    firstName: 'Jorge',
    lastName: 'Doicela',
    email: 'jorge.doicela.molina@gmail.com',
    role: 'admin',
    termsAccepted: false,
  };

  const mockOnConsentSuccess = vi.fn();
  const mockOnLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el modal con ambas pestañas y botón de aceptar deshabilitado inicialmente', () => {
    render(
      <TermsConsentModal
        user={mockUser}
        onConsentSuccess={mockOnConsentSuccess}
        onLogout={mockOnLogout}
      />
    );

    expect(screen.getByText(/Aceptación Obligatoria de Condiciones/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Condiciones de Servicio/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Política de Privacidad \(LOPDP Ecuador\)/i).length).toBeGreaterThan(
      0
    );

    const submitBtn = screen.getByRole('button', { name: /Aceptar y Continuar/i });
    expect(submitBtn).toBeDisabled();
  });

  it('debe habilitar el botón solo cuando ambas casillas de consentimiento estén marcadas', () => {
    render(
      <TermsConsentModal
        user={mockUser}
        onConsentSuccess={mockOnConsentSuccess}
        onLogout={mockOnLogout}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);

    const submitBtn = screen.getByRole('button', { name: /Aceptar y Continuar/i });
    expect(submitBtn).toBeDisabled();

    // Marcamos la primera casilla
    fireEvent.click(checkboxes[0]);
    expect(submitBtn).toBeDisabled();

    // Marcamos la segunda casilla
    fireEvent.click(checkboxes[1]);
    expect(submitBtn).not.toBeDisabled();

    // Desmarcamos una casilla
    fireEvent.click(checkboxes[0]);
    expect(submitBtn).toBeDisabled();
  });

  it('debe enviar la petición de consentimiento y ejecutar onConsentSuccess al aceptar', async () => {
    const updatedUserData = { ...mockUser, termsAccepted: true, privacyAccepted: true };
    httpClient.post.mockResolvedValueOnce({
      data: { success: true, data: updatedUserData },
    });

    render(
      <TermsConsentModal
        user={mockUser}
        onConsentSuccess={mockOnConsentSuccess}
        onLogout={mockOnLogout}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    const submitBtn = screen.getByRole('button', { name: /Aceptar y Continuar/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(httpClient.post).toHaveBeenCalledWith('/auth/consent', {
        acceptTerms: true,
        acceptPrivacy: true,
        version: '2026.1',
      });
      expect(mockOnConsentSuccess).toHaveBeenCalledWith(updatedUserData);
    });
  });

  it('debe invocar onLogout si el usuario hace clic en Rechazar y Cerrar Sesión', () => {
    render(
      <TermsConsentModal
        user={mockUser}
        onConsentSuccess={mockOnConsentSuccess}
        onLogout={mockOnLogout}
      />
    );

    const logoutBtn = screen.getByRole('button', { name: /Rechazar y Cerrar Sesión/i });
    fireEvent.click(logoutBtn);

    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });
});
