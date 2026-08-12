# 03 — Integración API y Resiliencia del Cliente

## 1. Arquitectura de Clientes HTTP

El frontend organiza los clientes HTTP en archivos por dominio funcional dentro de `src/api/`. Cada archivo exporta funciones que encapsulan las llamadas a la API REST del backend mediante `axios`.

### 1.1 Configuración de Axios

La instancia base de Axios se configura con:
- `baseURL`: URL del backend obtenida de `import.meta.env.VITE_API_URL` (variable de entorno de Vite).
- `headers`: `Authorization: Bearer <token>` inyectado automáticamente desde `localStorage`.

```javascript
// api/base.js (patrón)
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

### 1.2 Manejo de Errores

Los errores HTTP son capturados en el interceptor de respuesta de Axios:
- **HTTP 401:** Token expirado o inválido → Limpia `localStorage` y redirige a `/login`.
- **HTTP 403:** Sin permisos → Muestra toast de error con el mensaje del servidor.
- **HTTP 429:** Rate limit superado → Muestra toast de advertencia.
- **HTTP 5xx:** Error de servidor → Muestra toast de error genérico.

## 2. Headers de Contexto Multi-Tenant

El tenant del usuario autenticado se transmite automáticamente en el payload JWT (`req.user.tenantId`), no en headers adicionales. El header `x-tenant-id` solo es utilizado por el SuperAdmin para seleccionar la empresa sobre la que opera.

## 3. Comunicación en Tiempo Real (Socket.IO)

El frontend establece una conexión Socket.IO con el backend para recibir notificaciones en tiempo real. Los eventos incluyen:

| Evento | Descripción |
|--------|-------------|
| `notification` | Nueva notificación in-app |
| `payroll_status` | Cambio de estado de una nómina |
| `attendance_update` | Actualización de estado de asistencia |

La conexión se establece al autenticarse y se cierra al hacer logout.

## 4. Progressive Web App (PWA)

La configuración de PWA mediante `vite-plugin-pwa` genera un Service Worker que:
- Cachea los activos estáticos (JS, CSS, imágenes) del bundle de Vite para carga offline.
- Intercepta peticiones de red fallidas cuando el usuario está sin conexión y devuelve la versión cacheada.
- El componente `OfflineIndicator` monitorea el evento `online/offline` del navegador y muestra un banner cuando la conexión se pierde.

## 5. Variables de Entorno del Frontend

| Variable | Descripción |
|---------|-------------|
| `VITE_API_URL` | URL base del backend (`http://localhost:5000/api` en dev, `https://erp.jorgedoicela.com/api` en prod) |
| `VITE_APP_NAME` | Nombre de la aplicación (para PWA manifest) |

## 6. Visualización de Ecuaciones Matemáticas

El módulo de inteligencia analítica utiliza `react-katex` para renderizar las fórmulas matemáticas (modelo Weibull, regresión lineal, etc.) directamente en la interfaz:

```jsx
import { InlineMath, BlockMath } from 'react-katex';

// Fórmula de supervivencia Weibull
<BlockMath math={`S(t) = \\exp\\left(-\\left(\\frac{t}{\\lambda}\\right)^k \\cdot e^{\\beta X}\\right)`} />
```

## 7. Mapas de Geocerca (Leaflet)

La pantalla de configuración del sistema y el perfil de empleado utilizan `react-leaflet` para:
- Visualizar la ubicación del lugar de trabajo en un mapa interactivo.
- Permitir al administrador configurar la geocerca arrastrando un marcador.
- Mostrar el radio de geocerca como un círculo visual sobre el mapa.

## 8. Exportación de Datos

El frontend implementa dos estrategias de exportación:

### 8.1 Exportación vía API (Server-side)

Para reportes de nómina, asistencia y empleados, el frontend hace una petición al endpoint `/api/export/*` que devuelve un blob (PDF o Excel). El cliente descarga el blob usando `URL.createObjectURL`.

### 8.2 Exportación en el Cliente (Client-side)

Algunas vistas permiten exportar los datos visibles directamente desde el navegador usando `jspdf` + `jspdf-autotable` para PDF o `canvg` para gráficos SVG → Canvas → PNG.
