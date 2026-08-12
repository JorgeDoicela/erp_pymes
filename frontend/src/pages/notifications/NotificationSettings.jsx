import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

const NotificationSettings = () => {
    const [preferences, setPreferences] = useState({});
    const [loading, setLoading] = useState(true);

    const notificationTypes = [
        { key: 'CONTRACT_EXPIRATION', label: 'Vencimiento de Contratos' },
        { key: 'EVALUATION_REMINDER', label: 'Recordatorios de Evaluación' },
        { key: 'EVALUATION_ASSIGNED', label: 'Asignación de Evaluación' },
        { key: 'DOCUMENT_EXPIRATION', label: 'Vencimiento de Documentos' },
        { key: 'PAYROLL_CLOSING', label: 'Cierre de Nómina' },
        { key: 'PAYROLL_REVIEW', label: 'Revisión de Nómina' },
        { key: 'PAYROLL_CONFIRM', label: 'Confirmación de Pago' },
        { key: 'ABSENCE_REQUEST', label: 'Solicitud de Ausencia' },
        { key: 'ABSENCE_STATUS', label: 'Estado de Ausencia' },
    ];

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const response = await api.get('/notifications/preferences');
            setPreferences(response.data.preferences || {});
        } catch (error) {
            console.error('Error fetching preferences', error);
            toast.error('Error al cargar preferencias');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (type, channel) => {
        setPreferences(prev => {
            const typePrefs = prev[type] || { email: true, inApp: true };
            const newTypePrefs = { ...typePrefs, [channel]: !typePrefs[channel] };
            return { ...prev, [type]: newTypePrefs };
        });
    };

    const savePreferences = async () => {
        try {
            await api.put('/notifications/preferences', {
                preferences
            });
            toast.success('Preferencias guardadas correctamente');
        } catch (error) {
            console.error('Error updating preferences', error);
            toast.error('Error al guardar preferencias');
        }
    };

    if (loading) return <div className="p-8 text-gray-400 text-xs text-center">Cargando preferencias...</div>;

    return (
        <div className="space-y-5">
            {/* Header Limpio ERP */}
            <div className="pb-4 border-b border-gray-200">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Sistema · Preferencias</p>
                <h1 className="text-xl font-semibold text-gray-900">Configuración de Notificaciones</h1>
                <p className="text-sm text-gray-500 mt-0.5">Gestiona los canales por los cuales deseas recibir alertas del sistema.</p>
            </div>

            {/* Formulario de Canales por Tipo */}
            <div className="bg-white rounded border border-gray-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    <span>Tipo de Notificación</span>
                    <div className="flex items-center gap-6">
                        <span className="w-12 text-center">App</span>
                        <span className="w-12 text-center">Email</span>
                    </div>
                </div>

                <div className="divide-y divide-gray-100 text-xs">
                    {notificationTypes.map(({ key, label }) => {
                        const emailEnabled = preferences[key]?.email !== false;
                        const inAppEnabled = preferences[key]?.inApp !== false;

                        return (
                            <div key={key} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                <div>
                                    <h3 className="font-medium text-gray-900">{label}</h3>
                                    <p className="text-[11px] text-gray-400">Alertas automáticas para {label.toLowerCase()}</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <label className="w-12 flex justify-center items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={inAppEnabled}
                                            onChange={() => handleToggle(key, 'inApp')}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </label>

                                    <label className="w-12 flex justify-center items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={emailEnabled}
                                            onChange={() => handleToggle(key, 'email')}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </label>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <button
                    onClick={savePreferences}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
                >
                    Guardar Preferencias
                </button>
            </div>
        </div>
    );
};

export default NotificationSettings;
