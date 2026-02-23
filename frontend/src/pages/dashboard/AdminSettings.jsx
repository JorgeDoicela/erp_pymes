import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSettings, FiSave, FiCheckCircle, FiAlertCircle, FiClock, FiMapPin, FiExternalLink, FiPlus } from 'react-icons/fi';
import systemService from '../../services/systemService';
import LocationPickerMap from '../../components/common/LocationPickerMap';

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
                allowedIPs: settings.allowedIPs,
                globalLatitude: settings.globalLatitude,
                globalLongitude: settings.globalLongitude,
                globalRadius: settings.globalRadius
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

    const useMyLocation = () => {
        if (!navigator.geolocation) {
            setMessage({ type: 'error', text: 'Tu navegador no soporta geolocalización.' });
            return;
        }

        setMessage({ type: 'info', text: 'Obteniendo tu ubicación...' });
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setSettings(prev => ({
                    ...prev,
                    globalLatitude: position.coords.latitude,
                    globalLongitude: position.coords.longitude
                }));
                setMessage({ type: 'success', text: 'Ubicación capturada correctamente. No olvides guardar los cambios.' });
                setTimeout(() => setMessage({ type: '', text: '' }), 5000);
            },
            (err) => {
                let msg = 'Error al obtener ubicación.';
                if (err.code === 1) msg = 'Permiso de ubicación denegado.';
                setMessage({ type: 'error', text: msg });
            },
            { enableHighAccuracy: true }
        );
    };

    const addCurrentIp = () => {
        if (!settings?.yourIp) return;
        const currentIps = settings.allowedIPs ? settings.allowedIPs.split(',').map(i => i.trim()) : [];
        if (!currentIps.includes(settings.yourIp)) {
            const newList = [...currentIps, settings.yourIp].join(', ');
            setSettings({ ...settings, allowedIPs: newList });
            setMessage({ type: 'success', text: `IP ${settings.yourIp} añadida a la lista. No olvides guardar.` });
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        } else {
            setMessage({ type: 'info', text: 'Tu IP ya está en la lista.' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
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
                                    {/* Fingerprint SVG icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
                                        <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
                                        <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
                                        <path d="M2 12a10 10 0 0 1 18-6" />
                                        <path d="M2 16h.01" />
                                        <path d="M21.8 16c.2-2 .131-5.354 0-6" />
                                        <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
                                        <path d="M8.65 22c.21-.66.45-1.32.57-2" />
                                        <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
                                    </svg>
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

                    {/* Attendance Control Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <FiClock className="text-indigo-500" />
                            Control de Asistencia Global
                        </h3>
                        <div className="space-y-6">
                            <div className="flex flex-col gap-6">
                                <div className="space-y-4">
                                    <label className="block text-sm font-semibold text-slate-700">Ubicación de la Oficina (Geofencing)</label>
                                    <LocationPickerMap
                                        initialLat={settings.globalLatitude}
                                        initialLng={settings.globalLongitude}
                                        radius={settings.globalRadius}
                                        onLocationChange={(lat, lng) => setSettings({ ...settings, globalLatitude: lat, globalLongitude: lng })}
                                        height="350px"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Latitud Global</label>
                                        <input
                                            type="number"
                                            step="any"
                                            placeholder="Ej: -0.1806"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                            value={settings.globalLatitude || ''}
                                            onChange={e => setSettings({ ...settings, globalLatitude: parseFloat(e.target.value) || null })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Longitud Global</label>
                                        <input
                                            type="number"
                                            step="any"
                                            placeholder="Ej: -78.4678"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                            value={settings.globalLongitude || ''}
                                            onChange={e => setSettings({ ...settings, globalLongitude: parseFloat(e.target.value) || null })}
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Radio (metros)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={settings.globalRadius || ''}
                                                onChange={e => setSettings({ ...settings, globalRadius: parseInt(e.target.value) || 200 })}
                                            />
                                            <button
                                                onClick={useMyLocation}
                                                type="button"
                                                className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 text-sm font-semibold whitespace-nowrap"
                                                title="Capturar mi ubicación actual"
                                            >
                                                <FiMapPin /> GPS
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-slate-700">IPs Permitidas (Separadas por coma)</label>
                                    {settings.yourIp && (
                                        <button
                                            onClick={addCurrentIp}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded transition-colors"
                                        >
                                            <FiPlus /> Mi IP: {settings.yourIp}
                                        </button>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-400 mb-2 italic">Si se deja vacío, se permite cualquier IP. Ej: 192.168.1.1, 201.12.3.4</p>
                                <input
                                    type="text"
                                    placeholder="Ej: 192.168.1.1, 10.0.0.1"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                    value={settings.allowedIPs || ''}
                                    onChange={e => setSettings({ ...settings, allowedIPs: e.target.value })}
                                />
                            </div>

                            {(settings.globalLatitude && settings.globalLongitude) && (
                                <div className="pt-2 border-t border-slate-50 flex justify-end">
                                    <a
                                        href={`https://www.google.com/maps?q=${settings.globalLatitude},${settings.globalLongitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-500 flex items-center gap-1 hover:underline"
                                    >
                                        <FiExternalLink /> Ver ubicación actual en Google Maps
                                    </a>
                                </div>
                            )}

                            <p className="p-3 bg-indigo-50 text-indigo-700 rounded-lg text-xs leading-relaxed">
                                <strong>Nota:</strong> Estas configuraciones se aplicarán a todos los empleados de forma global, a menos que tengan una configuración específica definida en su perfil personal.
                            </p>
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
