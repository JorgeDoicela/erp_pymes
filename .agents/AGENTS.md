# Reglas del Proyecto (Norma ERP / ERP PYMES)

Sistema SaaS multi-tenant B2B para PYMES ecuatorianas: talento humano, nómina, asistencia con geocerca, contratos, contabilidad de partida doble, cumplimiento laboral (Código del Trabajo, IESS, LOPDP), firma electrónica, analítica predictiva y asistente legal con IA (RAG + WhatsApp). Las directrices globales del usuario aplican automáticamente; este archivo las especializa.

---

## 1. Stack Tecnológico Vigente

| Capa | Tecnología |
|---|---|
| Backend | Node.js 20+ (ESM), Express 5, Prisma 5 (PostgreSQL 15 + `pgvector`), Zod 3, Decimal.js, Vitest 3, ESLint flat config |
| Frontend | React 19, Vite 7, React Router 7, Tailwind CSS 3, Axios, react-hot-toast, Recharts, Vitest + Testing Library (JS/JSX, alias `@core`, `@modules`) |
| IA | `@huggingface/transformers` (ONNX QUInt8 local), multi-proveedor LLM (`llmProvider.service.js`), RAG legal, motores estocásticos (`intelligence/predictive`) |
| Infraestructura | Docker Compose (`db`, `redis`, `backend`, `frontend`, `gateway` Nginx), GHCR, AWS EC2 vía SSH, GitHub Actions (`ci.yml`, `deploy.yml`, `rollback.yml`) |
| Calidad | Husky (`pre-commit` lint-staged + secretlint, `commit-msg` commitlint, `pre-push` tests), Conventional Commits, Rulesets en `main` y `develop` |

---

## 2. Arquitectura Canónica (Resumen Vinculante)

* **Backend:** Monolito modular con Pure Nested Vertical Slices en `backend/src/modules/<dominio>[/<slice>]`. Flujo obligatorio `routes -> controller -> service -> repository -> prisma`. Comunicación entre dominios solo vía `modules/<dominio>/index.js`.
* **Frontend:** Arquitectura por dominio en `frontend/src/modules/<dominio>/{pages,components,hooks,services,utils,constants}` y núcleo compartido en `frontend/src/core/{ui,api,layout,feedback,hooks,utils,constants,pwa}`.
* **Datos:** Aislamiento multi-tenant por `tenantId` reforzado por el interceptor de `backend/src/database/db.js` y `AsyncLocalStorage` (`tenantContext.js`).

---

## 3. Límites Duros de Código (Resumen)

| Elemento | Advertencia | Bloqueante |
|---|---|---|
| Archivo backend (service / repository) | > 300 líneas | > 400 líneas |
| Controller backend | > 150 líneas | > 200 líneas |
| Componente / página React | > 250 líneas | > 350 líneas |
| Hook personalizado | > 120 líneas | > 200 líneas |
| Función o método | > 40 líneas | > 60 líneas |
| Parámetros posicionales | > 3 | > 4 (usar objeto) |
| Dependencias inyectadas por servicio | > 5 | > 7 |

Detalle, justificación y excepciones: skill `erp-ingenieria-software`. Verificación automática: `node .agents/skills/erp-ingenieria-software/scripts/audit-architecture.mjs`.

---

## 4. Orquestación Obligatoria de Skills

| Tipo de tarea | Skills a activar (en orden) |
|---|---|
| Cualquier cambio de código | `erp-ingenieria-software` (siempre, base transversal) |
| Backend, APIs, servicios, repositorios | `desarrollo-backend` (global) + `erp-backend` |
| Esquema Prisma, migraciones, seeds, consultas | `erp-base-de-datos` + `erp-backend` |
| Autenticación, RBAC, tenant, cifrado, LOPDP | `erp-seguridad-multitenant` + `datos-seguros` (global) |
| Frontend, UI, componentes, experiencia de usuario | `desarrollo-frontend` (global) + `erp-ux-ui-diseno` + `erp-frontend` + `estilos-erp-pymes` |
| Diseño de pantallas, flujos UX, Design System, tablas/formularios | `erp-ux-ui-diseno` + `estilos-erp-pymes` + `erp-frontend` |
| IA, RAG, LLM, WhatsApp, motores predictivos | `erp-ia-rag` + `erp-backend` |
| Docker, CI/CD, Nginx, despliegue, Git | `sysadmin` (global) + `erp-infraestructura-deploy` |
| Pruebas, cobertura, regresiones | `erp-testing-calidad` |
| Revisión de PR, auditoría, comandos `profesional` / `senior` / `sin-parches` | `erp-revision-codigo` |
| Documentación | `documentacion` (global) |

---

## 5. Reglas de Arquitectura de Software Profesional y Experto UX/UI

### 5.1 Arquitectura de Software (Clean / Hexagonal / DDD Táctico en Vertical Slices)
* **Separación estricta de preocupaciones:** Los servicios de dominio (`*.service.js`) jamás reciben objetos HTTP (`req`, `res`) ni importan el cliente Prisma directamente.
* **Bounded Contexts y Contratos Públicos:** Ningún módulo accede a archivos internos de otro módulo; toda integración cruza exclusivamente por el `index.js` del dominio consumido.
* **Inmutabilidad Financiera e Idempotencia:** Dinero y porcentajes legales siempre con `Decimal.js` (Value Objects); operaciones contables, de nómina y webhooks deben ser atómicas (`prisma.$transaction` en repositorio) e idempotentes.
* **Gobernanza por Fitness Functions:** Todo código nuevo debe pasar `audit-architecture.mjs` y las suites de `backend/tests/architecture/` sin introducir acoplamiento ni superar los límites de líneas.

### 5.2 Experto en UX/UI y Diseño de Producto B2B (Holded / Xero / Linear)
* **Arquitectura de Interacción y Carga Cognitiva:** Una única acción primaria por pantalla (`Button variant="primary"`), revelación progresiva (tablas concisas + detalle en `Drawer`/`Modal`/`Tabs`) y confirmación contextual con resumen numérico antes de acciones contables o legales irreversibles.
* **Superficies y Precisión Tipográfica:** Fondos `#ffffff` sobre `#f9fafb`; bordes `1px solid #e5e7eb`; radios `4px` a `6px`. Sin sombras en tarjetas y tablas (solo `shadow-xl` en modales). Monedas, saldos, RUC, cédulas y fechas obligatoriamente con `font-mono tabular-nums` y alineación derecha (`text-right`) en columnas numéricas.
* **Ciclo de Vida Completo y Accesibilidad (WCAG 2.1 AA):** Toda vista implementa los 4 estados (`Skeleton` geométrico sin salto de layout, `EmptyState` accionable, `ErrorState` con reintento y `DataState`). Formularios con `<label>` permanente, validación constructiva inline, preservación de datos ante error y navegación completa por teclado (`Tab`, `Enter`, `Escape`).
* **Cero Ruido Visual:** Cero emojis, cero gradientes decorativos, cero badges chillones, cero falso affordance. Iconos solo en acciones reales.

---

## 6. Definición de Terminado (Definition of Done)

1. `npm run lint` sin errores en backend y frontend.
2. `npm run test` en verde (backend + frontend); pruebas nuevas para toda regla de negocio nueva.
3. `npm --prefix frontend run build` exitoso si se tocó frontend.
4. Script de auditoría sin violaciones nuevas en los archivos modificados.
5. Documentación en `docs/` sincronizada cuando cambian contratos, esquema o flujos.
6. Commit con Conventional Commits; integración a `develop` solo por Pull Request.
