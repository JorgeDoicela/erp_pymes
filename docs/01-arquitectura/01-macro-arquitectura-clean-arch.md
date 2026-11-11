# 01 — Clean Architecture y Macro-Estructura

## 1. Separación de Responsabilidades

El backend sigue una estructura en capas inspirada en los principios de Clean Architecture. Cada capa tiene una responsabilidad única y las dependencias fluyen hacia adentro (desde la infraestructura hacia el dominio).

```
┌─────────────────────────────────────────────┐
│  HTTP Layer (Routes + Controllers)          │  ← Entrada/salida HTTP
├─────────────────────────────────────────────┤
│  Application Layer (Services)               │  ← Lógica de negocio
├─────────────────────────────────────────────┤
│  Domain Layer (Repositories)                │  ← Contratos de persistencia
├─────────────────────────────────────────────┤
│  Infrastructure Layer (Prisma + DB)         │  ← Implementación de persistencia
└─────────────────────────────────────────────┘
```

## 2. Capa HTTP: Rutas, DTOs y Controladores

Los controladores actúan como adaptadores de entrada delgados respaldados por una capa previa de validación estricta con esquemas Zod (DTOs):

1. **Validación en los Bordes:** El middleware `validate(schema)` (`src/core/middleware/validate.middleware.js`) intercepta la solicitud y rechaza con HTTP 400 cualquier cuerpo de petición que no cumpla estrictamente con el DTO correspondiente ubicado dentro de cada módulo o en los validadores universales (`src/core/validators.js`), impidiendo que datos inválidos alcancen la lógica de negocio.
2. **Controladores Delgados:** Extraen los parámetros saneados (`req.body`, `req.params`, `req.query`), delegan la ejecución a los servicios o repositorios y formatean la respuesta HTTP con códigos semánticos.

Los controladores no contienen lógica de negocio. No acceden directamente a Prisma. Todo acceso a datos pasa por la capa de servicios o repositorios.

**Estructura de respuesta estandarizada:**

```json
// Éxito
{ "success": true, "data": { ... }, "message": "Operación exitosa" }

// Error controlado
{ "success": false, "message": "Descripción del error", "code": "ERROR_CODE" }
```

## 3. Capa de Aplicación: Servicios

Los servicios contienen toda la lógica de negocio del dominio. Son clases o módulos exportados que:

- Validan las reglas de negocio (límites de plan, unicidad, estados válidos).
- Coordinan múltiples operaciones de repositorios en transacciones cuando corresponde.
- Registran auditoría de las operaciones críticas.
- Emiten notificaciones o eventos secundarios.

**Ejemplos de servicios críticos:**

| Servicio                    | Ubicación                              | Responsabilidad                                                                   |
| --------------------------- | -------------------------------------- | --------------------------------------------------------------------------------- |
| `PayrollCalculationService` | `src/modules/payroll/calculation/`     | Motor de cálculo de nómina batch con precisión financiera Decimal.js              |
| `OffboardingService`        | `src/modules/employees/lifecycle/`     | Simulador de liquidación legal conforme al Código de Trabajo ecuatoriano          |
| `attendanceService`         | `src/modules/attendance/tracking/`     | Registro de asistencia con validación de geocerca Haversine, VPN y consentimiento |
| `intelligenceService`       | `src/modules/intelligence/predictive/` | Motor estadístico: Weibull, Monte Carlo, ANOVA, scoring multidimensional          |

## 4. Capa de Dominio: Repositorios

Los repositorios abstraen el acceso a datos y encapsulan completamente las consultas a Prisma ORM, garantizando que los controladores y servicios no dependan de la infraestructura de persistencia directa:

- `accountingRepository`: Operaciones transaccionales para asientos contables (partida doble), periodos fiscales, catálogo de cuentas, centros de costo y reportes (`src/modules/accounting/`).
- `payrollRepository`: Gestión de configuración activa de nómina, creación transaccional de rubros e historial de liquidaciones por empleado (`src/modules/payroll/`).
- `employeeRepository`: Creación y actualización con encriptación AES-256 de campos bancarios y salarios (`src/modules/employees/directory/`).
- `attendanceRepository`: Consultas optimizadas de marcación por empleado y rango de fechas (`src/modules/attendance/tracking/`).
- `auditRepository`: Registro asíncrono no bloqueante de eventos de auditoría y trazabilidad (`src/modules/audit/`).

