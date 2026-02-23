import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BiometricSettings = () => {
    const [loading, setLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/biometric/status`, config);
            setIsRegistered(res.data.isRegistered);
        } catch (err) {
            console.error('Error fetching biometric status:', err);
        } finally {
            setStatusLoading(false);
        }
    };

    const handleRegister = async () => {
        try {
            setLoading(true);
            setMessage({ type: 'info', text: 'Preparando registro...' });

            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const optionsRes = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/biometric/register/options`, config);
            const options = optionsRes.data;

            setMessage({ type: 'info', text: 'Por favor, use el sensor de su dispositivo...' });

            // Iniciar registro en el navegador (Importación dinámica)
            const { startRegistration } = await import('@simplewebauthn/browser');
            const regResp = await startRegistration({ optionsJSON: options });

            const verifyRes = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/biometric/register/verify`, regResp, config);

            if (verifyRes.data.verified) {
                setMessage({ type: 'success', text: '¡Biometría configurada exitosamente!' });
                setIsRegistered(true);
            } else {
                setMessage({ type: 'error', text: 'No se pudo verificar la credencial.' });
            }
        } catch (err) {
            console.error('Biometric Reg Error:', err);
            const msg = err.response?.data?.message || err.message || 'Error al configurar biometría.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setLoading(false);
        }
    };

    // Simple SVG icons to avoid react-icons build issues
    const IconShield = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    );

    const IconFingerprint = ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
    );

    const IconCheck = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
    );

    const IconAlert = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
    );

    if (statusLoading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <IconShield />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Seguridad Biométrica</h2>
                    <p className="text-sm text-slate-500">
                        {isRegistered ? 'Su biometría está configurada y lista' : 'Configure su huella para marcaciones rápidas y seguras'}
                    </p>
                </div>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' :
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}>
                    {message.type === 'error' ? <IconAlert /> : message.type === 'success' ? <IconCheck /> : <IconFingerprint className="animate-pulse" />}
                    {message.text}
                </div>
            )}

            {!message && isRegistered && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-3 text-sm">
                    <IconCheck />
                    Biometría configurada correctamente en este dispositivo.
                </div>
            )}

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-6">
                <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="text-blue-500"><IconFingerprint /></span> ¿Por qué usar biometría?
                </h3>
                <ul className="text-sm text-slate-600 space-y-2 list-disc ml-5">
                    <li>Marcaciones en un solo toque.</li>
                    <li>Máxima seguridad: solo usted puede registrar su asistencia.</li>
                    <li>Soporta FaceID, TouchID y Windows Hello.</li>
                    <li className="text-amber-600 font-medium italic">Nota: Si añade o cambia biometrías en su dispositivo (ej. nuevo dedo), deberá volver a configurar este acceso por seguridad.</li>
                </ul>
            </div>

            <button
                onClick={handleRegister}
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${loading ? 'bg-slate-400 cursor-not-allowed' :
                    isRegistered ? 'bg-slate-800 hover:bg-slate-700' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                    }`}
            >
                {loading ? 'Procesando...' : (
                    <>
                        <IconFingerprint />
                        {isRegistered ? 'VOLVER A CONFIGURAR HUELLA' : 'CONFIGURAR HUELLA DIGITAL'}
                    </>
                )}
            </button>
        </div>
    );
};

export default BiometricSettings;
