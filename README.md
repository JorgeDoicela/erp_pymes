# Norma ERP — Sistema de Gestión y Cumplimiento Laboral

Sistema web de gestión del talento humano, nómina legal y contabilidad orientado a PyMEs, construido con arquitectura multi-tenant sobre una pila PERN (PostgreSQL · Express.js · React · Node.js) y alineado con el **ODS 8 (Trabajo Decente y Crecimiento Económico)**. Incorpora un motor de nómina conforme a la legislación laboral ecuatoriana, registro de asistencia con validación geoespacial y biométrica WebAuthn FIDO2, módulo de contabilidad financiera aislada y gobernanza socio-laboral.

## Estructura del Repositorio

```
erp_pymes/
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
│       ├── pages/    # Secciones de interfaz de usuario
│       ├── components/  # Componentes reutilizables
│       ├── api/      # Clientes HTTP por dominio
│       └── hooks/    # Custom hooks de estado
├── nginx/            # Reverse Proxy & API Gateway perimetral (SSL/TLS · WebSockets)
├── scripts/          # Utilidades operativas, mantenimiento y pruebas de estrés
├── docs/             # Biblioteca técnica Docs-as-Code (00-indice-general.md)
└── docker-compose.yml  # Orquestación: PostgreSQL · Redis · Backend · Frontend · Gateway
```

## Módulos Funcionales

| Módulo             | Descripción                                                                      |
| ------------------ | -------------------------------------------------------------------------------- |
| Empleados          | CRUD de empleados con perfil, expediente, historial laboral y activos            |
| Asistencia         | Registro con validación de geocerca, VPN, biometría WebAuthn y turnos            |
| Contratos          | Gestión de tipos contractuales con alertas de vencimiento automáticas            |
| Nómina             | Cálculo automatizado con horas extra, recargo nocturno y anticipos               |
| Desempeño          | Plantillas de evaluación 360°, objetivos SMART y tracking de progreso            |
| Reclutamiento      | Portal de vacantes, aplicaciones y scoring de candidatos                         |
| Inteligencia       | Modelo Weibull de rotación, Monte Carlo, ANOVA y scoring multidimensional        |
| Contabilidad       | Plan de cuentas, asientos contables, centros de costos y balance de comprobación |
| Cumplimiento Legal | Vencimiento de documentos, checklist de compliance y trazabilidad                |
| Comunicación       | Tablón de anuncios con lectura confirmada y reconocimiento                       |
| Emprendimiento     | Módulo de incubadora con rondas de inversión, hitos y análisis de mercado        |

## Pila Tecnológica

**Backend:** Node.js 20 · Express 5 · Prisma ORM 5.22 · PostgreSQL 15 · Socket.IO 4 · node-cron 4

**Frontend:** React 19 · Vite 7 · React Router DOM 7 · Recharts 3 · Leaflet 1.9 · Framer Motion 12 · TailwindCSS 3

**Seguridad:** JWT (jsonwebtoken) · bcryptjs · AES-256-GCM (crypto nativo) · Helmet · WebAuthn (@simplewebauthn)

**Infraestructura:** Docker Compose · Nginx (SSL/TLS) · Redis 7 · AWS EC2 (Debian GNU/Linux)

## Levantamiento con Docker (Recomendado)

El proyecto está 100% dockerizado y gestiona todos los servicios mediante una única fuente de verdad en la raíz:

```bash
# 1. Crear el archivo de entorno desde la plantilla unificada
cp .env.example .env

# 2. Levantar la plataforma completa (Postgres, Redis, Backend, Frontend, Gateway)
docker compose up --build -d

# 3. Visualizar logs de los servicios
docker compose logs -f
```

La aplicación quedará disponible en `http://localhost` (o en `https://norma.doicela.dev` en el VPS de producción).

## Documentación Técnica

La documentación técnica detallada se encuentra centralizada en [`docs/00-indice-general.md`](./docs/00-indice-general.md), estructurada bajo taxonomía jerárquica modular:

- [`01-arquitectura/`](./docs/01-arquitectura/) — Arquitectura general, Clean Architecture y patrones de diseño
- [`02-backend-servicios/`](./docs/02-backend-servicios/) — API REST, autenticación, gobernanza, nómina y seguridad
- [`03-motores-especializados/`](./docs/03-motores-especializados/) — Nómina, liquidación, asistencia/geocercas, 360°, WebAuthn y PDF
- [`04-base-de-datos/`](./docs/04-base-de-datos/) — Esquema relacional y catálogos normativos
- [`05-frontend-web/`](./docs/05-frontend-web/) — Arquitectura React, componentes y resiliencia
- [`06-inteligencia-y-analitica/`](./docs/06-inteligencia-y-analitica/) — Modelos predictivos, RSI, Causal AI, DP-FedAvg, MORL y FT-Transformer
- [`07-despliegue-y-operaciones/`](./docs/07-despliegue-y-operaciones/) — Infraestructura Docker, AWS EC2, flujo Git/CI, auditoría y DR
- [`08-artefactos-scrum/`](./docs/08-artefactos-scrum/) — Backlog y artefactos de gestión
- [`09-sostenibilidad-ods/`](./docs/09-sostenibilidad-ods/) — Alineación estratégica, metas y especificación de métricas para ODS 8 (Trabajo Decente)

## Flujo de Trabajo Git y Calidad de Código

El proyecto implementa un flujo de integración continua estricto para garantizar estabilidad, seguridad y trazabilidad:

- **Topología de Ramas:**
  - `main`: Rama de producción protegida. Despliega automáticamente a AWS EC2. Push directo restringido exclusivamente a `JorgeDoicela` para hotfixes de emergencia.
  - `develop`: Rama de integración protegida. Commits directos bloqueados; todo cambio debe ingresar obligatoriamente mediante Pull Request con suite de CI aprobada.
  - `jorge_doicela` / `feature/*` / `fix/*`: Ramas de trabajo donde cada desarrollador implementa sus cambios partiendo de `develop`.
- **Hooks Locales Automatizados (Husky):**
  - `pre-commit`: Ejecuta `lint-staged` con ESLint (auto-fix), Prettier y escaneo de credenciales con Secretlint sobre archivos en staging.
  - `commit-msg`: Valida la convención _Conventional Commits_ (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`) con Commitlint.
  - `pre-push`: Ejecuta la suite de pruebas unitarias e integración de Vitest (backend y frontend) antes de enviar cambios al repositorio remoto.
- **Integración Continua (GitHub Actions):** Todo Pull Request hacia `develop` o `main` ejecuta obligatoriamente el pipeline de CI ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)) con escaneo de seguridad, pruebas de backend y build de frontend.

Guía operativa detallada: [`docs/07-despliegue-y-operaciones/06-estandar-git-flujo-ramas-y-calidad.md`](./docs/07-despliegue-y-operaciones/06-estandar-git-flujo-ramas-y-calidad.md).

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

**Autor y Titular de Derechos:** Jorge Doicela — Copyright (c) 2026. Todos los derechos reservados.  
**Licencia:** Propietaria / Confidencial (Ver archivo [LICENSE](./LICENSE)). Prohibida su copia, reproducción o distribución sin autorización expresa.