## 5. Monolito Modular y Rebanadas Verticales Anidadas (`src/modules/`)

Para evitar la dispersión de código y desacoplar las capas, el backend opera bajo el patrón de **Monolito Modular con Rebanadas Verticales Anidadas (Pure Nested Vertical Slices)**:

- **Módulos Compuestos (`attendance`, `payroll`, `employees`, `performance`, `reports`, `tenants`, `compliance`, `notifications`, `intelligence`):** Albergan subdirectorios de vertical slices (`/tracking`, `/absences`, `/shifts`, `/calculation`, `/config`, etc.), cada uno encapsulando su propio controlador, servicio, repositorio y rutas.
- **Módulos Atómicos (`accounting`, `audit`, `auth`, `biometrics`, `communication`, `contracts`, `documents`, `recruitment`, `signatures`, `skills`, `sustainability`, `system`):** Operan como single-slices directos y autocontenidos.
- **Contratos Públicos Limpios:** Cada módulo expone su API pública a través de su propio archivo `index.js`, impidiendo importaciones internas cruzadas no autorizadas entre dominios.
- **Enrutador Central (`src/core/router.js`):** Monta y distribuye de forma centralizada los 21 módulos bajo el prefijo unificado `/api`.

## 6. Tipado Estático Progresivo

El sistema cuenta con configuración de TypeScript (`tsconfig.json` con `allowJs: true` y `noEmit: true`) y definiciones formales de dominio co-ubicadas en sus respectivos Bounded Contexts:

- `src/modules/accounting/accounting.types.ts`: Contratos para asientos (`IJournalEntry`, `IJournalLine`), cuentas (`IAccountingAccount`) y balances.
- La integridad de tipos se audita de forma continua mediante `npm run typecheck` (`tsc --noEmit`), garantizando cero errores de tipos en tiempo de compilación.

## 7. Capa de Infraestructura: Prisma + Multi-Tenant Interceptor

La capa de infraestructura está representada por `db.js`, que instancia un único cliente Prisma y le configura un middleware (`$use`) que intercepta **todas** las operaciones de base de datos para aplicar automáticamente el filtro `WHERE tenantId`.

Este enfoque garantiza que, incluso si un servicio olvida aplicar el filtro explícitamente, el interceptor lo hará de forma transparente, previniendo fugas de datos entre tenants.

**Categorías de modelos en el interceptor:**

```javascript
// Modelos con columna tenantId directa (filtro directo)
DIRECT_TENANT_MODELS = ['Employee', 'Shift', 'Payroll', 'AccountingPeriod', ...]

// Modelos vinculados al empleado (filtro por relación)
EMPLOYEE_RELATION_MODELS = ['Contract', 'Attendance', 'AbsenceRequest', 'Document', ...]

// Modelos con relaciones indirectas (filtro jerárquico)
INDIRECT_RELATION_MAP = {
  'PayrollDetail': { payroll: { tenantId: true } },
  'JobApplication': { vacancy: { tenantId: true } },
  ...
}
```

## 8. Patrón de Contexto Asíncrono (AsyncLocalStorage)

El `tenantContext.js` implementa el contexto asíncrono utilizando `AsyncLocalStorage` de Node.js. Este mecanismo propaga el `tenantId` a través de toda la cadena de promesas de una petición HTTP sin necesidad de pasarlo explícitamente como parámetro en cada función.

```javascript
// Funciones exportadas
runWithTenant(tenantId, callback, isSuperAdmin); // Establece contexto
runWithoutTenantFilter(callback); // Bypass temporal para validaciones internas
getTenantId(); // Lee el tenantId del contexto activo
isTenantFilterBypassed(); // Verifica si el bypass está activo
```

## 9. Gestión de Errores Centralizada y Jerarquía de Dominio

El `errorHandler.js` actúa como middleware de Express capturando todos los errores no manejados. Se integra con la jerarquía de errores de dominio de `src/core/errors/appError.js`:

- **Errores operacionales de dominio:** `ValidationError` (Zod / reglas de negocio) → HTTP 400; `NotFoundError` → HTTP 404; `UnauthorizedError` → HTTP 401; `ForbiddenError` → HTTP 403; `ConflictError` → HTTP 409.
- **Errores de infraestructura:** Fallos de conexión o de base de datos no controlados → HTTP 500.

El middleware también implementa el `requestLogger`, que registra cada petición entrante con método, ruta, código de respuesta y duración en milisegundos.
