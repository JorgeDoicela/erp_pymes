# Estado y Plan Maestro: Migración a Arquitectura Modular por Dominio

**Ubicación del Proyecto:** `backend/`  
**Fecha de Actualización:** 10 de noviembre de 2026  
**Estado General:** Fases 1, 2, 3, 4 y 5 completadas (100% del plan global). 156 tests en verde. Tipado TypeScript y ESLint sin errores.

---

## 1. Resumen Ejecutivo y Objetivo

El backend de **ERP PYMES** se encontraba estructurado bajo un patrón tradicional *Package-by-Layer* (capas horizontales en `src/controllers/`, `src/services/`, `src/repositories/`, `src/routes/`, `src/jobs/`).

**Objetivo cumplido:**  
Se transformó el 100% del backend en un **Monolito Modular por Dominio** (*Bounded Contexts* en `src/modules/`), donde cada dominio encapsula de forma vertical su persistencia, lógica de negocio, endpoints HTTP y tareas programadas (*jobs*). Se eliminaron todas las capas horizontales legadas tras migrar el 100% de las importaciones internas, pruebas y seeds, manteniendo cero regresiones.

```
ESTRUCTURA FINAL (backend/src/)
├── core/
│   ├── errors/appError.js        # Jerarquía de errores operacionales
│   ├── storage/blob.service.js   # Adaptador local de almacenamiento
│   └── router.js                 # Enrutador global conectado a src/modules/
├── config/                       # Configuración de entorno, roles y storage
├── database/                     # Cliente Prisma y contexto multi-tenant
├── dto/                          # Esquemas y validadores compartidos
├── middleware/                   # Auth, tenant, maintenance, rateLimit, errorHandler
├── modules/                      # 21 Bounded Contexts + index.js
├── types/                        # Definiciones de tipos
├── utils/                        # Cifrado, utilidades financieras y contables
├── app.js                        # Configuración Express y middlewares
└── server.js                     # Arranque HTTP/WebSocket y cron jobs
```

---

## 2. Mapa Global de Fases y Progreso

| Fase | Descripción del Dominio | Módulos Involucrados | Estado |
| :--- | :--- | :--- | :--- |
| **Fase 1** | Consolidación de Módulos Base | `accounting`, `payroll`, `employees` | **Completado** |
| **Fase 2** | Núcleo de Talento Humano | `contracts`, `documents`, `attendance` | **Completado** |
| **Fase 3** | Legal, Desempeño y Selección | `compliance`, `signatures`, `performance`, `recruitment` | **Completado** |
| **Fase 4** | Plataforma, Notificaciones, IA y Reportes | `biometrics`, `skills`, `communication`, `tenants`, `audit`, `notifications`, `intelligence`, `reports`, `auth`, `system` | **Completado** |
| **Fase 5** | Limpieza Definitiva y Auditoría | Traslado de router a `core/router.js`, storage a `core/storage/`, retiro de carpetas legadas (`controllers`, `services`, `repositories`, `routes`, `jobs`) y certificación final | **Completado** |

---

## 3. Resumen de Módulos Consolidados (`src/modules/`)

1. **`accounting`**: Contabilidad general, libro mayor, balance y asientos contables.
2. **`payroll`**: Cálculo de nómina, configuración, beneficios, anticipos y `payroll.jobs.js`.
3. **`employees`**: Ciclo de vida del colaborador, activos, expediente, onboarding y offboarding.
4. **`contracts`**: Contratos laborales, anexos, renovaciones y `contract.jobs.js`.
5. **`documents`**: Gestión documental, vigencia y `document.jobs.js`.
6. **`attendance`**: Marcaciones, turnos, ausencias, geocerca y `attendance.jobs.js`.
7. **`compliance`**: Cumplimiento normativo Ministerio del Trabajo / IESS y beneficios de ley.
8. **`signatures`**: Firma digital QR y firma electrónica PKCS#12 Ecuador.
9. **`performance`**: Evaluaciones 360, objetivos OKR/KPI y `performance.jobs.js`.
10. **`recruitment`**: ATS, vacantes, postulaciones y aislamiento multi-tenant.
11. **`sustainability`**: Módulo transversal de sostenibilidad y RAG.
12. **`audit`**: Registro y consulta unificada de trazabilidad (`audit.repository.js`, `audit.service.js`, `audit.controller.js`, `audit.routes.js`).
13. **`biometrics`**: Autenticación WebAuthn / FIDO2 desacoplada en repositorio, servicio, controlador y rutas.
14. **`skills`**: Gestión de habilidades y competencias del colaborador.
15. **`communication`**: Tablón de comunicados internos, acuses de recibo y cumpleaños.
16. **`tenants`**: Onboarding SaaS, perfil de empresa, backoffice SuperAdmin y operaciones de seed/migración remota con transacción unificada de aprovisionamiento (`provisionTenantWithAdmin`).
17. **`notifications`**: Notificaciones in-app, preferencias de canales, correo (`email.service.js`) y tiempo real (`socket.service.js`).
18. **`intelligence`**: Motores científicos de People Analytics, IA (RSI, Inferencia Causal, Aprendizaje Federado, MORL Pareto, Atención Temporal, FT-Transformer), analítica descriptiva (`analytics.service.js`) y proyectos de emprendimiento/CapTable/validación.
19. **`reports`**: Reportes operativos de asistencia y exportación CSV/Excel/PDF (`report.repository.js`, `report.service.js`, `export.service.js`).
20. **`auth`**: Autenticación por correo/cédula, validación de estado de suscripción del tenant y recuperación de contraseña.
21. **`system`**: Configuración operativa del sistema, geocodificación inversa, estado biométrico y healthcheck de base de datos.

---

## 4. Estado de Verificación Final

| Métrica | Resultado | Comando Ejecutado |
| :--- | :--- | :--- |
| **Archivos de Prueba (Vitest)** | **26 de 26 pasados (100%)** | `npm --prefix backend test` |
| **Tests Individuales** | **156 pasados (0 fallos)** | `npm --prefix backend test` |
| **Chequeo de Tipos TypeScript** | **0 errores** | `npm --prefix backend run typecheck` |
| **Linting (ESLint)** | **0 errores (92 warnings preexistentes)** | `npm --prefix backend run lint` |
| **Módulos en `src/modules/`** | **21 dominios consolidados + `index.js`** | Verificado en árbol final de `backend/src/modules/` |
| **Capas Legadas** | **Eliminadas al 100%** | Retiradas `controllers/`, `services/`, `repositories/`, `routes/`, `jobs/` |
