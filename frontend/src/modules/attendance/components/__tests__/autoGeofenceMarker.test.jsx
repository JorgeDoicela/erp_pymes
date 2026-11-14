/**
 * @file autoGeofenceMarker.test.jsx
 * @description Suite de pruebas unitarias para el marcado automático por geocerca y pre-autorización biométrica WebAuthn.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { AutoGeofenceControlPanel } from '../AutoGeofenceControlPanel.jsx';
import {
  useAutoGeofenceMarker,
  computeClientHaversineMeters,
} from '../../hooks/useAutoGeofenceMarker.js';

describe('AutoGeofenceControlPanel & useAutoGeofenceMarker', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('calcula correctamente la distancia Haversine en cliente', () => {
    const samePoint = computeClientHaversineMeters(-0.1806, -78.4678, -0.1806, -78.4678);
    expect(samePoint).toBe(0);

    const distantPoint = computeClientHaversineMeters(-0.1806, -78.4678, -0.1845, -78.4678);
    expect(distantPoint).toBeGreaterThan(400);
    expect(distantPoint).toBeLessThan(500);
  });

  it('solicita verificación biométrica WebAuthn al activar Auto-Entrada cuando biometricEnabled es true', async () => {
    const triggerBiometricMock = vi.fn().mockResolvedValue({ passed: true });
    const onExecuteAutoMarkMock = vi.fn();
    const onNotifyMock = vi.fn();

    const { result } = renderHook(() =>
      useAutoGeofenceMarker({
        targetEmployeeId: 'emp_test_1',
        status: 'NOT_STARTED',
        geofenceConfig: { enabled: true, targetLat: -0.1806, targetLng: -78.4678, radius: 200 },
        consentStatus: true,
        biometricEnabled: true,
        hasBiometricRegistered: true,
        triggerBiometric: triggerBiometricMock,
        onExecuteAutoMark: onExecuteAutoMarkMock,
        onNotify: onNotifyMock,
      })
    );

    expect(result.current.autoEntryEnabled).toBe(false);
    expect(result.current.biometricPreAuthorized).toBe(false);

    await act(async () => {
      await result.current.toggleAutoEntry();
    });

    expect(triggerBiometricMock).toHaveBeenCalledWith('emp_test_1');
    expect(result.current.autoEntryEnabled).toBe(true);
    expect(result.current.biometricPreAuthorized).toBe(true);
  });

  it('bloquea la activación del switch si la verificación biométrica es cancelada o falla', async () => {
    const triggerBiometricMock = vi.fn().mockResolvedValue({
      passed: false,
      reason: 'Operación cancelada por el usuario',
    });
    const onNotifyMock = vi.fn();

    const { result } = renderHook(() =>
      useAutoGeofenceMarker({
        targetEmployeeId: 'emp_test_2',
        status: 'WORKING',
        geofenceConfig: { enabled: true, targetLat: -0.1806, targetLng: -78.4678, radius: 200 },
        consentStatus: true,
        biometricEnabled: true,
        hasBiometricRegistered: true,
        triggerBiometric: triggerBiometricMock,
        onExecuteAutoMark: vi.fn(),
        onNotify: onNotifyMock,
      })
    );

    await act(async () => {
      await result.current.toggleAutoExit();
    });

    expect(triggerBiometricMock).toHaveBeenCalledWith('emp_test_2');
    expect(result.current.autoExitEnabled).toBe(false);
    expect(result.current.biometricPreAuthorized).toBe(false);
  });

  it('renderiza los interruptores de Entrada y Salida y emite eventos al hacer clic', () => {
    const onToggleEntry = vi.fn();
    const onToggleExit = vi.fn();

    render(
      <AutoGeofenceControlPanel
        geofenceConfig={{ enabled: true, targetLat: -0.1806, targetLng: -78.4678, radius: 200 }}
        consentStatus={true}
        biometricEnabled={false}
        biometricPreAuthorized={true}
        authorizingBiometric={false}
        autoEntryEnabled={true}
        autoExitEnabled={false}
        liveDistanceMeters={45}
        liveInsideGeofence={true}
        watchingGps={true}
        onToggleAutoEntry={onToggleEntry}
        onToggleAutoExit={onToggleExit}
        onAuthorizeBiometric={vi.fn()}
      />
    );

    const entrySwitch = screen.getByRole('switch', {
      name: /Auto-marcar Entrada al detectar geocerca/i,
    });
    const exitSwitch = screen.getByRole('switch', {
      name: /Auto-marcar Salida al abandonar el radio/i,
    });

    expect(entrySwitch).toHaveAttribute('aria-checked', 'true');
    expect(exitSwitch).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText(/Distancia: 45m/i)).toBeInTheDocument();

    fireEvent.click(exitSwitch);
    expect(onToggleExit).toHaveBeenCalledTimes(1);
  });
});
