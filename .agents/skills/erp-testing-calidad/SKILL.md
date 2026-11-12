---
name: erp-testing-calidad
description: >
  Activa esta skill al crear, modificar o depurar pruebas unitarias, de
  integración, de arquitectura o de componentes en Norma ERP (Vitest 3 en
  backend y frontend, Testing Library, mocks con vi.hoisted y vi.mock,
  cobertura y reglas de calidad pre-push/CI).
---

# Testing, Cobertura y Aseguramiento de Calidad — Norma ERP

Directriz obligatoria para toda tarea que involucre pruebas automatizadas en
backend o frontend, creación de nuevas reglas de negocio, corrección de bugs
(toda corrección requiere test de regresión) y validación de contratos arquitectónicos.

**Combinar siempre con:** `erp-ingenieria-software` (base transversal).

---

## 1. Taxonomía de Pruebas en Backend

Directorio raíz: `backend/tests/`. Configuración en `backend/vitest.config.js`
(`environment: 'node'`, `globals: true`, cobertura `v8`).

```
backend/tests/
├── architecture/                      # Contratos del monolito modular
│   ├── modularMonolith.test.js        # Verifica que los 22 módulos exporten su contrato público
│   └── repositories.test.js           # Verifica métodos de dominio en repositorios y ausencia de fugas
├── core/                              # Middlewares, utilidades, cifrado, errores, interceptores
├── integration/                       # Flujos multi-módulo e integración HTTP (Supertest)
├── modules/                           # Pruebas unitarias por dominio (espejo de src/modules/)
│   ├── accounting/
│   ├── attendance/
│   ├── auth/
│   ├── contracts/
│   ├── employees/
│   ├── intelligence/
│   ├── payroll/
│   ├── sustainability/
│   └── ...
└── stress/                            # Pruebas de concurrencia y carga
```

---

## 2. Convenciones de Mocking en Backend (Vitest 3 + ESM)

En Node ESM (`"type": "module"`), `vi.mock` se eleva (hoisting) antes de los `import`.
Para referenciar objetos mockeados dentro de la fábrica de `vi.mock`, **es obligatorio
usar `vi.hoisted()`**.

### 2.1 Plantilla Canónica de Test Unitario de Servicio

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';

