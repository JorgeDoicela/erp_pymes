# Catálogo de Patrones Aprobados — Ejemplos de Referencia

Ejemplos mínimos alineados con el código real de Norma ERP. Copiar la forma, no el dominio.

---

## 1. Service Layer con Inyección por Constructor

```js
// backend/src/modules/<dominio>/<recurso>.service.js
import defaultRepo from './<recurso>.repository.js';
import { auditRepository as defaultAuditRepo } from '../audit/index.js';
import { NotFoundError, ConflictError } from '../../core/errors/appError.js';

export class ContractRenewalService {
  /**
   * @param {{ contractRepo?: object, auditRepo?: object }} [deps]
   */
  constructor({ contractRepo = defaultRepo, auditRepo = defaultAuditRepo } = {}) {
    this.contractRepo = contractRepo;
    this.auditRepo = auditRepo;
  }

  /**
   * @param {{ tenantId: string, contractId: string, user: { id: string } }} input
   */
  async renew({ tenantId, contractId, user }) {
    const contract = await this.contractRepo.findById(contractId, tenantId);
    if (!contract) throw new NotFoundError('Contrato no encontrado');
    if (contract.status !== 'ACTIVE') throw new ConflictError('Solo se renuevan contratos activos');

    const renewed = await this.contractRepo.renew(contractId, tenantId);
    await this.auditRepo.log({ tenantId, userId: user.id, action: 'CONTRACT_RENEWED', entityId: contractId });
    return renewed;
  }
}

export default new ContractRenewalService();
```

En pruebas: `new ContractRenewalService({ contractRepo: mockRepo, auditRepo: mockAudit })`.

---

## 2. Strategy por Mapa de Configuración

```js
const SETTLEMENT_STRATEGIES = Object.freeze({
  DESPIDO_INTEMPESTIVO: computeUnjustifiedDismissal,
  RENUNCIA_VOLUNTARIA: computeVoluntaryResignation,
  DESAHUCIO: computeEviction,
});

export function computeSettlement({ reason, ...input }) {
  const strategy = SETTLEMENT_STRATEGIES[reason];
  if (!strategy) throw new ValidationError(`Causal de terminación no soportada: ${reason}`);
  return strategy(input);
}
```

Agregar una causal = agregar una función pura y una entrada al mapa (OCP). Cada estrategia se prueba aislada.

---

## 3. Registry Extensible

Referencia real: `backend/src/modules/whatsapp/skills/whatsappSkill.registry.js`. Contrato mínimo de un elemento registrable:

```js
export class ExampleSkill {
  id = 'EXAMPLE';
  name = 'Ejemplo';
  description = 'Descripción usada en prompts e introspección';
  async prepareDraft({ text, employee, activeSession, aiConfig }) { /* ... */ }
  async executeConfirmedAction({ payload, employee, tenantId }) { /* ... */ }
}
```

---

## 4. Unit of Work con `prisma.$transaction`

```js
// Solo dentro de *.repository.js
async approveVacationWithDecrement({ requestId, employeeId, days }) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.absenceRequest.update({ where: { id: requestId }, data: { status: 'APPROVED' } });
    await tx.employee.update({ where: { id: employeeId }, data: { vacationDays: { decrement: days } } });
    return request;
  });
}
```

El servicio decide la regla ("se descuentan días al aprobar"); el repositorio garantiza la atomicidad.

---

## 5. Value Object Monetario

```js
import { financial } from '../../core/utils/financialUtils.js';

const gross = financial.sum(baseSalary, overtimePay, commissions);
const iessPersonal = financial.percentage(gross, IESS_PERSONAL_RATE);
const net = financial.round(financial.subtract(gross, iessPersonal, advances));
```

Prohibido: `const net = gross - gross * 0.0945;`

---

## 6. Container / Presentational + Custom Hook (Frontend)

```jsx
// pages/ContractsPage.jsx (contenedor: orquesta)
export default function ContractsPage() {
  const { contracts, status, error, reload } = useContracts();
  if (status === 'loading') return <TableSkeleton />;
  if (status === 'error') return <ErrorState message={error} onRetry={reload} />;
  return <ContractsTable contracts={contracts} />;
}

// components/ContractsTable.jsx (presentación: solo props)
export function ContractsTable({ contracts }) { /* Table del Design System */ }
```

---

## 7. Guard Clauses en Lugar de Anidamiento

```js
// Correcto
if (!employee) throw new NotFoundError('Empleado no encontrado');
if (employee.tenantId !== tenantId) throw new ForbiddenError();
if (!employee.activeContract) throw new ValidationError('Sin contrato activo vigente');
return this.computePayroll(employee);
```

