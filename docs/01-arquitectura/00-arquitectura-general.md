# 00 — Arquitectura General del Sistema

## 1. Descripción del Sistema

Norma ERP es una plataforma de gestión de talento humano, nómina legal y contabilidad diseñada para PyMEs, implementada como una aplicación web SaaS multi-tenant. El sistema permite que múltiples empresas (tenants) operen de forma completamente aislada sobre una única instancia de infraestructura, compartiendo la capa de aplicación pero manteniendo separación total de datos mediante aislamiento lógico a nivel de base de datos.

El sistema está compuesto por dos aplicaciones independientes que se comunican a través de una API REST:

- **Backend:** API REST construida con Node.js (Express 5), gestionando la lógica de negocio, persistencia de datos mediante Prisma ORM sobre PostgreSQL, y comunicación en tiempo real mediante Socket.IO.
- **Frontend:** Single Page Application (SPA) construida con React 19 y Vite, servida como activos estáticos a través de Nginx con configuración de proxy inverso hacia el backend.

## 2. Pila Tecnológica

### 2.1 Backend

| Componente               | Tecnología                    | Versión |
| ------------------------ | ----------------------------- | ------- |
| Runtime                  | Node.js                       | 20 LTS  |
| Framework HTTP           | Express                       | 5.1.0   |
| ORM                      | Prisma Client                 | 5.22.0  |
| Base de datos            | PostgreSQL + pgvector         | 15      |
| WebSockets               | Socket.IO                     | 4.8.3   |
| Tareas programadas       | node-cron                     | 4.2.1   |
| Autenticación            | JSON Web Token (jsonwebtoken) | 9.0.2   |
| Hashing de contraseñas   | bcryptjs                      | 3.0.3   |
| Encriptación             | Node.js crypto (AES-256-GCM)  | nativo  |
| Cabeceras de seguridad   | Helmet                        | 8.1.0   |
| Autenticación biométrica | @simplewebauthn/server        | 13.2.3  |
| Envío de correo          | Nodemailer                    | 7.0.12  |
| Subida de archivos       | Multer                        | 2.0.2   |
| Exportación Excel        | ExcelJS                       | 4.4.0   |
| Precisión financiera     | Decimal.js                    | 10.6.0  |
| Validación de esquemas   | Zod                           | 3.24.2  |
| Tipado estático          | TypeScript (tsc --noEmit)     | 5.9.3   |

### 2.2 Frontend

| Componente             | Tecnología              | Versión       |
| ---------------------- | ----------------------- | ------------- |
| Framework UI           | React                   | 19.2.0        |
| Bundler                | Vite                    | 7.2.4         |
| Enrutamiento           | React Router DOM        | 7.10.0        |
| Gráficos               | Recharts                | 3.6.0         |
| Mapas / Geocerca       | Leaflet + React-Leaflet | 1.9.4 / 5.0.0 |
| Animaciones            | Framer Motion           | 12.23.26      |
| Renderizado matemático | KaTeX + React-KaTeX     | 0.18.4        |
| Biometría cliente      | @simplewebauthn/browser | 13.2.2        |
| Estilos                | Tailwind CSS            | 3.4.18        |
| Notificaciones         | react-hot-toast         | 2.6.0         |
| Generación PDF         | jspdf + jspdf-autotable | 3.0.4         |
| PWA                    | vite-plugin-pwa         | 1.3.0         |

### 2.3 Infraestructura

| Componente             | Tecnología                                    |
| ---------------------- | --------------------------------------------- |
| Contenedores           | Docker + Docker Compose                       |
| Proxy inverso          | Nginx (SSL/TLS en producción)                 |
| Servidor en la nube    | AWS EC2                                       |
| Volúmenes persistentes | postgres_data · uploads_data · ai_models_data |

## 3. Arquitectura Multi-Tenant

El sistema implementa un modelo de multi-tenancy tipo **single-database, shared-schema** con aislamiento lógico garantizado por un interceptor de Prisma (`$use`) que actúa como middleware de base de datos.

### 3.1 Flujo de Resolución de Tenant

