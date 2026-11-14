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
import Select from '../../ui/Select.jsx';

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

  it('debe verbalizar semánticamente los controles interactivos al recibir foco en modo asistido', () => {
    localStorage.setItem('norma_accessibility_speech_enabled', 'true');

    render(
      <AccessibilityProvider>
        <div>
          <button type="button" aria-label="Guardar Cambios">
            Guardar
          </button>
          <input type="password" placeholder="Clave secreta" required />
        </div>
      </AccessibilityProvider>
    );

    const button = screen.getByRole('button', { name: /Guardar Cambios/i });
    fireEvent.focusIn(button);

    expect(mockCancel).toHaveBeenCalled();
    expect(mockSpeak).toHaveBeenCalled();
    const lastCallUtterance = mockSpeak.mock.calls[mockSpeak.mock.calls.length - 1][0];
    expect(lastCallUtterance.text).toContain('Botón');
    expect(lastCallUtterance.text).toContain('Guardar Cambios');
  });

  it('debe interceptar el primer clic en un botón para verbalizarlo sin ejecutarlo, y ejecutarlo al segundo clic', () => {
    localStorage.setItem('norma_accessibility_speech_enabled', 'true');
    const mockAction = vi.fn();

    render(
      <AccessibilityProvider>
        <div>
          <button type="button" onClick={mockAction} aria-label="Editar Perfil">
            Editar Perfil
          </button>
        </div>
      </AccessibilityProvider>
    );

    const button = screen.getByRole('button', { name: /Editar Perfil/i });

    // Primer clic: inspección TalkBack (NO debe llamar al onClick)
    fireEvent.click(button);
    expect(mockAction).not.toHaveBeenCalled();
    expect(mockSpeak).toHaveBeenCalled();
    const firstUtterance = mockSpeak.mock.calls[mockSpeak.mock.calls.length - 1][0];
    expect(firstUtterance.text).toBe('Botón: Editar Perfil');

    // Segundo clic sobre el mismo botón: confirmación TalkBack (SÍ debe ejecutar la acción)
    fireEvent.click(button);
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('debe verbalizar textos informativos y salarios sin ejecutar navegación', () => {
    localStorage.setItem('norma_accessibility_speech_enabled', 'true');

    render(
      <AccessibilityProvider>
        <main>
          <p>Habilita la narración audible de la interfaz.</p>
          <div>
            <span>SALARIO BASE</span>
            <span>$3,100.00 USD</span>
          </div>
        </main>
      </AccessibilityProvider>
    );

    const paragraph = screen.getByText(/Habilita la narración audible/i);
    fireEvent.click(paragraph);

    expect(mockSpeak).toHaveBeenCalled();
    const utterance = mockSpeak.mock.calls[mockSpeak.mock.calls.length - 1][0];
    expect(utterance.text).toContain('Habilita la narración audible de la interfaz');
    expect(utterance.text).not.toContain('Texto:');
  });

  it('no debe incluir prefijos técnicos como encabezado nivel N en títulos informativos', () => {
    localStorage.setItem('norma_accessibility_speech_enabled', 'true');

    render(
      <AccessibilityProvider>
        <main>
          <h2>Acceso al Sistema</h2>
        </main>
      </AccessibilityProvider>
    );

    const heading = screen.getByRole('heading', { level: 2 });
    fireEvent.click(heading);

    expect(mockSpeak).toHaveBeenCalled();
    const utterance = mockSpeak.mock.calls[mockSpeak.mock.calls.length - 1][0];
    expect(utterance.text).toBe('Acceso al Sistema');
    expect(utterance.text).not.toContain('Encabezado');
    expect(utterance.text).not.toContain('nivel');
  });

  it('debe asociar <label> a <select> y anunciar solo la opción seleccionada sin concatenar todas las opciones', () => {
    localStorage.setItem('norma_accessibility_speech_enabled', 'true');

    render(
      <AccessibilityProvider>
        <main>
          <div>
            <label htmlFor="dept-select">Departamento</label>
            <select id="dept-select" defaultValue="finanzas">
              <option value="gerencia">Gerencia</option>
              <option value="finanzas">Finanzas y Contabilidad</option>
              <option value="rrhh">Talento Humano</option>
            </select>
          </div>
        </main>
      </AccessibilityProvider>
    );

    const selectEl = screen.getByLabelText('Departamento');
    fireEvent.click(selectEl);

    const utterance = mockSpeak.mock.calls[mockSpeak.mock.calls.length - 1][0];
    expect(utterance.text).toBe(
      'Menú desplegable: Departamento. Seleccionado: Finanzas y Contabilidad.'
    );
    expect(utterance.text).not.toContain('Talento Humano');

    // Cambiar selección y verificar lectura del nuevo valor
    fireEvent.change(selectEl, { target: { value: 'rrhh' } });
    const changedUtterance = mockSpeak.mock.calls[mockSpeak.mock.calls.length - 1][0];
    expect(changedUtterance.text).toBe(
      'Menú desplegable: Departamento. Seleccionado: Talento Humano.'
    );
  });

  it('debe leer pares clave-valor completos, expandir abreviaturas y deletrear cédulas/RUC dígito por dígito', () => {
    localStorage.setItem('norma_accessibility_speech_enabled', 'true');

    render(
      <AccessibilityProvider>
        <main>
          <h2>Ing. Oswaldo Guevara</h2>
          <div>
            <span>DEPARTAMENTO</span>
            <span>Gerencia</span>
          </div>
          <p>Cédula: 1712345678</p>
        </main>
      </AccessibilityProvider>
    );

    fireEvent.click(screen.getByText('Ing. Oswaldo Guevara'));
    expect(mockSpeak.mock.calls[mockSpeak.mock.calls.length - 1][0].text).toBe(
      'Ingeniero Oswaldo Guevara'
    );

    fireEvent.click(screen.getByText('DEPARTAMENTO'));
    expect(mockSpeak.mock.calls[mockSpeak.mock.calls.length - 1][0].text).toBe(
      'DEPARTAMENTO: Gerencia'
    );

    fireEvent.click(screen.getByText(/1712345678/));
    expect(mockSpeak.mock.calls[mockSpeak.mock.calls.length - 1][0].text).toBe(
      'Cédula: 1 7 1 2 3 4 5 6 7 8'
    );
  });

  it('debe permitir activar y desactivar la voz desde cualquier pantalla con el atajo Alt + V y detener con Escape', () => {
    render(
      <AccessibilityProvider>
        <AccessibilitySettingsCard />
      </AccessibilityProvider>
    );

    expect(screen.getByText('Inactivo')).toBeInTheDocument();

    // Presionar Alt + V para activar en cualquier pantalla (ej. /login)
    fireEvent.keyDown(window, { key: 'v', code: 'KeyV', altKey: true });
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(localStorage.getItem('norma_accessibility_speech_enabled')).toBe('true');
    expect(mockSpeak.mock.calls[mockSpeak.mock.calls.length - 1][0].text).toBe(
      'Asistencia por voz activada.'
    );

    // Presionar Escape para callar inmediatamente la voz
    mockCancel.mockClear();
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(mockCancel).toHaveBeenCalledTimes(1);

    // Presionar Alt + V nuevamente para desactivar
    fireEvent.keyDown(window, { key: 'v', code: 'KeyV', altKey: true });
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
    expect(localStorage.getItem('norma_accessibility_speech_enabled')).toBe('false');
  });

  it('debe conectar ScreenReaderAnnouncer con speak() cuando la voz asistida está activa', () => {
    localStorage.setItem('norma_accessibility_speech_enabled', 'true');

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AccessibilityProvider>
          <ScreenReaderAnnouncer />
        </AccessibilityProvider>
      </MemoryRouter>
    );

    expect(mockSpeak).toHaveBeenCalled();
    expect(mockSpeak.mock.calls[mockSpeak.mock.calls.length - 1][0].text).toBe(
      'Pantalla Iniciar Sesión cargada.'
    );
  });

  it('debe permitir explorar las opciones del componente Select en TalkBack (1er toque lee la opción sin entrar, 2do toque selecciona)', () => {
    localStorage.setItem('norma_accessibility_speech_enabled', 'true');
    const mockOnChange = vi.fn();

    render(
      <AccessibilityProvider>
        <Select
          aria-label="Seleccionar sección"
          value="personal"
          onChange={mockOnChange}
          options={[
            { value: 'personal', label: 'Información Personal' },
            { value: 'job', label: 'Datos Laborales' },
            { value: 'contracts', label: 'Contratos (1)' },
          ]}
        />
      </AccessibilityProvider>
    );

    const combobox = screen.getByRole('combobox', { name: /Seleccionar sección/i });

    // 1er toque en el combobox: lee qué es y qué tiene seleccionado sin abrir aún
    fireEvent.click(combobox);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(mockSpeak.mock.calls[mockSpeak.mock.calls.length - 1][0].text).toBe(
      'Menú desplegable: Seleccionar sección. Seleccionado: Información Personal.'
    );

    // 2do toque en el combobox: abre la lista de opciones
    fireEvent.click(combobox);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    const contractsOption = screen.getByRole('option', { name: /Contratos \(1\)/i });

    // 1er toque en la opción "Contratos (1)": lee la opción SIN cambiar de pestaña aún
    fireEvent.click(contractsOption);
    expect(mockOnChange).not.toHaveBeenCalled();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(mockSpeak.mock.calls[mockSpeak.mock.calls.length - 1][0].text).toBe(
      'Opción: Contratos 1'
    );

    // 2do toque en "Contratos (1)": confirma y cambia a esa sección
    fireEvent.click(contractsOption);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange.mock.calls[0][0].target.value).toBe('contracts');
  });

  it('debe interceptar el primer toque en el botón cerrar (X) de un modal y en iconos SVG interiores sin cerrarlo', () => {
    localStorage.setItem('norma_accessibility_speech_enabled', 'true');
    const mockOnClose = vi.fn();

    render(
      <AccessibilityProvider>
        <div role="dialog" aria-modal="true">
          <h3>Editar Ficha del Colaborador</h3>
          <button type="button" aria-label="Cerrar modal" onClick={mockOnClose}>
            <svg data-testid="close-svg">
              <path data-testid="close-path" />
            </svg>
          </button>
        </div>
      </AccessibilityProvider>
    );

    const closePath = screen.getByTestId('close-path');

    // 1er toque sobre el icono SVG interno: debe interceptarse, leer "Botón: Cerrar modal" y NO llamar a onClose
    fireEvent.click(closePath);
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(mockSpeak).toHaveBeenCalled();
    expect(mockSpeak.mock.calls[mockSpeak.mock.calls.length - 1][0].text).toBe(
      'Botón: Cerrar modal'
    );

    // 2do toque sobre el mismo botón: ahora sí se ejecuta la acción de cerrar
    fireEvent.click(screen.getByRole('button', { name: /Cerrar modal/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