// 1. Declarar mocks con vi.hoisted para que existan antes del hoisting de vi.mock
const mockRepo = vi.hoisted(() => ({
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));

// 2. Mockear el repositorio o dependencia con la ruta relativa exacta al módulo
vi.mock('../../../src/modules/payroll/settlement/settlement.repository.js', () => ({
  default: mockRepo,
  settlementRepository: mockRepo,
}));

// 3. Importar el servicio bajo prueba DESPUÉS de declarar vi.mock
import { settlementService } from '../../../src/modules/payroll/settlement/settlement.service.js';
import { NotFoundError, ValidationError } from '../../../src/core/errors/appError.js';

describe('settlementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateSettlement', () => {
    it('calcula liquidación con Decimal.js sin pérdida de precisión', async () => {
      mockRepo.findById.mockResolvedValueOnce({
        id: 'emp_1',
        tenantId: 'ten_1',
        baseSalary: '1000.00',
        WorkedDays: 360,
      });

      const result = await settlementService.calculateSettlement({
        tenantId: 'ten_1',
        employeeId: 'emp_1',
      });

      expect(result.totalAmount).toBe('1000.00');
      expect(mockRepo.findById).toHaveBeenCalledWith('emp_1', 'ten_1');
    });

    it('lanza NotFoundError cuando el empleado no pertenece al tenant', async () => {
      mockRepo.findById.mockResolvedValueOnce(null);

      await expect(
        settlementService.calculateSettlement({
          tenantId: 'ten_1',
          employeeId: 'emp_inexistente',
        })
      ).rejects.toThrow(NotFoundError);
    });
  });
});
```

### 2.2 Inyección por Constructor (Servicios basados en Clases)

En servicios modernos con inyección de dependencias en el constructor (ej. `AccountingService`),
prefiere pasar un objeto mock directamente al instanciar la clase en lugar de `vi.mock`:

```javascript
const repoMock = { findAccountByCode: vi.fn(), createJournalEntry: vi.fn() };
const service = new AccountingService(repoMock);
```

---

## 3. Pruebas de Arquitectura (Innegociables)

Los archivos en `backend/tests/architecture/` garantizan la integridad estructural del monolito:

1. **`modularMonolith.test.js`:** Verifica que todos los módulos registrados en `src/modules/index.js` expongan su interfaz pública sin errores de importación circular. Si creas un módulo nuevo, regístralo en `src/modules/index.js` y actualiza este test.
2. **`repositories.test.js`:** Verifica que los repositorios cumplan los contratos de acceso a datos.

---

## 4. Pruebas en Frontend (Vitest + Testing Library)

Configuración en `frontend/vite.config.js` (`environment: 'jsdom'`, `setupFiles: './src/test/setup.js'`).
Ubicación: `frontend/src/test/` y carpetas `__tests__/` co-localizadas junto a componentes/hooks en `src/core/` o `src/modules/`.

### 4.1 Reglas de Pruebas en Frontend

1. **Probar comportamiento visible, no detalles de implementación:** Usar `screen.getByRole`, `getByLabelText`, `getByText` de `@testing-library/react`. No seleccionar por clases CSS de Tailwind.
2. **Mocking de API:** Mockear el servicio del módulo (`@modules/<dominio>/services/...`) o `httpClient` (`@core/api/httpClient`), nunca `window.fetch` ni `axios` crudo.
3. **Ciclo de vida completo:** Todo test de página o componente con datos remotos debe verificar los estados:
   - `loading` (presencia de `Skeleton` o indicador de carga).
   - `empty` (presencia de `EmptyState` cuando la lista viene vacía).
   - `error` (mensaje de error claro y opción de reintento).
   - `success` (renderizado de datos formateados e interacción del usuario).

---

## 5. Qué es Obligatorio Probar en Cada Cambio

| Tipo de cambio | Pruebas obligatorias |
|----------------|---------------------|
| Cálculo financiero, nómina, IESS, impuestos, liquidación | Casos normales, casos borde (`0`, decimales periódicos, topes legales), redondeo exacto con `Decimal.js` y errores de validación. |
| Endpoint o caso de uso nuevo | Caso exitoso, fallo de validación DTO (Zod), entidad no encontrada (`NotFoundError`), intento de acceso cross-tenant (`tenantId` distinto). |
| Corrección de bug | Test de regresión que reproduzca exactamente el fallo antes del fix y pase después del fix. |
| Componente de UI reutilizable (`core/ui/`) | Renderizado de variantes, manejo de eventos (`onClick`, `onChange`), atributos de accesibilidad (`aria-*`, `disabled`). |
| Motor predictivo o RAG (`sustainability/`, `intelligence/`) | Estructura determinística del output (`{ prediction, confidence, metadata }`), auditoría numérica de `legalEvaluator` y manejo de fallback cuando el proveedor LLM falla. |

---

## 6. Antipatrones Prohibidos en Tests

| Antipatrón | Corrección |
|------------|-----------|
| Conectar a base de datos real en tests unitarios | Mockear el repository o inyectar doble de prueba; la BD real solo se usa en `tests/integration/`. |
| Usar `setTimeout` arbitrarios para esperar promesas | Usar `await waitFor(...)` en frontend o promesas resueltas en backend. |
| Tests dependientes del orden de ejecución | Limpiar mocks en `beforeEach(() => vi.clearAllMocks())` y no mutar estado global. |
| Desactivar o borrar un test que falla para pasar CI | Diagnosticar la causa raíz del fallo y corregir el código o actualizar el test si cambió el requisito legítimamente. |
| Aserciones débiles (`expect(result).toBeDefined()`) | Verificar valores concretos de negocio (`expect(result.netPay).toBe('905.50')`). |

---

## 7. Comandos de Ejecución y Verificación

```bash
# Ejecutar toda la suite de backend
npm --prefix backend test

# Ejecutar un archivo de test específico en backend
npx --prefix backend vitest run tests/modules/payroll/payrollService.test.js

# Ejecutar cobertura en backend
npm --prefix backend run test:coverage

# Ejecutar toda la suite de frontend
npm --prefix frontend test

# Ejecutar suite completa del monorepo (backend + frontend)
npm test
```

