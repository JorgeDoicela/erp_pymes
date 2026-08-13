import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export const useNotificationSocket = (onNewNotification) => {
    const socketRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;

        // Extract tenantId from user object in localStorage if available
        let userObj = null;
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) userObj = JSON.parse(storedUser);
        } catch (e) {
            console.error('Error parsing stored user:', e);
        }

        // Determine server URL (remove trailing /api if present)
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const serverUrl = apiUrl.replace(/\/api\/?$/, '');

        const socket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[WEBSOCKET] Conectado al servidor de notificaciones');
            socket.emit('authenticate', {
                token: token,
                userId: userObj?.id || userObj?.employeeId,
                tenantId: userObj?.tenantId
            });

            if (userObj?.tenantId) {
                socket.emit('join_tenant', userObj.tenantId);
            }
        });

        socket.on('new_notification', (notification) => {
            console.log('[WEBSOCKET] Nueva notificación recibida:', notification);
            if (typeof onNewNotification === 'function') {
                onNewNotification(notification);
            }
        });

        socket.on('disconnect', (reason) => {
            console.log('[WEBSOCKET] Desconectado:', reason);
        });

        return () => {
            socket.off('connect');
            socket.off('new_notification');
            socket.off('disconnect');
            socket.disconnect();
        };
    }, [onNewNotification]);

    return socketRef.current;
};

export default useNotificationSocket;
