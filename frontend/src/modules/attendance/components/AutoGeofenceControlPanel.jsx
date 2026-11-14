/**
 * @file AutoGeofenceControlPanel.jsx
 * @description Panel presentacional de configuración de auto-marcado por geocerca (Entrada al ingresar al radio / Salida al abandonar el radio).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { FiMapPin } from 'react-icons/fi';
import { MdFingerprint } from 'react-icons/md';

export const AutoGeofenceControlPanel = ({
  geofenceConfig,
  consentStatus,
  biometricEnabled,
  biometricPreAuthorized,
  authorizingBiometric,
  autoEntryEnabled,
  autoExitEnabled,
  liveDistanceMeters,
  liveInsideGeofence,
  watchingGps,
  onToggleAutoEntry,
  onToggleAutoExit,
  onAuthorizeBiometric,
  disabled = false,
}) => {
  const hasCoordinates = Boolean(
    geofenceConfig &&
    typeof geofenceConfig.targetLat === 'number' &&
    typeof geofenceConfig.targetLng === 'number'
  );
  const radius = Number(geofenceConfig?.radius || 200);
  const anyActive = autoEntryEnabled || autoExitEnabled;
  const needsBioSessionAuth = biometricEnabled && anyActive && !biometricPreAuthorized;

  return (
    <div className="w-full max-w-md mb-5 bg-gray-50 border border-gray-200 rounded-[4px] p-3.5 text-xs space-y-3">
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="flex items-center gap-1.5">
          <FiMapPin className="w-3.5 h-3.5 text-gray-600" />
          <span className="font-semibold text-gray-900">Marcación Automática por Geocerca</span>
        </div>
        <span className="font-mono tabular-nums text-[11px] text-gray-500">
          {hasCoordinates ? `Radio: ${radius}m` : 'Sin geocerca asignada'}
        </span>
      </div>

      {!hasCoordinates ? (
        <p className="text-[11px] text-gray-500">
          Para utilizar el marcado automático por ubicación, configure las coordenadas del sitio de
          trabajo en la ficha del empleado o en la configuración de la empresa.
        </p>
      ) : (
        <>
          <div className="space-y-2.5">
            {/* Switch 1: Auto-marcar Entrada */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <label
                  htmlFor="toggle-auto-entry"
                  className="font-medium text-gray-800 block cursor-pointer"
                >
                  Auto-marcar Entrada al detectar geocerca
                </label>
                <span className="text-[11px] text-gray-500 block">
                  Registra la entrada automáticamente al ingresar al perímetro ({radius}m).
                </span>
              </div>
              <button
                id="toggle-auto-entry"
                type="button"
                role="switch"
                aria-checked={autoEntryEnabled}
                aria-label="Auto-marcar Entrada al detectar geocerca"
                disabled={disabled || authorizingBiometric || !consentStatus}
                onClick={onToggleAutoEntry}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-1 ${
                  autoEntryEnabled ? 'bg-blue-600 border-blue-600' : 'bg-gray-200 border-gray-300'
                } ${disabled || authorizingBiometric || !consentStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    autoEntryEnabled ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Switch 2: Auto-marcar Salida */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-200/70">
              <div>
                <label
                  htmlFor="toggle-auto-exit"
                  className="font-medium text-gray-800 block cursor-pointer"
                >
                  Auto-marcar Salida al abandonar el radio
                </label>
                <span className="text-[11px] text-gray-500 block">
                  Registra la salida automáticamente cuando el GPS detecta que sales del perímetro.
                </span>
              </div>
              <button
                id="toggle-auto-exit"
                type="button"
                role="switch"
                aria-checked={autoExitEnabled}
                aria-label="Auto-marcar Salida al abandonar el radio"
                disabled={disabled || authorizingBiometric || !consentStatus}
                onClick={onToggleAutoExit}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-1 ${
                  autoExitEnabled ? 'bg-blue-600 border-blue-600' : 'bg-gray-200 border-gray-300'
                } ${disabled || authorizingBiometric || !consentStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    autoExitEnabled ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Autorización Biométrica de Sesión cuando se recarga la página con un switch ya activo */}
          {needsBioSessionAuth && (
            <div className="pt-2 border-t border-gray-200 flex items-center justify-between gap-2">
              <span className="text-[11px] text-gray-600">
                Requiere confirmar huella en esta sesión para habilitar el disparo GPS.
              </span>
              <button
                type="button"
                onClick={onAuthorizeBiometric}
                disabled={authorizingBiometric}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-[4px] text-[11px] font-medium flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              >
                <MdFingerprint className="w-3.5 h-3.5" />
                {authorizingBiometric ? 'Verificando...' : 'Autorizar Huella'}
              </button>
            </div>
          )}

          {/* Telemetría en vivo de distancia al perímetro */}
          {anyActive && (!biometricEnabled || biometricPreAuthorized) && (
            <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-600">
              <span>{watchingGps ? 'Monitoreo GPS activo' : 'Esperando señal GPS...'}</span>
              {liveDistanceMeters !== null && (
                <span className="font-mono tabular-nums font-medium text-gray-900">
                  Distancia: {liveDistanceMeters}m ·{' '}
                  {liveInsideGeofence ? 'Dentro del radio' : 'Fuera del radio'}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AutoGeofenceControlPanel;
