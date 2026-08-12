# 00 — Arquitectura General del Sistema

## 1. Descripción del Sistema

Emplifi es una plataforma de gestión de talento humano diseñada para PyMEs, implementada como una aplicación web SaaS multi-tenant. El sistema permite que múltiples empresas (tenants) operen de forma completamente aislada sobre una única instancia de infraestructura, compartiendo la capa de aplicación pero manteniendo separación total de datos mediante aislamiento lógico a nivel de base de datos.

El sistema está compuesto por dos aplicaciones independientes que se comunican a través de una API REST:

- **Backend:** API REST construida con Node.js (Express 5), gestionando la lógica de negocio, persistencia de datos mediante Prisma ORM sobre PostgreSQL, y comunicación en tiempo real mediante Socket.IO.
- **Frontend:** Single Page Application (SPA) construida con React 19 y Vite, servida como activos estáticos a través de Nginx con configuración de proxy inverso hacia el backend.

## 2. Pila Tecnológica

### 2.1 Backend

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Runtime | Node.js | 20 LTS |
| Framework HTTP | Express | 5.1.0 |
| ORM | Prisma Client | 5.22.0 |
| Base de datos | PostgreSQL | 15-alpine |
| Caché / Mensajería | Redis | 7-alpine |
| WebSockets | Socket.IO | 4.8.3 |
| Tareas programadas | node-cron | 4.2.1 |
| Autenticación | JSON Web Token (jsonwebtoken) | 9.0.2 |
| Hashing de contraseñas | bcryptjs | 3.0.3 |
| Encriptación | Node.js crypto (AES-256-GCM) | nativo |
| Cabeceras de seguridad | Helmet | 8.1.0 |
| Autenticación biométrica | @simplewebauthn/server | 13.2.3 |
| Envío de correo | Nodemailer | 7.0.12 |
| Subida de archivos | Multer | 2.0.2 |
| Exportación Excel | ExcelJS | 4.4.0 |
| Precisión financiera | Decimal.js | 10.6.0 |

### 2.2 Frontend

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Framework UI | React | 19.2.0 |
| Bundler | Vite | 7.2.4 |
| Enrutamiento | React Router DOM | 7.10.0 |
| Gráficos | Recharts | 3.6.0 |
| Mapas / Geocerca | Leaflet + React-Leaflet | 1.9.4 / 5.0.0 |
| Animaciones | Framer Motion | 12.23.26 |
| Renderizado matemático | KaTeX + React-KaTeX | 0.18.4 |
| Biometría cliente | @simplewebauthn/browser | 13.2.2 |
| Estilos | Tailwind CSS | 3.4.18 |
| Notificaciones | react-hot-toast | 2.6.0 |
| Generación PDF | jspdf + jspdf-autotable | 3.0.4 |
| PWA | vite-plugin-pwa | 1.3.0 |

### 2.3 Infraestructura

| Componente | Tecnología |
|-----------|-----------|
| Contenedores | Docker + Docker Compose |
| Proxy inverso | Nginx (SSL/TLS en producción) |
| Servidor en la nube | AWS EC2 |
| Volúmenes persistentes | postgres_data · redis_data · uploads_data |

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

### 3.2 Planes de Suscripción

| Plan | Descripción | Max. Empleados |
|------|-------------|----------------|
| ESSENTIAL | Plan base para PyMEs pequeñas | 50 |
| GROWTH | Plan en crecimiento | Configurable |
| ENTERPRISE | Sin límite de empleados | Ilimitado |

El campo `maxEmployees` en el modelo `Tenant` es validado en tiempo de creación de cada empleado por el `EmployeeService`.

### 3.3 Roles del Sistema

| Rol | Descripción | Nivel de Acceso |
|-----|-------------|-----------------|
| `superadmin` | Administrador de la plataforma | Lectura global en modo supervisión, escritura exclusiva en gestión de tenants |
| `admin` | Administrador de empresa | CRUD completo sobre todos los módulos de su tenant |
| `hr` | Recursos Humanos | CRUD en nómina, evaluaciones, contratos, documentos |
| `employee` | Colaborador | Lectura de su propio perfil, auto-marcado de asistencia, evaluaciones propias |

## 4. Organización del Código Backend

