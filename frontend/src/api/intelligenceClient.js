/**
 * Cliente HTTP centralizado para el módulo de Inteligencia
 *
 * Ventajas sobre el patrón anterior (token en cada función):
 * - Token leído una sola vez via interceptor
 * - Manejo automático de 401 (sesión expirada → redirige a /login)
 * - Errores HTTP normalizados en un solo lugar
 */

import axios from 'axios';

const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const intelligenceClient = axios.create({
    baseURL: `${BASE_URL}/intelligence`,
    timeout: 30000, // 30s — las peticiones de análisis pueden tardar
    headers: { 'Content-Type': 'application/json' },
});

// Interceptor de REQUEST: inyectar token automáticamente
intelligenceClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor de RESPONSE: manejar errores globales
intelligenceClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Sesión expirada — limpiar estado y redirigir
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default intelligenceClient;
