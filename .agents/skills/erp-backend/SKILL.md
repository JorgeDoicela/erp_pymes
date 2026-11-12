---
name: erp-backend
description: >-
  Activa esta skill en toda tarea del backend de Norma ERP (backend/src): crear o modificar endpoints, rutas,
  controladores, servicios, repositorios, DTOs Zod, jobs cron, middlewares o bounded contexts del monolito
  modular con Pure Nested Vertical Slices (Express 5, Prisma 5, ESM). Define la anatomía obligatoria de un
  slice, el contrato HTTP, el manejo de errores, la validación y las reglas de comunicación entre dominios.
---

# Backend Norma ERP — Monolito Modular con Nested Vertical Slices

**Rol:** Ingeniero Backend Senior de Norma ERP (Node.js 20 ESM, Express 5, Prisma 5, PostgreSQL 15 + `pgvector`, Zod 3, Decimal.js). Diseñas e implementas endpoints, lógica de dominio (nómina ecuatoriana, IESS, Código del Trabajo, contabilidad de partida doble, asistencia, contratos) y acceso a datos bajo la arquitectura de Monolito Modular con Pure Nested Vertical Slices.

Complementa a `desarrollo-backend` (global) y presupone `erp-ingenieria-software`. Para esquema y migraciones activar también `erp-base-de-datos`; para tenant, RBAC y cifrado, `erp-seguridad-multitenant`; para pruebas, `erp-testing-calidad`.

---

## 1. Mapa del Backend

```
backend/src/
├── server.js / app.js          # Arranque HTTP, Socket.IO, jobs
├── config/                     # env.js, roles.js (ROLES, ROLE_PERMISSIONS), storage.config.js
├── database/                   # db.js (PrismaClient + interceptor multi-tenant), tenantContext.js (AsyncLocalStorage)
├── core/                       # Transversal: errors/, middleware/, security/, storage/, utils/, validators.js, router.js
└── modules/
    ├── index.js                # Registro central: re-exporta el contrato público de cada dominio
    ├── <atómico>/              # accounting, audit, auth, biometrics, communication, contracts, documents,
    │                           # recruitment, signatures, skills, sustainability, system, whatsapp
    └── <compuesto>/<slice>/    # attendance/{absences,shifts,tracking}, payroll/{advances,benefits,calculation,config},
                                # employees/{directory,lifecycle,records}, performance/{evaluations,goals},
                                # reports/{analytics,exports}, tenants/{organization,superadmin},
                                # compliance/{labor,statutory}, notifications/{alerts,channels},
                                # intelligence/{analytics,entrepreneurship,predictive}
```

**Criterio atómico vs compuesto:** un dominio se divide en slices cuando contiene más de un agregado con ciclo de vida propio o supera ~6 archivos de capa. Cada slice es autosuficiente (routes, controller, service, repository, dto).

---

## 2. Anatomía Obligatoria de un Slice

| Archivo | Responsabilidad única | Prohibido |
|---|---|---|
| `<recurso>.routes.js` | Declarar verbo + ruta + middlewares (`authenticate`, `authorize`, `requireTenant`, `validate(dto)`) + handler | Lógica, consultas, transformaciones |
| `<recurso>.dto.js` | Esquemas Zod de `body`, `query`, `params`; reutiliza `core/validators.js` | Acceso a datos |
| `<recurso>.controller.js` | Extraer `tenantId`, `user`, `params`, `body` validado; invocar servicio; serializar con código HTTP correcto. Envuelto en `asyncHandler` | `try/catch` manual, `res.status(400)` por validación, reglas de negocio, Prisma |
| `<recurso>.service.js` | Reglas de negocio, orquestación, transacciones lógicas, auditoría. Clase con DI por constructor + instancia por defecto | `req`/`res`, Prisma directo, formateo HTTP |
| `<recurso>.repository.js` | Único acceso a Prisma: consultas con `select`/`include` explícitos, `$transaction`, filtros por `tenantId` | Reglas de negocio, lanzar errores HTTP |
| `<recurso>.jobs.js` | Programación cron (`node-cron`) que invoca servicios | Prisma directo, lógica duplicada del servicio |
| `index.js` (dominio) | Contrato público: rutas, servicios, repositorios y DTOs que otros dominios pueden consumir | Exportar helpers internos |

Plantillas completas listas para copiar: [plantilla-slice.md](references/plantilla-slice.md).

---

## 3. Procedimiento para Crear un Endpoint o Slice

1. Ubicar el dominio y slice; si el recurso es nuevo, crear carpeta de slice en el dominio compuesto o archivos en el atómico.
2. Definir el DTO Zod (entrada) y el shape de salida (proyección `select` en el repositorio; nunca devolver `password`, `salary` cifrado ni columnas internas).
3. Implementar el repositorio con filtros explícitos por `tenantId`.
4. Implementar el servicio como clase con DI; lanzar `NotFoundError`, `ValidationError`, `ConflictError`, `ForbiddenError`, `UnauthorizedError` de `core/errors/appError.js`.
5. Implementar el controlador con `asyncHandler`.
6. Declarar la ruta con `authenticate`, `authorize([...ROLES])`, `requireTenant` (si opera datos de empresa) y `validate(dto)`.
7. Exportar en `index.js` del dominio; si es un router nuevo, montarlo en `core/router.js` vía `modules/index.js`.
8. Si el modelo Prisma es nuevo y tiene datos de tenant, registrarlo en el interceptor de `database/db.js` (ver `erp-base-de-datos`).
9. Pruebas unitarias del servicio en `backend/tests/modules/<dominio>/` con repositorios mockeados; actualizar `tests/architecture/modularMonolith.test.js` si cambia el contrato público.
10. Documentar el endpoint en `docs/02-backend-servicios/01-especificacion-api-rest.md`.

