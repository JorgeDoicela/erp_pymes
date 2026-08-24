import { useState, useEffect, useRef, useCallback } from 'react';
import notificationService from '../../services/notifications/notification.service';
import { useNavigate } from 'react-router-dom';
import useNotificationSocket from '../../hooks/useNotificationSocket';
import { toast } from 'react-hot-toast';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotificationsData = async () => {
        try {
            const [res, unreadRes] = await Promise.all([
                notificationService.getNotifications({ limit: 5 }),
                notificationService.getUnreadCount()
            ]);
            const list = Array.isArray(res) ? res : (res?.data || []);
            setNotifications(list.slice(0, 5));
            setUnreadCount(unreadRes.count || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // Callback when real-time WebSocket notification arrives
    const handleNewWebSocketNotification = useCallback((newNotif) => {
        setNotifications(prev => [newNotif, ...(Array.isArray(prev) ? prev.slice(0, 4) : [])]);
        setUnreadCount(prev => prev + 1);
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white text-gray-900 shadow-lg rounded p-3.5 border border-gray-200 pointer-events-auto flex items-start gap-3`}>
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Nueva Notificación</p>
                    <p className="text-xs font-semibold text-gray-900 mt-0.5">{newNotif.title}</p>
                    <p className="text-xs text-gray-600 line-clamp-2 mt-1">{newNotif.message}</p>
                </div>
            </div>
        ), { duration: 4000 });
    }, []);

    // Connect WebSocket
    useNotificationSocket(handleNewWebSocketNotification);

    useEffect(() => {
        fetchNotificationsData();
        const interval = setInterval(fetchNotificationsData, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getCategoryBadge = (type) => {
        if (!type) return { label: 'SISTEMA', color: 'bg-gray-100 text-gray-700 border-gray-200' };
        if (type.startsWith('PAYROLL_')) return { label: 'NÓMINA', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
        if (type.startsWith('ABSENCE_')) return { label: 'AUSENCIA', color: 'bg-rose-50 text-rose-800 border-rose-200' };
        if (type.startsWith('EVALUATION_')) return { label: 'DESEMPEÑO', color: 'bg-amber-50 text-amber-800 border-amber-200' };
        if (type.includes('CONTRACT')) return { label: 'CONTRATO', color: 'bg-blue-50 text-blue-800 border-blue-200' };
        if (type.includes('DOCUMENT')) return { label: 'DOCUMENTO', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
        return { label: 'SISTEMA', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    };

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'hr';

    const handleRead = async (notification) => {
        if (!notification.isRead) {
            try {
                await notificationService.markAsRead(notification.id);
                setNotifications(prev => prev.map(n =>
                    n.id === notification.id ? { ...n, isRead: true } : n
                ));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error('Error marking as read:', error);
            }
        }

        setIsOpen(false);
        if (notification.type.startsWith('ANNOUNCEMENT')) {
            navigate('/announcements');
        } else if (notification.type === 'CONTRACT_EXPIRATION') {
            navigate(isAdmin ? '/admin/contracts/expiring' : '/my-expedient');
        } else if (notification.type.startsWith('EVALUATION_')) {
            navigate(isAdmin ? '/performance' : '/performance/my-evaluations');
        } else if (notification.type.startsWith('ABSENCE_')) {
            navigate(isAdmin ? '/admin/absences' : '/empleado/ausencias');
        } else if (notification.type === 'DOCUMENT_EXPIRATION') {
            navigate('/profile');
        } else if (notification.type === 'DOCUMENT_EXPIRATION_HR' || notification.type === 'DOCUMENT_EXPIRED') {
            navigate(isAdmin ? '/admin/employees' : '/profile');
        } else if (notification.type.startsWith('PAYROLL_')) {
            navigate(isAdmin ? '/admin/payroll/generator' : '/my-payments');
        } else {
            navigate('/notifications');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleViewAll = () => {
        setIsOpen(false);
        navigate('/notifications');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 transition-colors rounded ${isOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                title="Centro de Notificaciones"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-mono font-bold text-white bg-blue-600 rounded-full border-2 border-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 origin-top-right bg-white border border-gray-200 rounded shadow-xl z-[100] overflow-hidden text-gray-800">
                    <div className="p-3.5 border-b border-gray-200 flex justify-between items-center bg-gray-50/70">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 text-xs tracking-tight">Notificaciones</h3>
                            {unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded font-mono">
                                    {unreadCount} nuevas
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAllRead} className="text-[11px] text-blue-600 hover:text-blue-800 font-medium transition-colors cursor-pointer">
                                    Marcar leídas
                                </button>
                            )}
                            <button
                                onClick={() => { setIsOpen(false); navigate('/notifications/settings'); }}
                                className="p-1 rounded hover:bg-gray-200/60 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                                title="Configuración de canales"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[26rem] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
                                <span className="font-medium text-gray-500">No tienes notificaciones recientes</span>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {notifications.map(item => {
                                    const badge = getCategoryBadge(item.type);
                                    return (
                                        <li
                                            key={item.id}
                                            onClick={() => handleRead(item)}
                                            className={`p-3.5 hover:bg-gray-50/80 cursor-pointer transition-colors relative ${!item.isRead ? 'bg-blue-50/30' : ''}`}
                                        >
                                            <div className="flex gap-3 items-start">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center gap-2 mb-1">
                                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.color}`}>
                                                            {badge.label}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-mono tabular-nums">
                                                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs ${!item.isRead ? 'text-gray-900 font-semibold' : 'text-gray-700 font-medium'}`}>
                                                        {item.title}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mt-0.5">
                                                        {item.message}
                                                    </p>
                                                </div>
                                                {!item.isRead && (
                                                    <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1"></span>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    <div className="p-2.5 border-t border-gray-200 bg-gray-50/50">
                        <button
                            onClick={handleViewAll}
                            className="w-full py-1.5 text-xs text-center text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors font-medium cursor-pointer"
                        >
                            Ver todas las notificaciones →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
