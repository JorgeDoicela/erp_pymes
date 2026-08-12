# 02 — Motor de Liquidación Legal (Offboarding)

## 1. Descripción General

El `OffboardingService` implementa el simulador y calculador oficial de Acta de Finiquito conforme al Código de Trabajo de Ecuador. Se encuentra en `backend/src/services/employees/offboardingService.js`.

El servicio ofrece dos funcionalidades principales:
1. **Simulación de liquidación** (`simulateSettlement`): Calcula el monto total sin persistir cambios. Útil para que el administrador revise antes de iniciar el proceso oficial.
2. **Inicio del proceso de offboarding** (`startOffboarding`): Confirma la liquidación, genera un checklist de tareas de desvinculación y persiste el proceso en la base de datos.

## 2. Causales de Salida

| Causal | Código | Aplica Desahucio | Aplica Indemnización |
|--------|--------|-----------------|---------------------|
| Renuncia Voluntaria | `VOLUNTARY_RESIGNATION` | ✓ (si ≥1 año) | ✗ |
| Despido Intempestivo | `UNFAIR_DISMISSAL` | ✓ (si ≥1 año) | ✓ |
| Fin de Contrato | `CONTRACT_END` | ✓ (si ≥1 año) | ✗ |
| Jubilación / Otros | Otros | ✗ | ✗ |

## 3. Algoritmo de Cálculo del Finiquito

Todos los cálculos utilizan el wrapper `financial` (Decimal.js, 20 dígitos, ROUND_HALF_UP).

### 3.1 Determinación del Tiempo de Servicio

```javascript
const daysWorkedTotal = ceil(abs(endDate - startDate) / (1000 * 60 * 60 * 24));
const yearsWorked = daysWorkedTotal / 365.25;    // Considera años bisiestos
const fullYearsWorked = floor(yearsWorked);
const monthsWorked = daysWorkedTotal / 30.4375;  // Mes promedio gregoriano
```

El denominador `365.25` se utiliza para el conteo de años (incluye años bisiestos). El denominador `30.4375` (365.25 / 12) para el conteo de meses.

### 3.2 Décimo Tercero Proporcional

Período de acumulación: 1 de diciembre del año anterior al 30 de noviembre del año en curso.

```
Meses Acumulados = min(mesesTrabajados, 12)
Décimo Tercero Proporcional = (Salario Base × Meses Acumulados) / 12
```

El tope de 12 meses previene que empleados con contratos extremadamente cortos generen un monto superior al décimo anual.

### 3.3 Décimo Cuarto Proporcional

Basado en el Salario Básico Unificado (SBU) vigente:

```
SBU = $460.00 USD (valor fijo codificado — actualizar anualmente)
Meses Acumulados = min(mesesTrabajados, 12)
Décimo Cuarto Proporcional = (SBU × Meses Acumulados) / 12
```

### 3.4 Vacaciones No Gozadas

**Derecho:** 15 días hábiles por año completo de trabajo = 1.25 días por mes trabajado.

```
Días de Vacaciones Ganadas = mesesTrabajados × 1.25
```

**Descuento de vacaciones ya tomadas:** Consulta los registros de `AbsenceRequest` con `type IN ('VACATION', 'Vacaciones', 'vacaciones')` y `status = 'APPROVED'`:

```javascript
// Cálculo de días por cada ausencia aprobada
const days = max(1, round((endDate - startDate) / (1000*60*60*24)) + 1);
takenDays += days;
```

El `+1` en el cálculo incluye tanto el día de inicio como el de fin del período de vacaciones.

```
Días Pendientes de Vacaciones = max(0, DíasGanadas − DíasTomados)
Monto de Vacaciones = DíasPendientes × SalarioDiario

Donde: SalarioDiario = SalarioBase / 30
```

### 3.5 Bonificación por Desahucio (Art. 185 del Código de Trabajo)

Aplica en: `VOLUNTARY_RESIGNATION`, `UNFAIR_DISMISSAL`, `CONTRACT_END` — **siempre que** `fullYearsWorked ≥ 1`.

```
Desahucio = SalarioBase × 0.25 × AñosCompletosServicio
```

