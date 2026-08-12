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

## 2. Capa HTTP: Rutas y Controladores

Los controladores actúan como adaptadores delgados que:

1. Extraen y validan los parámetros de entrada (`req.body`, `req.params`, `req.query`).
2. Delegan la ejecución a los servicios correspondientes.
3. Transforman el resultado en una respuesta HTTP estandarizada.

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

Los repositorios abstraen el acceso a datos. El sistema implementa el patrón Repository para los dominios con mayor complejidad de consultas:

- `employeeRepository`: Creación con encriptación de campos bancarios y salarios.
- `attendanceRepository`: Consultas optimizadas por empleado y fecha.
- `auditRepository`: Registro no bloqueante de logs de auditoría.

Para los dominios de menor complejidad, los servicios acceden directamente a Prisma.

## 5. Capa de Infraestructura: Prisma + Multi-Tenant Interceptor

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

## 6. Patrón de Contexto Asíncrono (AsyncLocalStorage)

El `tenantContext.js` implementa el contexto asíncrono utilizando `AsyncLocalStorage` de Node.js. Este mecanismo propaga el `tenantId` a través de toda la cadena de promesas de una petición HTTP sin necesidad de pasarlo explícitamente como parámetro en cada función.

```javascript
// Funciones exportadas
runWithTenant(tenantId, callback, isSuperAdmin)  // Establece contexto
runWithoutTenantFilter(callback)                  // Bypass temporal para validaciones internas
getTenantId()                                     // Lee el tenantId del contexto activo
isTenantFilterBypassed()                          // Verifica si el bypass está activo
```

## 7. Gestión de Errores Centralizada

El `errorHandler.js` actúa como middleware de Express capturando todos los errores no manejados. Distingue entre:

- **Errores operacionales:** Errores de lógica de negocio (validaciones, datos no encontrados) → HTTP 400/404.
- **Errores de infraestructura:** Errores de Prisma, de red → HTTP 500.
- **Errores de autenticación:** JWT inválido o expirado → HTTP 401.
- **Errores de autorización:** Rol insuficiente, tenant no encontrado → HTTP 403/404.

El middleware también implementa el `requestLogger`, que registra cada petición entrante con método, ruta y timestamp.
