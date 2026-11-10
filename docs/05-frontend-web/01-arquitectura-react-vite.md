# 01 — Arquitectura React + Vite (Frontend)

## 1. Stack Tecnológico

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | React | 19.2.0 |
| Bundler | Vite | 7.2.4 |
| Enrutamiento | React Router DOM | 7.10.0 |
| Gráficos analíticos | Recharts | 3.6.0 |
| Mapas y geocerca | Leaflet + React-Leaflet | 1.9.4 / 5.0.0 |
| Animaciones | Framer Motion | 12.23.26 |
| Renderizado ecuaciones | KaTeX + React-KaTeX | 0.18.4 |
| Biometría cliente | @simplewebauthn/browser | 13.2.2 |
| Estilos | Tailwind CSS | 3.4.18 |
| Toast | react-hot-toast | 2.6.0 |
| HTTP | Axios | 1.13.2 |
| Iconos | react-icons | 5.5.0 / heroicons 2.2.0 |
| PDF cliente | jspdf + jspdf-autotable | 3.0.4 |
| PWA | vite-plugin-pwa | 1.3.0 |

## 2. Estructura Arquitectónica Modular por Dominio (Feature/Domain-Driven)

```
frontend/src/
├── App.jsx                  # Orquestador: rutas por dominio, guards de autenticación (RBAC)
├── main.jsx                 # Bootstrap: React DOM + Router + ThemeProvider
├── index.css                # Variables CSS globales, reset, estándar estilos-erp-pymes
├── core/                    # Núcleo Transversal Compartido (Agnóstico de Negocio)
│   ├── api/                 # Cliente HTTP base centralizado (httpClient.js)
│   ├── constants/           # Roles (roles.js), permisos globales
│   ├── feedback/            # Loading, ErrorState, ErrorBoundary, MaintenanceBanner
│   ├── layout/              # MainLayout, DashboardLayout, Header, Sidebar, Footer
│   ├── pwa/                 # OfflineIndicator, PWAInstallPrompt, PWAReloadPrompt
│   ├── ui/                  # Design System Atómico (Button, Input, Select, Table, Modal...)
│   └── utils/               # Formateadores numéricos/fechas, validadores generales
│
└── modules/                 # Módulos Verticales Autónomos por Dominio
    ├── accounting/          # Contabilidad, Plan de Cuentas, Asientos, Balances
    ├── analytics/           # Inteligencia Predictiva (AIG), Advisor, Modelos ML, What-If
    ├── attendance/          # Asistencia, Turnos, Ausencias, Biometría WebAuthn
    ├── audit/               # Trazabilidad y Logs de Auditoría
    ├── auth/                # Login, Registro de Tenant, Recuperación de Clave
    ├── communication/       # Cartelera de Anuncios y Comunicados Corporativos
    ├── compliance/          # Cumplimiento Legal y Normativa Laboral
    ├── contracts/           # Contratos Laborales por Vencer
    ├── employees/           # Empleados, Expedientes, Activos, Onboarding, Certificados PDF
    ├── entrepreneurship/    # Incubadora de Emprendimientos y Proyectos
    ├── help/                # Centro de Ayuda y Soporte
    ├── notifications/       # Notificaciones Push / WebSocket en Tiempo Real
    ├── payroll/             # Nómina, Roles de Pago, Beneficios, Anticipos, Finiquitos
    ├── performance/         # Evaluaciones de Desempeño 360°, Metas y Objetivos
    ├── portal/              # Home landing, Dashboards centrales (Admin, Empleado, Móvil)
    ├── recruitment/         # Vacantes, Postulaciones, Candidatos y Entrevistas
    ├── reports/             # Reportes Gerenciales Consolidados y Exportadores
    ├── signatures/          # Centro de Firmas Electrónicas y Verificación Pública
    └── superadmin/          # Backoffice Multi-Tenant, Auditoría SaaS y Planes
```

### 2.1. Anatomía Canónica de un Módulo de Dominio (`src/modules/<dominio>/`)

Cada módulo opera bajo el principio de **alta cohesión y encapsulamiento estricto** (*vertical slice*):
* `pages/`: Vistas de usuario y páginas accesibles mediante enrutamiento.
* `components/`: Componentes visuales y contenedores de uso exclusivo del dominio.
* `services/`: Adaptadores HTTP y llamadas a endpoints del dominio.
* `hooks/`: Custom hooks con lógica de negocio y estado del dominio.
* `utils/`: Algoritmos, generadores y validadores específicos del dominio.
* `index.js`: **Public API (Barril)** que expone formalmente los artefactos públicos para el resto de la aplicación.

## 3. Gestión de Estado Global

El estado de autenticación se gestiona mediante un hook de estado local en `App.jsx`, inicializado desde `localStorage`:

```javascript
const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
        return { token, user: JSON.parse(user), isAuthenticated: true };
    }
    return { token: null, user: null, isAuthenticated: false };
});
```

No se utiliza Redux ni Context API de React para el estado de autenticación. El objeto `auth` y la función `setAuth` se pasan como props a los componentes que los requieren.

## 4. Lazy Loading y Code Splitting

El frontend aplica `React.lazy()` a todas las páginas no críticas, dividiendo el bundle en chunks independientes. Solo las páginas de carga crítica son eager-loaded:

**Eager (carga inmediata):**
- `Home` (landing pública)
- `Login`
- `AdminDashboard`
- `EmployeeDashboard`
- `ResetPassword`

**Lazy (carga bajo demanda):** 30+ páginas, incluyendo módulos completos como Contabilidad, Reclutamiento, Inteligencia, Cumplimiento Legal, etc.

Todas las rutas lazy están envueltas en un `<Suspense fallback={<Loading />}>` global.

## 5. Guards de Autenticación y Autorización

Las rutas protegidas verifican el estado de autenticación y el rol del usuario antes de renderizar:

```jsx
// Guard de autenticación
if (!auth.isAuthenticated) return <Navigate to="/login" />;

// Guard de rol
if (auth.user.role !== 'admin') return <Navigate to="/dashboard/employee" />;
```

## 6. PWA (Progressive Web App)

El sistema incluye soporte PWA mediante `vite-plugin-pwa`:

- **`PWAInstallPrompt`:** Sugiere al usuario instalar la aplicación como PWA en su dispositivo.
- **`OfflineIndicator`:** Muestra un banner cuando el usuario pierde conectividad.
- **`PWAReloadPrompt`:** Notifica al usuario cuando hay una nueva versión disponible y permite recargar.

El Service Worker generado por `vite-plugin-pwa` maneja el caché de activos estáticos para disponibilidad offline básica.

## 7. Temas Claro/Oscuro

El sistema soporta dos temas visuales (light mode / dark mode). El tema activo se detecta desde:
1. Preferencia guardada en `localStorage`.
2. Preferencia del sistema operativo (`prefers-color-scheme`).

Los logos se adaptan al tema activo:
- **Tema claro:** `logo_istpet_color.webp`
- **Tema oscuro:** `logo_blanco.webp`

## 8. Portal de Carrerasy Reclutamiento Público

Las páginas `CareersPage` y `JobApplication` son accesibles sin autenticación y utilizan un `axios` sin header de autorización. Los candidatos externos pueden:
1. Ver vacantes activas publicadas por la empresa.
2. Completar y enviar su aplicación con datos personales y CV.

Estas páginas existen fuera del `MainLayout` (que requiere autenticación) y tienen su propio diseño visual público.
