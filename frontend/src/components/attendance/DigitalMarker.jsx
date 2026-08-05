import React, { useState, useEffect } from 'react';
import attendanceService from '../../services/attendance/attendanceService';
import systemService from '../../services/systemService';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { updateConsentTracking } from '../../services/employees/employee.service';
import { FiShield, FiMapPin, FiCheckCircle, FiLock, FiX } from 'react-icons/fi';
import { MdFingerprint } from 'react-icons/md';

const DigitalMarker = ({ user }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [employeeId, setEmployeeId] = useState(user?.id || '');
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showConsent, setShowConsent] = useState(false);
    const [consenting, setConsenting] = useState(false);
    const [consentStatus, setConsentStatus] = useState(user?.trackingConsent || false);

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

    // Fetch status on mount if user exists
    useEffect(() => {
        if (user?.id) {
            setEmployeeId(user.id);
            checkStatus(user.id);
            // Check if user has consented
            if (user.trackingConsent === false) {
                setShowConsent(true);
            }
        }
    }, [user]);

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
            const targetId = user?.id || employeeId;
            // 1. Obtener opciones del servidor
            const optionsRes = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/biometric/login/options`, {
                employeeId: targetId
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

    const initiateMark = (type) => {
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
        const targetId = user?.id || employeeId;

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
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-white backdrop-blur-sm border border-slate-200 text-slate-900 p-4 sm:p-8 rounded-2xl shadow-sm">
            {/* Clock */}
            <div className="mb-6 sm:mb-8 text-center">
                <h2 className="text-sm sm:text-xl text-slate-500 font-light tracking-widest uppercase mb-2">Marcador Digital</h2>
                <div className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tighter text-blue-600 tabular-nums">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="text-slate-500 mt-2 text-base md:text-lg">
                    {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                {/* Biometric badge */}
                {biometricEnabled && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                            <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                        </svg>
                        Verificación biométrica activa
                    </div>
                )}
            </div>

            {/* Input ID (Solo si no hay usuario) */}

            {!user && (
                <div className="w-full mb-8 relative max-w-md mx-auto">
                    {!foundEmployee ? (
                        <>
                            <label className="block text-sm text-slate-600 mb-1 ml-1 text-center">Número de Cédula</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={employeeId}
                                    onChange={(e) => setEmployeeId(e.target.value)}
                                    placeholder="Ingrese su cédula..."
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-slate-400 text-center text-lg tracking-widest"
                                />
                                <button
                                    onClick={() => checkStatus()}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-lg transition-colors font-bold shadow-lg shadow-blue-500/20"
                                >
                                    Buscar
                                </button>
                            </div>
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white text-xl">
                                    {foundEmployee.firstName[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{foundEmployee.firstName} {foundEmployee.lastName}</h3>
                                    <p className="text-xs text-slate-500">{foundEmployee.position} • {foundEmployee.department}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setFoundEmployee(null); setEmployeeId(''); setStatus(null); setMessage({ type: '', text: '' }); }}
                                className="text-slate-500 hover:text-blue-600 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs transition-colors"
                            >
                                Cambiar
                            </button>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Message */}
            {message.text && (
                <div className="w-full max-w-sm mb-6">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`px-4 py-3 rounded-lg text-center text-sm font-medium ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : message.type === 'info' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}
                    >
                        {message.text}
                    </motion.div>

                    {message.showMapLink && (
                        <div className="mt-2 flex justify-center gap-3">
                            <a
                                href={`https://www.google.com/maps?q=${message.lastCoords.latitude},${message.lastCoords.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                Ver donde estoy según GPS
                            </a>
                        </div>
                    )}
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-xl"
                    >
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Confirmar {
                            pendingAction === 'ENTRY' ? 'Entrada' :
                                pendingAction === 'EXIT' ? 'Salida' :
                                    pendingAction === 'BREAK_START' ? 'Inicio de Almuerzo' : 'Fin de Almuerzo'
                        }</h3>
                        <p className="text-slate-600 mb-6">
                            ¿Confirmas registrar tu {
                                pendingAction === 'ENTRY' ? 'entrada' :
                                    pendingAction === 'EXIT' ? 'salida' :
                                        pendingAction === 'BREAK_START' ? 'inicio de almuerzo' : 'fin de almuerzo'
                            } a las <strong className="text-slate-900">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => { setShowConfirm(false); setPendingAction(null); }}
                                className="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmMark}
                                className={`px-4 py-2 rounded-lg font-bold text-white shadow-lg ${pendingAction === 'ENTRY'
                                    ? 'bg-emerald-600 hover:bg-emerald-500'
                                    : 'bg-amber-600 hover:bg-amber-500'
                                    }`}
                            >
                                Confirmar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* GPS Reminder */}
            <div className="mb-6 flex flex-col sm:flex-row items-center justify-center gap-2">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span>GPS activo para validación</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
                    <FiShield className="h-3.5 w-3.5" />
                    <span>Bloqueo de VPN/Proxy activo</span>
                </div>
            </div>

            {/* Buttons */}

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                {/* Entry Button */}
                {(status === 'NOT_STARTED' || status === 'COMPLETED' || status === null) && (
                    <button
                        onClick={() => initiateMark('ENTRY')}
                        disabled={loading || status === 'COMPLETED' || !consentStatus}
                        className={`
                            col-span-2 py-6 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex flex-col items-center gap-2
                            ${(status === 'COMPLETED' || !consentStatus)
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                : 'bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-emerald-500/20'}
                        `}
                    >
                        <span className="text-2xl">{!consentStatus && <FiLock className="mb-1" />}</span>
                        ENTRADA
                    </button>
                )}

                {/* Working Actions */}
                {status === 'WORKING' && (
                    <>
                        {/* Only show lunch button if they haven't started lunch yet today */}
                        {!recordData?.breakStart && (
                            <button
                                onClick={() => initiateMark('BREAK_START')}
                                disabled={loading || !consentStatus}
                                className={`py-6 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex flex-col items-center gap-2 ${!consentStatus ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-blue-500/20'}`}
                            >
                                <span className="text-2xl">{!consentStatus && <FiLock />}</span>
                                ALMUERZO
                            </button>
                        )}
                        <button
                            onClick={() => initiateMark('EXIT')}
                            disabled={loading || !consentStatus}
                            className={`py-6 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex flex-col items-center gap-2 ${!consentStatus ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-amber-500/20'} ${!recordData?.breakStart ? '' : 'col-span-2'}`}
                        >
                            <span className="text-2xl">{!consentStatus && <FiLock />}</span>
                            SALIDA
                        </button>
                    </>
                )}

                {/* On Break Actions */}
                {status === 'ON_BREAK' && (
                    <button
                        onClick={() => initiateMark('BREAK_END')}
                        disabled={loading}
                        className="col-span-2 py-6 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex flex-col items-center gap-2 bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white shadow-indigo-500/20"
                    >
                        <span className="text-2xl">🔙</span>
                        REGRESAR DEL ALMUERZO
                    </button>
                )}
            </div>

            {/* Status Footer */}
            <div className="mt-8 flex flex-col items-center gap-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${status === 'WORKING' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    status === 'COMPLETED' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        status === 'ON_BREAK' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                    {status === 'WORKING' ? 'Actualmente Trabajando' :
                        status === 'ON_BREAK' ? 'En Hora de Almuerzo' :
                            status === 'COMPLETED' ? 'Jornada Completada' :
                                'Sin registrar entrada'}
                </span>

                <button
                    onClick={() => setShowConsent(true)}
                    className="flex items-center gap-2 text-[10px] text-slate-400 hover:text-blue-500 transition-colors uppercase tracking-widest font-bold"
                >
                    <FiShield size={12} />
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
