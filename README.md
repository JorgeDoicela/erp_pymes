# Emplifi — Sistema de Gestión de Talento Humano

Sistema web de gestión del talento humano orientado a PyMEs, construido con arquitectura multi-tenant sobre una pila PERN (PostgreSQL · Express.js · React · Node.js). Incorpora un motor de nómina conforme a la legislación laboral ecuatoriana, un módulo de inteligencia analítica con modelos estadísticos de supervivencia y scoring multidimensional, registro de asistencia con validación geoespacial y biométrica WebAuthn, y un módulo de contabilidad financiera aislado.

## Estructura del Repositorio

```
recursos_humanos/
├── backend/          # API REST (Node.js · Express · Prisma ORM)
│   ├── prisma/       # Esquema de base de datos y migraciones
│   ├── src/
│   │   ├── app.js            # Configuración Express y middleware stack
│   │   ├── server.js         # Punto de entrada (HTTP + Socket.IO)
│   │   ├── config/           # Variables de entorno y roles
│   │   ├── controllers/      # Controladores por dominio
│   │   ├── services/         # Lógica de negocio por dominio
│   │   ├── repositories/     # Capa de acceso a datos (patrón Repository)
│   │   ├── routes/           # Definición de rutas REST
│   │   ├── middleware/       # Auth · Tenant · Error · Rate Limit · Maintenance
│   │   ├── database/         # Cliente Prisma con interceptor multi-tenant
│   │   ├── jobs/             # Cron jobs automatizados (node-cron)
│   │   └── utils/            # Encriptación AES-256-GCM · Utilidades financieras
│   └── tests/        # Pruebas de integración (Vitest · Supertest)
├── frontend/         # SPA React (Vite · Tailwind CSS · Recharts · Leaflet)
│   └── src/
│       ├── pages/    # 19 secciones de interfaz de usuario
│       ├── components/  # Componentes reutilizables
│       ├── api/      # Clientes HTTP por dominio
│       └── hooks/    # Custom hooks de estado
├── docs/             # Documentación técnica por secciones
└── docker-compose.yml  # Orquestación: PostgreSQL · Redis · Backend · Frontend/Nginx
```

## Módulos Funcionales

| Módulo | Descripción |
|--------|-------------|
| Empleados | CRUD de empleados con perfil, expediente, historial laboral y activos |
| Asistencia | Registro con validación de geocerca, VPN, biometría WebAuthn y turnos |
| Contratos | Gestión de tipos contractuales con alertas de vencimiento automáticas |
| Nómina | Cálculo automatizado con horas extra, recargo nocturno y anticipos |
| Desempeño | Plantillas de evaluación 360°, objetivos SMART y tracking de progreso |
| Reclutamiento | Portal de vacantes, aplicaciones y scoring de candidatos |
| Inteligencia | Modelo Weibull de rotación, Monte Carlo, ANOVA y scoring multidimensional |
| Contabilidad | Plan de cuentas, asientos contables, centros de costos y balance de comprobación |
| Cumplimiento Legal | Vencimiento de documentos, checklist de compliance y trazabilidad |
| Comunicación | Tablón de anuncios con lectura confirmada y reconocimiento |
| Emprendimiento | Módulo de incubadora con rondas de inversión, hitos y análisis de mercado |

## Pila Tecnológica

**Backend:** Node.js 20 · Express 5 · Prisma ORM 5.22 · PostgreSQL 15 · Socket.IO 4 · node-cron 4

**Frontend:** React 19 · Vite 7 · React Router DOM 7 · Recharts 3 · Leaflet 1.9 · Framer Motion 12 · TailwindCSS 3

**Seguridad:** JWT (jsonwebtoken) · bcryptjs · AES-256-GCM (crypto nativo) · Helmet · WebAuthn (@simplewebauthn)

**Infraestructura:** Docker Compose · Nginx (SSL/TLS) · Redis 7 · AWS EC2

## Levantamiento Local

```bash
# Clonar y levantar con Docker Compose
docker compose up --build -d

# O levantamiento manual (desarrollo)
# 1. Backend
cd backend && cp .env.example .env  # Configurar variables
npm install
npx prisma migrate dev
npm run dev   # Puerto 5000

# 2. Frontend
cd frontend && npm install
npm run dev   # Puerto 5173
```

## Documentación Técnica

La documentación detallada se encuentra en [`/docs`](./docs/README.md), organizada en las siguientes secciones:

- [`01-arquitectura/`](./docs/01-arquitectura/) — Arquitectura general, clean architecture y patrones de diseño
- [`02-backend-servicios/`](./docs/02-backend-servicios/) — API REST, autenticación, gobernanza, nómina, seguridad
- [`03-motores-especializados/`](./docs/03-motores-especializados/) — Motor de nómina y motor de liquidación legal
- [`04-base-de-datos/`](./docs/04-base-de-datos/) — Esquema relacional y catálogos normativos
- [`05-frontend-web/`](./docs/05-frontend-web/) — Arquitectura React y componentes de UI
- [`06-inteligencia-y-analitica/`](./docs/06-inteligencia-y-analitica/) — Modelos estadísticos y scoring multidimensional
- [`07-despliegue-y-operaciones/`](./docs/07-despliegue-y-operaciones/) — Infraestructura Docker y operaciones
- [`08-artefactos-scrum/`](./docs/08-artefactos-scrum/) — Backlog y épicas funcionales

## Variables de Entorno Requeridas

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...                  # Clave de 64 chars mínimo
ENCRYPTION_KEY=...              # Clave hex de 32 bytes (AES-256-GCM)
RP_ID=...                       # Relying Party ID para WebAuthn
FRONTEND_URL=...
EMAIL_USER=...
EMAIL_PASS=...
```

---

**Autor:** Jorge Doicela — Licencia ISC