```
backend/src/
├── app.js                # Express app: CORS, Helmet, middleware stack, rutas
├── server.js             # Punto entrada: HTTP server + Socket.IO init + Cron jobs
├── config/
│   ├── roles.js          # Enumeración de roles y helper isSuperAdminRole()
│   └── storage.config.js # Configuración de almacenamiento local
├── controllers/          # Controladores HTTP (thin layer → delegan a services)
│   ├── auth/             # Login, forgot/reset password
│   ├── admin/            # Seed controller, SuperAdmin
│   ├── attendance/       # Asistencia, Turnos, Ausencias
│   ├── employees/        # Empleados, Expediente, Activos, Offboarding
│   ├── payroll/          # Nómina, Configuración, Beneficios, Anticipos
│   ├── performance/      # Evaluaciones, Objetivos
│   ├── contracts/        # Contratos
│   ├── documents/        # Documentos
│   ├── notifications/    # Notificaciones, Preferencias
│   ├── compliance/       # Cumplimiento legal
│   ├── communication/    # Anuncios
│   ├── tenant/           # Gestión de tenants
│   ├── reports/          # Reportes
│   ├── export/           # Exportación
│   ├── skills/           # Habilidades
│   ├── recruitment.controller.js  # Reclutamiento
│   ├── analytics.controller.js    # Analítica general
│   ├── intelligenceController.js  # Motor de inteligencia
│   ├── audit.controller.js        # Logs de auditoría
│   ├── biometric.controller.js    # WebAuthn
│   └── notification.preferences.controller.js
├── services/             # Lógica de negocio (capa de dominio)
│   ├── attendance/       # attendanceService.js · absenceService.js · shiftService.js
│   ├── employees/        # employeeService.js · offboardingService.js · assetService.js · expedientService.js
│   ├── payroll/          # payrollCalculationService.js · payrollConfigService.js · salaryAdvanceService.js
│   ├── performance/      # (evaluaciones y objetivos)
│   ├── contracts/        # (gestión de contratos)
│   ├── documents/        # (gestión de documentos)
│   ├── compliance/       # (cumplimiento normativo)
│   ├── notifications/    # notificationService.js
│   ├── recruitment/      # (reclutamiento)
│   ├── reports/          # (generación de reportes)
│   ├── export/           # (exportación de datos)
│   ├── skills/           # (habilidades)
│   ├── communication/    # (anuncios)
│   ├── storage/          # (almacenamiento de archivos)
│   ├── system/           # (configuración del sistema)
│   └── intelligenceService.js  # Motor de inteligencia analítica (1621 líneas)
├── repositories/         # Acceso a datos (patrón Repository)
│   ├── employees/        # employeeRepository.js
│   ├── attendance/       # attendanceRepository.js
│   └── audit/            # auditRepository.js
├── routes/               # Definición de rutas REST agrupadas por dominio
│   └── index.routes.js   # Router principal con montaje de todos los sub-routers
├── middleware/
│   ├── auth.middleware.js        # Verificación JWT, authorize(roles)
│   ├── tenant.middleware.js      # Resolución y validación de tenant
│   ├── errorHandler.js           # Manejo centralizado de errores, request logger
│   ├── maintenance.middleware.js  # Modo mantenimiento programado
│   ├── performance.middleware.js  # Logging de tiempos de respuesta
│   ├── rateLimit.middleware.js    # Rate limiting configurable por ruta
│   ├── security.middleware.js     # Protección de archivos estáticos
│   ├── superAdmin.middleware.js   # Middleware exclusivo para SuperAdmin
│   ├── upload.middleware.js       # Configuración Multer
│   └── validation.middleware.js   # Validación de esquemas de entrada
├── database/
│   ├── db.js             # PrismaClient singleton con interceptor multi-tenant ($use)
│   └── tenantContext.js  # AsyncLocalStorage para contexto asíncrono de tenant
├── jobs/                 # Tareas programadas con node-cron
│   ├── contractCronJob.js     # Alertas de vencimiento de contratos (diario 08:00)
│   ├── documentCronJob.js     # Alertas de documentos vencidos
│   ├── payrollCronJob.js      # Recordatorios de cierre y pago de nómina (diario 09:00)
│   ├── performanceCronJob.js  # Alertas de evaluaciones pendientes
│   └── requestMonitorCronJob.js # Monitoreo de solicitudes pendientes
└── utils/
    ├── encryption.js     # AES-256-GCM: encrypt/decrypt para salarios, coordenadas y datos bancarios
    └── financialUtils.js # Decimal.js wrapper para cálculos financieros con precisión de 20 dígitos
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

El servidor `server.js` instancia Socket.IO sobre el mismo servidor HTTP de Express. Los eventos emitidos incluyen notificaciones de asistencia, alertas de evaluación y cambios de estado de procesos asincrónicos. Redis puede configurarse como adaptador de Socket.IO para escalado horizontal.

## 7. Almacenamiento de Archivos

Los archivos subidos (CV, contratos, documentos de identidad, firmas de activos) se almacenan en el sistema de archivos local del contenedor Docker, mapeados al volumen persistente `uploads_data`. El directorio base es `backend/uploads/`, subdividido por tipo de documento.

## 8. Cron Jobs Registrados

| Job | Expresión Cron | Función |
|-----|----------------|---------|
| contractCronJob | `0 8 * * *` | Alertas de contratos por vencer (30, 15, 7 días) |
| payrollCronJob | `0 9 * * *` | Recordatorios de cierre y pago de nómina |
| documentCronJob | Configurable | Alertas de documentos vencidos |
| performanceCronJob | Configurable | Alertas de evaluaciones pendientes |
| requestMonitorCronJob | Configurable | Monitoreo de solicitudes pendientes de aprobación |
