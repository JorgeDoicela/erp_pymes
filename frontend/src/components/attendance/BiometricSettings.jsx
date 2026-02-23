import React, { useState } from 'react';
import axios from 'axios';
import { startRegistration } from '@simplewebauthn/browser';
import { FiFingerprint, FiCheckCircle, FiAlertCircle, FiShield } from 'react-icons/fi';

const BiometricSettings = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleRegister = async () => {
        try {
            setLoading(true);
            setMessage({ type: 'info', text: 'Preparando registro...' });

            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // 1. Obtener opciones del servidor
            const optionsRes = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/biometric/register/options`, config);
            const options = optionsRes.data;

            setMessage({ type: 'info', text: 'Por favor, use el sensor de su dispositivo...' });

            // 2. Iniciar registro en el navegador
            const regResp = await startRegistration(options);

            // 3. Enviar al servidor para verificar y guardar
            const verifyRes = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/biometric/register/verify`, regResp, config);

            if (verifyRes.data.verified) {
                setMessage({ type: 'success', text: '¡Biometría configurada exitosamente!' });
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

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <FiShield size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Seguridad Biométrica</h2>
                    <p className="text-sm text-slate-500">Configure su huella para marcaciones rápidas y seguras</p>
                </div>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' :
                        message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}>
                    {message.type === 'error' ? <FiAlertCircle /> : message.type === 'success' ? <FiCheckCircle /> : <FiFingerprint className="animate-pulse" />}
                    {message.text}
                </div>
            )}

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-6">
                <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <FiFingerprint className="text-blue-500" /> ¿Por qué usar biometría?
                </h3>
                <ul className="text-sm text-slate-600 space-y-2 list-disc ml-5">
                    <li>Marcaciones en un solo toque.</li>
                    <li>Máxima seguridad: solo usted puede registrar su asistencia.</li>
                    <li>Soporta FaceID, TouchID y Windows Hello.</li>
                    <li>Detección automática de cambios en la configuración del dispositivo.</li>
                </ul>
            </div>

            <button
                onClick={handleRegister}
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                    }`}
            >
                {loading ? 'Procesando...' : (
                    <>
                        <FiFingerprint size={20} />
                        CONFIGURAR HUELLA DIGITAL
                    </>
                )}
            </button>
        </div>
    );
};

export default BiometricSettings;
