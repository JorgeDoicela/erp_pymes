# 03. Integración con API y Resiliencia en Cliente

## 1. Cliente HTTP Centralizado (Axios Instance)

El cliente web gestiona la comunicación con la API REST a través de una instancia configurada de **Axios** (`src/api/axios.js` / `src/services/api.js`).

```javascript
// Configuración base de la instancia Axios en EMPLIFI
import axios from 'axios';

const api = axios.create({
 baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
 headers: { 'Content-Type': 'application/json' }
});

// Interceptor de Peticiones: Inyección de Bearer Token
api.interceptors.request.use((config) => {
 const token = localStorage.getItem('token');
 if (token) {
 config.headers.Authorization = `Bearer ${token}`;
 }
 return config;
});
```

---

## 2. Manejo de Errores e Interceptores de Respuesta

- **Detección de Sesión Expirada (`401 Unauthorized`)**:
 - Cuando la API devuelve un código `401`, el interceptor de respuesta captura la excepción, purga los datos del `localStorage` (`user`, `token`) y fuerza la redirección del navegador a la pantalla `/login`.
- **Modo Mantenimiento (`503 Service Unavailable`)**:
 - Intercepta la bandera de mantenimiento global activando el banner defensivo en toda la aplicación.
- **Tratamiento de Errores de Red**: Muestra alertas mediante `toast.error()` con mensajes entendibles para el usuario final sin exponer trazas internas del servidor.

---

## 3. Manejo de Estados de Carga e Inactividad

- **Cargador Global (`Loading.jsx`)**: Desplegado mientras transicionan las vistas perezosas o durante peticiones de red prolongadas.
- **Persistencia Local Segura**: Los datos de usuario en `localStorage` no contienen información confidencial como contraseñas ni claves de cifrado.