```
Petición HTTP
     │
     ▼
[authenticate middleware]  ← Valida JWT, extrae req.user.tenantId
     │
     ▼
[requireTenant middleware]  ← Busca tenant en BD, valida estado de suscripción
     │                       Rechaza: SUSPENDED, CANCELLED, TRIAL_EXPIRED
     ▼
[runWithTenant(tenantId)]  ← Inyecta tenantId en AsyncLocalStorage
     │
     ▼
[Prisma $use interceptor]  ← Aplica filtros WHERE tenantId automáticamente
     │                       en todas las operaciones find*/update/delete
     ▼
Base de datos PostgreSQL
```

### 3.2 Planes de Suscripción y Período de Prueba

El sistema cuenta con un esquema de precios de impacto social orientado al apoyo de pequeñas y medianas empresas (PyMEs) e Inclusión Tecnológica:

| Plan       | Descripción                    | Precio / Emp / Mes | Max. Empleados | Prueba Gratuita   |
| ---------- | ------------------------------ | ------------------ | -------------- | ----------------- |
| ESSENTIAL  | Plan base para microempresas   | $0.50 / emp        | 25             | 45 días completos |
| GROWTH     | Plan en crecimiento para PyMEs | $1.00 / emp        | 100            | 45 días completos |
| ENTERPRISE | Plan corporativo sin límites   | $2.00 / emp        | Ilimitado      | 45 días completos |

- **Período de Prueba (Trial):** 45 días naturales sin necesidad de tarjeta de crédito. Este plazo está diseñado para permitir a las empresas completar un ciclo mensual integro de gestión de asistencia, solicitudes y cálculo/cierre de nómina.
- Validaciones: El campo `maxEmployees` en el modelo `Tenant` es validado en tiempo de registro de empleados y gestión de licencias.

### 3.3 Roles del Sistema

| Rol          | Descripción                    | Nivel de Acceso                                                               |
| ------------ | ------------------------------ | ----------------------------------------------------------------------------- |
| `superadmin` | Administrador de la plataforma | Lectura global en modo supervisión, escritura exclusiva en gestión de tenants |
| `admin`      | Administrador de empresa       | CRUD completo sobre todos los módulos de su tenant                            |
| `hr`         | Recursos Humanos               | CRUD en nómina, evaluaciones, contratos, documentos                           |
| `employee`   | Colaborador                    | Lectura de su propio perfil, auto-marcado de asistencia, evaluaciones propias |

## 4. Organización del Código Backend (Monolito Modular & Pure Nested Vertical Slices)

El backend está estructurado bajo una arquitectura de **Monolito Modular con Rebanadas Verticales Anidadas (Pure Nested Vertical Slices)**. Cada dominio funcional (Bounded Context) encapsula completamente sus controladores, servicios, repositorios, rutas y definiciones dentro de su propio módulo, exponiendo su contrato público a través de un archivo `index.js`. La lógica transversal reside de forma aislada en el directorio `core/`.

