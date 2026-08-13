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
│                             COVARIABLES CONFUSORAS (X)                                   │
│              (Salario Basal, Antigüedad en Meses, Ausencias, Desempeño)                  │
└───────────────────────────┬──────────────────────────────────────────┬───────────────────┘
                            │                                          │
                            ▼                                          ▼
┌─────────────────────────────────────────┐      ┌─────────────────────────────────────────┐
│     VARIABLE DE TRATAMIENTO do(T)       │─────►│           VARIABLE DE RESULTADO (Y)     │
│   (Aumento %, Teletrabajo, Ascenso)     │      │     (Tasa de Fuga & Retorno ROI)        │
└─────────────────────────────────────────┘      └─────────────────────────────────────────┘
```

---

## 2. Formulación Matemática del Motor Causal

### 2.1. Modelo de Puntaje de Propensión (Propensity Score)

El Puntaje de Propensión $e(\mathbf{X}_i)$ representa la probabilidad condicional de que el empleado $i$ reciba la intervención de tratamiento $T_i = 1$ dado su vector de covariables socio-laborales $\mathbf{X}_i$:

$$e(\mathbf{X}_i) = P(T_i = 1 \mid \mathbf{X}_i) = \frac{1}{1 + \exp\left( - (\gamma_0 + \vec{\gamma} \cdot \mathbf{X}_i) \right)}$$

---

### 2.2. Efecto Promedio del Tratamiento (Average Treatment Effect - ATE)

Mediante la técnica de Ponderación de Probabilidad Inversa (IPW), se equilibra la distribución de covariables entre el grupo tratado y de control, eliminando el sesgo de selección:

$$\text{ATE} = \mathbb{E}[Y(1) - Y(0)] = \frac{1}{N} \sum_{i=1}^N \left( \frac{T_i Y_i}{e(\mathbf{X}_i)} - \frac{(1 - T_i) Y_i}{1 - e(\mathbf{X}_i)} \right)$$

Un valor de $\text{ATE} < 0$ indica una reducción neta en la probabilidad de fuga atribuible causalmente a la intervención $do(T)$.

---

### 2.3. Modelo Financiero de Ahorro y ROI Neto

Para transformar el efecto causal ATE en métricas de impacto económico gerencial:

1. **Costo de Reemplazo por Fuga ($\text{Costo}_{\text{reemplazo}}$):** Se estima en $3.5 \times \text{Salario Mensual Promedio}$.
2. **Casos de Fuga Evitados ($\Delta N$):** 

$$\Delta N = |\text{ATE}| \times N_{\text{muestra}}$$

3. **Ahorro Estimado por Retención ($\text{Ahorro}$):**

$$\text{Ahorro} = \Delta N \times \text{Costo}_{\text{reemplazo}}$$

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
    }
  }
}
```

### 4.2 `GET /api/intelligence/causal/history`
Obtiene el historial de intervenciones causales evaluadas previamente para el tenant.

---

## 5. Diseño Experimental para la Publicación Científica

1. **Planteamiento:** Demostrar empíricamente que la toma de decisiones basada en Inferencia Causal ($do(T)$ via PSM+IPW) supera a la optimización basada en regresiones estáticas $P(Y \mid X)$.
2. **Métricas de Evaluación:** Reducción de la Tasa de Fuga Real (ATE) y Eficiencia en la Asignación de Presupuesto (ROI Neto).
3. **Prueba de Hipótesis:** Prueba t de Student sobre el estimador ATE con muestreo Bootstrap (1,000 repeticiones) para validar que $p < 0.001$.
