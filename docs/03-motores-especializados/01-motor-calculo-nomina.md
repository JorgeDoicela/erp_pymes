# 01 — Motor de Cálculo de Nómina

## 1. Descripción General

El `PayrollCalculationService` implementa el motor de cálculo de nómina en `backend/src/services/payroll/payrollCalculationService.js` (736 líneas). El motor procesa en batch todos los empleados activos de un tenant para un período mensual, calculando el salario neto de cada uno aplicando la normativa laboral vigente en Ecuador.

Todas las operaciones aritméticas utilizan `Decimal.js` con 20 dígitos de precisión y redondeo `ROUND_HALF_UP` mediante el wrapper `financial` para evitar errores de punto flotante en cálculos monetarios.

## 2. Fórmula de Nómina

```
Salario Neto = Salario Ganado + Costo Horas Extra + Total Bonificaciones − Total Deducciones
```

### 2.1 Salario Ganado (Salario Proporcional)

```
Salario por Día = Salario Base / Días Laborables Configurados (default: 30)
Salario Ganado  = Salario por Día × Días Trabajados Efectivos

Días Trabajados Efectivos = max(0, Días Elegibles − Faltas del Período)

Días Elegibles:
  - Si contrato activo todo el mes:  Días Laborables Configurados
  - Si contrato parcial en el mes:   min(Días Laborables, Días Efectivos del Contrato)
```

La proporcionalización por contrato parcial considera:
- `effectiveStart = max(contract.startDate, period.startDate)`
- `effectiveEnd = min(contract.endDate, period.endDate)` si el contrato no es indefinido
- `effectiveDaysInPeriod = ceil((effectiveEnd - effectiveStart) / MS_PER_DAY) + 1`

### 2.2 Tarifa Horaria

```
Tarifa Horaria = Salario Base / (Días Laborables × 8 horas)
```

Esta tarifa base se utiliza para el cálculo de horas extra y recargo nocturno.

### 2.3 Horas Extra

Las horas extra se determinan por registro de asistencia:

**Fuente primaria:** `Attendance.overtimeHours` (campo calculado al marcar salida en el servicio de asistencia comparando la hora de salida vs. la hora de fin del turno).

**Fuente secundaria:** Si `overtimeHours` no está presente, se calcula como:
```
Horas Extra Diarias = max(0, Horas Trabajadas − Horas Esperadas del Turno)
```

Las **Horas Esperadas del Turno** se obtienen del `EmployeeSchedule` activo para esa fecha:
```
Duración Turno = Hora Fin − Hora Inicio (corregido si cruza medianoche)
Horas Esperadas = Duración Turno − (Minutos de Descanso / 60)
```

Si no hay turno asignado, se asume 8 horas esperadas por defecto.

**Multiplicadores de horas extra:**

| Condición | Multiplicador |
|-----------|--------------|
| Día de semana (Lun-Vie) | 1.5× tarifa horaria |
| Fin de semana (Sáb-Dom) y contrato con `hasDoubleOvertime = true` | 2.0× tarifa horaria |
| Fin de semana y `hasDoubleOvertime = false` | 1.5× tarifa horaria |

```
Costo Total Horas Extra = Σ (HE_diarias × Tarifa Horaria × Multiplicador)
```

### 2.4 Recargo Nocturno (25%)

Se aplica si `contract.hasNightSurcharge = true`. Para cada registro de asistencia con hora de entrada y salida, se calcula el solapamiento con las franjas nocturnas:

- **Franja nocturna 1:** 19:00 a 00:00 del día del registro
- **Franja nocturna 2:** 00:00 a 06:00 del día del registro

```javascript
// Función getOverlap(start, end, rangeStart, rangeEnd)
const nightHours_1 = getOverlap(checkIn, checkOut, 19h, 00h+1day);
const nightHours_2 = getOverlap(checkIn, checkOut, 00h, 06h);
const totalNightHours = nightHours_1 + nightHours_2;
nightSurchargeAmount = totalNightHours × TarifaHoraria × 0.25;
```