```
backend/src/
├── app.js                          # Configuración Express: Helmet, CORS, parser y montaje de router central
├── server.js                       # Entrada del servidor HTTP, inicialización Socket.IO y jobs cron
├── config/                         # Configuraciones estáticas y entorno (roles, storage)
│   ├── roles.js                    # Enumeración de roles del sistema y helper isSuperAdminRole()
│   └── storage.config.js           # Rutas y configuración de almacenamiento de archivos
│
├── core/                           # Núcleo transversal compartido (Cross-cutting Concerns)
│   ├── index.js                    # Barril de exportación canónica del núcleo
│   ├── router.js                   # Enrutador central que monta los 21 módulos bajo prefijo /api
│   ├── validators.js               # Esquemas Zod universales (Cédula ecuatoriana Módulo 10, teléfonos)
│   ├── errors/
│   │   └── appError.js             # Jerarquía de errores operacionales (AppError, NotFoundError, etc.)
│   ├── middleware/
│   │   ├── errorHandler.js         # Manejador centralizado de errores con mapeo HTTP semántico
│   │   ├── performance.middleware.js # Auditoría y logging de latencias con alertas SLA (>2000ms)
│   │   ├── rateLimit.middleware.js # Rate limiting por IP y ruta
│   │   └── validate.middleware.js  # Validación de esquemas Zod en los bordes de entrada
│   ├── security/
│   │   └── encryption.js           # Criptografía AES-256-GCM para datos sensibles (salarios, cuentas)
│   ├── storage/
│   │   ├── blob.service.js         # Abstracción de persistencia de archivos binarios
│   │   └── upload.middleware.js    # Middleware Multer para subida multipart/form-data
│   └── utils/
│       ├── asyncHandler.js         # Envoltorio de captura de excepciones asíncronas para Express
│       └── financialUtils.js       # Motor de aritmética de precisión arbitraria Decimal.js (ROUND_HALF_UP)
│
└── modules/                        # Bounded Contexts Modulares (21 dominios)
    ├── index.js                    # Barril maestro de exportación de contratos de todos los módulos
    │
    │   # --- Módulos Compuestos (Rebanadas Verticales Anidadas) ---
    ├── attendance/                 # Control Asistencial y Geofencing
    │   ├── absences/               # Slice de ausencias, permisos e incidencias (Controller, Service, Repo, Routes)
    │   ├── shifts/                 # Slice de turnos y tolerancias horarias (Controller, Service, Repo, Routes)
    │   ├── tracking/               # Slice de marcación GPS y geocercas (Controller, Service, Repo, Routes, Jobs)
    │   └── index.js                # Contrato público del módulo attendance
    │
    ├── payroll/                    # Nómina Legal y Remuneraciones
    │   ├── advances/               # Slice de anticipos quincenales (Controller, Service, Repo, Routes)
    │   ├── benefits/               # Slice de beneficios corporativos (Controller, Service, Repo, Routes)
    │   ├── calculation/            # Slice de motor de cálculo batch de rol de pagos (Controller, Service, Repo, Routes)
    │   ├── config/                 # Slice de configuración de parámetros patronales/IESS (Controller, Service, Repo, Routes)
    │   ├── payroll.jobs.js         # Jobs cron para cierre de nómina
    │   └── index.js                # Contrato público del módulo payroll
    │
    ├── employees/                  # Talento Humano y Gestión de Personal
    │   ├── directory/              # Slice de nómina de colaboradores y perfiles (Controller, Service, Repo, Routes)
    │   ├── lifecycle/              # Slice de onboarding y liquidaciones de offboarding (Controller, Service, Repo, Routes)
    │   ├── records/                # Slice de expedientes digitales y asignación de activos/EPPs
    │   └── index.js                # Contrato público del módulo employees
    │
    ├── performance/                # Desempeño y OKRs
    │   ├── evaluations/            # Slice de evaluaciones 360°, plantillas y rúbricas (Controller, Service, Repo, Routes)
    │   ├── goals/                  # Slice de metas y KPIs organizacionales (Controller, Service, Repo, Routes)
    │   ├── performance.jobs.js     # Jobs cron de recordatorios de evaluación
    │   └── index.js                # Contrato público del módulo performance
    │
    ├── reports/                    # Inteligencia de Negocio y Reportes Operativos
    │   ├── analytics/              # Slice de métricas de rotación y clima laboral (Controller, Service, Repo, Routes)
    │   ├── exports/                # Slice de generación de archivos CSV (BOM UTF-8) y PDF
    │   └── index.js                # Contrato público del módulo reports
    │
    ├── tenants/                    # Multitenancy y Administración de Plataforma
    │   ├── organization/           # Slice de configuración de empresas y onboarding de inquilinos
    │   ├── superadmin/             # Slice de control global de tenants para SuperAdmin
    │   └── index.js                # Contrato público del módulo tenants
    │
    ├── compliance/                 # Cumplimiento Laboral Ecuatoriano
    │   ├── labor/                  # Slice de alertas de inspección y normativas (Controller, Service, Repo, Routes)
    │   ├── statutory/              # Slice de provisiones legales patronales (13er, 14to, Fondos de Reserva)
    │   └── index.js                # Contrato público del módulo compliance
    │
    ├── notifications/              # Notificaciones y Mensajería
    │   ├── alerts/                 # Slice de avisos in-app y preferencias de usuario (Controller, Service, Repo, Routes)
    │   ├── channels/               # Slice de WebSockets (Socket.IO) y transporte de correo SMTP (Nodemailer)
    │   └── index.js                # Contrato público del módulo notifications
    │
    ├── intelligence/               # Inteligencia Artificial y Analítica Predictiva
    │   ├── analytics/              # Slice de dashboards inteligentes y scoring multidimensional
    │   ├── entrepreneurship/       # Slice de simuladores What-If y valoración de proyectos
    │   ├── predictive/             # Slice de motores estadísticos (RSI, Causal AI, DP-SGD, MORL, FT-Transformer)
    │   └── index.js                # Contrato público del módulo intelligence
    │
    │   # --- Módulos Atómicos (Single Slice Directo) ---
    ├── accounting/                 # Contabilidad gubernamental y NIIF (Controller, Service, Repo, Routes, DTOs, Types)
    ├── audit/                      # Trazabilidad inmutable de eventos de auditoría (Controller, Repo, Routes)
    ├── auth/                       # Autenticación JWT, recuperación de contraseña y middleware de sesión
    ├── biometrics/                 # Autenticación biométrica WebAuthn / FIDO2 del lado del servidor (@simplewebauthn/server)
    ├── communication/              # Comunicados oficiales institucionales y confirmaciones de lectura
    ├── contracts/                  # Gestión de contratos laborales y alertas de vencimiento
    ├── documents/                  # Archivos digitales del colaborador y control de caducidades
    ├── recruitment/                # Pipeline de vacantes, postulaciones y selección de candidatos
    ├── signatures/                 # Firma electrónica ecuatoriana conforme a Ley de Comercio Electrónico
    ├── skills/                     # Matriz de habilidades y competencias técnicas
    ├── sustainability/             # Indicadores ODS 8, RAG legal ecuatoriano y pipeline de fine-tuning SLM
    └── system/                     # Parámetros del sistema y middleware de mantenimiento programado
```

