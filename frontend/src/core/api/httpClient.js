/**
 * @file httpClient.js
 * @description Cliente HTTP centralizado y unificado para Norma ERP
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const httpClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30s timeout para prevenir conexiones zombis
});

// Interceptor de Petición: Inyección de Credenciales y Multi-Tenancy
httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Respuesta: Resiliencia, Manejo de Errores y Estados de Sesión
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Error de red / backend inaccesible
      toast.error('No se pudo establecer conexión con el servidor. Verifique su red.', {
        id: 'network-error',
        duration: 4000,
      });
      return Promise.reject(error);
    }

    const { status, data, config } = error.response;
    const isAuthRoute = config?.url?.includes('/auth/');
    const isSuperAdminRoute = config?.url?.includes('/superadmin');

    // 401 No Autorizado / Token Expirado
    if (status === 401 && !isAuthRoute) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register-tenant') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('Su sesión ha expirado. Por favor ingrese nuevamente.', {
          id: 'auth-expired',
          duration: 3500,
        });
        window.location.href = '/login';
      }
    }

    // 402 / 403 Suscripción Suspendida o Inactiva
    const isSuspendedOrInactive =
      status === 402 ||
      data?.code === 'SUBSCRIPTION_SUSPENDED' ||
      data?.code === 'TRIAL_EXPIRED' ||
      data?.code === 'TENANT_INACTIVE' ||
      data?.code === 'SUBSCRIPTION_CANCELLED';

    if (isSuspendedOrInactive && !isSuperAdminRoute) {
      const msg =
        data?.message || 'La suscripción de la empresa se encuentra suspendida o inactiva.';
      toast.error(msg, {
        id: 'subscription-inactive',
        duration: 4500,
      });
    }

    // 503 Modo Mantenimiento
    if (status === 503) {
      toast.error('El sistema se encuentra temporalmente en mantenimiento técnico programado.', {
        id: 'maintenance-error',
        duration: 5000,
      });
    }

    return Promise.reject(error);
  }
);

export default httpClient;
