import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to include token in requests
api.interceptors.request.use(
    (config) => {
        // You might want to get the token from localStorage or context here if not passed directly
        // But for now, we will assume the service handles passing the token or we rely on the caller
        // However, a common pattern is to check storage:
        const token = localStorage.getItem('token'); // Or however you store it
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

import toast from 'react-hot-toast';

// Interceptor to handle expired sessions or suspended subscriptions (402 Payment Required)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const { status, data } = error.response;
            if (status === 402 || data?.code === 'SUBSCRIPTION_SUSPENDED' || data?.code === 'TRIAL_EXPIRED') {
                const msg = data?.message || 'La suscripción de la empresa se encuentra suspendida por pago pendiente.';
                
                toast.error(msg, {
                    duration: 4000,
                    icon: '🚫',
                    style: {
                        borderRadius: '14px',
                        background: '#0f172a',
                        color: '#f8fafc',
                        border: '1px solid #334155',
                        padding: '14px 18px',
                        fontSize: '14px',
                        fontWeight: '600',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)'
                    }
                });

                sessionStorage.setItem('auth_error_toast', msg);
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                setTimeout(() => {
                    window.location.href = '/login';
                }, 1600);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
