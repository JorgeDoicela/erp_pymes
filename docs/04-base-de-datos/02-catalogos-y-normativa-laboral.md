# Catálogos del Sistema y Parámetros de Normativa Laboral

## 1. Enumeraciones y Catálogos de Dominio

El esquema relacional utiliza catálogos de valores tipados para mantener la consistencia de los datos en todas las operaciones:

### 1.1. Tipos de Contrato Laboral (`Contract.type`)
- **`INDEFINIDO`**: Contrato a tiempo indefinido con periodo de prueba de 90 días (Art. 15 del Código del Trabajo).
- **`EVENTUAL`**: Contrato eventual por exigencias circunstanciales con recargo del $35\%$ sobre el valor hora base.
- **`PARCIAL_PERMANENTE`**: Jornada laboral parcial (menos de 40 horas semanales).
- **`PASANTIA`**: Convenio formativo de pasantías preprofesionales regulado por la Ley de Pasantías.

### 1.2. Categorías de Ausencias y Licencias (`AbsenceRequest.type`)
- **`VACACIONES`**: Licencia con goce de sueldo descontada del saldo anual acumulado (`vacationDays`).
- **`ENFERMEDAD`**: Incapacidad temporal por enfermedad común o profesional.
- **`MATERNIDAD_PATERNIDAD`**: Licencia remunerada por maternidad (12 semanas) o paternidad (10 a 15 días).
- **`CALAMIDAD_DOMESTICA`**: Permiso remunerado de hasta 3 días por emergencia o fallecimiento de familiar en primer grado.
- **`PERSONAL_SIN_SUELDO`**: Permiso no remunerado con suspensión temporal de la relación laboral.

### 1.3. Causal de Desvinculación (`OffboardingProcess.causal`)
- **`VOLUNTARY_RESIGNATION`**: Renuncia voluntaria (con derecho a proporcional 13ro, 14to, vacaciones y desahucio Art. 185 si $\text{Años} \ge 1$).
- **`UNFAIR_DISMISSAL`**: Despido intempestivo (con derecho a proporcional 13ro, 14to, vacaciones, desahucio Art. 185 e indemnización Art. 188).
- **`CONTRACT_END`**: Terminación por vencimiento de plazo del contrato.
- **`JUST_CAUSE`**: Visto bueno / terminación por causal justa legal (sin indemnización Art. 188).

### 1.4. Estados del Flujo de Reclutamiento (`JobApplication.status`)
- **`PENDING`**: Postulación recibida pendiente de revisión preliminar.
- **`REVIEWING`**: En evaluación de perfil curricular por Recursos Humanos.
- **`INTERVIEW`**: Candidato convocado a fase de entrevista técnica o de competencias.
- **`OFFER`**: Oferta laboral extendida al candidato.
- **`HIRED`**: Postulante contratado e integrado al expediente de `Employee`.
- **`REJECTED`**: Postulación no seleccionada.

---

## 2. Matriz de Parámetros de Ley Laboral (`PayrollConfig` & `offboardingService.js`)

La tabla `payroll_configs` y el servicio de desvinculación centralizan los coeficientes normativos requeridos para la liquidación de haberes y provisión de obligaciones patronales conforme a la legislación ecuatoriana:

| Parámetro / Ley | Coeficiente Normativo | Descripción del Cómputo |
|---|:---:|---|
| `workingDays` | $30\text{ días}$ | Base fija mensual para el cálculo del sueldo diario. |
| `iessPersonalRatio` | $9.45\%$ ($0.0945$) | Porcentaje de aporte individual obligatorio del trabajador al IESS. |
| `iessEmployerRatio` | $11.15\%$ ($0.1115$) | Porcentaje de aporte patronal obligatorio de la empresa al IESS. |
| `overtimeMultiplierStandard` | $1.50$ ($50\%$) | Multiplicador para horas extras suplementarias (ejecutadas hasta las 24:00). |
| `overtimeMultiplierExtra` | $2.00$ ($100\%$) | Multiplicador para horas extraordinarias (ejecutadas entre 24:00 y 06:00, o días festivos). |
| `nightShiftSurcharge` | $1.25$ ($25\%$) | Recargo sobre la hora ordinaria por jornada nocturna (entre 19:00 y 06:00). |
| `reserveFundRatio` | $8.33\%$ ($0.0833$) | Fondo de Reserva aportado mensualmente a partir del 13er mes de trabajo continuo. |
| `thirteenthProportional` | $\frac{1}{12}$ | Proporción mensual del Décimo Tercer Sueldo (ciclo 1 dic a 30 nov). |
| `fourteenthProportional` | $\frac{\$460.00}{12}$ | Proporción mensual del Décimo Cuarto Sueldo sobre el Salario Básico Unificado ($\$460.00\text{ USD}$). |
| `vacationProportional` | $\frac{1}{24}$ | Proporción mensual de provisión para el descanso anual pagado ($15\text{ días}/24$). |
| `desahucioRatio` (Art. 185) | $25\%$ por año | $25\%$ del último sueldo mensual por cada año de servicio completo. |
| `severanceRatio` (Art. 188) | $3\text{ meses} / 1\text{ mes por año}$ | $3$ meses de sueldo (si $\le 3$ años) o $1$ mes por año (si $>3$ años, máx 25 meses). |
