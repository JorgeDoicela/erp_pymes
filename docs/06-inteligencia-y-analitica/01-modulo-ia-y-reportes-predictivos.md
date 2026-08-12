# 01 — Módulo de Inteligencia Analítica y Reportes Predictivos

## 1. Descripción General

El `intelligenceService.js` (1,621 líneas) implementa un motor analítico con 8 módulos funcionales que operan sobre los datos históricos del tenant. El **dashboard principal** (`getIntelligenceDashboard`) ejecuta todos los módulos en una sola solicitud utilizando procesamiento paralelo mediante `Promise.all`, minimizando la latencia total.

```
getIntelligenceDashboard()
    │
    ├── fetchRawEmployees()           → Carga empleados con datos relacionados
    ├── getRetentionRiskAnalysis()    → Módulo 1: Weibull survival model
    ├── getPerformanceInsights()      → Módulo 2: Análisis de tendencias de desempeño
    ├── getAttendancePatterns()       → Módulo 3: Patrones de asistencia y ausencias
    ├── getPayrollOptimization()      → Módulo 4: Optimización de costos de nómina
    ├── getDepartmentComparison()     → Módulo 6: ANOVA interdepartamental
    ├── getEmployeeScoring()          → Scoring multidimensional (ver archivo 02)
    ├── getProactiveAlerts()          → Módulo 8: Alertas proactivas
    ├── getOrganizationalHealth()     → Salud organizacional compuesta
    ├── getPredictiveAnalytics()      → Regresión lineal de rotación
    ├── getPatternAnalysis()          → Patrones de ausencias por día/departamento
    ├── runWhatIfMonteCarlo()         → Módulo 7: Simulador Monte Carlo
    ├── calculateFinancialImpact()    → Impacto financiero estimado
    ├── calculateBurnoutAndProductivity() → Burnout por departamento
    ├── calculateHeadcountPayrollProjection() → Proyección 6 meses
    └── generateRecommendations()    → Recomendaciones priorizadas
```

---

## 2. Módulo 1: Análisis de Riesgo de Rotación (Modelo de Supervivencia Weibull)

### 2.1 Fundamento Teórico

El sistema modela la probabilidad de rotación de un empleado utilizando el **modelo de riesgo proporcional de Weibull** con covariables. Este modelo es apropiado para el análisis de tiempo hasta el evento (abandono de la empresa) porque puede modelar tanto tasas de riesgo crecientes como decrecientes en función del tiempo de servicio.

**Función de supervivencia con covariables:**

$$S(t) = \exp\left(-\left(\frac{t}{\lambda}\right)^k \cdot e^{\beta X}\right)$$

Donde:
- $t$ = tiempo de servicio en meses (tenure)
- $\lambda$ = parámetro de escala (default: 24 meses)
- $k$ = parámetro de forma (default: 1.5)
- $\beta X$ = combinación lineal de covariables ponderadas

### 2.2 Covariables del Modelo

El predictor lineal $\beta X$ se construye sumando el aporte de cada covariable:

| Covariable | Lógica de Activación | Peso ($\beta$) |
|-----------|---------------------|---------------|
| Salario bajo vs. media departamental | `salaryRatio < 0.8` (más de 20% bajo la media) | +0.8 |
| Salario muy bajo vs. media | `salaryRatio < 0.6` (más de 40% bajo la media) | +0.5 adicional |
| Ausencias frecuentes | `totalAbsences >= 5` en los últimos datos | +0.7 |
| Ausencias muy frecuentes | `totalAbsences >= 10` | +0.5 adicional |
| Llegadas tarde | `lateDays >= 5` en 90 días | +0.6 |
| Llegadas tarde frecuentes | `lateDays >= 15` en 90 días | +0.4 adicional |
| Desempeño en declive | Empleado en lista `declining` y pendingReview | +0.9 |
| Desempeño bajo sostenido | `avgPerfScore < 60` | +0.6 |
| Desempeño moderado | `avgPerfScore < 70` | +0.3 |
| Contrato temporal | `contractType = 'Temporal'` | +0.4 |
| Empleado reciente | `tenureMonths <= 6` | +0.3 |
| Empleado muy veterano | `tenureMonths >= 60` | -0.2 (factor protector) |

