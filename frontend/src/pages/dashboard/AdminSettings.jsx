import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import systemService from '../../services/systemService';
import api from '../../api/axios.js';
import LocationPickerMap from '../../components/common/LocationPickerMap';

const SETTINGS_TABS = [
    { id: 'COMPANY', label: 'Identificación & Plan' },
    { id: 'GEOFENCING', label: 'Geocerca & Asistencia' },
    { id: 'SECURITY', label: 'Seguridad & Biometría' },
    { id: 'MAINTENANCE', label: 'Mantenimiento & Sistema' }
];

const AdminSettings = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('COMPANY');
    const [settings, setSettings] = useState(null);
    const [tenant, setTenant] = useState(null);
    const [tenantForm, setTenantForm] = useState({ name: '', ruc: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingTenant, setSavingTenant] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchData();
    }, []);

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const fetchData = async () => {
        try {
            const [sysRes, tenantRes] = await Promise.all([
                systemService.getSettings(),
                api.get('/tenants/me').catch(() => ({ data: { success: false } }))
            ]);

            if (sysRes.success) {
                setSettings(sysRes.data);
            }
            if (tenantRes.data?.success) {
                setTenant(tenantRes.data.data);
                setTenantForm({
                    name: tenantRes.data.data.name || '',
                    ruc: tenantRes.data.data.ruc || ''
                });
            }
        } catch {
            showNotification('error', 'Error al cargar la parametrización del sistema');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTenant = async () => {
        setSavingTenant(true);
        try {
            const res = await api.put('/tenants/me', tenantForm);
            if (res.data?.success) {
                setTenant(prev => ({ ...prev, ...res.data.data }));
                showNotification('success', 'Identificación fiscal de la empresa actualizada correctamente');
            }
        } catch (err) {
            showNotification('error', err.response?.data?.message || 'Error al actualizar los datos de la empresa');
        } finally {
            setSavingTenant(false);
        }
    };

    const handleToggle = (field) => {
        setSettings(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSaveSettings = async () => {
        setSaving(true);
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
                showNotification('success', 'Parámetros del sistema guardados correctamente');
            }
        } catch {
            showNotification('error', 'Error al guardar los parámetros del sistema');
        } finally {
            setSaving(false);
        }
    };

    const useMyLocation = () => {
        if (!navigator.geolocation) {
            showNotification('error', 'Tu navegador no soporta geolocalización');
            return;
        }

        showNotification('success', 'Obteniendo coordenadas GPS del dispositivo...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setSettings(prev => ({
                    ...prev,
                    globalLatitude: position.coords.latitude,
                    globalLongitude: position.coords.longitude
                }));
                showNotification('success', 'Ubicación GPS capturada. Recuerde guardar los cambios.');
            },
            (err) => {
                const msg = err.code === 1 ? 'Permiso de ubicación denegado por el navegador' : 'Error al obtener ubicación GPS';
                showNotification('error', msg);
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
            showNotification('success', `IP ${settings.yourIp} añadida a la lista permitida`);
        } else {
            showNotification('success', 'Tu IP actual ya está registrada en la lista');
        }
    };

    const inputClass = "w-full bg-white border border-gray-200 rounded px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors";

    if (loading) return <div className="p-12 text-gray-400 text-xs text-center">Cargando configuración del sistema...</div>;

    const hasGeofencing = !!(settings?.globalLatitude && settings?.globalLongitude);
    const employeeCount = tenant?._count?.employees || 0;
    const maxEmployees = tenant?.maxEmployees || 50;

    return (
        <div className="space-y-4">
            {/* Notificación Toast Sobria */}
            {notification && (
                <div
                    className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded border text-xs font-medium shadow-md transition-all ${
                        notification.type === 'success'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : 'bg-red-50 text-red-900 border-red-200'
                    }`}
                >
                    {notification.message}
                </div>
            )}

            {/* Header ERP con Balance Operativo */}
            <div className="pb-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Administración · Parámetros Globales</p>
                    <h1 className="text-xl font-semibold text-gray-900">Configuración del Sistema</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Control de datos fiscales, suscripción, geocercas de asistencia y biometría.</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-4 bg-white px-3.5 py-2 rounded border border-gray-200 font-mono text-xs">
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Plan Contratado</span>
                            <span className="font-semibold text-purple-700">{tenant?.plan || 'ESSENTIAL'}</span>
                        </div>
                        <div className="w-px h-6 bg-gray-200" />
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Capacidad</span>
                            <span className="font-semibold text-blue-700 tabular-nums">{employeeCount} / {maxEmployees}</span>
                        </div>
                        <div className="w-px h-6 bg-gray-200" />
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Geocerca</span>
                            <span className={`font-semibold ${hasGeofencing ? 'text-emerald-700' : 'text-gray-400'}`}>
                                {hasGeofencing ? '✓ Activa' : 'Inactiva'}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/admin')}
                        className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                    >
                        Volver al Panel
                    </button>
                </div>
            </div>

            {/* Pestañas Temáticas Estructuradas */}
            <div className="flex items-center border-b border-gray-200 gap-1 overflow-x-auto">
                {SETTINGS_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-2.5 px-4 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === tab.id
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Contenido Pestaña: Identificación & Plan */}
            {activeTab === 'COMPANY' && (
                <div className="space-y-4">
                    <div className="bg-white p-5 rounded border border-gray-200 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Identificación Fiscal y Razón Social</h3>
                                <p className="text-[11px] text-gray-500 mt-0.5">Información legal de la empresa para roles de pago y contratos.</p>
                            </div>
                            <span className="px-2.5 py-1 rounded text-xs font-mono font-medium border bg-purple-50 text-purple-800 border-purple-200">
                                Plan {tenant?.plan || 'ESSENTIAL'} · {tenant?.subscriptionStatus === 'ACTIVE' ? 'Suscripción Activa' : 'Prueba Gratuita'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    Nombre Comercial / Razón Social
                                </label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={tenantForm.name}
                                    onChange={e => setTenantForm({ ...tenantForm, name: e.target.value })}
                                    placeholder="Ej. Acme Corp S.A."
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    RUC / Identificación Tributaria
                                </label>
                                <input
                                    type="text"
                                    className={`${inputClass} font-mono`}
                                    value={tenantForm.ruc}
                                    onChange={e => setTenantForm({ ...tenantForm, ruc: e.target.value })}
                                    placeholder="1790000000001"
                                />
                            </div>
                        </div>

                        {/* Barra de Cuota de Colaboradores */}
                        <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-gray-700">Capacidad de Colaboradores Activos</span>
                                <span className="font-mono text-gray-600 font-semibold tabular-nums">
                                    {employeeCount} / {maxEmployees} plazas ocupadas ({Math.round((employeeCount / maxEmployees) * 100)}%)
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${
                                        (employeeCount / maxEmployees) > 0.9 ? 'bg-red-500' : 'bg-blue-600'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.round((employeeCount / maxEmployees) * 100))}%` }}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSaveTenant}
                                disabled={savingTenant}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-medium transition-colors cursor-pointer"
                            >
                                {savingTenant ? 'Guardando...' : 'Guardar Datos Fiscales'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Contenido Pestaña: Geocerca & Asistencia */}
            {activeTab === 'GEOFENCING' && settings && (
                <div className="space-y-4">
                    <div className="bg-white p-5 rounded border border-gray-200 space-y-4">
                        <div className="pb-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Ubicación Central y Geocerca (Geofencing)</h3>
                                <p className="text-[11px] text-gray-500 mt-0.5">Control de perímetro para el registro de marcaciones de asistencia física.</p>
                            </div>
                            {hasGeofencing && (
                                <a
                                    href={`https://www.google.com/maps?q=${settings.globalLatitude},${settings.globalLongitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-mono"
                                >
                                    Ver en Google Maps ↗
                                </a>
                            )}
                        </div>

                        <div className="rounded border border-gray-200 overflow-hidden">
                            <LocationPickerMap
                                initialLat={settings.globalLatitude}
                                initialLng={settings.globalLongitude}
                                radius={settings.globalRadius}
                                onLocationChange={(lat, lng) => setSettings({ ...settings, globalLatitude: lat, globalLongitude: lng })}
                                height="320px"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    Latitud Global
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="Ej: -0.1806"
                                    className={`${inputClass} font-mono`}
                                    value={settings.globalLatitude || ''}
                                    onChange={e => setSettings({ ...settings, globalLatitude: parseFloat(e.target.value) || null })}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    Longitud Global
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="Ej: -78.4678"
                                    className={`${inputClass} font-mono`}
                                    value={settings.globalLongitude || ''}
                                    onChange={e => setSettings({ ...settings, globalLongitude: parseFloat(e.target.value) || null })}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    Radio de Tolerancia (Metros)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        className={`${inputClass} font-mono`}
                                        value={settings.globalRadius || ''}
                                        onChange={e => setSettings({ ...settings, globalRadius: parseInt(e.target.value, 10) || 200 })}
                                    />
                                    <button
                                        onClick={useMyLocation}
                                        type="button"
                                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded border border-gray-200 transition-colors shrink-0 cursor-pointer"
                                        title="Capturar GPS del dispositivo actual"
                                    >
                                        GPS Actual
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* IPs Permitidas */}
                        <div className="space-y-1.5 pt-2">
                            <div className="flex justify-between items-center">
                                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider">
                                    Direcciones IP de Red Permitidas
                                </label>
                                {settings.yourIp && (
                                    <button
                                        type="button"
                                        onClick={addCurrentIp}
                                        className="text-xs text-blue-600 hover:underline cursor-pointer font-mono"
                                    >
                                        + Agregar mi IP ({settings.yourIp})
                                    </button>
                                )}
                            </div>
                            <input
                                type="text"
                                placeholder="Ej: 192.168.1.1, 201.12.3.4 (Dejar vacío para permitir cualquier IP)"
                                className={`${inputClass} font-mono`}
                                value={settings.allowedIPs || ''}
                                onChange={e => setSettings({ ...settings, allowedIPs: e.target.value })}
                            />
                            <p className="text-[11px] text-gray-400">
                                Separe múltiples direcciones IP con comas. Si se deja en blanco, los colaboradores podrán marcar desde cualquier conexión de red.
                            </p>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-medium transition-colors cursor-pointer"
                            >
                                {saving ? 'Guardando...' : 'Guardar Parámetros de Geocerca'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Contenido Pestaña: Seguridad & Biometría */}
            {activeTab === 'SECURITY' && settings && (
                <div className="space-y-4">
                    <div className="bg-white p-5 rounded border border-gray-200 space-y-4">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">Validación Biométrica en Marcaciones</h3>
                            <p className="text-[11px] text-gray-500 mt-0.5">Control de autenticación por huella dactilar o reconocimiento facial WebAuthn.</p>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-200">
                            <div>
                                <p className="text-xs font-semibold text-gray-900">Exigir Verificación Biométrica</p>
                                <p className="text-[11px] text-gray-500 mt-0.5 max-w-xl">
                                    Los empleados deben verificar su identidad biométrica antes de registrar su entrada o salida. Si el dispositivo no cuenta con sensor biométrico, el sistema permitirá la marcación estándar.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleToggle('biometricEnabled')}
                                className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                                    settings.biometricEnabled
                                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                                        : 'bg-gray-100 text-gray-600 border-gray-200'
                                }`}
                            >
                                {settings.biometricEnabled ? '✓ Activada' : 'Desactivada'}
                            </button>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-medium transition-colors cursor-pointer"
                            >
                                {saving ? 'Guardando...' : 'Guardar Parámetros de Seguridad'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Contenido Pestaña: Mantenimiento & Sistema */}
            {activeTab === 'MAINTENANCE' && settings && (
                <div className="space-y-4">
                    <div className="bg-white p-5 rounded border border-gray-200 space-y-4">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">Modo Mantenimiento del Sistema</h3>
                            <p className="text-[11px] text-gray-500 mt-0.5">Permite activar un banner de advertencia operativa para los usuarios.</p>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-200">
                            <div>
                                <p className="text-xs font-semibold text-gray-900">Estado del Modo Mantenimiento</p>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                    Muestra un aviso preventivo en la cabecera del portal a todos los colaboradores y supervisores.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleToggle('maintenanceMode')}
                                className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                                    settings.maintenanceMode
                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                        : 'bg-gray-100 text-gray-600 border-gray-200'
                                }`}
                            >
                                {settings.maintenanceMode ? '⚠ Activado' : 'Desactivado'}
                            </button>
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                Mensaje Informativo de Mantenimiento
                            </label>
                            <input
                                type="text"
                                className={inputClass}
                                value={settings.maintenanceMessage || ''}
                                onChange={e => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                                placeholder="El sistema estará en mantenimiento brevemente."
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-medium transition-colors cursor-pointer"
                            >
                                {saving ? 'Guardando...' : 'Guardar Configuración de Mantenimiento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSettings;
