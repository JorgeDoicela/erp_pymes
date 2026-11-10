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

1. **Validación en los Bordes:** El middleware `validate(schema)` intercepta la solicitud y rechaza con HTTP 400 cualquier cuerpo de petición que no cumpla estrictamente con el DTO correspondiente (`src/dto/`), impidiendo que datos inválidos alcancen la lógica de negocio.
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

| Servicio | Responsabilidad |
|---------|-----------------|
| `PayrollCalculationService` | Motor de cálculo de nómina batch con precisión financiera Decimal.js |
| `OffboardingService` | Simulador de liquidación legal conforme al Código de Trabajo ecuatoriano |
| `attendanceService` | Registro de asistencia con validación de geocerca Haversine, VPN y consentimiento |
| `intelligenceService` | Motor estadístico: Weibull, Monte Carlo, ANOVA, scoring multidimensional |

## 4. Capa de Dominio: Repositorios

Los repositorios abstraen el acceso a datos y encapsulan completamente las consultas a Prisma ORM, garantizando que los controladores y servicios no dependan de la infraestructura de persistencia directa:

- `accountingRepository`: Operaciones transaccionales para asientos contables (partida doble), periodos fiscales, catálogo de cuentas, centros de costo y reportes.
- `payrollRepository`: Gestión de configuración activa de nómina, creación transaccional de rubros e historial de liquidaciones por empleado.
- `employeeRepository`: Creación y actualización con encriptación AES-256 de campos bancarios y salarios.
- `attendanceRepository`: Consultas optimizadas de marcación por empleado y rango de fechas.
- `auditRepository`: Registro asíncrono no bloqueante de eventos de auditoría y trazabilidad.

## 5. Monolito Modular y Bounded Contexts (`src/modules/`)

Para evitar la dispersión de código y facilitar la mantenibilidad, los dominios centrales operan bajo el patrón de **Monolito Modular**:

- `src/modules/accounting/`: Agrupa de forma autocontenida sus rutas, controlador, repositorio y DTOs de validación.
- `src/modules/payroll/`: Agrupa rutas, controladores de liquidación y configuración, servicios de cálculo, repositorio y DTOs.
- `src/modules/employees/`: Agrupa rutas, controlador, servicio, repositorio y DTOs de talento humano.
- `src/modules/index.js`: Registro central unificado que expone los Bounded Contexts hacia el enrutador principal de la aplicación (`src/routes/index.routes.js`).

## 6. Tipado Estático Progresivo (`src/types/`)

El sistema cuenta con configuración de TypeScript (`tsconfig.json` con `allowJs: true` y `noEmit: true`) y definiciones formales de dominio:

- `accounting.types.ts`: Contratos para asientos (`IJournalEntry`, `IJournalLine`), cuentas (`IAccountingAccount`) y balances.
- `payroll.types.ts`: Contratos para configuraciones (`IPayrollConfig`) y detalles de nómina (`IPayrollDetail`).
- `employee.types.ts`: Contratos de colaboradores y roles autorizados.

La integridad de tipos se audita de forma continua mediante `npm run typecheck`.

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
runWithTenant(tenantId, callback, isSuperAdmin)  // Establece contexto
runWithoutTenantFilter(callback)                  // Bypass temporal para validaciones internas
getTenantId()                                     // Lee el tenantId del contexto activo
isTenantFilterBypassed()                          // Verifica si el bypass está activo
```

## 9. Gestión de Errores Centralizada y Jerarquía de Dominio

El `errorHandler.js` actúa como middleware de Express capturando todos los errores no manejados. Se integra con la jerarquía de errores de dominio de `src/core/errors/appError.js`:

- **Errores operacionales de dominio:** `ValidationError` (Zod / reglas de negocio) → HTTP 400; `NotFoundError` → HTTP 404; `UnauthorizedError` → HTTP 401; `ForbiddenError` → HTTP 403; `ConflictError` → HTTP 409.
- **Errores de infraestructura:** Fallos de conexión o de base de datos no controlados → HTTP 500.

El middleware también implementa el `requestLogger`, que registra cada petición entrante con método, ruta, código de respuesta y duración en milisegundos.
