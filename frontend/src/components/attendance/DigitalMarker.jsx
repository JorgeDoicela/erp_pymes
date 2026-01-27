import React, { useState, useEffect } from 'react';
import attendanceService from '../../services/attendance/attendanceService';
import { motion } from 'framer-motion';

const DigitalMarker = ({ user }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    // Si tenemos usuario, usamos su ID directamente (asumiendo user.id o user.employeeId)
    const [employeeId, setEmployeeId] = useState(user?.id || '');
    const [status, setStatus] = useState(null); // 'WORKING', 'COMPLETED', 'NOT_STARTED'
    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState({ type: '', text: '' });
    const [foundEmployee, setFoundEmployee] = useState(null);
    const [recordData, setRecordData] = useState(null);
    const [locationName, setLocationName] = useState(null);

    // Modal State
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // 'ENTRY' or 'EXIT'

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
        }
    }, [user]);

    const checkStatus = async (id = employeeId) => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await attendanceService.getStatus(id);
            if (res.success) {
                setStatus(res.data.status);
                // Save full record data for UI details
                if (res.data) {
                    setRecordData(res.data);
                }
                if (res.data.employee) {
                    setFoundEmployee(res.data.employee);
                    // Also update the employeeId to the internal UUID for marking
                    setEmployeeId(res.data.employee.id);
                }
            }
        } catch (err) {
            console.error(err);
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
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                    const data = await response.json();
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
                { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
            );
        });
    };

    const initiateMark = (type) => {
        setPendingAction(type);
        setShowConfirm(true);
    };

    const confirmMark = async () => {
        setShowConfirm(false);
        if (!pendingAction) return;
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
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Error al registrar asistencia.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-slate-800/50 backdrop-blur-sm border border-white/10 text-white p-8 rounded-2xl shadow-xl">
            {/* Clock */}
            <div className="mb-8 text-center">
                <h2 className="text-xl text-slate-400 font-light tracking-widest uppercase mb-2">Marcador Digital</h2>
                <div className="text-6xl font-bold tracking-tighter text-blue-400 tabular-nums">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="text-slate-500 mt-2 text-lg">
                    {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Input ID (Solo si no hay usuario) */}

            {!user && (
                <div className="w-full mb-8 relative max-w-md mx-auto">
                    {!foundEmployee ? (
                        <>
                            <label className="block text-sm text-slate-400 mb-1 ml-1 text-center">Número de Cédula</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={employeeId}
                                    onChange={(e) => setEmployeeId(e.target.value)}
                                    placeholder="Ingrese su cédula..."
                                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-slate-600 text-center text-lg tracking-widest"
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
                            className="bg-slate-700/50 rounded-xl p-4 border border-white/10 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-xl">
                                    {foundEmployee.firstName[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{foundEmployee.firstName} {foundEmployee.lastName}</h3>
                                    <p className="text-xs text-slate-300">{foundEmployee.position} • {foundEmployee.department}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setFoundEmployee(null); setEmployeeId(''); setStatus(null); setMessage({ type: '', text: '' }); }}
                                className="text-slate-400 hover:text-white px-3 py-1 bg-white/5 rounded-lg text-xs"
                            >
                                Cambiar
                            </button>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Message */}
            {message.text && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-6 px-4 py-3 rounded-lg w-full max-w-sm text-center text-sm font-medium ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}
                >
                    {message.text}
                </motion.div>
            )}

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                    >
                        <h3 className="text-xl font-bold text-white mb-4">Confirmar {
                            pendingAction === 'ENTRY' ? 'Entrada' :
                                pendingAction === 'EXIT' ? 'Salida' :
                                    pendingAction === 'BREAK_START' ? 'Inicio de Almuerzo' : 'Fin de Almuerzo'
                        }</h3>
                        <p className="text-slate-300 mb-6">
                            ¿Confirmas registrar tu {
                                pendingAction === 'ENTRY' ? 'entrada' :
                                    pendingAction === 'EXIT' ? 'salida' :
                                        pendingAction === 'BREAK_START' ? 'inicio de almuerzo' : 'fin de almuerzo'
                            } a las <strong className="text-white">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => { setShowConfirm(false); setPendingAction(null); }}
                                className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
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

            {/* Buttons */}

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                {/* Entry Button */}
                {(status === 'NOT_STARTED' || status === 'COMPLETED' || status === null) && (
                    <button
                        onClick={() => initiateMark('ENTRY')}
                        disabled={loading || status === 'COMPLETED'}
                        className={`
                            col-span-2 py-6 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex flex-col items-center gap-2 border border-white/5
                            ${status === 'COMPLETED'
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                                : 'bg-gradient-to-br from-emerald-500/80 to-emerald-600/80 hover:from-emerald-400 hover:to-emerald-500 text-white hover:shadow-emerald-500/20'}
                        `}
                    >
                        <span className="text-2xl"></span>
                        ENTRADA
                    </button>
                )}

                {/* Working Actions */}
                {status === 'WORKING' && (
                    <>
                        <button
                            onClick={() => initiateMark('BREAK_START')}
                            disabled={loading}
                            className="py-6 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex flex-col items-center gap-2 border border-white/5 bg-gradient-to-br from-blue-500/80 to-blue-600/80 hover:from-blue-400 hover:to-blue-500 text-white hover:shadow-blue-500/20"
                        >
                            <span className="text-2xl"></span>
                            ALMUERZO
                        </button>
                        <button
                            onClick={() => initiateMark('EXIT')}
                            disabled={loading}
                            className="py-6 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex flex-col items-center gap-2 border border-white/5 bg-gradient-to-br from-amber-500/80 to-amber-600/80 hover:from-amber-400 hover:to-amber-500 text-white hover:shadow-amber-500/20"
                        >
                            <span className="text-2xl"></span>
                            SALIDA
                        </button>
                    </>
                )}

                {/* On Break Actions */}
                {status === 'ON_BREAK' && (
                    <button
                        onClick={() => initiateMark('BREAK_END')}
                        disabled={loading}
                        className="col-span-2 py-6 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex flex-col items-center gap-2 border border-white/5 bg-gradient-to-br from-indigo-500/80 to-indigo-600/80 hover:from-indigo-400 hover:to-indigo-500 text-white hover:shadow-indigo-500/20"
                    >
                        <span className="text-2xl">🔙</span>
                        REGRESAR DEL ALMUERZO
                    </button>
                )}
            </div>

            {/* Status Footer */}
            <div className="mt-8 text-center">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${status === 'WORKING' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/20' :
                    status === 'COMPLETED' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20' :
                        status === 'ON_BREAK' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20' :
                            'bg-slate-700 text-slate-400 border border-white/5'
                    }`}>
                    {status === 'WORKING' ? 'Actualmente Trabajando' :
                        status === 'ON_BREAK' ? 'En Hora de Almuerzo' :
                            status === 'COMPLETED' ? 'Jornada Completada' :
                                'Sin registrar entrada'}
                </span>
            </div>

            {/* In-situ History & Details */}
            {status !== 'NOT_STARTED' && status !== null && recordData && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 w-full max-w-md bg-slate-700/30 rounded-lg p-4 text-sm border border-white/5"
                >
                    <h4 className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-3 border-b border-white/5 pb-2">
                        Resumen de Hoy
                    </h4>
                    <div className="space-y-3">
                        {/* Entry Info */}
                        {recordData.checkIn && (
                            <div className="flex justify-between items-center">
                                <span className="text-slate-300">Entrada:</span>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-white">
                                            {new Date(recordData.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {/* Lateness Badge */}
                                        {recordData.isLate ? (
                                            <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded border border-amber-500/30">
                                                Tardío
                                            </span>
                                        ) : (
                                            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/30">
                                                Puntual
                                            </span>
                                        )}
                                    </div>
                                    {/* Location Info */}
                                    {recordData.entryLocation && (
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 text-right w-full justify-end" title={locationName || `${recordData.entryLocation.lat}, ${recordData.entryLocation.lng}`}>
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

                        {/* Exit Info if exists */}
                        {recordData.checkOut && (
                            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                <span className="text-slate-300">Salida:</span>
                                <div className="flex flex-col items-end">
                                    <span className="font-mono font-bold text-white">
                                        {new Date(recordData.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default DigitalMarker;
