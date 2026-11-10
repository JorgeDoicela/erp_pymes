# Estado y Plan Maestro: Migración a Arquitectura Modular por Dominio

**Ubicación del Proyecto:** `backend/`  
**Fecha de Actualización:** 10 de noviembre de 2026  
**Estado General:** Fases 1, 2 y 3 completadas (60% del plan global). 146 tests en verde. Tipado TypeScript sin errores.

---

## 1. Resumen Ejecutivo y Objetivo

El backend de **ERP PYMES** se encontraba estructurado bajo un patrón tradicional *Package-by-Layer* (capas horizontales en `src/controllers/`, `src/services/`, `src/repositories/`, `src/routes/`), con módulos incipientes que cubrían únicamente el ~20% del código de negocio.

**Objetivo de la migración:**  
Transformar el 100% del backend en un **Monolito Modular por Dominio** (*Bounded Contexts* en `src/modules/`), donde cada dominio encapsula de forma vertical su persistencia, lógica de negocio, endpoints HTTP y tareas programadas (*jobs*). La migración se ejecuta bajo una estricta política de **cero regresiones**, manteniendo la compatibilidad hacia atrás durante la transición mediante fachadas `@deprecated` y garantizando la suite de pruebas completa en verde en cada paso.

```
ESTRUCTURA OBJETIVO (src/modules/<dominio>/)
├── <dominio>.repository.js   # Persistencia y consultas Prisma aisladas
├── <dominio>.service.js      # Reglas de negocio y orquestación
├── <dominio>.controller.js   # Manejo de peticiones HTTP / Express
├── <dominio>.routes.js       # Enrutamiento y middlewares de ruta
├── <dominio>.jobs.js         # Tareas programadas (cron) del dominio (si aplica)
└── index.js                  # Punto de entrada público del módulo
```

---

## 2. Mapa Global de Fases y Progreso

| Fase | Descripción del Dominio | Módulos Involucrados | Estado |
| :--- | :--- | :--- | :--- |
| **Fase 1** | Consolidación de Módulos Base | `accounting`, `payroll`, `employees` | **Completado** |
| **Fase 2** | Núcleo de Talento Humano | `contracts`, `documents`, `attendance` | **Completado** |
| **Fase 3** | Legal, Desempeño y Selección | `compliance`, `signatures`, `performance`, `recruitment` | **Completado** |
| **Fase 4** | Plataforma, Notificaciones e IA | `biometrics`, `skills`, `communication`, `tenants`, `audit`, `notifications`, `intelligence`, `reports` | **Pendiente** |
| **Fase 5** | Limpieza Definitiva y Auditoría | Retiro de carpetas legadas (`controllers`, `services`, `repositories`, `routes`) y certificación final | **Pendiente** |

---

## 3. Lo Que Se Ha Realizado en Detalle

### Fase 1: Consolidación y Cierre de Módulos Base (Completada)
* **`accounting`:** Se verificó la encapsulación completa de contabilidad general, libro mayor, balance y asientos contables.
* **`payroll`:** Se auditó y consolidó el motor de nómina y liquidación de sueldos con legislación ecuatoriana.
* **`employees`:** Se unificó toda la gestión del ciclo de vida del colaborador dentro de `src/modules/employees/`:
  * Se absorbieron: `asset.service.js`, `expedient.service.js`, `offboarding.service.js`, `onboardingOffboarding.controller.js` y `onboardingOffboarding.routes.js`.
  * Se corrigió la estructura matemática original de liquidación laboral (`simulateSettlement`) para preservar compatibilidad con `offboardingService.test.js`.

### Fase 2: Modularización del Núcleo de Talento Humano (Completada)
* **`src/modules/contracts/`:**
  * Componentes: `contract.repository.js`, `contract.service.js`, `contract.controller.js`, `contract.routes.js`, `contract.jobs.js`, `index.js`.
  * Funcionalidad: Gestión de contratos laborales, anexos, renovaciones y cron jobs de alerta de vencimiento.
* **`src/modules/documents/`:**
  * Componentes: `document.repository.js`, `document.service.js`, `document.controller.js`, `document.routes.js`, `document.jobs.js`, `index.js`.
  * Funcionalidad: Gestión documental, subida de archivos, categorización y verificación de vigencia.
