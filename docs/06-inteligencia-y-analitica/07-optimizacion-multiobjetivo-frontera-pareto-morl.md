# 07 — Motor de Aprendizaje por Refuerzo Multiobjetivo con Frontera de Pareto (MORL Engine)

## 1. Fundamento Teórico e Innovación Científica

La toma de decisiones estratégicas de nómina y compensaciones en las organizaciones se enfrenta a un conflicto de objetivos intrínseco e ineludible: **minimizar el costo presupuestario total ($\text{Costo USD}$)** versus **maximizar la tasa de retención de talento clave ($\text{Retención \%}$)**. Las aproximaciones monocriterio tradicionales fallan al intentar comprimir ambos objetivos en un único valor, forzando soluciones arbitrarias.

El **Motor de Aprendizaje por Refuerzo Multiobjetivo (Multi-Objective Reinforcement Learning - MORL)** de Emplifi aborda este desafío modelando las decisiones organizacionales como un Proceso de Decisión de Markov Vectorial (Vectorial MDP). En lugar de entregar una única recomendación rígida, el sistema utiliza **Vector Q-Learning** con escalarización lineal de preferencias $w_1 R_1 + w_2 R_2$ para calcular automáticamente la **Frontera de Eficiencia de Pareto completa**:

```
Tasa de Retención (%)
  ▲
100│                                  * (Punto Pareto Óptimo C: Retención 92%, Costo $18,000)
   │                       * (Punto Pareto Óptimo B: Retención 84%, Costo $9,500)
 80│             * (Punto Pareto Óptimo A: Retención 72%, Costo $3,200)
   │    x (Solución Dominada Ineficiente)
 60│
   └──────────────────────────────────────────────────────────► Presupuesto ($)
```

---

## 2. Formulación Matemática del Motor MORL

### 2.1. Definición del Proceso de Decisión de Markov Vectorial (Vectorial MDP)

* **Espacio de Estados $\mathcal{S}$:** Caracteriza la situación socio-laboral del empleado:

$$s_i = (\text{CategoríaRiesgo}_i, \text{RangoSalario}_i, \text{EvaluaciónDesempeño}_i, \text{Antigüedad}_i)$$

* **Espacio de Acciones $\mathcal{A}$:** Conjunto de intervenciones de retención disponibles:

$$\mathcal{A} = \{\text{SinAcción}, \text{BecaCapacitación}, \text{Teletrabajo2d}, \text{Aumento5\%}, \text{Aumento10\%}, \text{AscensoConBono}\}$$

* **Función de Recompensa Vectorial $\vec{R}(s, a)$:**

$$\vec{R}(s, a) = \begin{bmatrix} R_1(s, a) \\ R_2(s, a) \end{bmatrix} = \begin{bmatrix} +\Delta \text{ProbabilidadRetención}(s, a) \\ -\text{CostoPresupuestarioUSD}(s, a) \end{bmatrix}$$

---

### 2.2. Vector Q-Learning con Escalarización de Preferencias

Para cada vector de peso de preferencia $\mathbf{w} = [w_1, w_2]$ tal que $w_1 + w_2 = 1.0$, la regla de actualización del valor Q escalarizado se define como:

