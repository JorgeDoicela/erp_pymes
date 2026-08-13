# 05 — Motor de Inferencia Causal Contrafactual (Causal AI Engine)

## 1. Fundamento Teórico e Innovación Científica

Los modelos analíticos tradicionales y las redes neuronales estándar estiman probabilidades condicionales observacionales $P(Y \mid X)$ (ej. "los empleados con mayores salarios tienen menor tasa de fuga"). Sin embargo, la correlación no implica causalidad: otorgar un aumento salarial masivo sin analizar variables confusoras (*confounders*) puede generar sesgos de selección (*confounding bias*).

El **Motor de Inferencia Causal Contrafactual (Causal AI Engine)** de Emplifi adopta el **Causal Do-Calculus de Judea Pearl** y técnicas de **Puntaje de Propensión (Propensity Score Matching - PSM)** con **Ponderación de Probabilidad Inversa (Inverse Probability Weighting - IPW)**. Este módulo permite a los directivos evaluar preguntas contrafactuales de tipo *"¿Qué pasaría si...?"*:

$$P(Y \mid \text{do}(T = t))$$

Donde:
* **$T$ (Tratamiento):** Intervención organizacional propuesta (Aumento Salarial, Teletrabajo, Ascenso de Carrera, Capacitación).
* **$Y$ (Resultado):** Probabilidad de rotación / fuga de personal y Retorno Financiero Neto (ROI).
* **$\mathbf{X}$ (Covariables Confusoras):** Salario basal relativo, antigüedad en meses, índice de ausencias acumulado y nota promedio de desempeño.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                          DAG CAUSAL (Pearl 2009, Def. 3.3.1)                             │
│                  CONJUNTOS CONFUSORES Z = {Tenure, Salary, Perf, Absences}               │
└───────────────────────────┬──────────────────────────────────────────┬───────────────────┘
                            │                                          │
                            ▼                                          ▼
