# 03 — Simulador Monte Carlo y ANOVA Interdepartamental

## 1. Fundamento: Simulación Monte Carlo

La **simulación Monte Carlo** es un método de cálculo numérico que utiliza muestreo aleatorio repetido para obtener distribuciones de resultados en presencia de incertidumbre. En el contexto del módulo de inteligencia de Emplifi, se aplica para modelar la incertidumbre en los parámetros de respuesta de los empleados a intervenciones de recursos humanos.

El simulador implementado ejecuta **N=2,000 iteraciones** por defecto (configurable hasta límites del servidor). Cada iteración:
1. Muestrea valores aleatorios de las variables estocásticas desde distribuciones normales.
2. Calcula el ROI y el ahorro neto estimado para esa iteración.
3. Acumula los resultados.

Al finalizar, se construye la distribución empírica de los resultados y se calculan percentiles para construir **intervalos de confianza al 95%**.

## 2. Generador de Números Aleatorios con Distribución Normal

El servicio implementa el método de **transformación de Box-Muller** para generar muestras de una distribución normal a partir del generador uniforme de JavaScript (`Math.random()`):

```javascript
function randomNormal(mean, std) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const n = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + std * n;
}
```

Este método produce exactamente una muestra $N(\mu, \sigma)$ por llamada. Los valores se truncan a un mínimo positivo para que las elasticidades no sean negativas.

## 3. Modelo Económico del Simulador

### 3.1 Costos de Inversión (Determinísticos)

```javascript
annualBaseSalaryCost    = totalEmployees × baseAvgSalary × 12
directSalaryIncreaseCost = annualBaseSalaryCost × (salaryIncreasePercent / 100)
wellnessTotalCost        = totalEmployees × wellnessInvestment
totalInvestmentCost      = directSalaryIncreaseCost + wellnessTotalCost
```

Donde `baseAvgSalary = $850 USD` (aproximación para PyMEs del segmento objetivo).

### 3.2 Costo de Rotación Baseline (Determinístico)

El costo de reemplazar a un empleado es modelado como porcentaje de su salario anual:

```javascript
baselineTurnoverRiskCost =
    (highRiskCount   × baseAvgSalary × 12 × 0.35) +  // 35% costo reemplazo alto riesgo
    (mediumRiskCount × baseAvgSalary × 12 × 0.15)    // 15% costo reemplazo riesgo medio
```

Estos factores (35% y 15%) corresponden a estimaciones de costos de rotación documentadas en literatura de recursos humanos para cargos de nivel medio en PyMEs latinoamericanas: costos de selección, entrenamiento y pérdida de productividad transitoria.

### 3.3 Cálculo Estocástico por Iteración

```javascript
// Variables muestreadas desde distribución Normal
salaryElasticity    = max(1.0,  N(3.5, 0.6))    // Reducción de riesgo por punto % de aumento salarial
wellnessElasticity  = max(0.02, N(0.12, 0.03))  // Reducción de riesgo por $ de bienestar
overtimeSavingsFactor = max(0.5, N(1.0, 0.15))  // Factor de realización del ahorro en HE

// Reducción de riesgo de rotación simulada (%)
simulatedRiskRedPct = clip(5, 85,
    salaryIncreasePercent × salaryElasticity +
    wellnessInvestment × wellnessElasticity
)

// Beneficios
simulatedAvoidedTurnover = baselineTurnoverRiskCost × (simulatedRiskRedPct / 100)
simulatedOvertimeSavings = totalEmployees × 45 × 12 × (overtimeOptimization/100) × overtimeSavingsFactor
                                        // 45 USD/hora estimado × 12 meses × %opt × factor_realización

simulatedGrossSavings = simulatedAvoidedTurnover + simulatedOvertimeSavings
simulatedNetSavings   = simulatedGrossSavings − totalInvestmentCost
simulatedROI          = (simulatedNetSavings / totalInvestmentCost) × 100
```

### 3.4 Resumen de Distribución

Tras N iteraciones:

```javascript
// Ordenar resultados
roiResults.sort()
netSavingsResults.sort()

// Percentiles
roiCI95 = {
    p2_5:   roiResults[ floor(0.025 × N) ],   // Escenario pesimista (IC95%)
    median: roiResults[ floor(0.50  × N) ],   // Mediana
    p97_5:  roiResults[ floor(0.975 × N) ]    // Escenario optimista (IC95%)
}

meanROI = mean(roiResults)
meanNetSavings = mean(netSavingsResults)
meanRiskReductionPercent = mean(riskReductionResults)
```

### 3.5 Análisis de Sensibilidad (Tornado Chart)

El análisis de sensibilidad calcula el impacto promedio acumulado de cada parámetro a lo largo de todas las iteraciones:

