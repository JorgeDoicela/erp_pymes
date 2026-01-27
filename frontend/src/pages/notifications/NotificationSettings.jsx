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
        { key: 'ABSENCE_STATUS', label: 'Estado de Ausencia' }, // Check service usage
    ];

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const response = await api.get('/notifications/preferences');
            // Response: { preferences: { KEY: { email: true, inApp: true } } }
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
            const typePrefs = prev[type] || { email: true, inApp: true }; // Default true
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

    if (loading) return <div className="p-8 text-white">Cargando...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6">
            <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 mb-6">
                    Configuración de Notificaciones
                </h2>

                <div className="bg-slate-800/50 rounded-xl border border-white/5 p-6 space-y-6">
                    {notificationTypes.map(({ key, label }) => {
                        // Default to true if not set
                        const emailEnabled = preferences[key]?.email !== false;
                        const inAppEnabled = preferences[key]?.inApp !== false;

                        return (
                            <div key={key} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                                <div>
                                    <h3 className="font-medium text-slate-200">{label}</h3>
                                    <p className="text-xs text-slate-500">Alertas para {label.toLowerCase()}</p>
                                </div>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${inAppEnabled ? 'bg-blue-600' : 'bg-slate-600'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${inAppEnabled ? 'translate-x-4' : ''}`}></div>
                                        </div>
                                        <input type="checkbox" className="hidden" checked={inAppEnabled} onChange={() => handleToggle(key, 'inApp')} />
                                        <span className="text-sm text-slate-400">App</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${emailEnabled ? 'bg-indigo-600' : 'bg-slate-600'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${emailEnabled ? 'translate-x-4' : ''}`}></div>
                                        </div>
                                        <input type="checkbox" className="hidden" checked={emailEnabled} onChange={() => handleToggle(key, 'email')} />
                                        <span className="text-sm text-slate-400">Email</span>
                                    </label>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={savePreferences}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
                    >
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettings;
