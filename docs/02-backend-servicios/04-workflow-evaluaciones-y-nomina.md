# 04 — Workflows de Evaluaciones y Nómina

## 1. Workflow de Evaluación de Desempeño

### 1.1 Ciclo de Vida de una Evaluación

```
[Admin/HR] Crea Plantilla
      │
      ▼
EvaluationTemplate (criteria: JSON, scale: JSON, period, instructions)
      │
      ▼ POST /api/performance/evaluations
[Admin/HR] Asigna Evaluación al Empleado
      │
      ├─→ EmployeeEvaluation (status: PENDING)
      └─→ EvaluationReviewer[] (uno por cada revisor asignado)
              │
              ▼ PUT /api/performance/evaluations/:id/submit
      [Revisor] Completa la evaluación
              │
              ├─→ EvaluationReviewer.status = COMPLETED
              ├─→ EvaluationReviewer.responses = JSON de respuestas
              ├─→ EvaluationReviewer.score = puntuación calculada
              └─→ Si todos los revisores completaron:
                      EmployeeEvaluation.status = COMPLETED
                      EmployeeEvaluation.finalScore = promedio de scores
```

### 1.2 Estructura de Criterios (EvaluationTemplate.criteria)

Los criterios se almacenan como JSON en el campo `criteria` del modelo `EvaluationTemplate`. Cada criterio define:
- `id`: Identificador único del criterio.
- `name`: Nombre del criterio (ej: "Trabajo en Equipo").
- `weight`: Peso relativo en el cálculo del puntaje final (0-100, suma debe ser 100).
- `description`: Descripción y guía para el evaluador.

### 1.3 Escala de Evaluación (EvaluationTemplate.scale)

El campo `scale` define la escala de puntuación en formato JSON:
- Escala numérica: `{ "min": 1, "max": 5, "labels": {"1": "Deficiente", ..., "5": "Excelente"} }`
- Escala porcentual: `{ "min": 0, "max": 100 }`

### 1.4 Alertas Automáticas de Evaluaciones

El `performanceCronJob.js` ejecuta una verificación periódica para detectar:
- Evaluaciones en estado `PENDING` cuya `endDate` ya pasó.
- Genera notificaciones a los administradores y revisores indicando el número de días de retraso.

El módulo de inteligencia también detecta estas evaluaciones vencidas como parte de las **alertas proactivas** del dashboard (`getProactiveAlerts`), clasificándolas por severidad según días de retraso:
- `LOW`: 1-7 días de retraso.
- `MEDIUM`: 8-14 días de retraso.
- `HIGH`: Más de 14 días de retraso.

---

## 2. Workflow de Nómina

### 2.1 Estados de la Nómina

```
DRAFT → APPROVED → PAID
  │
  └─ (puede eliminarse mientras esté en DRAFT)
```

- **DRAFT:** Nómina generada pero no confirmada. Permite edición manual de registros individuales.
- **APPROVED:** Confirmada por el administrador. No permite edición. En este paso se procesan los beneficios one-time y se descuentan las cuotas de anticipos.
- **PAID:** Nómina marcada como pagada. Se registra la fecha de pago.

### 2.2 Proceso de Generación (POST `/api/payroll/generate`)

El proceso de generación ejecuta las siguientes etapas de forma secuencial:

**Etapa 1: Verificación de Duplicados**  
Verifica que no exista una nómina para el mismo período (`month/year`) en el tenant. Si ya existe, lanza error.

**Etapa 2: Obtención de Parámetros Globales**  
Carga la `PayrollConfig` activa del tenant, incluyendo los `PayrollItem[]` (ítems globales de ingresos/deducciones).

**Etapa 3: Selección de Empleados**  
Carga todos los empleados del tenant con al menos un contrato activo que tenga vigencia dentro del período solicitado. Un contrato es vigente si:
```
contract.startDate <= period.endDate
AND (contract.endDate IS NULL OR contract.endDate >= period.startDate)
AND contract.status = 'Active'
```

**Etapa 4: Carga Batch de Datos**  
Con los IDs de los empleados seleccionados, realiza 4 consultas batch paralelas:
- `Attendance[]` del período → indexado en `Map<employeeId, Attendance[]>`
- `EmployeeSchedule[]` activos → indexado en `Map<employeeId, Schedule[]>`
- `EmployeeBenefit[]` activos → indexado en `Map<employeeId, Benefit[]>`
- `SalaryAdvance[]` aprobados → indexado en `Map<employeeId, Advance[]>`

**Etapa 5: Cálculo por Empleado**  
Ver sección detallada en `docs/03-motores-especializados/01-motor-calculo-nomina.md`.

**Etapa 6: Persistencia en Base de Datos**  
Crea un registro `Payroll` principal con el total y todos los `PayrollDetail[]` en una sola operación `prisma.payroll.create({ data: { details: { create: [...] } } })`.

### 2.3 Proceso de Confirmación (PUT `/api/payroll/:id/confirm`)

Ejecutado dentro de una transacción Prisma (`$transaction`):

1. Carga la nómina con todos sus detalles.
2. **Validación de consistencia:** Recalcula la suma de `netSalary` de todos los detalles y verifica que sea igual al `totalAmount` de la cabecera. Si hay discrepancia, rechaza la confirmación.
3. **Procesamiento de beneficios one-time:** Para cada detalle, revisa los bonos. Si un bono tiene `benefitId` y `frequency = 'ONE_TIME'`, actualiza el `EmployeeBenefit.status` a `'PROCESSED'`.
4. **Procesamiento de anticipos:** Para cada detalle, revisa las deducciones con `advanceId`. Incrementa `paidInstallments` y `paidAmount`. Si `paidInstallments >= installments` o `paidAmount >= amount`, cambia el estado del anticipo a `'PAID'`.
5. Actualiza el estado de la nómina a `'APPROVED'`.
6. Registra auditoría dentro de la transacción.

### 2.4 Generación de Archivo Bancario (GET `/api/payroll/:id/bank-file`)

Genera un archivo CSV con el formato requerido para transferencias bancarias masivas:

```
Identificacion,Beneficiario,Banco,TipoCuenta,NumeroCuenta,Monto,Detalle
1234567890,Jorge Doicela,Banco Pichincha,AHORROS,2200123456,1250.00,Nómina 31/08/2026
```

Los campos `bankName` y `accountNumber` son desencriptados en el momento de generación usando `safeDecrypt`. Si la desencriptación falla para algún empleado, se coloca `'ERROR_DECRYPT'` en el campo correspondiente para no omitir el registro.

Solo se incluyen empleados que tienen `bankName` y `accountNumber` configurados.

### 2.5 Cron Jobs de Recordatorio de Nómina

El `payrollCronJob.js` se ejecuta diariamente a las 09:00 AM y envía notificaciones a todos los administradores activos en los siguientes momentos:

| Trigger | Condición | Mensaje |
|---------|-----------|---------|
| Aviso de cierre | Faltan 5 días para el cierre de novedades | `PAYROLL_CLOSING` |
| Alerta de revisión | Faltan 3 días para la fecha de pago | `PAYROLL_REVIEW` |
| Confirmación urgente | Falta 1 día para la fecha de pago | `PAYROLL_CONFIRM` |

La fecha de pago se calcula como el último día del mes en curso (`new Date(year, month + 1, 0)`). La fecha de cierre es 5 días antes de la fecha de pago.