Los pesos fueron calibrados heurísticamente sobre patrones de rotación observados en el dominio de PyMEs latinoamericanas.

### 2.3 Cálculo de Tasa de Riesgo Weibull

```javascript
// Implementación en calculateRetentionRiskScore()
const LAMBDA = 24;          // Escala: 24 meses
const K = 1.5;              // Forma: riesgo creciente en el tiempo

// Predictor lineal
const betaX = Σ(covariable_weight);  // Suma de pesos activados

// Tasa de riesgo instantánea h(t)
const baseHazard = (K / LAMBDA) * Math.pow(tenure / LAMBDA, K - 1);
const weibullHazardRate = baseHazard * Math.exp(betaX);

// Probabilidad de supervivencia a 12 meses
const survivalProb = Math.exp(-Math.pow(tenure / LAMBDA, K) * Math.exp(betaX));

// Probabilidad de rotación anual (score)
const annualTurnoverProb = (1 - survivalProb) * 100;

// Clip a [0, 95] para evitar extrapolaciones extremas
const score = Math.min(95, Math.max(0, Math.round(annualTurnoverProb)));
```

### 2.4 Clasificación de Riesgo

| Score | Nivel |
|-------|-------|
| ≥ 70% | Alto Riesgo |
| ≥ 40% | Riesgo Medio |
| < 40% | Riesgo Bajo |

### 2.5 Preparación de Datos (prepareEmployeeData)

Antes de calcular scores, la función `prepareEmployeeData` desencripta los salarios de todos los empleados y calcula el **salario medio por departamento** para la comparativa relativa:

```javascript
employees.forEach(emp => {
    emp._decryptedSalary = decryptSalary(emp.salary) || 850;  // 850 como fallback
});

// Media departamental
DIRECT_TENANT_MODELS.forEach(dept => {
    departmentAvgSalaries[dept] = mean(salarios del departamento);
});
```

---

## 3. Módulo 2: Análisis de Desempeño (getPerformanceInsights)

### 3.1 Identificación de Tendencias

Para cada empleado con al menos 2 evaluaciones, el sistema calcula si su curva de desempeño es **ascendente** o **descendente**:

```javascript
const recentAvg = mean(evaluaciones recientes.slice(0, 2));    // Promedio 2 más recientes
const previousAvg = mean(evaluaciones previas.slice(2, 4));    // Promedio siguientes 2

const scoreDelta = recentAvg - previousAvg;

if (scoreDelta > 5) → highPerformers (en mejora)
if (scoreDelta < -12) → declining (en declive significativo)
```

### 3.2 Salida del Módulo

```json
{
  "declining": [{ "employeeId", "employeeName", "department", "avgScore", "previousAvg", "scoreDelta" }],
  "highPerformers": [{ ... }],
  "stats": { "total", "declining", "highPerformers", "stable" }
}
```

---

## 4. Módulo 3: Patrones de Asistencia (getAttendancePatterns)

Analiza los registros de asistencia de los últimos 90 días para detectar:

- **Días de ausencias frecuentes:** Rangos con `totalAbsences >= 3` en el período.
- **Ausencias sospechosas:** Empleados con patrón `>= 2 ausencias en días lunes o viernes` (patrón de puentes) usando `suspiciousAbsences`.
- **Impacto por departamento:** Suma de ausencias y tardanzas agrupadas por departamento (`departmentImpact`).

---

## 5. Módulo 4: Optimización de Costos de Nómina (getPayrollOptimization)

Analiza las 2 nóminas más recientes para identificar:

- **Anomalías de horas extra:** Empleados cuyas `overtimeHours` en la última nómina superan en más de 1.5 desviaciones estándar el promedio del departamento.
- **Alerta de incremento de costos:** Si el costo total de la última nómina supera en más del 15% a la nómina anterior, genera una alerta.
- **Distribución de beneficios:** Monto promedio de beneficios por empleado por departamento.

---

## 6. Módulo 5: Matching de Candidatos (getRecruitmentMatching)

Calcula un **score de candidato** para clasificar las aplicaciones de una vacante:

| Factor | Condición | Puntos |
|--------|-----------|--------|
| Evaluaciones | `(avgEvalScore / 100) × 25` | 0-25 pts |
| Entrevistas completadas | `min(completedInterviews × 8, 25)` | 0-25 pts |
| Aplicación temprana (≤3 días) | — | 10 pts |
| Aplicación oportuna (≤7 días) | — | 5 pts |
| Estado OFFER | — | 25 pts |
| Estado INTERVIEW | — | 15 pts |
| Estado REVIEWING | — | 10 pts |
| Estado PENDING | — | 5 pts |

Los candidatos se ordenan por score descendente. El resultado incluye los 3 mejores candidatos como `topCandidates`.

---

## 7. Módulo 6: Comparativa Interdepartamental y ANOVA

### 7.1 ANOVA de un Factor sobre Desempeño

El módulo calcula un ANOVA (Analysis of Variance) de un factor para determinar si existen diferencias estadísticamente significativas en el desempeño promedio entre departamentos.

**Variables:**
- Variable dependiente: `perfScore` (puntaje promedio de evaluaciones por empleado).
- Factor: departamento.

**Cálculo:**

```javascript
// Media global
grandMean = grandSum / totalN;

// Suma de cuadrados entre grupos (ssBetween)
ssBetween = Σ(n_i × (mean_i - grandMean)²)

// Suma de cuadrados dentro de grupos (ssWithin)
ssWithin = Σ Σ (x_ij - mean_i)²

// Estadístico F
dfBetween = k - 1           // k = número de departamentos
dfWithin = totalN - k
msBetween = ssBetween / dfBetween
msWithin = ssWithin / dfWithin
F = msBetween / msWithin
```

**p-valor:** Calculado mediante la función `calculateFPValue(F, dfBetween, dfWithin)` que implementa una aproximación del p-valor de la distribución F.

**Interpretación:** `isSignificant = pValue < 0.05`

### 7.2 Prueba t de Welch (Pairwise)

Si el ANOVA es significativo, se realiza una prueba t de Welch entre el mejor y el peor departamento para comparar sus medias de desempeño de forma más específica:

```javascript
// calculateWelchTTest(samplesA, samplesB)
const meanA = mean(samplesA);
const meanB = mean(samplesB);
const varA = variance(samplesA);    // Varianza muestral
const varB = variance(samplesB);

const tStat = (meanA - meanB) / sqrt(varA/nA + varB/nB);

// Grados de libertad de Welch-Satterthwaite
const df = (varA/nA + varB/nB)² / ((varA/nA)²/(nA-1) + (varB/nB)²/(nB-1));
```

### 7.3 Score de Salud Departamental

Para cada departamento se calcula un score de riesgo compuesto:

```
riskComponent         = (avgRiskScore / 100) × 40
performanceComponent  = (decliningCount / employeeCount) × 30
attendanceComponent   = ((absences + lateDays) / (employeeCount × 10)) × 30

overallScore = riskComponent + performanceComponent + attendanceComponent
```

| overallScore | Salud |
|-------------|-------|
| < 20 | Excelente |
| 20-39 | Bueno |
| 40-59 | Regular |
| ≥ 60 | Crítico |

Los departamentos se ordenan de menor a mayor `overallScore` y se asigna un `ranking`.

---

## 8. Módulo 7: Simulador Monte Carlo (What-If Estocástico)

El simulador ejecuta N=2,000 iteraciones (configurable) de un modelo estocástico para proyectar el impacto de intervenciones de recursos humanos.

### 8.1 Parámetros de Entrada

| Parámetro | Descripción | Default |
|-----------|-------------|---------|
| `salaryIncreasePercent` | % de incremento salarial preventivo | 5% |
| `wellnessInvestment` | Inversión en bienestar por empleado (USD) | $150 |
| `overtimeOptimization` | % de reducción de horas extra | 20% |
| `iterations` | Número de iteraciones Monte Carlo | 2,000 |

### 8.2 Variables Estocásticas (Distribución Normal)

En cada iteración se muestrea:

```javascript
// randomNormal(mean, stddev) — usando Box-Muller transform
const salaryElasticity   = max(1.0,  randomNormal(3.5, 0.6));   // Elasticidad del incremento salarial
const wellnessElasticity = max(0.02, randomNormal(0.12, 0.03)); // Elasticidad de bienestar
const overtimeSavingsFactor = max(0.5, randomNormal(1.0, 0.15)); // Factor de ahorro en HE
```

