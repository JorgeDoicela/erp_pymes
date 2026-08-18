/**
 * @file DigitalMarker.jsx
 * @description Marcador Digital de Asistencia con Verificación de Geocercas (GPS), Detección de Spoofing y Biometría WebAuthn.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState, useEffect } from 'react';
import attendanceService from '../../services/attendance/attendanceService';
import systemService from '../../services/systemService';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { updateConsentTracking } from '../../services/employees/employee.service';
import { FiShield, FiMapPin, FiCheckCircle, FiLock, FiX } from 'react-icons/fi';
import { MdFingerprint } from 'react-icons/md';

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
    const [employeeId, setEmployeeId] = useState(autoLoadUser ? (currentUser?.id || '') : '');
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showConsent, setShowConsent] = useState(false);
    const [consenting, setConsenting] = useState(false);
    const [consentStatus, setConsentStatus] = useState(currentUser?.trackingConsent || false);

    const [message, setMessage] = useState({ type: '', text: '' });
    const [foundEmployee, setFoundEmployee] = useState(null);
    const [recordData, setRecordData] = useState(null);
    const [locationName, setLocationName] = useState(null);

    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // 'ENTRY' or 'EXIT'

    const handleAcceptConsent = async () => {
        setConsenting(true);
        try {
            await updateConsentTracking(true);

            // Actualizar localStorage para que persista en la sesión actual
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            savedUser.trackingConsent = true;
            localStorage.setItem('user', JSON.stringify(savedUser));
            setConsentStatus(true);

            setShowConsent(false);
            setMessage({ type: 'success', text: 'Consentimiento registrado correctamente.' });
        } catch (err) {
            setMessage({ type: 'error', text: 'No se pudo registrar el consentimiento.' });
        } finally {
            setConsenting(false);
        }
    };

    const handleRejectConsent = async () => {
        setConsenting(true);
        try {
            await updateConsentTracking(false);

            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            savedUser.trackingConsent = false;
            localStorage.setItem('user', JSON.stringify(savedUser));
            setConsentStatus(false);

            setShowConsent(false);
            setMessage({ type: 'info', text: 'Consentimiento retirado. No podrá marcar asistencia sin aceptar los términos.' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Error al procesar la solicitud.' });
        } finally {
            setConsenting(false);
        }
    };

    // Biometric
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [biometricSupported, setBiometricSupported] = useState(false);

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch status on mount if autoLoadUser is true and user exists
    useEffect(() => {
        if (autoLoadUser && currentUser?.id) {
            setEmployeeId(currentUser.id);
            checkStatus(currentUser.id);
            // Check if user has consented
            if (currentUser.trackingConsent === false) {
                setShowConsent(true);
            }
        }
    }, [user, autoLoadUser]);

    // Fetch biometric setting on mount
    useEffect(() => {
        const fetchBiometricSetting = async () => {
            try {
                const res = await systemService.getBiometricSetting();
                setBiometricEnabled(res.biometricEnabled ?? false);
            } catch {
                setBiometricEnabled(false);
            }
        };
        fetchBiometricSetting();

        // Check if device has ANY user-verifying platform authenticator
        // (fingerprint, face ID, PIN, password, pattern — anything the OS security system offers)
        const checkSupport = async () => {
            try {
                if (
                    typeof window !== 'undefined' &&
                    window.PublicKeyCredential &&
                    typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
                ) {
                    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                    setBiometricSupported(available);
                } else {
                    setBiometricSupported(false);
                }
            } catch {
                setBiometricSupported(false);
            }
        };
        checkSupport();
    }, []);

    const checkStatus = async (id = employeeId) => {
        const cleanId = id?.toString().trim();
        if (!cleanId) return;
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await attendanceService.getStatus(cleanId);
            if (res.success) {
                setStatus(res.data.status);
                if (res.data) {
                    setRecordData(res.data);
                }
                if (res.data.employee) {
                    setFoundEmployee(res.data.employee);
                    setEmployeeId(res.data.employee.id);
                }
            } else {
                const errMsg = res.message || res.error || 'Empleado no encontrado. Verifique la cédula ingresada.';
                setMessage({ type: 'error', text: errMsg });
            }
        } catch (err) {
            setMessage({ type: 'error', text: err?.message || 'Error al buscar empleado.' });
        } finally {
            setLoading(false);
        }
    };


    // Effect to reverse geocode when recordData has entryLocation
    useEffect(() => {
        const fetchLocationName = async () => {
            if (recordData?.entryLocation && !locationName) {
                try {
                    const { lat, lng } = recordData.entryLocation;
                    // Use backend proxy to avoid CORS and add User-Agent
                    const data = await systemService.reverseGeocode(lat, lng);

                    if (data && data.display_name) {
                        // Clean up address: take first 3 parts or specific fields
                        const name = data.display_name.split(',').slice(0, 3).join(',');
                        setLocationName(name);
                    }
                } catch (error) {
                    console.error("Error creating address from coordinates:", error);
                }
            }
        };
        fetchLocationName();
    }, [recordData]);

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
                        longitude: position.coords.longitude
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

    const triggerBiometric = async () => {
        if (!biometricSupported) {
            return {
                passed: false,
                reason: 'Este dispositivo no tiene seguridad configurada.'
            };
        }

        try {
            // El usuario que valida con su huella/FaceID es la persona autenticada en el dispositivo (ej. Administrador/Supervisor)
            const biometricUserId = currentUser?.id || foundEmployee?.id || employeeId;
            // 1. Obtener opciones del servidor para la persona presente en el dispositivo
            const optionsRes = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/biometric/login/options`, {
                employeeId: biometricUserId
            });

            const options = optionsRes.data;

            // 2. Ejecutar WebAuthn en el navegador
            const { startAuthentication } = await import('@simplewebauthn/browser');

            // Separar metadatos internos de las opciones de WebAuthn
            const { internalUserId, ...webauthnOptions } = options;
            const asseResp = await startAuthentication({ optionsJSON: webauthnOptions });

            // 3. Verificar en el servidor
            const verifyRes = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/biometric/login/verify`, {
                body: asseResp,
                internalUserId: options.internalUserId
            });

            if (verifyRes.data.verified) {
                return { passed: true };
            } else {
                return { passed: false, reason: 'Error de verificación biométrica.' };
            }
        } catch (err) {
            console.error('Biometric Auth Error:', err);
            const data = err.response?.data;
            if (data?.requiresReRegistration) {
                return {
                    passed: false,
                    reason: data.message || 'Tu biometría ha cambiado. Ve a tu perfil y vuelve a configurar tu huella para continuar.'
                };
            }
            const msg = data?.message || 'Error al verificar identidad.';
            return { passed: false, reason: msg };
        }
    };

    const isAdminOrSuperAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || currentUser?.email === 'admin@emplifi.com';
    const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.email === 'admin@emplifi.com';

    const initiateMark = (type) => {
        if (isSuperAdmin && !foundEmployee) {
            setMessage({
                type: 'error',
                text: 'Modo Supervisión: El SuperAdministrador debe buscar la cédula del empleado para registrar su asistencia.'
            });
            return;
        }
        setPendingAction(type);
        setShowConfirm(true);
    };

    const confirmMark = async () => {
        setShowConfirm(false);
        if (!pendingAction) return;

        // If biometric is enabled, it is MANDATORY — no fallback
        if (biometricEnabled) {
            setMessage({ type: 'info', text: 'Verificando identidad biométrica...' });
            const result = await triggerBiometric();
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
            // Intentar obtener ubicación, pero no bloquear si falla (o sí, según requerimiento. Asumiremos obligatorio para este feature)
            // Si el user pidió Geolocalización explícitamente, quizás sea obligatorio. 
            // Hagámoslo "soft" por ahora: intentamos, si falla, avisamos pero permitimos marcar o no?
            // User request: "Permite verificar..." -> Insinúa que debería estar.
            // Voy a hacerlo obligatorio si el navegador lo soporta, para cumplir el requerimiento de seguridad.
            location = await getLocation();
        } catch (locError) {
            console.warn("Location error:", locError);
            // Opción: Fallar si no hay ubicación
            setMessage({ type: 'error', text: `Error de Ubicación: ${locError.message}. Se requiere GPS activado.` });
            setLoading(false);
            return;
        }

        setMessage({ type: '', text: '' });
        try {
            const res = await attendanceService.markAttendance(targetId, type, location);
            if (res.success) {
                setMessage({ type: 'success', text: res.message + (res.workedHours ? ` (${res.workedHours} hrs)` : '') });
                // Refresh status
                await checkStatus(targetId);
            } else {
                let errorMsg = res.message || 'Error al registrar asistencia.';
                // Si el error es de ubicación (del backend), añadimos un link de ayuda
                if (errorMsg.includes('Ubicación no permitida') && location) {
                    errorMsg += ` (Tus coordenadas: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)})`;
                    setMessage({
                        type: 'error',
                        text: errorMsg,
                        showMapLink: true,
                        lastCoords: location
                    });
                } else {
                    setMessage({ type: 'error', text: errorMsg });
                }
            }
        } catch (err) {
            setMessage({ type: 'error', text: err?.message || 'Error inesperado al registrar asistencia.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full bg-white border border-gray-200 text-gray-900 p-6 sm:p-8 rounded">
            {/* Clock */}
            <div className="mb-6 text-center">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Marcador Digital de Jornada</div>
                <div className="text-4xl sm:text-5xl font-bold font-mono tracking-tight text-gray-900 tabular-nums">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="text-gray-500 mt-1 text-xs">
                    {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                {/* Biometric badge */}
                {biometricEnabled && (
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-gray-50 border border-gray-200 text-gray-700 text-[11px] font-medium">
                        <FiLock className="w-3 h-3 text-blue-600" />
                        Verificación biométrica activa
                    </div>
                )}
            </div>

            {/* Buscador de Empleado (Público o Modo Administrador) */}
            {allowSearch && (!user || isAdminOrSuperAdmin) && (
                <div className="w-full mb-6 relative max-w-md mx-auto">
                    {!foundEmployee ? (
                        <>
                            <label className="block text-xs font-medium text-gray-600 mb-1 text-center">
                                {isAdminOrSuperAdmin ? 'Buscar Empleado por Número de Cédula' : 'Número de Cédula'}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={employeeId}
                                    onChange={(e) => setEmployeeId(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') checkStatus(); }}
                                    placeholder="Ingrese número de cédula..."
                                    className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-center font-mono"
                                />
                                <button
                                    onClick={() => checkStatus()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer"
                                >
                                    Buscar
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="bg-gray-50 rounded p-3 border border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded bg-gray-200 text-gray-800 font-mono font-semibold text-xs flex items-center justify-center">
                                    {foundEmployee.firstName[0]}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-xs text-gray-900">{foundEmployee.firstName} {foundEmployee.lastName}</h3>
                                    <p className="text-[11px] text-gray-500">{foundEmployee.position} • {foundEmployee.department}</p>
                                </div>
                            </div>
                            {allowSearch && (
                                <button
                                    onClick={() => { setFoundEmployee(null); setEmployeeId(''); setStatus(null); setMessage({ type: '', text: '' }); }}
                                    className="text-gray-600 hover:text-gray-900 px-2.5 py-1 bg-white border border-gray-200 rounded text-xs transition-colors cursor-pointer"
                                >
                                    Cambiar
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Message */}
            {message.text && (
                <div className="w-full max-w-md mb-4">
                    <div className={`px-3.5 py-2 rounded text-center text-xs font-medium border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : message.type === 'info' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                        {message.text}
                    </div>

                    {message.showMapLink && (
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

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-gray-200 rounded p-5 max-w-sm w-full shadow-xl">
                        <h3 className="text-sm font-bold text-gray-900 mb-2">Confirmar {
                            pendingAction === 'ENTRY' ? 'Entrada' :
                                pendingAction === 'EXIT' ? 'Salida' :
                                    pendingAction === 'BREAK_START' ? 'Inicio de Almuerzo' : 'Fin de Almuerzo'
                        }</h3>
                        <p className="text-xs text-gray-600 mb-5">
                            ¿Confirmas registrar tu {
                                pendingAction === 'ENTRY' ? 'entrada' :
                                    pendingAction === 'EXIT' ? 'salida' :
                                        pendingAction === 'BREAK_START' ? 'inicio de almuerzo' : 'fin de almuerzo'
                            } a las <strong className="text-gray-900 font-mono">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>?
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => { setShowConfirm(false); setPendingAction(null); }}
                                className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmMark}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* GPS Reminder */}
            <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded border border-gray-200">
                    <FiMapPin className="w-3 h-3 text-gray-500" />
                    <span>GPS activo para validación</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded border border-gray-200">
                    <FiShield className="w-3 h-3 text-gray-500" />
                    <span>Protección VPN/Proxy activa</span>
                </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                {/* Entry Button */}
                {(status === 'NOT_STARTED' || status === 'COMPLETED' || status === null) && (
                    <button
                        onClick={() => initiateMark('ENTRY')}
                        disabled={loading || status === 'COMPLETED' || !consentStatus}
                        className={`
                            col-span-2 py-3 rounded font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer
                            ${(status === 'COMPLETED' || !consentStatus)
                                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'}
                        `}
                    >
                        {!consentStatus && <FiLock className="w-3.5 h-3.5" />}
                        REGISTRAR ENTRADA
                    </button>
                )}

                {/* Working Actions */}
                {status === 'WORKING' && (
                    <>
                        {!recordData?.breakStart && (
                            <button
                                onClick={() => initiateMark('BREAK_START')}
                                disabled={loading || !consentStatus}
                                className={`py-3 rounded font-semibold text-xs border transition-colors flex items-center justify-center gap-2 cursor-pointer ${!consentStatus ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                                {!consentStatus && <FiLock className="w-3.5 h-3.5" />}
                                INICIAR ALMUERZO
                            </button>
                        )}
                        <button
                            onClick={() => initiateMark('EXIT')}
                            disabled={loading || !consentStatus}
                            className={`py-3 rounded font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${!consentStatus ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-blue-600 hover:bg-blue-700 text-white'} ${!recordData?.breakStart ? '' : 'col-span-2'}`}
                        >
                            {!consentStatus && <FiLock className="w-3.5 h-3.5" />}
                            REGISTRAR SALIDA
                        </button>
                    </>
                )}

                {/* On Break Actions */}
                {status === 'ON_BREAK' && (
                    <button
                        onClick={() => initiateMark('BREAK_END')}
                        disabled={loading}
                        className="col-span-2 py-3 rounded font-semibold text-xs bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                        FINALIZAR ALMUERZO
                    </button>
                )}
            </div>

            {/* Status Footer */}
            <div className="mt-6 flex flex-col items-center gap-3">
                <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase border ${status === 'WORKING' ? 'bg-green-50 text-green-700 border-green-200' :
                    status === 'COMPLETED' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                        status === 'ON_BREAK' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-gray-50 text-gray-500 border-gray-200'
                    }`}>
                    {status === 'WORKING' ? 'Actualmente Trabajando' :
                        status === 'ON_BREAK' ? 'En Hora de Almuerzo' :
                            status === 'COMPLETED' ? 'Jornada Completada' :
                                'Sin registrar entrada'}
                </span>

                <button
                    onClick={() => setShowConsent(true)}
                    className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
                >
                    <FiShield className="w-3 h-3" />
                    Privacidad y Consentimiento
                </button>
            </div>

            {/* In-situ History & Details */}
            {status !== 'NOT_STARTED' && status !== null && recordData && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 w-full max-w-md bg-slate-50 rounded-lg p-4 text-sm border border-slate-200"
                >
                    <h4 className="text-slate-500 text-xs uppercase tracking-wider font-bold mb-3 border-b border-slate-200 pb-2">
                        Resumen de Hoy
                    </h4>
                    <div className="space-y-3">
                        {/* Entry Info */}
                        {recordData.checkIn && (
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Entrada:</span>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-slate-800">
                                            {new Date(recordData.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {/* Lateness Badge */}
                                        {recordData.isLate ? (
                                            <span className="bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded border border-amber-200">
                                                Tardío
                                            </span>
                                        ) : (
                                            <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded border border-emerald-200">
                                                Puntual
                                            </span>
                                        )}
                                    </div>
                                    {/* Location Info */}
                                    {recordData.entryLocation && (
                                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5 text-right w-full justify-end" title={locationName || `${recordData.entryLocation.lat}, ${recordData.entryLocation.lng}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 flex-shrink-0">
                                                <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.62.829.799 1.654 1.38 2.274 1.766a11.267 11.267 0 00.758.434l.024.01.003.001zM6 9a4 4 0 118 0 4 4 0 01-8 0z" clipRule="evenodd" />
                                            </svg>
                                            <span className="max-w-[250px] break-words">
                                                {locationName || `${recordData.entryLocation.lat.toFixed(4)}, ${recordData.entryLocation.lng.toFixed(4)}`}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Lunch Info if exists */}
                        {recordData.breakStart && (
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                <span className="text-slate-500">Almuerzo:</span>
                                <div className="flex flex-col items-end">
                                    <span className="font-mono text-slate-800">
                                        {new Date(recordData.breakStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {recordData.breakEnd && ` - ${new Date(recordData.breakEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Exit Info if exists */}
                        {recordData.checkOut && (
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                <span className="text-slate-500">Salida:</span>
                                <div className="flex flex-col items-end">
                                    <span className="font-mono font-bold text-slate-800">
                                        {new Date(recordData.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Tracking Consent Modal */}
            <AnimatePresence>
                {showConsent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[99] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.96, opacity: 0, y: 10 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/90 relative overflow-hidden my-auto"
                        >
                            {/* Subtle Top Border */}
                            <div className="h-1 w-full bg-slate-800" />

                            <div className="p-5 space-y-4">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
                                            <FiShield size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900 leading-tight">
                                                Protección de Datos y Consentimiento
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                Tratamiento de información laboral
                                            </p>
                                        </div>
                                    </div>
                                    {!consentStatus && (
                                        <button
                                            onClick={() => setShowConsent(false)}
                                            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
                                            title="Cerrar"
                                        >
                                            <FiX size={16} />
                                        </button>
                                    )}
                                </div>

                                {/* Compact Features List */}
                                <div className="space-y-2 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                                    <div className="flex items-start gap-2.5">
                                        <MdFingerprint size={16} className="text-slate-700 shrink-0 mt-0.5" />
                                        <p className="text-slate-700 leading-snug">
                                            <strong className="text-slate-900">Biometría local:</strong> Confirmación de identidad de forma privada en tu dispositivo.
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-2.5 border-t border-slate-200/60 pt-2">
                                        <FiMapPin size={15} className="text-slate-700 shrink-0 mt-0.5" />
                                        <p className="text-slate-700 leading-snug">
                                            <strong className="text-slate-900">Geolocalización:</strong> Captura de ubicación únicamente al registrar entrada/salida.
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-2.5 border-t border-slate-200/60 pt-2">
                                        <FiLock size={15} className="text-slate-700 shrink-0 mt-0.5" />
                                        <p className="text-slate-700 leading-snug">
                                            <strong className="text-slate-900">Confidencialidad:</strong> Uso estrictamente laboral sin seguimiento fuera del marcado.
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="space-y-2 pt-1">
                                    <button
                                        onClick={handleAcceptConsent}
                                        disabled={consenting}
                                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.99] cursor-pointer"
                                    >
                                        {consenting ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <FiCheckCircle size={15} />
                                                <span>{consentStatus ? 'Actualizar Consentimiento' : 'Aceptar y Autorizar'}</span>
                                            </>
                                        )}
                                    </button>

                                    {consentStatus ? (
                                        <button
                                            onClick={handleRejectConsent}
                                            disabled={consenting}
                                            className="w-full py-1.5 text-slate-500 hover:text-red-600 text-xs font-medium text-center transition-colors cursor-pointer"
                                        >
                                            Retirar consentimiento
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setShowConsent(false)}
                                            className="w-full py-1 text-slate-400 hover:text-slate-600 text-xs font-medium text-center transition-colors cursor-pointer"
                                        >
                                            Cerrar sin aceptar
                                        </button>
                                    )}

                                    <p className="text-[10px] text-center text-slate-400 pt-0.5 leading-tight">
                                        Información tratada según la política de privacidad de la empresa.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DigitalMarker;
