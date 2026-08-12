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

## 2. Estructura de Directorios

```
frontend/src/
├── App.jsx              # Punto de entrada: rutas, guards de autenticación, estado global
├── main.jsx             # Bootstrap: React DOM + Router + ThemeProvider
├── index.css            # Variables CSS globales, reset, tema oscuro/claro
├── constants/
│   ├── roles.js         # Enumeración de roles (sincronizada con backend)
│   └── ...
├── api/                 # Clientes HTTP por dominio
│   ├── auth.js          # Login, logout, forgot-password
│   ├── employees.js     # CRUD de empleados
│   ├── attendance.js    # Registro de asistencia
│   ├── payroll.js       # Nómina
│   ├── intelligence.js  # Dashboard de inteligencia
│   └── ...              # Un archivo por módulo funcional
├── components/          # Componentes reutilizables
│   ├── layout/
│   │   └── MainLayout.jsx    # Shell con sidebar, header y outlet de contenido
│   ├── common/
│   │   ├── MaintenanceBanner.jsx
│   │   └── ...
│   ├── pwa/
│   │   ├── PWAInstallPrompt.jsx
│   │   ├── OfflineIndicator.jsx
│   │   └── PWAReloadPrompt.jsx
│   └── Loading.jsx
├── pages/               # Páginas por módulo funcional (19 subdirectorios)
│   ├── auth/            # Login, ResetPassword, RegisterTenant
│   ├── landing/         # Home (página pública de aterrizaje)
│   ├── dashboard/       # AdminDashboard, EmployeeDashboard, IntelligentDashboard
│   │   └── views/       # Vistas del portal de empleado
│   ├── employees/       # EmployeeList, EmployeeProfile, EmployeeExpedient, Offboarding
│   ├── attendance/      # AttendancePage, ShiftManagement, AdminAbsences
│   ├── payroll/         # PayrollConfiguration, PayrollGenerator, MyPayments, Benefits
│   ├── performance/     # EvaluationDashboard, CreateEvaluation, MyEvaluations
│   ├── recruitment/     # RecruitmentDashboard, CareersPage (pública), JobApplication
│   ├── analytics/       # AnalyticsDashboard
│   ├── reports/         # TurnoverReport, PerformanceReport, PayrollCostReport
│   ├── accounting/      # AccountingDashboard, ChartOfAccounts, JournalEntries
│   ├── contracts/       # ExpiringContracts
│   ├── notifications/   # NotificationsPage, NotificationSettings
│   ├── audit/           # AuditLogsPage
│   ├── compliance/      # LegalComplianceDashboard
│   ├── communication/   # AnnouncementsBoard
│   ├── help/            # HelpCenter
│   └── superadmin/      # SuperAdminDashboard
└── hooks/               # Custom hooks
```

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