* **`src/modules/attendance/`:**
  * Componentes: `attendance.repository.js`, `shift.repository.js`, `absence.repository.js`, `attendance.service.js`, `shift.service.js`, `absence.service.js`, `attendance.controller.js`, `shift.controller.js`, `absence.controller.js`, `attendance.routes.js`, `shift.routes.js`, `absence.routes.js`, `attendance.jobs.js`, `index.js`.
  * Funcionalidad: Marcaciones de asistencia, turnos y horarios, solicitudes de vacaciones/permisos y cron jobs de cierre diario.

### Fase 3: Dominios Legales, Firma, Desempeño y Selección (Completada)
* **`src/modules/compliance/`:**
  * Componentes: `compliance.service.js`, `statutoryBenefits.service.js`, `compliance.controller.js`, `compliance.routes.js`, `index.js`.
  * Funcionalidad: Cumplimiento normativo Ministerio del Trabajo / IESS, décimo tercero, décimo cuarto y utilidades.
* **`src/modules/signatures/`:**
  * Componentes: `qrSignature.service.js`, `ecuadorianElectronicSignature.service.js`, `signature.controller.js`, `signature.routes.js`, `index.js`.
  * Funcionalidad: Firma digital de documentos con certificados electrónicos ecuatorianos (PKCS#12) y estampados QR de verificación.
* **`src/modules/performance/`:**
  * Componentes: `performance.service.js`, `evaluation.controller.js`, `goals.controller.js`, `evaluation.routes.js`, `goals.routes.js`, `performance.jobs.js`, `index.js`.
  * Funcionalidad: Evaluaciones de desempeño 360, objetivos OKR/KPI y recordatorios programados.
* **`src/modules/recruitment/`:**
  * Componentes: `recruitment.repository.js`, `recruitment.service.js`, `recruitment.controller.js`, `recruitment.routes.js`, `index.js`.
  * Funcionalidad: Sistema de seguimiento de candidatos (ATS), publicación de vacantes, pipelines de selección y validación multitenant.

### Módulo Transversal Alineado
* **`src/modules/sustainability/`:**
  * Se corrigió la importación errónea de Prisma (`../../../database/db.js`) para garantizar estabilidad total.

### Integración Central y Retrocompatibilidad
* **Punto de Enlace Modular (`src/modules/index.js`):** Exporta los contratos públicos y routers de todos los módulos migrados.
* **Enrutador Global (`src/routes/index.routes.js`):** Consume directamente los routers modulares montados en sus respectivos prefijos (`/contracts`, `/documents`, `/attendance`, `/compliance`, `/signatures`, `/evaluations`, `/goals`, `/recruitment`, etc.).
* **Fachadas Re-export (`@deprecated`):** Se crearon stubs de redirección en las rutas legadas de `src/controllers/`, `src/services/`, `src/repositories/`, `src/routes/` y `src/jobs/` para que los tests o módulos externos que aún apunten a los caminos antiguos sigan funcionando sin roturas.

---

## 4. Estado de Verificación y Métricas Técnicas

| Métrica | Resultado | Observaciones |
| :--- | :--- | :--- |
| **Archivos de Prueba (Vitest)** | **26 de 26 pasados (100%)** | `npm --prefix backend test` |
| **Tests Individuales** | **146 pasados (0 fallos)** | Cobertura de nómina, empleados, asistencia, reclutamiento, multi-tenancy, etc. |
| **Chequeo de Tipos TypeScript** | **0 errores** | `npm --prefix backend run typecheck` (`tsc --noEmit`) |
| **Módulos en `src/modules/`** | **11 dominios consolidados** | `accounting`, `payroll`, `employees`, `contracts`, `documents`, `attendance`, `compliance`, `signatures`, `performance`, `recruitment`, `sustainability` |

---

## 5. Trabajo Pendiente para Completar la Migración

Quedan **2 fases** por ejecutar:

### Fase 4: Modularización de Plataforma, Comunicación e Inteligencia
Migrar los archivos que aún permanecen en las carpetas raíz hacia sus correspondientes módulos en `src/modules/`:

#### 1. Bloque de Plataforma y Administración
* **`src/modules/biometrics/`:**
  * Origen: `src/controllers/biometric.controller.js`, `src/routes/biometric.routes.js`.
* **`src/modules/skills/`:**
  * Origen: `src/controllers/skillController.js`, `src/services/skillService.js`, `src/repositories/skillRepository.js`, `src/routes/skill.routes.js`.
* **`src/modules/communication/`:**
  * Origen: `src/controllers/announcementController.js`, `src/services/announcementService.js`, `src/routes/announcement.routes.js`.
* **`src/modules/tenants/`:**
  * Origen: `src/controllers/tenantController.js`, `src/controllers/superAdminController.js`, `src/controllers/seedController.js`, `src/routes/tenant.routes.js`, `src/routes/superAdmin.routes.js`.
* **`src/modules/audit/`:**
  * Origen: `src/controllers/audit.controller.js`, `src/repositories/auditRepository.js`, `src/routes/audit.routes.js`.

#### 2. Bloque de Notificaciones y Comunicación en Tiempo Real
* **`src/modules/notifications/`:**
  * Origen: `src/controllers/notificationController.js`, `src/controllers/notification.preferences.controller.js`, `src/services/notificationService.js`, `src/services/emailService.js`, `src/services/socketService.js`, `src/routes/notification.routes.js`.

#### 3. Bloque de Inteligencia Artificial y Analítica
* **`src/modules/intelligence/`:**
  * Servicios: `src/services/intelligenceService.js`, `src/services/causalInferenceService.js`, `src/services/federatedLearningService.js`, `src/services/ftTransformerService.js`, `src/services/morlOptimizationService.js`, `src/services/rsiService.js`, `src/services/temporalAttentionService.js`.
  * Controladores: `src/controllers/analytics.controller.js`, `src/controllers/intelligenceController.js`, `src/controllers/capTable.controller.js`, `src/controllers/entrepreneurship.controller.js`, `src/controllers/validation.controller.js`.
  * Rutas: `src/routes/analytics.routes.js`, `src/routes/intelligence.routes.js`, `src/routes/entrepreneurship.routes.js`, `src/routes/capTable.routes.js`, `src/routes/validation.routes.js`.

#### 4. Bloque de Reportes y Exportación
* **`src/modules/reports/`:**
  * Origen: `src/controllers/reportController.js`, `src/controllers/exportController.js`, `src/services/reportService.js`, `src/services/exportService.js`, `src/routes/report.routes.js`, `src/routes/export.routes.js`.

---

### Fase 5: Limpieza Estructural Definitiva y Auditoría
1. **Actualización de Imports Externos:** Redirigir cualquier import residual hacia `src/modules/<dominio>/`.
2. **Eliminación de Capas Legadas:**
   * Retirar `src/controllers/`
   * Retirar `src/services/`
   * Retirar `src/repositories/`
   * Retirar `src/routes/` (manteniendo únicamente `src/routes/index.routes.js` o trasladándolo a `src/core/router.js`).
   * Retirar `src/jobs/` (los cron jobs ya residen dentro de cada módulo en `*.jobs.js`).
3. **Estructura Raíz Final:**
   ```
   backend/src/
   ├── core/         # Middlewares globales, auth, config, logger, errores
   ├── database/     # Cliente Prisma y conexiones de datos
   ├── modules/      # 100% de los dominios de negocio
   ├── app.js        # Configuración de Express y middlewares
   └── index.js      # Inicio del servidor HTTP
   ```
4. **Certificación:** Ejecutar suite completa de tests y análisis de tipos para avalar 0 regresiones.

---

## 6. Procedimiento para Retomar el Trabajo

Cuando se retome la sesión:

1. **Verificar el estado inicial:**
   ```powershell
   npm --prefix backend test
   npm --prefix backend run typecheck
   ```
2. **Iniciar Fase 4 por bloques:**
   * **Paso 4.1:** Crear `biometrics`, `skills`, `communication`, `tenants` y `audit`.
   * **Paso 4.2:** Crear `notifications`.
   * **Paso 4.3:** Crear `intelligence`.
   * **Paso 4.4:** Crear `reports`.
   * En cada bloque, actualizar `src/modules/index.js`, `src/routes/index.routes.js` y verificar `npm --prefix backend test`.
3. **Ejecutar Fase 5:**
   * Retirar archivos fachada en `src/controllers/`, `src/services/`, etc., tras constatar que no existen importaciones pendientes en tests ni en el código activo.
   * Ejecutar la verificación final.