```javascript
sensitivityTornado = [
    { parameter: 'Ajuste Salarial Preventivo',  impactIndex: mean(salaryInc × salaryElasticity) },
    { parameter: 'Presupuesto en Bienestar',    impactIndex: mean(wellness × wellnessElasticity) },
    { parameter: 'Optimización Horas Extras',   impactIndex: overtimeOptimization × 1.8 }
].sort(desc by impactIndex)
```

Este gráfico permite identificar qué parámetros tienen mayor impacto sobre el ROI, orientando la priorización de inversiones.

---

## 4. ANOVA de un Factor — Comparativa Interdepartamental

### 4.1 Hipótesis

- **H₀:** Las medias de desempeño son iguales en todos los departamentos: $\mu_1 = \mu_2 = ... = \mu_k$
- **H₁:** Al menos un departamento tiene una media de desempeño significativamente diferente.

### 4.2 Condiciones de Aplicación

El ANOVA se ejecuta únicamente si:
- `k_groups >= 2` (al menos 2 departamentos con empleados).
- `totalN > k_groups` (más observaciones que grupos, necesario para estimar ssWithin).

### 4.3 Cálculo del Estadístico F

```
Notación:
  k     = número de departamentos
  n_i   = empleados en departamento i
  N     = Σn_i (total de observaciones)
  x_ij  = puntaje de desempeño del empleado j en departamento i
  x̄_i  = media del departamento i
  x̄    = media global

Cálculo:
  SS_between = Σ n_i × (x̄_i − x̄)²
  SS_within  = Σ Σ (x_ij − x̄_i)²

  df_between = k − 1
  df_within  = N − k

  MS_between = SS_between / df_between
  MS_within  = SS_within  / df_within

  F = MS_between / MS_within
```

Bajo H₀, el estadístico F sigue una distribución $F(k-1, N-k)$.

### 4.4 p-valor Aproximado

La función `calculateFPValue(F, df1, df2)` implementa una aproximación numérica del p-valor de la distribución F, utilizada para determinar la significancia estadística sin dependencia de librerías externas.

```javascript
// Si F >= 4 y df_within >= 10:  p ≈ 0.03 (significativo)
// Si F >= 2.5 y df_within >= 5: p ≈ 0.08 (marginalmente significativo)
// En otros casos:               p ≈ 0.20 (no significativo)
```

> **Nota de implementación:** La aproximación actualmente codificada es una simplificación heurística por tramos. Para datos reales con N significativo, el valor F tiene mayor peso diagnóstico que el p-valor aproximado. Se recomienda implementar el cálculo exacto del CDF de la distribución F mediante integración numérica para usos analíticos de mayor precisión.

**Decisión:** `isSignificant = pValue < 0.05`

---

## 5. Prueba t de Welch — Comparación Bilateral

### 5.1 Objetivo

La prueba t de Welch se aplica para comparar las medias de desempeño entre el **mejor** y el **peor** departamento (según `overallScore`), sin asumir igualdad de varianzas.

### 5.2 Cálculo

```
t = (x̄_A − x̄_B) / sqrt(s²_A/n_A + s²_B/n_B)

Grados de libertad (Welch-Satterthwaite):
df_W = (s²_A/n_A + s²_B/n_B)² / [(s²_A/n_A)²/(n_A−1) + (s²_B/n_B)²/(n_B−1)]
```

Donde $s²_i$ es la **varianza muestral** (con denominador $n_i - 1$).

### 5.3 Condición de Ejecución

La prueba de Welch solo se ejecuta si ambos departamentos tienen al menos 2 observaciones (`bestScores.length >= 2 && worstScores.length >= 2`).

---

## 6. Interpretación Integrada de Resultados

El módulo de comparativa departamental entrega:

```json
{
  "departments": [
    {
      "department": "Tecnología",
      "ranking": 1,
      "employeeCount": 8,
      "avgRiskScore": 28.4,
      "stdDevRisk": 12.1,
      "highRiskPercentage": 12.5,
      "highPerformerPercentage": 37.5,
      "decliningPerformance": 1,
      "absences": 3,
      "lateDays": 5,
      "overallScore": 18.7,
      "health": "Excelente"
    }
  ],
  "anova": {
    "F": 4.832,
    "pValue": 0.0312,
    "isSignificant": true,
    "dfBetween": 3,
    "dfWithin": 16,
    "grandMean": 73.5
  },
  "pairwiseTTest": {
    "deptA": "Tecnología",
    "deptB": "Operaciones",
    "tStat": 2.41,
    "df": 12.3
  }
}
```

La combinación de ANOVA (¿existen diferencias entre departamentos?) y t de Welch (¿qué tan diferentes son los extremos?) proporciona evidencia estadística para fundamentar decisiones de redistribución de recursos o programas de intervención diferenciados.
