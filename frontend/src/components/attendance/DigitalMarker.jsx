/**
 * @file DigitalMarker.jsx
 * @description Marcador Digital de Asistencia con Geocercas (GPS), Detección de Spoofing y Biometría WebAuthn.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState, useEffect, useCallback } from 'react';
import attendanceService from '../../services/attendance/attendanceService';
import { FiShield, FiMapPin } from 'react-icons/fi';
import { MdFingerprint } from 'react-icons/md';
import Modal from '../common/Modal';

// Subcomponentes y hooks desacoplados del dominio attendance
import { useBiometricAuth } from '../../modules/attendance/hooks/useBiometricAuth';
import TrackingConsentModal from '../../modules/attendance/components/TrackingConsentModal';
import BiometricRegistrationBanner from '../../modules/attendance/components/BiometricRegistrationBanner';
import EmployeeSearchBox from '../../modules/attendance/components/EmployeeSearchBox';
import AttendanceSummaryCard from '../../modules/attendance/components/AttendanceSummaryCard';
import MarkerActionButtons from '../../modules/attendance/components/MarkerActionButtons';

const DigitalMarker = ({ user, autoLoadUser = false, allowSearch = true }) => {
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })();
  const currentUser = user || storedUser;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [employeeId, setEmployeeId] = useState(autoLoadUser ? currentUser?.id || '' : '');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [consentStatus, setConsentStatus] = useState(() => {
    const freshUser = (() => {
      try {
        return JSON.parse(localStorage.getItem('user') || 'null');
      } catch {
        return null;
      }
    })();
    return Boolean(freshUser?.trackingConsent ?? currentUser?.trackingConsent);
  });

  const [message, setMessage] = useState({ type: '', text: '', showMapLink: false, lastCoords: null });
  const [foundEmployee, setFoundEmployee] = useState(null);
  const [recordData, setRecordData] = useState(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Hook desacoplado de biometría WebAuthn
  const {
    biometricEnabled,
    hasBiometricRegistered,
    setHasBiometricRegistered,
    registeringBiometric,
    registerBiometric,
    triggerBiometric,
  } = useBiometricAuth();

  // Reloj digital en tiempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Carga automática del empleado si autoLoadUser está activo
  useEffect(() => {
    if (autoLoadUser && currentUser?.id) {
      setEmployeeId(currentUser.id);
      checkStatus(currentUser.id);

      const freshUser = (() => {
        try {
          return JSON.parse(localStorage.getItem('user') || 'null');
        } catch {
          return null;
        }
      })();
      const hasConsent = freshUser?.trackingConsent ?? currentUser?.trackingConsent;

      if (hasConsent === false) {
        setShowConsent(true);
      } else if (hasConsent === true) {
        setShowConsent(false);
        setConsentStatus(true);
      }
    }
  }, [user, autoLoadUser]);

  const handleQuickRegisterBiometric = async () => {
    setMessage({ type: 'info', text: 'Preparando lector biométrico / Windows Hello...' });
    const res = await registerBiometric();
    if (res.success) {
      setMessage({
        type: 'success',
        text: '¡Biometría registrada exitosamente! Ya puedes registrar tu asistencia.',
      });
      if (employeeId) checkStatus(employeeId);
    } else {
      setMessage({ type: 'error', text: res.message });
    }
  };

  const checkStatus = useCallback(
    async (id = employeeId) => {
      const cleanId = id?.toString().trim();
      if (!cleanId) return;
      setLoading(true);
      setMessage({ type: '', text: '' });
      try {
        const res = await attendanceService.getStatus(cleanId);
        if (res.success) {
          setStatus(res.data.status);
          if (res.data) setRecordData(res.data);
          if (res.data.employee) {
            setFoundEmployee(res.data.employee);
            setEmployeeId(res.data.employee.id);
            if (res.data.employee.hasBiometric !== undefined) {
              setHasBiometricRegistered(Boolean(res.data.employee.hasBiometric));
            }
            if (res.data.employee.trackingConsent !== undefined) {
              const hasConsent = Boolean(res.data.employee.trackingConsent);
              setConsentStatus(hasConsent);
              if (hasConsent) {
                setShowConsent(false);
                const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
                if (savedUser && !savedUser.trackingConsent) {
                  savedUser.trackingConsent = true;
                  localStorage.setItem('user', JSON.stringify(savedUser));
                  window.dispatchEvent(new Event('norma:user-updated'));
                  window.dispatchEvent(new Event('emplifi:user-updated'));
                }
              }
            }
          }
        } else {
          setMessage({
            type: 'error',
            text: res.message || res.error || 'Empleado no encontrado. Verifique la cédula ingresada.',
          });
        }
      } catch (err) {
        setMessage({ type: 'error', text: err?.message || 'Error al buscar empleado.' });
      } finally {
        setLoading(false);
      }
    },
    [employeeId, setHasBiometricRegistered]
  );

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada por su navegador'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let msg = 'Error obteniendo ubicación';
          if (error.code === error.PERMISSION_DENIED) msg = 'Permiso de ubicación denegado';
          else if (error.code === error.POSITION_UNAVAILABLE) msg = 'Ubicación no disponible';
          else if (error.code === error.TIMEOUT) msg = 'Tiempo de espera agotado al obtener ubicación';
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  };

  const isAdminOrSuperAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'superadmin' ||
    currentUser?.email === 'admin@normaerp.com' ||
    currentUser?.email === 'admin@emplifi.com';
  const isSuperAdmin =
    currentUser?.role === 'superadmin' ||
    currentUser?.email === 'admin@normaerp.com' ||
    currentUser?.email === 'admin@emplifi.com';

  const initiateMark = (type) => {
    if (isSuperAdmin && !foundEmployee) {
      setMessage({
        type: 'error',
        text: 'Modo Supervisión: El SuperAdministrador debe buscar la cédula del empleado para registrar su asistencia.',
      });
      return;
    }
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
      const biometricUserId = currentUser?.id || foundEmployee?.id || employeeId;
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

  const handleMark = async (type) => {
    const targetId = foundEmployee?.id || currentUser?.id || employeeId;

    if (!targetId) {
      setMessage({ type: 'error', text: 'Por favor ingrese su ID de empleado.' });
      return;
    }
    setLoading(true);
    setMessage({ type: 'info', text: 'Obteniendo ubicación...' });

    let location = null;
    try {
      location = await getLocation();
    } catch (locError) {
      console.warn('Location error:', locError);
      setMessage({
        type: 'error',
        text: `Error de Ubicación: ${locError.message}. Se requiere GPS activado.`,
      });
      setLoading(false);
      return;
    }

    setMessage({ type: '', text: '' });
    try {
      const res = await attendanceService.markAttendance(targetId, type, location);
      if (res.success) {
        setMessage({
          type: 'success',
          text: res.message + (res.workedHours ? ` (${res.workedHours} hrs)` : ''),
        });
        await checkStatus(targetId);
      } else {
        let errorMsg = res.message || 'Error al registrar asistencia.';
        if (errorMsg.includes('Ubicación no permitida') && location) {
          errorMsg += ` (Tus coordenadas: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)})`;
          setMessage({
            type: 'error',
            text: errorMsg,
            showMapLink: true,
            lastCoords: location,
          });
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
  };

  const actionLabel =
    pendingAction === 'ENTRY'
      ? 'entrada'
      : pendingAction === 'EXIT'
        ? 'salida'
        : pendingAction === 'BREAK_START'
          ? 'inicio de almuerzo'
          : 'fin de almuerzo';

  return (
    <div className="flex flex-col items-center justify-center w-full bg-white border border-gray-200 text-gray-900 p-6 sm:p-8 rounded-[4px]">
      {/* Reloj y Estado Biométrico */}
      <div className="mb-6 text-center">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Marcador Digital de Jornada
        </div>
        <div className="text-4xl sm:text-5xl font-bold font-mono tracking-tight text-gray-900 tabular-nums">
          {currentTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </div>
        <div className="text-gray-500 mt-1 text-xs">
          {currentTime.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
        {biometricEnabled && (
          <div
            className={`mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[11px] font-medium border ${
              hasBiometricRegistered === false
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <MdFingerprint
              className={`w-3.5 h-3.5 ${hasBiometricRegistered === false ? 'text-blue-600' : 'text-emerald-600'}`}
            />
            <span>
              {hasBiometricRegistered === false
                ? 'Autenticación Biométrica (Sin vincular en este equipo)'
                : 'Verificación biométrica activa'}
            </span>
          </div>
        )}
      </div>

      {/* Buscador de Empleado */}
      {allowSearch && (!user || isAdminOrSuperAdmin) && (
        <EmployeeSearchBox
          isAdminOrSuperAdmin={isAdminOrSuperAdmin}
          foundEmployee={foundEmployee}
          employeeId={employeeId}
          setEmployeeId={setEmployeeId}
          onSearch={() => checkStatus()}
          onClear={() => {
            setFoundEmployee(null);
            setEmployeeId('');
            setStatus(null);
            setMessage({ type: '', text: '' });
          }}
          allowSearch={allowSearch}
        />
      )}

      {/* Banner de Registro Biométrico In-Situ */}
      {biometricEnabled && hasBiometricRegistered === false && (
        <BiometricRegistrationBanner
          registering={registeringBiometric}
          onRegister={handleQuickRegisterBiometric}
        />
      )}

      {/* Mensajes de Notificación */}
      {message.text && (
        <div className="w-full max-w-md mb-4">
          <div
            className={`px-3.5 py-2 rounded-[4px] text-center text-xs font-medium border ${
              message.type === 'error'
                ? 'bg-red-50 text-red-700 border-red-200'
                : message.type === 'info'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-green-50 text-green-700 border-green-200'
            }`}
          >
            {message.text}
          </div>
          {message.showMapLink && message.lastCoords && (
            <div className="mt-1.5 flex justify-center gap-3">
              <a
                href={`https://www.google.com/maps?q=${message.lastCoords.latitude},${message.lastCoords.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
              >
                Ver ubicación en mapa (GPS)
              </a>
            </div>
          )}
        </div>
      )}

      {/* Modal de Confirmación */}
      <Modal
        isOpen={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          setPendingAction(null);
        }}
        title={`Confirmar ${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)}`}
        size="sm"
        footer={
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowConfirm(false);
                setPendingAction(null);
              }}
              className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-1.5 rounded-[4px] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmMark}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-1.5 rounded-[4px] transition-colors cursor-pointer"
            >
              Confirmar
            </button>
          </div>
        }
      >
        <p className="text-xs text-gray-600">
          ¿Confirmas registrar tu {actionLabel} a las{' '}
          <strong className="text-gray-900 font-mono tabular-nums">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </strong>
          ?
        </p>
      </Modal>

      {/* Recordatorio de GPS y Seguridad */}
      <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded-[4px] border border-gray-200">
          <FiMapPin className="w-3 h-3 text-gray-500" />
          <span>GPS activo para validación</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded-[4px] border border-gray-200">
          <FiShield className="w-3 h-3 text-gray-500" />
          <span>Protección VPN/Proxy activa</span>
        </div>
      </div>

      {/* Botones de Marcado */}
      <MarkerActionButtons
        status={status}
        recordData={recordData}
        loading={loading}
        consentStatus={consentStatus}
        biometricEnabled={biometricEnabled}
        hasBiometricRegistered={hasBiometricRegistered}
        onInitiateMark={initiateMark}
      />

      {/* Footer de Estado de Jornada */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <span
          className={`inline-block px-2.5 py-0.5 rounded-[4px] text-[11px] font-semibold tracking-wider uppercase border ${
            status === 'WORKING'
              ? 'bg-green-50 text-green-700 border-green-200'
              : status === 'COMPLETED'
                ? 'bg-gray-100 text-gray-700 border-gray-200'
                : status === 'ON_BREAK'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-gray-50 text-gray-500 border-gray-200'
          }`}
        >
          {status === 'WORKING'
            ? 'Actualmente Trabajando'
            : status === 'ON_BREAK'
              ? 'En Hora de Almuerzo'
              : status === 'COMPLETED'
                ? 'Jornada Completada'
                : 'Sin registrar entrada'}
        </span>

        <button
          type="button"
          onClick={() => setShowConsent(true)}
          className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
        >
          <FiShield className="w-3 h-3" />
          Privacidad y Consentimiento
        </button>
      </div>

      {/* Resumen de Jornada de Hoy */}
      {status !== 'NOT_STARTED' && status !== null && recordData && (
        <AttendanceSummaryCard recordData={recordData} />
      )}

      {/* Modal de Consentimiento de Datos */}
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