---

## 4. Contrato HTTP

| Operación | Verbo | Código éxito | Cuerpo |
|---|---|---|---|
| Listar | `GET /api/<recurso>` | 200 | `{ success: true, data: [...], meta?: { page, limit, total } }` |
| Obtener | `GET /api/<recurso>/:id` | 200 | `{ success: true, data: {...} }` |
| Crear | `POST /api/<recurso>` | 201 | `{ success: true, data: {...} }` |
| Actualizar parcial | `PATCH /api/<recurso>/:id` | 200 | `{ success: true, data: {...} }` |
| Acción de dominio | `PATCH /api/<recurso>/:id/<accion>` (`/approve`, `/post`, `/close`) | 200 | `{ success: true, data: {...} }` |
| Eliminar | `DELETE /api/<recurso>/:id` | 204 o 200 | vacío o `{ success: true }` |

Errores (emitidos solo por `core/middleware/errorHandler.js`):

```json
{ "success": false, "message": "Descripción para el usuario", "type": "NotFoundError", "errors": [{ "field": "x", "message": "..." }] }
```

* Rutas en inglés, plural, kebab-case (`/salary-advances`, `/cost-centers`). Mensajes al usuario en español.
* Listados con paginación obligatoria (`page`, `limit` con máximo 100) y filtros validados en DTO `query`. Prohibido `limit=1000` para "traer todo".
* Los nuevos endpoints adoptan el envelope `{ success, data }`. Endpoints legados que devuelven el objeto plano (`accounting.controller.js`) se migran solo junto con su consumidor frontend.

---

## 5. Validación y Errores

* Validación de entrada exclusivamente con `validate(dto)` en la ruta. El controlador confía en `req.body` ya parseado.
* Validaciones de negocio (saldo de vacaciones, periodo contable cerrado, solapamiento) en el servicio, lanzando `ValidationError` o `ConflictError`.
* Prohibido en código nuevo: `res.status(4xx).json(...)` en controladores, errores genéricos `new Error('Empleado no encontrado')` (usar `NotFoundError`), y detectar errores por texto del mensaje.
* Errores de Prisma `P2002`, `P2025`, `P2003` ya se traducen en `errorHandler`; no capturarlos para re-mapearlos manualmente.

---

## 6. Comunicación entre Dominios

```js
// Correcto
import { employeeRepository } from '../../employees/index.js';
import { notificationService } from '../../notifications/index.js';

// Prohibido
import { employeeRepository } from '../../employees/directory/employee.repository.js';
```

* Dependencias entre dominios se inyectan por constructor para permitir mocks.
* Ciclos de importación: si A necesita B y B necesita A, extraer la parte compartida a un tercer dominio o invertir mediante callback/evento. No resolver con imports diferidos dentro de funciones.
* Excepción vigente única: middlewares de `auth` y `tenants` importados directamente por rutas (ver `erp-ingenieria-software`).

---

## 7. Dominio Ecuatoriano — Reglas Técnicas

* **Dinero:** `financial` de `core/utils/financialUtils.js` (Decimal.js, precisión 20, `ROUND_HALF_UP`). Redondeo a 2 decimales solo al persistir o presentar.
* **Fechas laborales:** zona `America/Guayaquil`; usar `getEcuadorTodayIso`, `parseCanonicalCalendarDate`, `calculateCalendarDays` (exportados por `attendance/index.js`).
* **Identificación:** `validateCedulaEcuatoriana` y validadores de RUC en `core/validators.js`.
* **Parámetros legales** (SBU, porcentajes IESS, recargos 50 % / 100 %, décimos, fondos de reserva): constantes nombradas o configuración por tenant (`PayrollConfig`), nunca literales dispersos.
* **Salarios y coordenadas:** cifrados con `encryptSalary` / `decryptSalary` / `encryptCoordinate` (`core/security/encryption.js`).

---

## 8. Jobs, Tiempo Real y Correo

* Jobs en `<recurso>.jobs.js`, inicializados desde `server.js`, deben ser idempotentes y ejecutar por tenant dentro de `runWithTenant(tenantId, fn)`.
* Notificaciones vía `notificationService` (`notifications/index.js`); Socket.IO y correo solo a través de `notifications/channels`.
* Fallos de canales externos (SMTP, WhatsApp) no revierten la transacción de negocio; se registran y se reintentan.

---

## 9. Verificación

```bash
npm --prefix backend run lint
npm --prefix backend run test
node .agents/skills/erp-ingenieria-software/scripts/audit-architecture.mjs --files <archivos backend modificados>
```

Deuda conocida que no debe replicarse: [deuda-tecnica-backend.md](references/deuda-tecnica-backend.md).

