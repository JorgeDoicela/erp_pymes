import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSettings, FiFingerprint, FiSave, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import systemService from '../../services/systemService';

const AdminSettings = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await systemService.getSettings();
                if (res.success) {
                    setSettings(res.data);
                }
            } catch (err) {
                setMessage({ type: 'error', text: 'Error al cargar la configuración.' });
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleToggle = (field) => {
        setSettings(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await systemService.updateSettings({
                biometricEnabled: settings.biometricEnabled,
                maintenanceMode: settings.maintenanceMode,
                maintenanceMessage: settings.maintenanceMessage,
            });
            if (res.success) {
                setSettings(res.data);
                setMessage({ type: 'success', text: 'Configuración guardada correctamente.' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error al guardar la configuración.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <FiSettings className="text-slate-500" />
                        Configuración del Sistema
                    </h2>
                    <p className="text-slate-500 text-sm">Administra las opciones globales del sistema</p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors text-sm font-medium"
                >
                    Volver
                </button>
            </header>

            {/* Message */}
            {message.text && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${message.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                >
                    {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                    {message.text}
                </motion.div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
                    Cargando configuración...
                </div>
            ) : settings ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    {/* Biometric Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${settings.biometricEnabled ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'} transition-colors`}>
                                    <FiFingerprint size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-base">Autenticación Biométrica</h3>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Cuando está activa, los empleados deben verificar su identidad con huella dactilar
                                        o reconocimiento facial antes de registrar su asistencia.
                                        Si el dispositivo no soporta biometría, se permite marcar normalmente.
                                    </p>
                                    <span className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${settings.biometricEnabled
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {settings.biometricEnabled ? 'Activada' : 'Desactivada'}
                                    </span>
                                </div>
                            </div>
                            {/* Toggle */}
                            <button
                                onClick={() => handleToggle('biometricEnabled')}
                                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.biometricEnabled ? 'bg-blue-600' : 'bg-slate-200'
                                    }`}
                                role="switch"
                                aria-checked={settings.biometricEnabled}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.biometricEnabled ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Maintenance Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${settings.maintenanceMode ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'} transition-colors`}>
                                    <FiSettings size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-base">Modo Mantenimiento</h3>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Muestra un banner de mantenimiento a todos los usuarios del sistema.
                                    </p>
                                    <span className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${settings.maintenanceMode
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {settings.maintenanceMode ? 'Activado' : 'Desactivado'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleToggle('maintenanceMode')}
                                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.maintenanceMode ? 'bg-amber-500' : 'bg-slate-200'
                                    }`}
                                role="switch"
                                aria-checked={settings.maintenanceMode}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm shadow-blue-200"
                        >
                            {saving ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            ) : (
                                <FiSave />
                            )}
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </motion.div>
            ) : (
                <div className="text-center py-20 text-slate-400 text-sm">
                    No se pudo cargar la configuración.
                </div>
            )}
        </div>
    );
};

export default AdminSettings;
