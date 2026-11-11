# Memoria del Proyecto — ERP PYMES

Este archivo almacena el contexto operativo, decisiones de interfaz y lecciones aprendidas exclusivas del sistema ERP PYMES.

---

## 1. Decisiones de Diseño y Arquitectura Consolidadas

* **Estándar Visual:** Enterprise B2B minimalista (Holded / Xero / Linear).
* **Superficie:** Fondo `#f9fafb`, tarjetas `#ffffff` con borde `1px solid #e5e7eb` y esquinas de 4px a 6px.
* **Prohibiciones Absolutas:** Cero emojis, cero gradientes, cero sombras en tablas y cero cajas de colores para badges decorativos.
* **Tipografía de Cifras:** Valores financieros, RUCs y fechas con `font-mono tabular-nums`.
* **Arquitectura Backend (Pure Nested Vertical Slices):** 100% de los dominios organizados en Bounded Contexts modulares (`backend/src/modules/`, 21 módulos expuestos en `src/modules/index.js`). Los módulos compuestos (`attendance`, `payroll`, `employees`, `performance`, `reports`, `tenants`, `compliance`, `notifications`, `intelligence`) albergan sub-carpetas de rebanadas verticales anidadas (`/tracking`, `/absences`, `/shifts`, `/calculation`, `/config`, `/directory`, etc.), cada una encapsulando su propio controlador, servicio, repositorio y rutas. Los módulos atómicos (`auth`, `accounting`, `audit`, etc.) operan como single-slice directo. Todo inter-dominio se comunica únicamente vía el contrato público del módulo (`../<modulo>/index.js`), eliminando imports profundos cruzados. Prohibido Prisma ORM directo en controladores.
* **Arquitectura de Pruebas (`backend/tests/`):** Estructura jerárquica desacoplada organizada en 5 categorías: `architecture/` (monolito modular, repositorios), `core/` (cifrado, utilidades financieras, middlewares, seguridad, salud, validación DTO), `integration/` (regresiones multimodulares, auditoría de cálculos), `modules/<dominio>/` (pruebas unitarias por bounded context: `attendance`, `compliance`, `employees`, `intelligence`, `payroll`, `recruitment`, `signatures`) y `stress/` (scripts de carga y estrés de motores estocásticos).
* **Transversales y Núcleo (`src/core/`):** Enrutador central en `backend/src/core/router.js`, export canónico en `src/core/index.js`, middlewares transversales en `src/core/middleware/` (`errorHandler`, `performance`, `rateLimit`, `validate`), almacenamiento en `src/core/storage/` (`blob.service.js`, `upload.middleware.js`), utilidades en `src/core/utils/` (`asyncHandler`, `financialUtils`) y criptografía de campo en `src/core/security/encryption.js`. Middlewares de dominio residen co-ubicados dentro de sus Bounded Contexts (`modules/auth/auth.middleware.js`, `modules/tenants/organization/tenant.middleware.js`, `modules/tenants/superadmin/superAdmin.middleware.js`, `modules/system/maintenance.middleware.js`) y se exponen en sus respectivos `index.js`. Carpetas obsoletas `src/middleware/` y `src/utils/` fueron eliminadas por completo (cero proxies y cero duplicación horizontal).
* **Persistencia Pura en Servicios:** Controladores y servicios de dominio delegan la persistencia a sus repositorios (`performanceRepository`, `contractRepository`, `recruitmentRepository`), eliminando consultas crudas a Prisma ORM fuera de la capa de infraestructura.

---

## 2. Historial de Decisiones y Lecciones Aprendidas

* **2026-11-11 (Auditoría Integral de Duplicación de Herramientas, Dependencias y UI):**
  * Se auditó todo el monorepo en busca de herramientas y componentes redundantes:
    1. UI Form System: `InputField.jsx` y `SelectField.jsx` duplicaban `Input.jsx` y `Select.jsx`. Se enriquecieron `Input` y `Select` con soporte nativo de tooltip `help` y `placeholder`, reduciendo `InputField` y `SelectField` a alias retrocompatibles. En `EmployeeHelpers.jsx`, se eliminaron sus declaraciones locales duplicadas de `InputField`, `SelectField` y `EmptyState` en favor del Design System en `@core/ui`.
    2. Utilidades Financieras y Formateadores: Se eliminó la reimplementación local de `formatCurrency` en `ExecutiveKPIBanner.jsx`, centralizándola en `frontend/src/core/utils/formatters.js`.
    3. Librerías de Iconos y Dependencias: Se eliminó el paquete redundante `@heroicons/react` migrando los 4 archivos consumidores a `react-icons/hi2`, y se limpiaron dependencias no utilizadas (`@simplewebauthn/browser` y `socket.io-client` en backend; `canvg` y `react-is` en frontend).
  * Validación integral superada: 35/35 suites Vitest (189/189 tests en verde), 0 errores en `tsc --noEmit`, 0 errores en ESLint (backend y frontend) y build de producción de Vite exitoso.

