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

export default api;
