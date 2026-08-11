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
            toast.success('Preferencias guardadas');
        } catch (error) {
            console.error('Error updating preferences', error);
            toast.error('Error al guardar');
        }
    };

    if (loading) return <div className="p-8 text-slate-500 text-sm text-center">Cargando preferencias...</div>;

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Configuración de Notificaciones
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">Gestiona los canales por los cuales deseas recibir alertas del sistema.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 space-y-4 shadow-xs">
                {notificationTypes.map(({ key, label }) => {
                    const emailEnabled = preferences[key]?.email !== false;
                    const inAppEnabled = preferences[key]?.inApp !== false;

                    return (
                        <div key={key} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 gap-4">
                            <div>
                                <h3 className="font-semibold text-xs sm:text-sm text-slate-900">{label}</h3>
                                <p className="text-[11px] text-slate-400">Alertas para {label.toLowerCase()}</p>
                            </div>
                            <div className="flex gap-4 shrink-0">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${inAppEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${inAppEnabled ? 'translate-x-4' : ''}`}></div>
                                    </div>
                                    <input type="checkbox" className="hidden" checked={inAppEnabled} onChange={() => handleToggle(key, 'inApp')} />
                                    <span className="text-xs font-semibold text-slate-600">App</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${emailEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${emailEnabled ? 'translate-x-4' : ''}`}></div>
                                    </div>
                                    <input type="checkbox" className="hidden" checked={emailEnabled} onChange={() => handleToggle(key, 'email')} />
                                    <span className="text-xs font-semibold text-slate-600">Email</span>
                                </label>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end pt-2">
                <button
                    onClick={savePreferences}
                    className="app-button-primary"
                >
                    Guardar Preferencias
                </button>
            </div>
        </div>
    );
};

export default NotificationSettings;