* **2026-11-11 (Organización Modular de Seeds en Base de Datos):**
  * Se modularizó la carpeta `backend/prisma/seeds/` en 11 directorios de dominio (`common`, `tenants`, `employees`, `attendance`, `payroll`, `performance`, `recruitment`, `accounting`, `communication`, `entrepreneurship`, `intelligence`) y se creó el barril canónico `seeds/index.js`.
  * Se corrigió la importación rota en `offboarding.js` hacia el contrato público `src/modules/employees/index.js`.
  * `seed.js` unificó sus 21 imports directos en una sola importación de dominio desde `./seeds/index.js`.
  * Validación integral superada: 26/26 suites Vitest (159/159 tests en verde), 0 errores en `tsc --noEmit` y 0 errores en `eslint .`.

* **2026-11-11 (Organización Modular y Jerárquica de la Suite de Pruebas):**
  * Se reorganizó la carpeta plana `backend/tests/` (26 archivos) en una taxonomía profesional limpia: `architecture/`, `core/`, `integration/`, `modules/<dominio>/` y `stress/`.
  * Se ajustaron los paths relativos de importación y mocks de Vitest según su profundidad (`../../src/` y `../../../src/`).
  * Validación integral superada: 26/26 suites Vitest (159/159 tests en verde), 0 errores en `tsc --noEmit` y 0 errores en `eslint .`.

* **2026-11-11 (Migración a Pure Nested Vertical Slices en Backend):**
  * Se migró la arquitectura modular de `backend/src/modules/` a Rebanadas Verticales Anidadas puras (Nested Vertical Slices) en los 9 módulos compuestos: `attendance` (absences, shifts, tracking), `payroll` (advances, benefits, calculation, config), `employees` (directory, lifecycle, records), `performance` (evaluations, goals), `reports` (analytics, exports), `tenants` (organization, superadmin), `compliance` (labor, statutory), `notifications` (alerts, channels) e `intelligence` (analytics, entrepreneurship, predictive).
  * Los módulos atómicos (`accounting`, `audit`, `auth`, `biometrics`, `communication`, `contracts`, `documents`, `recruitment`, `signatures`, `skills`, `sustainability`, `system`) se mantienen como single slices autónomos.
  * Se blindaron los contratos públicos en los barriles `index.js` de cada módulo para evitar acoplamiento profundo inter-dominio.
  * Pruebas y validaciones completas: 26/26 suites Vitest (159/159 tests en verde), 0 errores en `tsc --noEmit` y 0 errores en `eslint .`.

* **2026-11-11 (Eliminación de Capas Duplicadas y Cierre Limpio de Vertical Slices):**
  * Se auditaron y eliminaron las 12 parejas de archivos duplicados y carpetas legacy (`src/middleware/` y `src/utils/`).
  * Se migró la totalidad de las 69 referencias residuales en rutas, servicios, seeds y tests hacia sus ubicaciones canónicas en `src/core/` y `src/modules/<dominio>/`.
  * Se eliminó el duplicado huérfano `seedSustainability.js` en el módulo de sostenibilidad.
  * Para evitar ciclos de dependencia en tiempo de ejecución (ESM), las rutas importan directamente el middleware de su bounded context correspondiente (`auth.middleware.js`, `tenant.middleware.js`, `superAdmin.middleware.js`).
  * Validación integral superada: 26/26 suites Vitest (159/159 tests en verde), 0 errores en `tsc --noEmit` y 0 errores en `eslint .`.

* **2026-11-10 (Cierre de Migración Modular Fases 4 y 5):**
  * Se modularizaron los bloques pendientes (`audit`, `biometrics`, `skills`, `communication`, `tenants`, `notifications`, `reports`, `intelligence`, `auth`, `system`) y se trasladó `payrollCronJob.js` a `src/modules/payroll/payroll.jobs.js`.
  * En `tenants`, se unificó la transacción de creación de empresa + settings + configuración de nómina + turno + admin en `tenantRepository.provisionTenantWithAdmin` para evitar duplicación entre onboarding público y alta desde SuperAdmin.
  * En `reports`, se centralizó la construcción de CSV con BOM UTF-8 en `export.service.js`.
  * Se actualizaron todos los imports y mocks de `backend/tests/` y `backend/prisma/seeds/offboarding.js` hacia `src/modules/` y `src/core/`, logrando 26/26 archivos Vitest (156/156 tests en verde), 0 errores en `tsc --noEmit` y 0 errores en `eslint .`.
