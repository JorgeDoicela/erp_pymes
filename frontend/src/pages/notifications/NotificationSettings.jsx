import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const EVENT_CATALOG = [
    {
        key: 'CONTRACT_EXPIRATION',
        category: 'CONTRACTS',
        categoryLabel: 'Contratos & Documentos',
        label: 'Vencimiento de Contratos Laborales',
        desc: 'Alertas tempranas (15 y 30 días) antes del término de un contrato laboral'
    },
    {
        key: 'DOCUMENT_EXPIRATION',
        category: 'CONTRACTS',
        categoryLabel: 'Contratos & Documentos',
        label: 'Vencimiento de Documentación Personal',
        desc: 'Avisos preventivos por caducidad de cédulas, certificados o carnets de salud'
    },
    {
        key: 'EVALUATION_ASSIGNED',
        category: 'PERFORMANCE',
        categoryLabel: 'Desempeño',
        label: 'Asignación de Rúbrica / Evaluación',
        desc: 'Notificación inmediata cuando se te asigne evaluar a un colaborador o par'
    },
    {
        key: 'EVALUATION_REMINDER',
        category: 'PERFORMANCE',
        categoryLabel: 'Desempeño',
        label: 'Recordatorios de Evaluación Pendiente',
        desc: 'Avisos sobre plazos de entrega próximos a vencer para rúbricas asignadas'
    },
    {
        key: 'EVALUATION_COMPLETED',
        category: 'PERFORMANCE',
        categoryLabel: 'Desempeño',
        label: 'Calificación de Desempeño Consolidada',
        desc: 'Aviso al colaborador cuando su ciclo de evaluación ha finalizado y cuenta con nota final'
    },
    {
        key: 'ABSENCE_REQUEST',
        category: 'ABSENCES',
        categoryLabel: 'Ausencias & Permisos',
        label: 'Solicitud de Ausencia o Vacaciones',
        desc: 'Notificación a supervisores y RRHH ante nuevos permisos ingresados por el personal'
    },
    {
        key: 'ABSENCE_STATUS',
        category: 'ABSENCES',
        categoryLabel: 'Ausencias & Permisos',
        label: 'Resolución de Solicitud de Permiso',
        desc: 'Aprobación, rechazo o justificación de solicitudes de vacaciones o permisos médicos'
    },
    {
        key: 'PAYROLL_CLOSING',
        category: 'PAYROLL',
        categoryLabel: 'Nómina & Pagos',
        label: 'Apertura y Cierre de Periodo de Nómina',
        desc: 'Avisos administrativos sobre consolidación del rol mensual y fechas de corte'
    },
    {
        key: 'PAYROLL_CONFIRM',
        category: 'PAYROLL',
        categoryLabel: 'Nómina & Pagos',
        label: 'Acreditación de Rol y Anticipos',
        desc: 'Notificación de generación de recibo de sueldo y abono de anticipos concedidos'
    },
    {
        key: 'ANNOUNCEMENT_NEW',
        category: 'COMMUNICATION',
        categoryLabel: 'Comunicación',
        label: 'Nuevos Comunicados Oficiales',
        desc: 'Alertas institucionales ante políticas y noticias que requieren acuse de recibo'
    }
];

const CATEGORY_TABS = [
    { id: 'ALL', label: 'Todos los Eventos' },
    { id: 'CONTRACTS', label: 'Contratos & Docs' },
    { id: 'PERFORMANCE', label: 'Desempeño' },
    { id: 'ABSENCES', label: 'Ausencias & Permisos' },
    { id: 'PAYROLL', label: 'Nómina & Pagos' },
    { id: 'COMMUNICATION', label: 'Comunicación' }
];

