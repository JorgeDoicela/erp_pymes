import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../../services/notifications/notification.service';

const NotificationsPage = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread

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

        // Navigation (Same logic as Bell)
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

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.isRead;
        return true;
    });

    const getIcon = (type) => {
        return (
            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200/60 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            </div>
        );
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6 font-sans">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        Centro de Notificaciones
                    </h2>
                    <p className="text-slate-500 text-xs mt-1">Historial de alertas y recordatorios</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/admin/notifications/settings')}
                        className="px-4 py-2 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 transition-colors text-slate-700 text-xs font-semibold shadow-xs flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Configurar
                    </button>
                    <button
                        onClick={() => navigate('/admin')}
                        className="px-4 py-2 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 transition-colors text-slate-700 text-xs font-semibold shadow-xs"
                    >
                        Volver al Panel
                    </button>
                </div>
            </header>

            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'}`}
                >
                    Todas
                </button>
                <button
                    onClick={() => setFilter('unread')}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === 'unread' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'}`}
                >
                    No leídas
                </button>
                <div className="flex-1"></div>
                <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-slate-700 hover:text-slate-900 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                    Marcar todas como leídas
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-400 text-xs">Cargando notificaciones...</div>
            ) : (
                <div className="space-y-3">
                    {filteredNotifications.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 text-xs italic shadow-xs">
                            No tienes notificaciones {filter === 'unread' ? 'pendientes' : 'en el historial'}.
                        </div>
                    ) : (
                        filteredNotifications.map(notification => (
                            <div
                                key={notification.id}
                                onClick={() => handleRead(notification)}
                                className={`relative group bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-slate-300 transition-all cursor-pointer shadow-xs ${!notification.isRead ? 'bg-slate-50/60' : ''}`}
                            >
                                {!notification.isRead && (
                                    <div className="absolute top-5 right-5 w-2 h-2 rounded-full bg-slate-900"></div>
                                )}
                                <div className="flex gap-4 items-start">
                                    {getIcon(notification.type)}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-sm ${!notification.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                                                {notification.title}
                                            </h4>
                                            <span className="text-[11px] text-slate-400 font-medium">
                                                {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-slate-500 text-xs leading-relaxed mb-3">
                                            {notification.message}
                                        </p>
                                        <div className="flex gap-2">
                                            {notification.type === 'CONTRACT_EXPIRATION' && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                                                    Contratos
                                                </span>
                                            )}
                                            {notification.type.startsWith('EVALUATION') && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                                                    Evaluaciones
                                                </span>
                                            )}
                                            {notification.type.startsWith('ABSENCE_') && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                                                    Ausencias
                                                </span>
                                            )}
                                            {notification.type.includes('DOCUMENT') && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                                                    Documentos
                                                </span>
                                            )}
                                            {notification.type.startsWith('PAYROLL_') && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                                                    Nómina
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
