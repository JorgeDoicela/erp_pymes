/**
 * @file useAutoGeofenceMarker.js
 * @description Hook autónomo para marcado automático de Entrada y Salida por geocerca GPS con pre-autorización biométrica WebAuthn.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  computeClientHaversineMeters,
  readAutoGeofencePrefs,
  writeAutoGeofencePrefs,
} from '../utils/geolocationUtils';

export { computeClientHaversineMeters };

export function useAutoGeofenceMarker({
  targetEmployeeId,
  status,
  geofenceConfig,
  consentStatus,
  biometricEnabled,
  hasBiometricRegistered,
  triggerBiometric,
  onExecuteAutoMark,
  onNotify,
}) {
  const [autoEntryEnabled, setAutoEntryEnabled] = useState(false);
  const [autoExitEnabled, setAutoExitEnabled] = useState(false);
  const [biometricPreAuthorized, setBiometricPreAuthorized] = useState(false);
  const [authorizingBiometric, setAuthorizingBiometric] = useState(false);
  const [liveDistanceMeters, setLiveDistanceMeters] = useState(null);
  const [liveInsideGeofence, setLiveInsideGeofence] = useState(null);
  const [watchingGps, setWatchingGps] = useState(false);

  const inFlightRef = useRef(false);
  const triggeredEntryDayRef = useRef(null);
  const triggeredExitDayRef = useRef(null);

  useEffect(() => {
    const prefs = readAutoGeofencePrefs(targetEmployeeId);
    setAutoEntryEnabled(prefs.autoEntryEnabled);
    setAutoExitEnabled(prefs.autoExitEnabled);
    setBiometricPreAuthorized(!biometricEnabled);
    setLiveDistanceMeters(null);
    setLiveInsideGeofence(null);
  }, [targetEmployeeId, biometricEnabled]);

  const ensureBiometricPreAuth = useCallback(async () => {
    if (!biometricEnabled) {
      setBiometricPreAuthorized(true);
      return true;
    }
    if (biometricPreAuthorized) return true;
    if (hasBiometricRegistered === false) {
      onNotify?.({
        type: 'error',
        text: 'Vincule primero su huella o Passkey en este dispositivo antes de activar el auto-marcado.',
      });
      return false;
    }

    setAuthorizingBiometric(true);
    onNotify?.({
      type: 'info',
      text: 'Confirme su huella o FaceID para autorizar el marcado automático por geocerca...',
    });

    try {
      const result = await triggerBiometric(targetEmployeeId);
      if (result?.passed) {
        setBiometricPreAuthorized(true);
        return true;
      }
      onNotify?.({
        type: 'error',
        text: result?.reason || 'No se pudo autorizar la biometría para el marcado automático.',
      });
      return false;
    } finally {
      setAuthorizingBiometric(false);
    }
  }, [
    biometricEnabled,
    biometricPreAuthorized,
    hasBiometricRegistered,
    triggerBiometric,
    targetEmployeeId,
    onNotify,
  ]);

  const toggleSwitch = useCallback(
    async (kind) => {
      if (!targetEmployeeId) return;
      if (!consentStatus) {
        onNotify?.({
          type: 'error',
          text: 'Otorgue primero el consentimiento de ubicación (LOPDP) para activar el auto-marcado.',
        });
        return;
      }

      const isEntry = kind === 'ENTRY';
      const nextValue = isEntry ? !autoEntryEnabled : !autoExitEnabled;
      if (nextValue && !(await ensureBiometricPreAuth())) return;

      const updatedPrefs = {
        autoEntryEnabled: isEntry ? nextValue : autoEntryEnabled,
        autoExitEnabled: isEntry ? autoExitEnabled : nextValue,
      };
      if (isEntry) setAutoEntryEnabled(nextValue);
      else setAutoExitEnabled(nextValue);

      writeAutoGeofencePrefs(targetEmployeeId, updatedPrefs);
      const label = isEntry ? 'Entrada' : 'Salida';
      onNotify?.({
        type: 'info',
        text: nextValue
          ? `Auto-marcado de ${label} activado por geocerca.`
          : `Auto-marcado de ${label} desactivado.`,
      });
    },
    [
      targetEmployeeId,
      consentStatus,
      autoEntryEnabled,
      autoExitEnabled,
      ensureBiometricPreAuth,
      onNotify,
    ]
  );

  useEffect(() => {
    const anyActive = autoEntryEnabled || autoExitEnabled;
    const hasGeofence =
      typeof geofenceConfig?.targetLat === 'number' &&
      typeof geofenceConfig?.targetLng === 'number';

    if (
      !targetEmployeeId ||
      !consentStatus ||
      !anyActive ||
      !hasGeofence ||
      (biometricEnabled && !biometricPreAuthorized) ||
      typeof navigator === 'undefined' ||
      !navigator.geolocation
    ) {
      setWatchingGps(false);
      return undefined;
    }

    let isMounted = true;
    setWatchingGps(true);
    const radius = Number(geofenceConfig.radius || 200);
    const dayLock = `${targetEmployeeId}:${new Date().toISOString().split('T')[0]}`;

    const onPos = async (pos) => {
      if (!isMounted || inFlightRef.current) return;
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      const dist = Math.round(
        computeClientHaversineMeters(
          coords.latitude,
          coords.longitude,
          geofenceConfig.targetLat,
          geofenceConfig.targetLng
        )
      );
      const isInside = dist <= radius;
      setLiveDistanceMeters(dist);
      setLiveInsideGeofence(isInside);

      const shouldAutoEnter =
        autoEntryEnabled &&
        status === 'NOT_STARTED' &&
        isInside &&
        triggeredEntryDayRef.current !== dayLock;
      const shouldAutoExit =
        autoExitEnabled &&
        status === 'WORKING' &&
        !isInside &&
        triggeredExitDayRef.current !== dayLock;
      if (!shouldAutoEnter && !shouldAutoExit) return;

      inFlightRef.current = true;
      if (shouldAutoEnter) triggeredEntryDayRef.current = dayLock;
      else triggeredExitDayRef.current = dayLock;

      try {
        await onExecuteAutoMark(shouldAutoEnter ? 'ENTRY' : 'EXIT', coords);
      } finally {
        inFlightRef.current = false;
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      onPos,
      () => isMounted && setWatchingGps(false),
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    return () => {
      isMounted = false;
      setWatchingGps(false);
      navigator.geolocation.clearWatch(watchId);
    };
  }, [
    targetEmployeeId,
    consentStatus,
    autoEntryEnabled,
    autoExitEnabled,
    geofenceConfig,
    biometricEnabled,
    biometricPreAuthorized,
    status,
    onExecuteAutoMark,
  ]);

  return {
    autoEntryEnabled,
    autoExitEnabled,
    biometricPreAuthorized,
    authorizingBiometric,
    liveDistanceMeters,
    liveInsideGeofence,
    watchingGps,
    toggleAutoEntry: () => toggleSwitch('ENTRY'),
    toggleAutoExit: () => toggleSwitch('EXIT'),
    authorizeSessionNow: ensureBiometricPreAuth,
  };
}

export default useAutoGeofenceMarker;
