/**
 * @file accessibility.test.jsx
 * @description Suite de pruebas unitarias para AccessibilityProvider, FloatingPlayer y SettingsCard.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import {
  AccessibilityProvider,
  AccessibilityFloatingPlayer,
  AccessibilitySettingsCard,
  ScreenReaderAnnouncer,
  announceToScreenReader,
  useAccessibility,
} from '../index.js';

describe('Accessibility Module Test Suite (TalkBack Asistido)', () => {
  const mockSpeak = vi.fn();
  const mockCancel = vi.fn();
  const mockPause = vi.fn();
  const mockResume = vi.fn();
  const mockGetVoices = vi.fn(() => [
    { name: 'Google Español', lang: 'es-ES', default: true },
    { name: 'Microsoft Helena', lang: 'es-EC', default: false },
  ]);

  beforeEach(() => {
    localStorage.clear();
    mockSpeak.mockClear();
    mockCancel.mockClear();
    mockPause.mockClear();
    mockResume.mockClear();

    // Mock nativo de window.speechSynthesis
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      value: {
        speak: mockSpeak,
        cancel: mockCancel,
        pause: mockPause,
        resume: mockResume,
        getVoices: mockGetVoices,
        onvoiceschanged: null,
      },
    });

    // Mock de SpeechSynthesisUtterance
    window.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text;
        this.lang = 'es-ES';
        this.rate = 1.0;
        this.pitch = 1.0;
      }
    };
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debe iniciar desactivado por defecto (isSpeechEnabled = false)', () => {
    const TestConsumer = () => {
      const { isSpeechEnabled } = useAccessibility();
      return <div data-testid="enabled-val">{String(isSpeechEnabled)}</div>;
    };

    render(
      <AccessibilityProvider>
        <TestConsumer />
      </AccessibilityProvider>
    );

    expect(screen.getByTestId('enabled-val')).toHaveTextContent('false');
  });

  it('no debe renderizar AccessibilityFloatingPlayer cuando está desactivado', () => {
    const { container } = render(
      <MemoryRouter>
        <AccessibilityProvider>
          <AccessibilityFloatingPlayer />
        </AccessibilityProvider>
      </MemoryRouter>
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByLabelText(/Controles de asistencia por voz/i)).not.toBeInTheDocument();
  });

  it('debe permitir activar y desactivar la asistencia en AccessibilitySettingsCard', () => {
    render(
      <AccessibilityProvider>
        <AccessibilitySettingsCard />
      </AccessibilityProvider>
    );

    const checkbox = screen.getByRole('checkbox', {
      name: /Activar asistencia por voz y lectura accesible/i,
    });
    expect(checkbox).not.toBeChecked();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();

    // Activar
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(localStorage.getItem('norma_accessibility_speech_enabled')).toBe('true');

    // Desactivar
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
    expect(localStorage.getItem('norma_accessibility_speech_enabled')).toBe('false');
  });

  it('debe renderizar el reproductor flotante cuando se activa y permitir probar la voz', () => {
    // Forzar activación previa en localStorage
    localStorage.setItem('norma_accessibility_speech_enabled', 'true');

    render(
      <MemoryRouter>
        <AccessibilityProvider>
          <AccessibilityFloatingPlayer />
          <AccessibilitySettingsCard />
        </AccessibilityProvider>
      </MemoryRouter>
    );

    // Reproductor flotante debe ser visible
    expect(
      screen.getByRole('region', { name: /Controles de asistencia por voz/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Voz Asistida')).toBeInTheDocument();

    // Probar botón de prueba de voz
    const testVoiceBtn = screen.getByRole('button', { name: /Probar Voz/i });
    fireEvent.click(testVoiceBtn);

    expect(mockCancel).toHaveBeenCalled();
    expect(mockSpeak).toHaveBeenCalled();
  });

  it('debe actualizar la velocidad de habla y persistirla en localStorage', () => {
    localStorage.setItem('norma_accessibility_speech_enabled', 'true');

    render(
      <AccessibilityProvider>
        <AccessibilitySettingsCard />
      </AccessibilityProvider>
    );

    const speedBtn = screen.getByRole('button', { name: /1.2x \(Rápida\)/i });
    fireEvent.click(speedBtn);

    expect(localStorage.getItem('norma_accessibility_speech_rate')).toBe('1.2');
  });

  it('debe anunciar automáticamente la ruta a TalkBack en la región aria-live polite', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <ScreenReaderAnnouncer />
      </MemoryRouter>
    );

    const statusRegion = screen.getByRole('status');
    expect(statusRegion).toBeInTheDocument();
    expect(statusRegion).toHaveAttribute('aria-live', 'polite');
    expect(statusRegion).toHaveTextContent(/Pantalla Panel de Control Administrativo cargada/i);
  });

  it('debe verbalizar mensajes manuales y de alerta enviados a announceToScreenReader', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <ScreenReaderAnnouncer />
      </MemoryRouter>
    );

    // Anuncio informativo estándar
    act(() => {
      announceToScreenReader('Marcación registrada con éxito');
    });

    const statusRegion = screen.getByRole('status');
    expect(statusRegion).toHaveTextContent('Marcación registrada con éxito');

    // Anuncio urgente / de error
    act(() => {
      announceToScreenReader('Error de conexión con la base de datos', 'assertive');
    });

    const alertRegion = screen.getByRole('alert');
    expect(alertRegion).toHaveAttribute('aria-live', 'assertive');
    expect(alertRegion).toHaveTextContent('Error de conexión con la base de datos');
  });
});
