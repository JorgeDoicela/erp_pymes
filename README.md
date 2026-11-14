# Norma ERP — Sistema de Gestión y Cumplimiento Laboral

Sistema web de gestión del talento humano, nómina legal y contabilidad orientado a PyMEs, construido con arquitectura multi-tenant sobre una pila PERN (PostgreSQL · Express.js · React · Node.js) y alineado con el **ODS 8 (Trabajo Decente y Crecimiento Económico)**. Incorpora un motor de nómina conforme a la legislación laboral ecuatoriana, registro de asistencia con validación geoespacial y biométrica WebAuthn FIDO2, módulo de contabilidad financiera aislada y gobernanza socio-laboral.

## Estructura del Repositorio

```
erp_pymes/
├── backend/            # API REST (Node.js · Express 5 · Prisma ORM · TypeScript check)
│   ├── prisma/         # Esquema relacional, migraciones y semillas modulares en 11 dominios
│   ├── src/
│   │   ├── app.js      # Configuración de Express, middlewares globales y montaje de router central
│   │   ├── server.js   # Punto de entrada HTTP, Socket.IO y orquestación de cron jobs
│   │   ├── core/       # Núcleo transversal (router, errors, middleware, security, storage, utils, validators)
│   │   └── modules/    # Monolito Modular con Pure Nested Vertical Slices (21 Bounded Contexts)
│   └── tests/          # Suite jerárquica en 5 categorías (architecture, core, integration, modules, stress)
├── frontend/           # SPA React 19 (Vite · Tailwind CSS · Recharts · Leaflet · PWA)
│   └── src/
│       ├── core/       # Design System atómico (ui), layout, feedback, hooks y utilidades centrales
│       └── modules/    # Bounded Contexts de cliente (vistas, componentes y hooks por dominio)
├── nginx/              # Reverse Proxy Gateway perimetral (SSL/TLS 443 · HTTP/2 · WebSockets)
├── scripts/            # Mantenimiento, respaldos de base de datos y pruebas de estrés
├── docs/               # Biblioteca técnica Docs-as-Code (00-indice-general.md)
└── docker-compose.yml  # Orquestación multi-contenedor: Postgres · Backend · Frontend · Gateway
```

## Módulos Funcionales (Bounded Contexts)

| Módulo             | Tipo de Slice | Descripción                                                                      |
| ------------------ | ------------- | -------------------------------------------------------------------------------- |
| Asistencia         | Anidado       | Marcación geocercada Haversine, turnos rotativos, permisos médicos y ausencias   |
| Nómina             | Anidado       | Cálculo legal batch, rubros patronales/IESS, anticipos y beneficios corporativos |
| Empleados          | Anidado       | Directorio de personal, expedientes digitales, inventario EPPs y finiquitos      |
| Desempeño          | Anidado       | Rúbricas cuantitativas 360°, tableros de OKRs y jobs cron de evaluación          |
| Reportes           | Anidado       | Analítica de rotación/clima y exportaciones consolidadas en CSV (BOM) y PDF      |
| Tenants            | Anidado       | Aislamiento multi-tenant por software, onboarding y consola SuperAdmin           |
| Cumplimiento Legal | Anidado       | Provisiones de ley (13er, 14to, fondos de reserva) y alertas preventivas         |
| Notificaciones     | Anidado       | WebSockets Socket.IO en tiempo real, canales SMTP y preferencias in-app          |
| Inteligencia       | Anidado       | Motor predictivo Weibull, Monte Carlo, ANOVA, RSI, Causal AI, DP-SGD y MORL      |
| Contabilidad       | Atómico       | Plan de cuentas, libro diario (partida doble), periodos y balance comprobación   |
| Auditoría          | Atómico       | Trazabilidad inmutable de eventos sensibles con metadatos de red                 |
| Autenticación      | Atómico       | Emisión/validación de tokens JWT, reseteo de contraseñas y control RBAC          |
| Biometría          | Atómico       | Desafíos criptográficos WebAuthn / FIDO2 servidor (@simplewebauthn/server)       |
| Comunicación       | Atómico       | Tablón de comunicados oficiales con confirmación de lectura digitalizada         |
| Contratos          | Atómico       | Tipos contractuales ecuatorianos y jobs de alerta de vencimiento                 |
| Documentos         | Atómico       | Repositorio documental con validación de caducidades                             |
| Reclutamiento      | Atómico       | Portal público de vacantes, postulaciones y calificación de entrevistas          |
| Firmas             | Atómico       | Certificados digitales y sellado QR conforme a la normativa ecuatoriana          |
| Habilidades        | Atómico       | Matriz de competencias técnicas por colaborador                                  |
| Sostenibilidad     | Atómico       | Indicadores socio-laborales ODS 8, asistente RAG legal y fine-tuning SLM         |
| Sistema            | Atómico       | Parámetros operativos de tenant y middleware de modo mantenimiento programado    |

## Pila Tecnológica

**Backend:** Node.js 20/22 · Express 5 · Prisma ORM 5.22 · PostgreSQL 15 + pgvector · Socket.IO 4 · Decimal.js · Zod · TypeScript check (50 suites Vitest)

**Frontend:** React 19 · Vite 7 · React Router DOM 7 · TailwindCSS 3 · Recharts 3 · Leaflet 1.9 · Framer Motion 12 · react-icons (Feather & Hi2) · PWA (14 suites Vitest)

**Seguridad:** JWT (jsonwebtoken) · bcryptjs · AES-256-GCM (crypto nativo) · Helmet · WebAuthn FIDO2 · Secretlint

**Infraestructura:** Docker Compose · Nginx Gateway (SSL/TLS) · AWS EC2 (Debian GNU/Linux) · GitHub Actions CI/CD DAG

## Levantamiento con Docker (Recomendado)

El proyecto está 100% dockerizado y gestiona todos los servicios mediante una única fuente de verdad en la raíz:

```bash
# 1. Crear el archivo de entorno desde la plantilla unificada
cp .env.example .env

# 2. Levantar la plataforma completa (Postgres, Backend, Frontend, Gateway)
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
