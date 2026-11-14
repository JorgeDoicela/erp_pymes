/**
 * @file DigitalMarker.jsx
 * @description Marcador Digital de Asistencia con Geocercas (GPS), Auto-Marcado por Perímetro y Biometría WebAuthn.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState, useEffect, useCallback } from 'react';
import attendanceService from '../services/attendanceService';
import { FiShield } from 'react-icons/fi';

import { useBiometricAuth } from '@/modules/attendance/hooks/useBiometricAuth';
import { useAutoGeofenceMarker } from '@/modules/attendance/hooks/useAutoGeofenceMarker';
import {
  readStoredSessionUser,
  requestNavigatorLocation,
} from '@/modules/attendance/utils/geolocationUtils';
import TrackingConsentModal from '@/modules/attendance/components/TrackingConsentModal';
import BiometricRegistrationBanner from '@/modules/attendance/components/BiometricRegistrationBanner';
import EmployeeSearchBox from '@/modules/attendance/components/EmployeeSearchBox';
import AttendanceSummaryCard from '@/modules/attendance/components/AttendanceSummaryCard';
import MarkerActionButtons from '@/modules/attendance/components/MarkerActionButtons';
import AutoGeofenceControlPanel from '@/modules/attendance/components/AutoGeofenceControlPanel';
import DigitalMarkerClockHeader from '@/modules/attendance/components/DigitalMarkerClockHeader';

const ACTION_LABELS = {
  ENTRY: 'entrada',
  EXIT: 'salida',
  BREAK_START: 'inicio de almuerzo',
  BREAK_END: 'fin de almuerzo',
};

const STATUS_BADGE = {
  WORKING: { text: 'Actualmente Trabajando', cls: 'bg-green-50 text-green-700 border-green-200' },
  COMPLETED: { text: 'Jornada Completada', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
  ON_BREAK: { text: 'En Hora de Almuerzo', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const DigitalMarker = ({ user, autoLoadUser = false, allowSearch = true }) => {
  const currentUser = user || readStoredSessionUser();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [employeeId, setEmployeeId] = useState(autoLoadUser ? currentUser?.id || '' : '');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [consentStatus, setConsentStatus] = useState(() =>
    Boolean(readStoredSessionUser()?.trackingConsent ?? currentUser?.trackingConsent)
  );
  const [message, setMessage] = useState({
    type: '',
    text: '',
    showMapLink: false,
    lastCoords: null,
  });
  const [foundEmployee, setFoundEmployee] = useState(null);
  const [recordData, setRecordData] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const {
    biometricEnabled,
    biometricSupported,
    deviceBiometrics,
    hasBiometricRegistered,
    setHasBiometricRegistered,
    registeringBiometric,
    registerBiometric,
    triggerBiometric,
  } = useBiometricAuth();

  const resolvedEmployeeId = foundEmployee?.id || (autoLoadUser ? currentUser?.id : employeeId);
  const geofenceConfig = foundEmployee?.geofence || recordData?.geofence || null;
  const isAdminOrSupervisor = ['admin', 'hr', 'manager'].includes(
    (currentUser?.role || '').toLowerCase()
  );

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const checkStatus = useCallback(
    async (targetId) => {
      const cleanId = (targetId || employeeId)?.toString().trim();
      if (!cleanId) return;
      setLoading(true);
      try {
        const res = await attendanceService.getStatus(cleanId);
        if (!res.success) {
          setMessage({
            type: 'error',
            text: res.message || res.error || 'Empleado no encontrado.',
          });
          return;
        }
        setStatus(res.data.status);
        if (res.data) setRecordData(res.data);
        const emp = res.data.employee;
        if (emp) {
          setFoundEmployee(emp);
          setEmployeeId(emp.id);
          if (emp.hasBiometric !== undefined) setHasBiometricRegistered(Boolean(emp.hasBiometric));
          if (emp.trackingConsent !== undefined) {
            const hasConsent = Boolean(emp.trackingConsent);
            setConsentStatus(hasConsent);
            if (hasConsent) {
              setShowConsent(false);
              const savedUser = readStoredSessionUser() || {};
              if (savedUser.id === emp.id && !savedUser.trackingConsent) {
                savedUser.trackingConsent = true;
                localStorage.setItem('user', JSON.stringify(savedUser));
                window.dispatchEvent(new Event('norma:user-updated'));
              }
            }
          }
        }
      } catch (err) {
        setMessage({ type: 'error', text: err?.message || 'Error al buscar empleado.' });
      } finally {
        setLoading(false);
      }
    },
    [employeeId, setHasBiometricRegistered]
  );

  useEffect(() => {
    if (autoLoadUser && currentUser?.id) {
      setEmployeeId(currentUser.id);
      checkStatus(currentUser.id);
      const hasConsent = readStoredSessionUser()?.trackingConsent ?? currentUser?.trackingConsent;
      if (hasConsent === false) setShowConsent(true);
      else if (hasConsent === true) {
        setShowConsent(false);
        setConsentStatus(true);
      }
    }
  }, [user, autoLoadUser, currentUser?.id, currentUser?.trackingConsent, checkStatus]);

  const handleMark = useCallback(
    async (type, preResolvedLocation = null, options = {}) => {
      const targetId = foundEmployee?.id || currentUser?.id || employeeId;
      if (!targetId) {
        setMessage({ type: 'error', text: 'Por favor ingrese su ID de empleado.' });
        return;
      }

      setLoading(true);
      let location = preResolvedLocation;
      if (!location) {
        setMessage({ type: 'info', text: 'Obteniendo ubicación...' });
        try {
          location = await requestNavigatorLocation();
        } catch (locError) {
          setMessage({
            type: 'error',
            text: `Error de Ubicación: ${locError.message}. Se requiere GPS activado.`,
          });
          setLoading(false);
          return;
        }
      }

      try {
        const res = await attendanceService.markAttendance(targetId, type, location, options);
        if (res.success) {
          const prefix = options?.autoGeofence ? '[Auto-Geocerca] ' : '';
          setMessage({
            type: 'success',
            text: `${prefix}${res.message}${res.workedHours ? ` (${res.workedHours} hrs)` : ''}`,
          });
          await checkStatus(targetId);
        } else {
          let errorMsg = res.message || 'Error al registrar asistencia.';
          if (errorMsg.includes('Ubicación no permitida') && location) {
            errorMsg += ` (Tus coordenadas: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)})`;
            setMessage({ type: 'error', text: errorMsg, showMapLink: true, lastCoords: location });
          } else {
            setMessage({ type: 'error', text: errorMsg });
          }
        }
      } catch (err) {
        setMessage({
          type: 'error',
          text: err?.message || 'Error inesperado al registrar asistencia.',
        });
      } finally {
        setLoading(false);
      }
    },
    [foundEmployee?.id, currentUser?.id, employeeId, checkStatus]
  );

  const executeAutoGeofenceMark = useCallback(
    async (type, coords) => handleMark(type, coords, { autoGeofence: true }),
    [handleMark]
  );

  const autoGeofence = useAutoGeofenceMarker({
    targetEmployeeId: resolvedEmployeeId,
    status,
    geofenceConfig,
    consentStatus,
    biometricEnabled,
    hasBiometricRegistered,
    triggerBiometric,
    onExecuteAutoMark: executeAutoGeofenceMark,
    onNotify: setMessage,
  });

  const handleQuickRegisterBiometric = async () => {
    setMessage({ type: 'info', text: 'Preparando lector biométrico / Windows Hello...' });
    const res = await registerBiometric();
    if (res.success) {
      setMessage({
        type: 'success',
        text: 'Biometría registrada exitosamente. Ya puedes registrar tu asistencia.',
      });
      if (resolvedEmployeeId) checkStatus(resolvedEmployeeId);
    } else {
      setMessage({ type: 'error', text: res.message });
    }
  };

  const initiateMark = (type) => {
    if (biometricEnabled && hasBiometricRegistered === false) {
      setMessage({
        type: 'error',
        text: 'Por favor vincula tu huella dactilar o FaceID en este dispositivo para continuar con el registro.',
      });
      return;
    }
    setPendingAction(type);
    setShowConfirm(true);
  };

  const confirmMark = async () => {
    setShowConfirm(false);
    if (!pendingAction) return;
    if (biometricEnabled) {
      setMessage({ type: 'info', text: 'Verificando identidad biométrica...' });
      const biometricUserId = foundEmployee?.id || currentUser?.id || employeeId;
      const result = await triggerBiometric(biometricUserId);
      if (!result.passed) {
        setMessage({ type: 'error', text: result.reason });
        setPendingAction(null);
        return;
      }
      setMessage({ type: '', text: '' });
    }
    await handleMark(pendingAction);
    setPendingAction(null);
  };

  const actionLabel = ACTION_LABELS[pendingAction] || 'fin de almuerzo';
  const badge = STATUS_BADGE[status] || {
    text: 'Sin registrar entrada',
    cls: 'bg-gray-50 text-gray-500 border-gray-200',
  };

  return (
    <div className="flex flex-col items-center justify-center w-full bg-white border border-gray-200 text-gray-900 p-6 sm:p-8 rounded-[4px]">
      <DigitalMarkerClockHeader
        currentTime={currentTime}
        biometricEnabled={biometricEnabled}
        hasBiometricRegistered={hasBiometricRegistered}
        message={message}
        showConfirm={showConfirm}
        actionLabel={actionLabel}
        onCancelConfirm={() => {
          setShowConfirm(false);
          setPendingAction(null);
        }}
        onAcceptConfirm={confirmMark}
      />

      {allowSearch && (!user || isAdminOrSupervisor) && (
        <EmployeeSearchBox
          isAdminOrSuperAdmin={isAdminOrSupervisor}
          foundEmployee={foundEmployee}
          employeeId={employeeId}
          setEmployeeId={setEmployeeId}
          onSearch={() => checkStatus()}
          onClear={() => {
            setFoundEmployee(null);
            setEmployeeId('');
            setStatus(null);
            setRecordData(null);
            setMessage({ type: '', text: '' });
          }}
          allowSearch={allowSearch}
        />
      )}

      {biometricEnabled && biometricSupported && hasBiometricRegistered === false && (
        <BiometricRegistrationBanner
          registering={registeringBiometric}
          onRegister={handleQuickRegisterBiometric}
          deviceBiometrics={deviceBiometrics}
        />
      )}

      {resolvedEmployeeId && (
        <AutoGeofenceControlPanel
          geofenceConfig={geofenceConfig}
          consentStatus={consentStatus}
          biometricEnabled={biometricEnabled}
          biometricPreAuthorized={autoGeofence.biometricPreAuthorized}
          authorizingBiometric={autoGeofence.authorizingBiometric}
          autoEntryEnabled={autoGeofence.autoEntryEnabled}
          autoExitEnabled={autoGeofence.autoExitEnabled}
          liveDistanceMeters={autoGeofence.liveDistanceMeters}
          liveInsideGeofence={autoGeofence.liveInsideGeofence}
          watchingGps={autoGeofence.watchingGps}
          onToggleAutoEntry={autoGeofence.toggleAutoEntry}
          onToggleAutoExit={autoGeofence.toggleAutoExit}
          onAuthorizeBiometric={autoGeofence.authorizeSessionNow}
          disabled={loading}
        />
      )}

      <MarkerActionButtons
        status={status}
        recordData={recordData}
        loading={loading}
        consentStatus={consentStatus}
        biometricEnabled={biometricEnabled}
        hasBiometricRegistered={hasBiometricRegistered}
        onInitiateMark={initiateMark}
      />

      <div className="mt-6 flex flex-col items-center gap-3">
        <span
          className={`inline-block px-2.5 py-0.5 rounded-[4px] text-[11px] font-semibold tracking-wider uppercase border ${badge.cls}`}
        >
          {badge.text}
        </span>
        <button
          type="button"
          onClick={() => setShowConsent(true)}
          className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
        >
          <FiShield className="w-3 h-3" />
          Privacidad y Consentimiento · GPS / Anti-VPN
        </button>
      </div>

      {status !== 'NOT_STARTED' && status !== null && recordData && (
        <AttendanceSummaryCard recordData={recordData} />
      )}

      <TrackingConsentModal
        isOpen={showConsent}
        onClose={() => setShowConsent(false)}
        consentStatus={consentStatus}
        setConsentStatus={setConsentStatus}
        onNotification={setMessage}
      />
    </div>
  );
};

export default DigitalMarker;
