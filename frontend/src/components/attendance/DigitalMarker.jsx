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
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleMark = async (type) => {
        const targetId = user?.id || employeeId;

        if (!targetId) {
            setMessage({ type: 'error', text: 'Por favor ingrese su ID de empleado.' });
            return;
        }
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await attendanceService.markAttendance(targetId, type);
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
                <div className="w-full mb-8 relative max-w-xs mx-auto">
                    <label className="block text-sm text-slate-400 mb-1 ml-1">ID de Empleado</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            placeholder="Ingrese su ID..."
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-slate-600"
                        />
                        <button
                            onClick={() => checkStatus()}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-4 rounded-lg transition-colors"
                            title="Verificar Estado"
                        >
                            Buscar
                        </button>
                    </div>
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

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <button
                    onClick={() => handleMark('ENTRY')}
                    disabled={loading || status === 'WORKING' || status === 'COMPLETED'}
                    className={`
            py-6 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex flex-col items-center gap-2 border border-white/5
            ${status === 'WORKING' || status === 'COMPLETED'
                            ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-br from-emerald-500/80 to-emerald-600/80 hover:from-emerald-400 hover:to-emerald-500 text-white hover:shadow-emerald-500/20'}
          `}
                >
                    <span className="text-2xl">☀️</span>
                    ENTRADA
                </button>

                <button
                    onClick={() => handleMark('EXIT')}
                    disabled={loading || status !== 'WORKING'}
                    className={`
            py-6 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex flex-col items-center gap-2 border border-white/5
            ${status !== 'WORKING'
                            ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-br from-amber-500/80 to-amber-600/80 hover:from-amber-400 hover:to-amber-500 text-white hover:shadow-amber-500/20'}
          `}
                >
                    <span className="text-2xl">Noche</span>
                    SALIDA
                </button>
            </div>

            {/* Status Footer */}
            <div className="mt-8 text-center">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${status === 'WORKING' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/20' :
                    status === 'COMPLETED' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20' :
                        'bg-slate-700 text-slate-400 border border-white/5'
                    }`}>
                    {status === 'WORKING' ? 'Actualmente Trabajando' :
                        status === 'COMPLETED' ? 'Jornada Completada' :
                            'Sin registrar entrada'}
                </span>
            </div>
        </div>
    );
};

export default DigitalMarker;