### 8.3 Modelo de Cada Iteración

```javascript
// Reducción de riesgo de rotación simulada
simulatedRiskRedPct = clip(5, 85,
    (salaryIncreasePercent × salaryElasticity) +
    (wellnessInvestment × wellnessElasticity)
);

// Ahorro por rotación evitada
simulatedAvoidedTurnover = baselineTurnoverRiskCost × (simulatedRiskRedPct / 100);

// Ahorro en horas extra
simulatedOvertimeSavings = (totalEmployees × 45 × 12 × overtimeOptimization/100) × overtimeSavingsFactor;

// ROI
simulatedNetSavings = simulatedAvoidedTurnover + simulatedOvertimeSavings − totalInvestmentCost;
simulatedROI = (simulatedNetSavings / totalInvestmentCost) × 100;
```

### 8.4 Salida: Distribución Percentil

Los resultados de todas las iteraciones se ordenan y se calculan percentiles:

```javascript
roiCI95 = {
    p2_5:   percentil(roiResults, 2.5),    // Límite inferior IC95%
    median: percentil(roiResults, 50),     // Mediana
    p97_5:  percentil(roiResults, 97.5)    // Límite superior IC95%
};
```

El análisis de sensibilidad (tornado) clasifica los parámetros por impacto promedio sobre el ROI.

---

## 9. Módulo 8: Alertas Proactivas

Las alertas son generadas por dos fuentes y ordenadas por `priority` y `severity`:

| Fuente | Tipo | Severity |
|--------|------|---------|
| Empleados con score ≥ 70% en Weibull | `RETENTION` | `CRITICAL` |
| Evaluaciones vencidas > 14 días | `PERFORMANCE` | `HIGH` |
| Evaluaciones vencidas > 7 días | `PERFORMANCE` | `MEDIUM` |
| Evaluaciones vencidas ≤ 7 días | `PERFORMANCE` | `LOW` |

---

## 10. Analítica Predictiva (Regresión Lineal de Rotación)

Proyecta la rotación mensual para los próximos 3 meses usando regresión lineal simple (OLS) sobre los últimos 6 meses de datos históricos de rotación:

```javascript
// Mínimos cuadrados ordinarios
slope     = (n × ΣxY − ΣX × ΣY) / (n × ΣX² − (ΣX)²)
intercept = (ΣY − slope × ΣX) / n
rSquared  = 1 − ssRes / ssTot
```

La predicción para el mes `i` (i=1,2,3) incluye:
- Valor predicho: `max(0, slope × nextX + intercept)`
- Intervalo de confianza manual: `predicted ± (0.5 + i × 0.3)` (margen crece con el horizonte)
- Confianza del modelo: `max(0.4, rSquared - i × 0.05)`

---

## 11. Generador de Dataset Anonimizado (Academic Grade)

`generateAcademicDataset(tenantId, format)` exporta los datos de los empleados en formato CSV o JSON con las siguientes variables anonimizadas:

| Variable | Descripción |
|---------|-------------|
| `subject_id` | Identificador anonimizado (EMP_0001, EMP_0002...) |
| `department_code` | Departamento |
| `position_tier` | Cargo |
| `tenure_days` | Días de antigüedad |
| `tenure_months` | Meses de antigüedad |
| `relative_salary_ratio` | Ratio salario/media departamental |
| `perf_eval_mean_12m` | Media de evaluaciones de desempeño |
| `absences_count_12m` | Número de ausencias registradas |
| `late_arrivals_count_12m` | Número de tardanzas registradas |
| `weibull_hazard_rate` | Tasa de riesgo instantánea del modelo Weibull |
| `annual_turnover_prob_pct` | Probabilidad de rotación anual (%) |
| `survival_prob_12m_pct` | Probabilidad de supervivencia a 12 meses (%) |
| `risk_classification` | Clasificación: Alto Riesgo / Riesgo Medio / Riesgo Bajo |

No se incluyen nombres, identificadores de identidad, correos, salarios nominales ni coordenadas GPS.