## 5. Seguridad por Capas

El sistema implementa múltiples capas de seguridad independientes:

1. **Cabeceras HTTP (Helmet):** CSP, HSTS (1 año, preload), X-Frame-Options SAMEORIGIN, X-Content-Type-Options nosniff.
2. **CORS:** Lista blanca de orígenes configurada explícitamente, con soporte para dominios dinámicos via variables de entorno.
3. **Cache-Control:** `no-store, no-cache, must-revalidate` en todas las respuestas para prevenir caché de datos sensibles.
4. **Rate Limiting:** Configurable por ruta. Login: 10 req / 15 min. Forgot-password: 5 req / 15 min.
5. **Autenticación JWT:** Bearer token verificado en cada petición protegida.
6. **Autorización RBAC:** `authorize(roles)` verifica que el rol del usuario esté en la lista permitida por cada endpoint.
7. **Aislamiento Multi-Tenant:** Interceptor Prisma `$use` aplica filtros `WHERE tenantId` automáticamente en todas las operaciones.
8. **Encriptación de datos sensibles:** AES-256-GCM para salarios, coordenadas GPS y datos bancarios.
9. **Validación Anti-VPN:** Verificación de IP mediante ip-api.com antes de registrar asistencia.
10. **Protección de archivos estáticos:** Las rutas `/uploads` verifican autenticación antes de servir archivos.

## 6. Comunicación en Tiempo Real

El servidor `server.js` instancia Socket.IO sobre el mismo servidor HTTP de Express. Los eventos emitidos incluyen notificaciones de asistencia, alertas de evaluación y cambios de estado de procesos asincrónicos.

## 7. Almacenamiento de Archivos

Los archivos subidos (CV, contratos, documentos de identidad, firmas de activos) se almacenan en el sistema de archivos local del contenedor Docker, mapeados al volumen persistente `uploads_data`. El directorio base es `backend/uploads/`, subdividido por tipo de documento.

## 8. Cron Jobs Registrados

| Job                   | Expresión Cron | Función                                           |
| --------------------- | -------------- | ------------------------------------------------- |
| contractCronJob       | `0 8 * * *`    | Alertas de contratos por vencer (30, 15, 7 días)  |
| payrollCronJob        | `0 9 * * *`    | Recordatorios de cierre y pago de nómina          |
| documentCronJob       | Configurable   | Alertas de documentos vencidos                    |
| performanceCronJob    | Configurable   | Alertas de evaluaciones pendientes                |
| requestMonitorCronJob | Configurable   | Monitoreo de solicitudes pendientes de aprobación |