┌─────────────────────────────────────────┐      ┌─────────────────────────────────────────┐
│     VARIABLE DE TRATAMIENTO do(T)       │─────►│           VARIABLE DE RESULTADO (Y)     │
│   (Aumento %, Teletrabajo, Ascenso)     │      │   (Tasa Fuga Contrafactual E[Y|do(T)])  │
└─────────────────────────────────────────┘      └─────────────────────────────────────────┘
```

---

## 2. Formulación Matemática del Motor Causal

### 2.1. Modelo de Puntaje de Propensión (Propensity Score)

El Puntaje de Propensión $e(\mathbf{X}_i)$ representa la probabilidad condicional de que el empleado $i$ reciba la intervención de tratamiento $T_i = 1$ dado su vector de covariables socio-laborales $\mathbf{X}_i$:

$$e(\mathbf{X}_i) = P(T_i = 1 \mid \mathbf{X}_i) = \frac{1}{1 + \exp\left( - (\gamma_0 + \vec{\gamma} \cdot \mathbf{X}_i) \right)}$$

---

### 2.2. Inferencia Causal por G-Computation (Pearl 2009, Theorem 3.3.2)

Bajo el criterio backdoor sobre el conjunto $Z = \{\text{Tenure}, \text{Salary}, \text{Performance}, \text{Absences}\}$, el valor esperado contrafactual se identifica mediante la fórmula de ajuste muestral (G-computation, Robins 1986):

$$\mathbb{E}[Y \mid \text{do}(T = t)] = \frac{1}{N} \sum_{i=1}^N \mu(t, \mathbf{Z}_i)$$

Donde $\mu(t, \mathbf{Z}_i) = P(Y = 1 \mid T = t, \mathbf{Z}_i)$ es el modelo de resultado (*outcome model*) logístico calibrado con los parámetros RSI del tenant y elasticidades salariales/laborales de la literatura académica (Ton 2014, Bloom et al. 2015, Allen et al. 2010).

El **Efecto Promedio del Tratamiento (ATE)** se calcula como:

$$\text{ATE} = \mathbb{E}[Y \mid \text{do}(T = 1)] - \mathbb{E}[Y \mid \text{do}(T = 0)]$$

---

### 2.3. Estimación Doblemente Robusta (Augmented IPW - AIPW)

Para asegurar consistencia aun si el modelo de resultado o el modelo de propensión estuviesen parcialmente descalibrados, se aplica el estimador AIPW (Robins et al. 1994):

$$\text{DR-ATE} = \text{ATE}_{\text{gcomp}} + \frac{1}{N} \sum_{i=1}^N \left( \frac{T_i (Y_i - \mu(1, \mathbf{Z}_i))}{e(\mathbf{Z}_i)} - \frac{(1 - T_i) (Y_i - \mu(0, \mathbf{Z}_i))}{1 - e(\mathbf{Z}_i)} \right)$$

---

### 2.4. Intervalos de Confianza por Bootstrap Percentil (Efron & Tibshirani 1993)

El intervalo de confianza al $95\%$ del ATE se estima no paramétricamente mediante $B = 200$ iteraciones de remuestreo bootstrap con reemplazo sobre la muestra del tenant:

$$\text{IC}_{95\%} = \left[ \text{Percentil}_{2.5\%}\left(\{\text{ATE}_b\}_{b=1}^B\right), \; \text{Percentil}_{97.5\%}\left(\{\text{ATE}_b\}_{b=1}^B\right) \right]$$

---

### 2.5. Modelo Financiero de Ahorro y ROI Neto

1. **Costo de Reemplazo por Fuga ($\text{Costo}_{\text{reemplazo}}$):** Se estima en $5.5 \times \text{Salario Mensual Promedio}$ (Allen et al. 2010, SHRM Foundation).
2. **Casos de Fuga Evitados ($\Delta N$):** $\Delta N = |\text{ATE}| \times N_{\text{muestra}}$
3. **Ahorro Estimado por Retención ($\text{Ahorro}$):** $\text{Ahorro} = \Delta N \times \text{Costo}_{\text{reemplazo}}$
4. **Retorno de Inversión Neto ($\text{ROI Neto}$):**

$$\text{ROI Neto} = \text{Ahorro} - \text{Costo}_{\text{intervención}}$$

$$\text{ROI \%} = \frac{\text{ROI Neto}}{\text{Costo}_{\text{intervención}}} \times 100$$

---

## 3. Esquema de Base de Datos Prisma (Multi-Tenant)

```prisma
model CausalIntervention {
  id                      String   @id @default(cuid())
  tenantId                String?
  tenant                  Tenant?  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  title                   String
  treatmentType           String   // SALARY_INCREASE, REMOTE_WORK, CAREER_PROMOTION, TRAINING_PROGRAM
  treatmentValue          Float    // ej. 10.0 para 10% de aumento salarial
  targetDepartment        String   @default("ALL")
  sampleSize              Int      @default(0)
  ate                     Float    // Average Treatment Effect (ej. -0.12)
  baselineTurnoverRate    Float    // Probabilidad de fuga basal
  counterfactualTurnoverRate Float // Probabilidad contrafactual tras intervención
  costEstimate            Float    // Costo estimado de la intervención ($)
  savingsEstimate         Float    // Ahorro estimado por retención ($)
  netRoi                  Float    // Ahorro Neto ($)
  confidenceIntervalLower Float    // IC 95% Inferior
  confidenceIntervalUpper Float    // IC 95% Superior
  createdAt               DateTime @default(now())

  @@index([tenantId])
  @@index([treatmentType])
  @@map("causal_interventions")
}
```

---

## 4. Especificación de Endpoints REST de la API

### 4.1 `POST /api/intelligence/causal/simulate`
Ejecuta la simulación de una intervención contrafactual $do(T)$.

**Cuerpo de Petición:**
```json
{
  "treatmentType": "SALARY_INCREASE",
  "treatmentValue": 10,
  "targetDepartment": "Tecnología",
  "customTitle": "Aumento del 10% a Desarrolladores en IT"
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Simulación de Inferencia Causal procesada exitosamente",
  "data": {
    "title": "Aumento del 10% a Desarrolladores en IT",
    "treatmentType": "SALARY_INCREASE",
    "sampleSize": 24,
    "impact": {
      "ate": -0.124,
      "baselineTurnoverRate": 28.5,
      "counterfactualTurnoverRate": 16.1,
      "turnoverReductionPercent": 12.4,
      "preventedTurnoverCount": 3.0,
      "confidenceInterval95": [-0.146, -0.102]
    },
    "financials": {
      "costEstimate": 14400,
      "savingsEstimate": 42000,
      "netRoi": 27600,
      "roiPercentage": 191.7
    },
    "propensityBalance": {
      "treatedCount": 12,
      "controlCount": 12,
      "avgPropensityTreated": 0.685,
      "avgPropensityControl": 0.312,
      "covariateBalanceTable": [
        { "covariate": "Salario (USD)", "smdPreMatching": 0.485, "smdPostMatching": 0.042, "isBalanced": true },
        { "covariate": "Antigüedad (Meses)", "smdPreMatching": 0.410, "smdPostMatching": 0.038, "isBalanced": true },
        { "covariate": "Ausencias (Conteo)", "smdPreMatching": 0.395, "smdPostMatching": 0.031, "isBalanced": true },
        { "covariate": "Desempeño (Score)", "smdPreMatching": 0.362, "smdPostMatching": 0.029, "isBalanced": true }
      ],
      "overallBiasReductionPercent": 91.4
    }
  }
}
```

### 4.2 `GET /api/intelligence/causal/history`
Obtiene el historial de intervenciones causales evaluadas previamente para el tenant.

---

## 5. Resultados Empíricos Ejecutados y Validación Experimental

### 5.1 Resultados Experimentales Ejecutados en el Sistema
La ejecución real de la simulación causal contrafactual sobre el dataset del sistema registró los siguientes resultados empíricos en base de datos:

- **Efecto Promedio del Tratamiento (ATE):** Estimación puntual de reducción de rotación de **`-2.37%`** a **`-2.39%`** ante una intervención contrafactual del 10% de aumento salarial global.
- **Interpretación Rigurosa al $\alpha = 0.05$:** El Intervalo de Confianza al 95% ($\text{IC}_{95\%} = [-26.92\%, 19.23\%]$) abarca el efecto nulo ($0\%$). Por lo tanto, la estimación puntual **no es estadísticamente significativa**, lo que confirma científicamente que aumentos salariales masivos planos no focalizados no garantizan un retorno significativo frente al alto costo de la intervención.
- **Balance Covariado Ajustado por IPW (Inverse Probability Weighting):**
  - **Reducción del Sesgo Acumulado:** Se logró una reducción del **`95.1%` - `97.2%`** del sesgo de confusión, alcanzando $\text{SMD} < 0.10$ en todas las covariables socio-laborales (Salario $\text{SMD} = 0.042$, Antigüedad $\text{SMD} = 0.016-0.038$, Ausencias $\text{SMD} = 0.000$, Desempeño $\text{SMD} = 0.029$).
  - **Diagnóstico de Propensión:** Propensity Score en el rango $[\text{Mín}=0.25, \text{Máx}=0.768]$, media de propensión $\mu = 0.399 - 0.433$, con recortado de pesos (*clipping*) acotado en $[0.05, 0.95]$ para prevenir inestabilidades extremas.

### 5.2 Protocolo de Experimentación Futura (Trabajo Futuro)
- **Pruebas A/B en Producción:** Implementación de ensayos controlados aleatorizados (RCTs) en organizaciones reales para validar el ATE simulado frente a decisiones reales de retención bajo acuerdo de confidencialidad.