const NotificationSettings = () => {
    const navigate = useNavigate();
    const [preferences, setPreferences] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('ALL');
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchPreferences();
    }, []);

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const fetchPreferences = async () => {
        try {
            const response = await api.get('/notifications/preferences');
            setPreferences(response.data.preferences || {});
        } catch (error) {
            console.error('Error fetching preferences', error);
            showNotification('error', 'Error al cargar preferencias');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (type, channel) => {
        setPreferences(prev => {
            const typePrefs = prev[type] || { email: true, inApp: true };
            const currentVal = typePrefs[channel] !== false; // true by default
            const newTypePrefs = { ...typePrefs, [channel]: !currentVal };
            return { ...prev, [type]: newTypePrefs };
        });
    };

    const handleToggleAllChannel = (channel, enable) => {
        setPreferences(prev => {
            const updated = { ...prev };
            EVENT_CATALOG.forEach(ev => {
                const current = updated[ev.key] || { email: true, inApp: true };
                updated[ev.key] = { ...current, [channel]: enable };
            });
            return updated;
        });
    };

    const handleResetDefaults = () => {
        const defaultPrefs = {};
        EVENT_CATALOG.forEach(ev => {
            defaultPrefs[ev.key] = { email: true, inApp: true };
        });
        setPreferences(defaultPrefs);
        showNotification('success', 'Canales restablecidos a configuración activa por defecto');
    };

    const savePreferences = async () => {
        setSaving(true);
        try {
            await api.put('/notifications/preferences', { preferences });
            showNotification('success', 'Preferencias de canales guardadas correctamente');
        } catch (error) {
            console.error('Error updating preferences', error);
            showNotification('error', 'Error al guardar preferencias');
        } finally {
            setSaving(false);
        }
    };

    // Métricas de canales activos
    const metrics = useMemo(() => {
        let activeInApp = 0;
        let activeEmail = 0;
        const total = EVENT_CATALOG.length;

        EVENT_CATALOG.forEach(ev => {
            const p = preferences[ev.key];
            if (!p || p.inApp !== false) activeInApp++;
            if (!p || p.email !== false) activeEmail++;
        });

        return { activeInApp, activeEmail, total };
    }, [preferences]);

    // Conteo por categoría para las pestañas
    const tabCounts = useMemo(() => {
        const counts = { ALL: EVENT_CATALOG.length };
        EVENT_CATALOG.forEach(ev => {
            counts[ev.category] = (counts[ev.category] || 0) + 1;
        });
        return counts;
    }, []);

    const filteredEvents = useMemo(() => {
        if (activeTab === 'ALL') return EVENT_CATALOG;
        return EVENT_CATALOG.filter(ev => ev.category === activeTab);
    }, [activeTab]);

    if (loading) return <div className="p-12 text-gray-400 text-xs text-center">Cargando configuración de canales...</div>;

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

            {/* Header ERP con Balance de Canales */}
            <div className="pb-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Sistema · Preferencias de Alertas</p>
                    <h1 className="text-xl font-semibold text-gray-900">Configuración de Canales de Notificación</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Seleccione los canales por los que desea recibir avisos del ciclo laboral.</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-4 bg-white px-3.5 py-2 rounded border border-gray-200 font-mono text-xs">
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">En Plataforma (App)</span>
                            <span className="font-semibold text-blue-700 tabular-nums">
                                {metrics.activeInApp} / {metrics.total} activos
                            </span>
                        </div>
                        <div className="w-px h-6 bg-gray-200" />
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Correo Electrónico</span>
                            <span className="font-semibold text-emerald-700 tabular-nums">
                                {metrics.activeEmail} / {metrics.total} activos
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/notifications')}
                        className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                    >
                        ← Volver a Notificaciones
                    </button>
                    <button
                        onClick={savePreferences}
                        disabled={saving}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                    >
                        {saving ? 'Guardando...' : 'Guardar Preferencias'}
                    </button>
                </div>
            </div>

            {/* Pestañas con Contadores Integrados */}
            <div className="flex items-center justify-between border-b border-gray-200 gap-4 overflow-x-auto">
                <div className="flex items-center gap-1">
                    {CATEGORY_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'border-gray-900 text-gray-900'
                                    : 'border-transparent text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            {tab.label} <span className="ml-1.5 font-mono text-[11px] text-gray-400">({tabCounts[tab.id] || 0})</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pb-1 text-xs">
                    <button
                        type="button"
                        onClick={() => handleToggleAllChannel('inApp', true)}
                        className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600 cursor-pointer"
                        title="Activar todos en la aplicación"
                    >
                        + Todos App
                    </button>
                    <button
                        type="button"
                        onClick={() => handleToggleAllChannel('email', true)}
                        className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600 cursor-pointer"
                        title="Activar todos en correo electrónico"
                    >
                        + Todos Email
                    </button>
                    <button
                        type="button"
                        onClick={handleResetDefaults}
                        className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-500 cursor-pointer"
                        title="Restablecer todos los canales por defecto"
                    >
                        Restablecer
                    </button>
                </div>
            </div>

            {/* Tabla Principal de Eventos y Canales */}
            <div className="bg-white rounded border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="py-2.5 px-4">Evento / Novedad Operativa</th>
                                <th className="py-2.5 px-4">Módulo</th>
                                <th className="py-2.5 px-4 text-center w-32">En Plataforma (App)</th>
                                <th className="py-2.5 px-4 text-center w-32">Correo Electrónico</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredEvents.map(ev => {
                                const inAppActive = preferences[ev.key]?.inApp !== false;
                                const emailActive = preferences[ev.key]?.email !== false;

                                return (
                                    <tr key={ev.key} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="py-3 px-4">
                                            <p className="font-medium text-gray-900">{ev.label}</p>
                                            <p className="text-gray-400 text-[11px] mt-0.5 max-w-xl">{ev.desc}</p>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-0.5 rounded text-[11px] font-mono border bg-gray-50 text-gray-700 border-gray-200 whitespace-nowrap">
                                                {ev.categoryLabel}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleToggle(ev.key, 'inApp')}
                                                className={`px-3 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
                                                    inAppActive
                                                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                                                        : 'bg-gray-100 text-gray-500 border-gray-200'
                                                }`}
                                            >
                                                {inAppActive ? '✓ Activo' : 'Inactivo'}
                                            </button>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleToggle(ev.key, 'email')}
                                                className={`px-3 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
                                                    emailActive
                                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                        : 'bg-gray-100 text-gray-500 border-gray-200'
                                                }`}
                                            >
                                                {emailActive ? '✓ Activo' : 'Inactivo'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettings;