### 2.5 Descuento por Horas No Trabajadas (Undertime)

```
Horas No Trabajadas Diarias = max(0, Horas Esperadas − Horas Trabajadas)
    [Solo cuando Horas Trabajadas > 0, es decir, el empleado sí asistió]

Descuento Undertime = Σ(Horas No Trabajadas Diarias) × Tarifa Horaria
```

### 2.6 Ítems de Configuración Global (PayrollItem)

Para cada ítem activo en `PayrollConfig.items`:
- `type = 'EARNING'` → Se agrega a las bonificaciones.
- `type = 'DEDUCTION'` → Se agrega a las deducciones.
- `fixedValue` → Monto fijo independiente del salario.
- `percentage` → Porcentaje del salario ganado (`financial.percentage(earnedSalary, item.percentage)`).

### 2.7 Beneficios Individuales

Los `EmployeeBenefit[]` activos del empleado se agregan íntegramente a las bonificaciones, independientemente de su monto.

### 2.8 Anticipos de Sueldo

Los `SalaryAdvance[]` en estado `APPROVED` generan deducciones automáticas por la cuota correspondiente al período:
```
Cuota Actual = paidInstallments + 1
Si CuotaActual <= totalInstallments → Deducción de monthlyDeduction
Etiqueta: "Anticipo/Préstamo (Cuota N/M)"
```

### 2.9 Cálculo del Neto Final

```
NetoFinal = max(0, SalarioGanado + CostoHorasExtra + TotalBonificaciones − TotalDeducciones)

Donde TotalBonificaciones incluye:
  - Recargo Nocturno (si aplica)
  - Ítems EARNING de configuración global
  - Beneficios individuales activos

Y TotalDeducciones incluye:
  - Ítems DEDUCTION de configuración global
  - Anticipos de sueldo (cuota del período)
  - Descuento por Undertime
```

## 3. Validación de Consistencia

Al confirmar una nómina, el sistema realiza una validación de integridad:

```javascript
const calculatedTotal = details.reduce((acc, d) => acc.plus(d.netSalary), Decimal(0));
const storedTotal = Decimal(payroll.totalAmount);
if (!calculatedTotal.equals(storedTotal)) → Rechazar confirmación
```

Esta validación garantiza que ninguna edición manual de un detalle individual haya dejado el total de la cabecera inconsistente. Al editar un detalle individualmente (`updatePayrollDetail`), el sistema también recalcula y actualiza el `totalAmount` de la cabecera.

## 4. Estructura de Almacenamiento

### Modelo `Payroll` (Cabecera)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `period` | DateTime | Primer día del mes de la nómina |
| `endDate` | DateTime | Último día del mes |
| `status` | String | DRAFT · APPROVED · PAID |
| `totalAmount` | Float | Suma total de salarios netos del período |
| `paymentDate` | DateTime? | Fecha en que se marcó como pagada |

### Modelo `PayrollDetail` (Registro por Empleado)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `baseSalary` | Float | Salario ganado proporcional |
| `workedDays` | Int | Días efectivamente trabajados |
| `overtimeHours` | Float | Total de horas extra del período |
| `overtimeAmount` | Float | Costo monetario de horas extra |
| `bonuses` | String (JSON) | Array de bonificaciones: `[{name, amount, benefitId?, frequency?}]` |
| `deductions` | String (JSON) | Array de deducciones: `[{name, amount, advanceId?}]` |
| `netSalary` | Float | Salario neto final |

## 5. Generación de Archivo Bancario

El método `generateBankFile(id)` produce un archivo CSV compatible con el formato de transferencia bancaria masiva:

```
Identificacion,Beneficiario,Banco,TipoCuenta,NumeroCuenta,Monto,Detalle
```

- Solo incluye empleados con `bankName` y `accountNumber` configurados.
- Desencripta `bankName` y `accountNumber` usando `safeDecrypt`.
- El monto se formatea con exactamente 2 decimales (`det.netSalary.toFixed(2)`).
- Caracteres coma (`,`) en nombre y banco son eliminados para no corromper el CSV.
