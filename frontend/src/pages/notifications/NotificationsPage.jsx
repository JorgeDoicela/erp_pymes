import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../../services/notifications/notification.service';
import useNotificationSocket from '../../hooks/useNotificationSocket';

const NotificationsPage = () => {
    const navigate = useNavigate();

    // Estados
    const [notifications, setNotifications] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        unread: 0,
        absenceCount: 0,
        evaluationCount: 0,
        contractCount: 0,
        payrollCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, absence, evaluation, contract, payroll
    const [actionLoading, setActionLoading] = useState(false);
    const [notification, setNotification] = useState(null); // feedback en pantalla

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const loadStats = async () => {
        try {
            const res = await notificationService.getNotificationStats();
            if (res.success && res.data) {
                setStats(res.data);
            }
        } catch (error) {
            console.error('Error al cargar estadísticas de notificaciones:', error);
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filter === 'unread') params.isUnread = true;
            else if (filter !== 'all') params.category = filter;

            const res = await notificationService.getNotifications(params);
            if (res.success && Array.isArray(res.data)) {
                setNotifications(res.data);
            } else if (Array.isArray(res)) {
                setNotifications(res);
            }
        } catch (error) {
            showNotification('error', error.message || 'Error al cargar notificaciones');
        } finally {
            setLoading(false);
        }
    };

    // WebSocket real-time listener
    const handleNewWebSocketNotification = useCallback((newNotif) => {
        setNotifications(prev => [newNotif, ...prev]);
        loadStats();
    }, []);

    useNotificationSocket(handleNewWebSocketNotification);

    useEffect(() => {
        window.scrollTo(0, 0);
        loadStats();
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [filter]);

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'hr';

    const handleReadAndNavigate = async (notif) => {
        if (!notif.isRead) {
            try {
                await notificationService.markAsRead(notif.id);
                setNotifications(prev => prev.map(n =>
                    n.id === notif.id ? { ...n, isRead: true } : n
                ));
                loadStats();
            } catch (error) {
                console.error('Error marcando notificación como leída:', error);
            }
        }

        if (notif.type.startsWith('ANNOUNCEMENT')) {
            navigate('/announcements');
        } else if (notif.type === 'CONTRACT_EXPIRATION') {
            navigate(isAdmin ? '/admin/contracts/expiring' : '/my-expedient');
        } else if (notif.type.startsWith('EVALUATION_')) {
            navigate(isAdmin ? '/performance' : '/performance/my-evaluations');
        } else if (notif.type.startsWith('ABSENCE_')) {
            navigate(isAdmin ? '/admin/absences' : '/empleado/ausencias');
        } else if (notif.type === 'DOCUMENT_EXPIRATION') {
            navigate('/profile');
        } else if (notif.type === 'DOCUMENT_EXPIRATION_HR' || notif.type === 'DOCUMENT_EXPIRED') {
            navigate(isAdmin ? '/admin/employees' : '/profile');
        } else if (notif.type.startsWith('PAYROLL_')) {
            navigate(isAdmin ? '/admin/payroll/generator' : '/my-payments');
        }
    };

    const handleMarkAllRead = async () => {
        setActionLoading(true);
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            showNotification('success', 'Todas las notificaciones fueron marcadas como leídas');
            loadStats();
        } catch (error) {
            showNotification('error', error.message || 'Error al marcar notificaciones');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteSingle = async (e, id) => {
        e.stopPropagation();
        try {
            await notificationService.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            showNotification('success', 'Notificación descartada');
            loadStats();
        } catch (error) {
            showNotification('error', error.message || 'Error al descartar notificación');
        }
    };

    const handleClearRead = async () => {
        setActionLoading(true);
        try {
            await notificationService.clearReadNotifications();
            setNotifications(prev => prev.filter(n => !n.isRead));
            showNotification('success', 'Notificaciones leídas eliminadas del historial');
            loadStats();
        } catch (error) {
            showNotification('error', error.message || 'Error al limpiar notificaciones');
        } finally {
            setActionLoading(false);
        }
    };

    const getCategoryBadge = (type) => {
        if (!type) return { label: 'SISTEMA', cls: 'bg-gray-50 text-gray-700 border-gray-200' };
        if (type.startsWith('PAYROLL_')) return { label: 'NÓMINA', cls: 'bg-emerald-50/60 text-emerald-900 border-emerald-200' };
        if (type.startsWith('ABSENCE_')) return { label: 'AUSENCIA', cls: 'bg-rose-50/60 text-rose-900 border-rose-200' };
        if (type.startsWith('EVALUATION_')) return { label: 'DESEMPEÑO', cls: 'bg-amber-50/60 text-amber-900 border-amber-200' };
        if (type.includes('CONTRACT')) return { label: 'CONTRATO', cls: 'bg-blue-50/60 text-blue-900 border-blue-200' };
        if (type.includes('DOCUMENT')) return { label: 'DOCUMENTO', cls: 'bg-indigo-50/60 text-indigo-900 border-indigo-200' };
        if (type.startsWith('ANNOUNCEMENT')) return { label: 'COMUNICADO', cls: 'bg-gray-50 text-gray-700 border-gray-200' };
        return { label: 'SISTEMA', cls: 'bg-gray-50 text-gray-700 border-gray-200' };
    };

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

            {/* Header ERP con Resumen de Alertas Integrado */}
            <div className="pb-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Sistema · Alertas & Eventos</p>
                    <h1 className="text-xl font-semibold text-gray-900">Centro de Notificaciones</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Historial operativo de vencimientos, aprobaciones y novedades en tiempo real.</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-4 bg-white px-3.5 py-2 rounded border border-gray-200 font-mono text-xs">
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">No Leídas</span>
                            <span className="font-semibold text-rose-700 tabular-nums">
                                {stats.unread} pendientes
                            </span>
                        </div>
                        <div className="w-px h-6 bg-gray-200" />
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Total Histórico</span>
                            <span className="font-semibold text-gray-900 tabular-nums">
                                {stats.total}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/notifications/settings')}
                        className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                    >
                        Configurar Canales ↗
                    </button>
                </div>
            </div>

            {/* Pestañas con Contadores Integrados (Holded/Linear Style) */}
            <div className="flex items-center justify-between border-b border-gray-200 gap-4 overflow-x-auto">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setFilter('all')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            filter === 'all'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Todas <span className="ml-1.5 font-mono text-[11px] text-gray-400">({stats.total})</span>
                    </button>

                    <button
                        onClick={() => setFilter('unread')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            filter === 'unread'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        No leídas <span className="ml-1.5 font-mono text-[11px] text-rose-700">({stats.unread})</span>
                    </button>

                    <button
                        onClick={() => setFilter('absence')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            filter === 'absence'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Ausencias <span className="ml-1.5 font-mono text-[11px] text-gray-400">({stats.absenceCount})</span>
                    </button>

                    <button
                        onClick={() => setFilter('evaluation')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            filter === 'evaluation'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Desempeño <span className="ml-1.5 font-mono text-[11px] text-gray-400">({stats.evaluationCount})</span>
                    </button>

                    <button
                        onClick={() => setFilter('contract')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            filter === 'contract'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Contratos / Docs <span className="ml-1.5 font-mono text-[11px] text-gray-400">({stats.contractCount})</span>
                    </button>

                    <button
                        onClick={() => setFilter('payroll')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            filter === 'payroll'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Nómina & Pagos <span className="ml-1.5 font-mono text-[11px] text-gray-400">({stats.payrollCount})</span>
                    </button>
                </div>

                <div className="flex items-center gap-2 shrink-0 pb-1">
                    <button
                        disabled={actionLoading || stats.unread === 0}
                        onClick={handleMarkAllRead}
                        className="text-xs text-gray-600 hover:text-gray-900 font-medium px-2.5 py-1 border border-gray-200 rounded hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-40"
                    >
                        Marcar todas leídas
                    </button>
                    <button
                        disabled={actionLoading || (stats.total - stats.unread === 0)}
                        onClick={handleClearRead}
                        className="text-xs text-gray-500 hover:text-red-700 font-medium px-2.5 py-1 border border-gray-200 rounded hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40"
                    >
                        Limpiar leídas
                    </button>
                </div>
            </div>

            {/* Listado de Notificaciones Estilo ERP */}
            <div className="bg-white rounded border border-gray-200 overflow-hidden divide-y divide-gray-100">
                {loading ? (
                    <div className="p-12 text-center text-gray-400 text-xs">
                        Cargando alertas del sistema...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-sm font-medium text-gray-700">Sin notificaciones</p>
                        <p className="text-xs text-gray-400 mt-1">No tienes alertas pendientes con el filtro seleccionado.</p>
                    </div>
                ) : (
                    notifications.map(notif => {
                        const badge = getCategoryBadge(notif.type);

                        return (
                            <div
                                key={notif.id}
                                onClick={() => handleReadAndNavigate(notif)}
                                className={`p-4 flex items-start justify-between gap-4 transition-colors cursor-pointer ${
                                    notif.isRead ? 'bg-white hover:bg-gray-50/60' : 'bg-blue-50/20 hover:bg-blue-50/30'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="pt-1 shrink-0">
                                        <span className={`inline-block w-2 h-2 rounded-full ${notif.isRead ? 'bg-gray-300' : 'bg-blue-600'}`} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${badge.cls}`}>
                                                {badge.label}
                                            </span>
                                            <span className="font-semibold text-xs text-gray-900">{notif.title}</span>
                                            <span className="text-[11px] text-gray-400 font-mono tabular-nums">
                                                {new Date(notif.createdAt).toLocaleDateString('es-EC', {
                                                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed max-w-3xl">
                                            {notif.message}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                                    <span className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                        Abrir →
                                    </span>
                                    <button
                                        onClick={(e) => handleDeleteSingle(e, notif.id)}
                                        className="text-gray-400 hover:text-gray-600 text-base leading-none p-1 cursor-pointer"
                                        title="Descartar notificación"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
