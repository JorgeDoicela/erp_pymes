import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let globalSocket = null;

const getSocketInstance = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return null;

    if (globalSocket) {
        if (!globalSocket.connected) {
            globalSocket.connect();
        }
        return globalSocket;
    }

    let serverUrl = '';
    if (import.meta.env.VITE_SOCKET_URL) {
        serverUrl = import.meta.env.VITE_SOCKET_URL;
    } else if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')) {
        serverUrl = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
    } else {
        serverUrl = window.location.origin;
    }

    globalSocket = io(serverUrl, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000
    });

    globalSocket.on('connect', () => {
        console.log('[WEBSOCKET] Conectado al servidor de notificaciones');

        let userObj = null;
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) userObj = JSON.parse(storedUser);
        } catch (e) {
            console.error('Error parsing stored user:', e);
        }

        const currentToken = localStorage.getItem('token') || sessionStorage.getItem('token');
        globalSocket.emit('authenticate', {
            token: currentToken,
            userId: userObj?.id || userObj?.employeeId,
            tenantId: userObj?.tenantId
        });

        if (userObj?.tenantId) {
            globalSocket.emit('join_tenant', userObj.tenantId);
        }
    });

    globalSocket.on('disconnect', (reason) => {
        console.log('[WEBSOCKET] Desconectado:', reason);
    });

    return globalSocket;
};

export const useNotificationSocket = (onNewNotification) => {
    const callbackRef = useRef(onNewNotification);

    useEffect(() => {
        callbackRef.current = onNewNotification;
    }, [onNewNotification]);

    useEffect(() => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;

        const socket = getSocketInstance();
        if (!socket) return;

        const handleNotification = (notification) => {
            console.log('[WEBSOCKET] Nueva notificación recibida:', notification);
            if (typeof callbackRef.current === 'function') {
                callbackRef.current(notification);
            }
        };

        socket.on('new_notification', handleNotification);

        return () => {
            socket.off('new_notification', handleNotification);
        };
    }, []);

    return globalSocket;
};

export default useNotificationSocket;
