# EMPLIFI - Especificación Técnica del Sistema

Documentación de arquitectura, ingeniería de software, esquemas de datos y especificación de servicios del sistema **EMPLIFI**.

El sistema está compuesto por una arquitectura desacoplada:
- **Backend**: Node.js (Express ES Modules + Prisma ORM + PostgreSQL 14+).
- **Frontend**: React 18 (Vite + React Router v6 + Axios).
- **Módulos**: Empleados, Asistencia (Geofencing GPS), Ausencias, Nómina, Evaluaciones 360, Reclutamiento, Clima Laboral, Contabilidad Financiera, Incubadora de Emprendimiento, Inteligencia/Analítica, Notificaciones, Biometría y Auditoría.

---

## 🗺️ Estructura de la Documentación

```
docs/documentacion/
├── 01-arquitectura/
│   ├── 01-macro-arquitectura-clean-arch.md      # Arquitectura en capas, diagrama Mermaid de secuencia HTTP
│   └── 02-micro-arquitecturas-patrones.md       # Repository Pattern, interceptores middleware, cifrado AES-256-GCM
├── 02-backend-servicios/
│   ├── 01-especificacion-api-rest.md            # Catálogo técnico de endpoints REST (50+ rutas)
│   ├── 02-autenticacion-sso-y-rbac.md           # Matriz de permisos RBAC para los 5 roles (admin, hr, employee, accounting, entrepreneur)
│   ├── 03-gobernanza-lopdp-y-auditoria.md       # LOPDP, protección de archivos static, consentimiento GPS, AuditLog
│   └── 04-workflow-evaluaciones-y-nomina.md     # Algoritmos de nómina, formulas de horas extras, ausencias y OKRs
├── 03-motores-especializados/
│   ├── 01-motor-documental-pdf.md               # Generador de contratos, roles de pago y certificados en PDF
│   ├── 02-motor-asistencia-y-geofencing.md      # Fórmula Haversine, marcación GPS, geocercas y tolerancias
│   ├── 03-motor-evaluacion-desempeno-360.md     # Rúbricas, evaluaciones par/boss/auto y ponderaciones
│   ├── 04-motor-biometrico-y-seguridad.md       # Credenciales BiometricCredential, hashing Bcrypt
│   └── 05-motor-notificaciones-multicanal.md    # Notificaciones in-app, correo SMTP y preferencias
├── 04-base-de-datos/
│   ├── 01-esquema-relacional-emplifi.md         # Especificación técnica de las 45 entidades Prisma PostgreSQL
│   └── 02-catalogos-y-normativa-laboral.md      # Catálogos del sistema, enums y parámetros de cálculo
├── 05-frontend-web/
│   ├── 01-arquitectura-react-vite.md            # React 18, Vite, React.lazy, enrutamiento y RequireAuth
│   ├── 02-componentes-ui-y-layout.md            # Layouts (MainLayout, Sidebar), componentes y gráficos
│   └── 03-integracion-api-y-resiliencia.md      # Interceptor Axios, refresco de sesión 401 y manejo de red
├── 06-inteligencia-y-analitica/
│   └── 01-modulo-ia-y-reportes-predictivos.md  # Fórmulas de turnover, análisis eNPS y proyecciones
├── 07-despliegue-y-operaciones/
│   ├── 01-instalacion-entorno-local.md          # Guía de despliegue local, variables `.env` y seeders
│   └── 02-guia-auditoria-y-cumplimiento.md      # Lista de verificación de auditoría, cifrado y respaldos
└── README.md
```

---

## 🎯 Navegación Directa por Módulo Técnico

- **Backend / APIs**: [`01-especificacion-api-rest.md`](file:///c:/Users/DESARROLLADOR/Desktop/Proyectos/recursos_humanos/docs/documentacion/02-backend-servicios/01-especificacion-api-rest.md)
- **Roles y Permisos**: [`02-autenticacion-sso-y-rbac.md`](file:///c:/Users/DESARROLLADOR/Desktop/Proyectos/recursos_humanos/docs/documentacion/02-backend-servicios/02-autenticacion-sso-y-rbac.md)
- **Base de Datos (45 Tablas)**: [`01-esquema-relacional-emplifi.md`](file:///c:/Users/DESARROLLADOR/Desktop/Proyectos/recursos_humanos/docs/documentacion/04-base-de-datos/01-esquema-relacional-emplifi.md)
- **Geofencing / GPS**: [`02-motor-asistencia-y-geofencing.md`](file:///c:/Users/DESARROLLADOR/Desktop/Proyectos/recursos_humanos/docs/documentacion/03-motores-especializados/02-motor-asistencia-y-geofencing.md)
- **Frontend SPA**: [`01-arquitectura-react-vite.md`](file:///c:/Users/DESARROLLADOR/Desktop/Proyectos/recursos_humanos/docs/documentacion/05-frontend-web/01-arquitectura-react-vite.md)