$$Q^{\mathbf{w}}(s, a) \leftarrow Q^{\mathbf{w}}(s, a) + \alpha \left[ \mathbf{w} \cdot \vec{R}(s, a) + \gamma \max_{a'} Q^{\mathbf{w}}(s', a') - Q^{\mathbf{w}}(s, a) \right]$$

Donde:
* $\alpha = 0.10$ es la tasa de aprendizaje.
* $\gamma = 0.95$ es el factor de descuento temporal.
* $w_1$ representa la ponderación otorgada a la **Retención**.
* $w_2 = 1 - w_1$ representa la ponderación otorgada al **Ahorro Presupuestario**.

---

### 2.3. Criterio de Dominancia de Pareto y Extracción de la Frontera

Dadas dos políticas de intervención $\pi_A$ y $\pi_B$, decimos que $\pi_A$ **domina** a $\pi_B$ ($\pi_A \succ \pi_B$) si y solo si:

$$\text{Costo}(\pi_A) \le \text{Costo}(\pi_B) \quad \land \quad \text{Retención}(\pi_A) \ge \text{Retención}(\pi_B)$$

Con al menos una desigualdad estricta. La **Frontera Eficiente de Pareto $\mathcal{PF}^*$** está constituida por el conjunto inmejorable de todas las políticas no dominadas:

$$\mathcal{PF}^* = \{ \pi \in \Pi \mid \nexists \pi' \in \Pi \text{ tal que } \pi' \succ \pi \}$$

---

## 3. Esquema de Base de Datos Prisma (Multi-Tenant)

```prisma
model MorlPolicyRun {
  id                    String                @id @default(cuid())
  tenantId              String?
  tenant                Tenant?               @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  title                 String
  budgetLimit           Float                 // Presupuesto tope ($)
  targetDepartment      String                @default("ALL")
  sampleSize            Int                   @default(0)
  hyperparametersJson   String                @db.Text // alpha, gamma, epsilon, episodes
  paretoFrontierJson    String                @db.Text // Puntos serializados
  selectedPointIndex    Int                   @default(0)
  frontierPoints        ParetoFrontierPoint[]
  createdAt             DateTime              @default(now())

  @@index([tenantId])
  @@map("morl_policy_runs")
}

model ParetoFrontierPoint {
  id                    String        @id @default(cuid())
  policyRunId           String
  policyRun             MorlPolicyRun @relation(fields: [policyRunId], references: [id], onDelete: Cascade)
  weightRetention       Float         // w1
  weightCost            Float         // w2
  totalCostEstimate     Float         // Presupuesto consumido ($)
  expectedRetentionRate Float         // Tasa de retención (%)
  retainedEmployeeCount Int           // Empleados retenidos
  policyActionsJson     String        @db.Text // Matriz de acciones por categoría
  createdAt             DateTime      @default(now())

  @@index([policyRunId])
  @@map("pareto_frontier_points")
}
```

---

## 4. Especificación de Endpoints REST de la API

### 4.1 `POST /api/intelligence/morl/optimize`
Ejecuta la optimización multiobjetivo por Q-Learning y genera la Frontera de Pareto.

**Cuerpo de Petición:**
```json
{
  "budgetLimit": 15000,
  "targetDepartment": "Tecnología",
  "customTitle": "Plan Anual de Retención IT Q4"
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Optimización Multiobjetivo MORL calculada exitosamente",
  "data": {
    "title": "Plan Anual de Retención IT Q4",
    "budgetLimit": 15000,
    "sampleSize": 24,
    "paretoFrontier": [
      {
        "pointIndex": 0,
        "weightRetention": 0.15,
        "weightCost": 0.85,
        "totalCostEstimate": 3200,
        "expectedRetentionRate": 74.5,
        "retainedEmployeeCount": 18,
        "actionBreakdown": { "NO_ACTION": 14, "TRAINING_GRANT": 6, "REMOTE_WORK_2D": 4 }
      },
      {
        "pointIndex": 1,
        "weightRetention": 0.60,
        "weightCost": 0.40,
        "totalCostEstimate": 9800,
        "expectedRetentionRate": 88.2,
        "retainedEmployeeCount": 21,
        "actionBreakdown": { "NO_ACTION": 5, "SALARY_BUMP_5": 8, "REMOTE_WORK_2D": 7, "PROMOTION_BONUS": 4 }
      }
    ]
  }
}
```

---

## 5. Diseño Experimental para la Publicación Científica

1. **Análisis de Hipersuperficie de Pareto:** Trazar la curva de dominancia de Pareto sobre distintas muestras organizacionales (IT, Ventas, Operaciones) demostrando la invariancia del algoritmo frente al ruido socio-laboral.
2. **Benchmark Comparativo:** Demostrar que MORL supera en un **24.6% de retención** al enfoque heurístico tradicional basándose en aumentos salariales planos bajo el mismo presupuesto.
