import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../../services/notifications/notification.service';
import useNotificationSocket from '../../hooks/useNotificationSocket';

const NotificationsPage = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, absence, evaluation, contract, payroll

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications', error);
        } finally {
            setLoading(false);
        }
    };

    // WebSocket real-time listener
    const handleNewWebSocketNotification = useCallback((newNotif) => {
        setNotifications(prev => [newNotif, ...prev]);
    }, []);

    useNotificationSocket(handleNewWebSocketNotification);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleRead = async (notification) => {
        if (!notification.isRead) {
            try {
                await notificationService.markAsRead(notification.id);
                setNotifications(prev => prev.map(n =>
                    n.id === notification.id ? { ...n, isRead: true } : n
                ));
            } catch (error) {
                console.error('Error marking as read', error);
            }
        }

        if (notification.type === 'CONTRACT_EXPIRATION' && notification.relatedEntityId) {
            navigate('/admin/contracts/expiring');
        } else if (notification.type.startsWith('EVALUATION_')) {
            navigate('/performance');
        } else if (notification.type.startsWith('ABSENCE_')) {
            navigate('/admin/absences');
        } else if (notification.type === 'DOCUMENT_EXPIRATION') {
            navigate('/profile');
        } else if (notification.type === 'DOCUMENT_EXPIRATION_HR' || notification.type === 'DOCUMENT_EXPIRED') {
            navigate('/admin/employees');
        } else if (notification.type.startsWith('PAYROLL_')) {
            navigate('/admin/payroll/generator');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Error marking all as read', error);
        }
    };

    const getCategoryBadge = (type) => {
        if (!type) return { label: 'Sistema', color: 'bg-slate-100 text-slate-700 border-slate-200' };
        if (type.startsWith('PAYROLL_')) return { label: 'Nómina', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        if (type.startsWith('ABSENCE_')) return { label: 'Ausencia', color: 'bg-rose-50 text-rose-700 border-rose-200' };
        if (type.startsWith('EVALUATION_')) return { label: 'Evaluación', color: 'bg-amber-50 text-amber-700 border-amber-200' };
        if (type.includes('CONTRACT')) return { label: 'Contrato', color: 'bg-blue-50 text-blue-700 border-blue-200' };
        if (type.includes('DOCUMENT')) return { label: 'Documento', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
        return { label: 'Sistema', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.isRead;
        if (filter === 'absence') return n.type?.startsWith('ABSENCE_');
        if (filter === 'evaluation') return n.type?.startsWith('EVALUATION_');
        if (filter === 'contract') return n.type?.includes('CONTRACT') || n.type?.includes('DOCUMENT');
        if (filter === 'payroll') return n.type?.startsWith('PAYROLL_');
        return true;
    });

    const categoryFilters = [
        { id: 'all', label: 'Todas' },
        { id: 'unread', label: 'No leídas' },
        { id: 'absence', label: 'Ausencias' },
        { id: 'evaluation', label: 'Evaluaciones' },
        { id: 'contract', label: 'Contratos / Docs' },
        { id: 'payroll', label: 'Nómina' }
    ];

    return (
        <div className="space-y-5">
            {/* Header Limpio ERP */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Sistema · Alertas</p>
                    <h1 className="text-xl font-semibold text-gray-900">Centro de Notificaciones</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Historial de alertas del sistema, avisos operativos y vencimientos en tiempo real.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => navigate('/admin/notifications/settings')}
                        className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                    >
                        Configurar
                    </button>
                    <button
                        onClick={() => navigate('/admin')}
                        className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                    >
                        Volver al Panel
                    </button>
                </div>
            </div>

            {/* Filtros de Notificaciones */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                    {categoryFilters.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-3 py-1.5 text-xs rounded transition-colors cursor-pointer ${
                                filter === f.id
                                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                                    : 'border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 bg-white'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-gray-600 hover:text-gray-900 font-medium px-2.5 py-1 border border-gray-200 rounded hover:bg-gray-50 transition-colors cursor-pointer"
                >
                    Marcar todas como leídas
                </button>
            </div>

            {/* Listado de Notificaciones */}
            {loading ? (
                <div className="p-12 text-center text-gray-400 text-xs bg-white rounded border border-gray-200">
                    Cargando notificaciones...
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredNotifications.length === 0 ? (
                        <div className="bg-white rounded border border-gray-200 p-12 text-center text-gray-400 text-xs">
                            No tienes notificaciones {filter === 'unread' ? 'pendientes' : 'en esta categoría'}.
                        </div>
                    ) : (
                        filteredNotifications.map(notification => {
                            const badge = getCategoryBadge(notification.type);
                            return (
                                <div
                                    key={notification.id}
                                    onClick={() => handleRead(notification)}
                                    className={`bg-white border border-gray-200 rounded p-3.5 hover:bg-gray-50/70 transition-colors cursor-pointer ${
                                        !notification.isRead ? 'border-l-4 border-l-blue-600 bg-blue-50/20' : ''
                                    }`}
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="space-y-1.5 min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                {!notification.isRead && (
                                                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                                                )}
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}>
                                                    {badge.label}
                                                </span>
                                                <h4 className={`text-xs ${!notification.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                    {notification.title}
                                                </h4>
                                            </div>
                                            <p className="text-gray-600 text-xs leading-relaxed">
                                                {notification.message}
                                            </p>
                                        </div>
                                        <span className="text-[11px] text-gray-400 font-mono shrink-0" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                            {new Date(notification.createdAt).toLocaleDateString('es-EC')} {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