**Ejemplo:** Empleado con 3 años y 5 meses → `fullYearsWorked = 3` → `Desahucio = Salario × 0.25 × 3`

### 3.6 Indemnización por Despido Intempestivo (Art. 188)

Aplica **únicamente** si `causal = 'UNFAIR_DISMISSAL'`:

```
Si yearsWorked <= 3:
    Indemnización = SalarioBase × 3   [3 meses de remuneración]

Si yearsWorked > 3:
    yearsToPay = min(ceil(yearsWorked), 25)   [máximo 25 meses]
    Indemnización = SalarioBase × yearsToPay
```

El techo de 25 meses está establecido en el Art. 188 del Código de Trabajo ecuatoriano.

### 3.7 Cálculo del Total del Finiquito

```
TotalFiniquito = DécimoTerceroProporcional
              + DécimoCuartoProporcional
              + MontoVacaciones
              + MontoDesahucio
              + MontoIndemnización
```

## 4. Proceso de Offboarding (startOffboarding)

Una vez calculado el finiquito, el método `startOffboarding` persiste el proceso e inicia el checklist de desvinculación.

### 4.1 Generación del Checklist

El checklist se construye dinámicamente con tareas predeterminadas más las tareas de devolución de activos asignados:

**Tareas fijas:**

| ID | Categoría | Tarea |
|----|-----------|-------|
| `IT_REVOKE` | IT | Revocación de correos corporativos y accesos a sistemas IT |
| `EXIT_INTERVIEW` | HR | Realización de entrevista de salida con RRHH |
| `SIGN_SETTLEMENT` | LEGAL | Firma de Acta de Finiquito y acreditación de fondos |

**Tareas dinámicas (por cada `EmployeeAsset` con `status = 'DELIVERED'`):**
- `ASSET_RETURN_{assetId}`: Devolución de activo/EPP con nombre y categoría.

El checklist se serializa como JSON en el campo `OffboardingProcess.checklist`.

### 4.2 Actualización del Checklist (updateChecklistStep)

Cuando se marca una tarea como completada:

1. Deserializa el JSON del checklist.
2. Actualiza el campo `completed` y `completedAt` de la tarea.
3. Verifica si **todas** las tareas están completadas.
4. Si todas están completadas, ejecuta una transacción Prisma:
   - Actualiza el proceso a `status: 'COMPLETED'`.
   - Establece `employee.isActive = false`, `employee.exitDate`, `employee.exitReason`, `employee.exitType`.
   - Actualiza todos los contratos activos del empleado a `status: 'Terminated'` con `endDate = exitDate`.
5. Si la tarea completada era una devolución de activo, actualiza el `EmployeeAsset.status = 'RETURNED'`.

### 4.3 Registro de Auditoría

El inicio del proceso de offboarding genera un log de auditoría asíncrono:
```javascript
auditRepository.createLog({
    entity: 'OffboardingProcess',
    action: 'START_OFFBOARDING',
    details: `Iniciado proceso de salida para ${nombre}. Causal: ${causal}. Total finiquito: $${total}`
});
```

## 5. Ejemplo de Cálculo

**Datos:** Empleado con 2 años, 3 meses y 15 días de servicio. Salario: $800 USD. Causal: Despido Intempestivo.

| Componente | Cálculo | Resultado |
|-----------|---------|-----------|
| mesesTrabajados | 2.375 años × 12 | 27.29 meses |
| Décimo Tercero Proporcional | ($800 × 12) / 12 | $800.00 |
| Décimo Cuarto Proporcional | ($460 × 12) / 12 | $460.00 |
| Vacaciones Ganadas | 27.29 × 1.25 | 34.11 días |
| Vacaciones Tomadas | (consultado en BD) | 15 días |
| Vacaciones Pendientes | 34.11 - 15 | 19.11 días |
| Salario Diario | $800 / 30 | $26.67 |
| Monto Vacaciones | 19.11 × $26.67 | $509.61 |
| Desahucio (2 años) | $800 × 0.25 × 2 | $400.00 |
| Indemnización (≤3 años) | $800 × 3 | $2,400.00 |
| **TOTAL FINIQUITO** | | **$4,569.61** |
