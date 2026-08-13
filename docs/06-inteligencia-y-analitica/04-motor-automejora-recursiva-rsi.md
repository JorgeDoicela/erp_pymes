# 04 — Motor de Automejora Recursiva (RSI Engine - Recursive Self-Improvement)

## 1. Fundamento Teórico e Innovación Científica

Los sistemas analíticos tradicionales de gestión del talento humano (People Analytics) operan mediante **modelos fijos y pasivos**. Una vez entrenados o configurados con ponderaciones estáticas, estos algoritmos no adaptan sus parámetros cuando sus predicciones difieren de los eventos reales acontecidos en la empresa (ej. desvinculaciones imprevistas o retención de personal clasificado como de alto riesgo).

El **Motor de Automejora Recursiva (RSI Engine - Recursive Self-Improvement)** introduce un **bucle cerrado de auto-calibración en tiempo real (Closed-Loop Calibration)** sobre la arquitectura SaaS Multi-Tenant de Emplifi. Cada observación o desenlace de personal registrado en el sistema genera una señal de retroalimentación matemática que actualiza estocásticamente el vector de hiperparámetros del modelo \(\vec{\beta}\) y la función de riesgo de Weibull, reduciendo la Pérdida Cuadrática Media (*Brier Score*) de forma recursiva sin intervención humana.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             HISTORIAL & EVENTOS DE EMPLEADOS                             │
│                     (Asistencia, Salarios, Evaluaciones, Offboarding)                    │
└───────────────────────────────────────────┬──────────────────────────────────────────────┘
                                            │
                                            ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                         PREDICCIÓN DE RIESGO DE ROTACIÓN (Weibull)                       │
│                     $S(t) = \exp\left( - (t / \lambda)^k \cdot e^{\vec{\beta} X} \right)$│
└───────────────────────────────────────────┬──────────────────────────────────────────────┘
                                            │
                                            ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                         AUDITORÍA Y OBSERVACIÓN DEL EVENTO REAL                          │
│                           $y_i \in \{0, 1\}$ (Permaneció / Renunció)                     │
└───────────────────────────────────────────┬──────────────────────────────────────────────┘
                                            │
                                            ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                     EVALUACIÓN DE PÉRDIDA CUADRÁTICA (Brier Score Loss)                  │
│                     $\text{MSE} = \frac{1}{N} \sum_{i=1}^N (p_i - y_i)^2$                │
└───────────────────────────────────────────┬──────────────────────────────────────────────┘
                                            │
                                            ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                       OPTIMIZACIÓN ESTOCÁSTICA Y AUTO-CALIBRACIÓN                        │
│             $\vec{\beta}_{t+1} = \vec{\beta}_t - \eta \nabla_{\vec{\beta}} \text{Loss}$  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Formulación Matemática del Motor RSI

### 2.1. Función de Pérdida del Modelo (Brier Score & Log-Loss)

Para evaluar la calibración del modelo predictivo de rotación sobre un conjunto de $N$ observaciones auditadas con resultado real $y_i \in \{0, 1\}$ y probabilidad predicha $p_i \in (0, 1)$, se define el **Brier Score (Pérdida Cuadrática Media)**:

$$\text{Brier Score} = \frac{1}{N} \sum_{i=1}^N (p_i - y_i)^2$$

Adicionalmente, se monitorea la métrica de Entropía Cruzada Binaria (**Log-Loss**):

$$\text{Log-Loss} = -\frac{1}{N} \sum_{i=1}^N \left[ y_i \ln(p_i + \epsilon) + (1 - y_i) \ln(1 - p_i + \epsilon) \right]$$

Donde $\epsilon = 10^{-5}$ es una constante de estabilidad numérica.

---

### 2.2. Regla de Actualización por Descenso de Gradiente Estocástico (SGD)

Dado el vector de hiperparámetros del modelo de riesgo:

$$\vec{\beta} = \begin{bmatrix} \beta_{\text{salary}} \\ \beta_{\text{absence}} \\ \beta_{\text{perf}} \\ \beta_{\text{no\_promo}} \end{bmatrix}$$

Durante cada época de calibración RSI ($t \to t+1$), el optimizador calcula la dirección del gradiente de la pérdida respecto a cada coeficiente $\beta_k$:

$$\Delta \beta_k = -\eta \cdot \frac{\partial \text{Loss}}{\partial \beta_k} + \xi$$

Donde:
* $\eta = 0.05$ es la tasa de aprendizaje (*learning rate*).
* $\xi \sim \mathcal{N}(0, \sigma^2)$ representa un término de exploración estocástica con pequeña varianza ($\sigma = 0.01$).

Las cotas de espacio de parámetros se restringen rígidamente para garantizar la plausibilidad biológica y organizacional:
* $\beta_{\text{salary}} \in [-1.50, -0.30]$
* $\beta_{\text{absence}} \in [0.10, 0.90]$
* $\beta_{\text{perf}} \in [0.50, 2.00]$
* $k_{\text{weibull}} \in [1.00, 1.80]$
* $\lambda_{\text{weibull}} \in [36, 60]$ (meses)

---

### 2.3. Porcentaje Acumulado de Automejora

El porcentaje de mejora de la precisión del modelo respecto a la Época Basal ($\text{Época } 1$) se calcula como:

$$\text{Mejora \%} = \max\left(0, \frac{\text{Brier}_{\text{Época 1}} - \text{Brier}_{\text{Época } t}}{\text{Brier}_{\text{Época 1}}} \times 100\right)$$

---

## 3. Arquitectura del Modelo de Datos Prisma (Multi-Tenant)

El aislamiento multi-empresa (*Multi-Tenant*) se garantiza a nivel de esquema asignando cada época de calibración e historial de predicción al identificador `tenantId`.

```prisma
model RsiCalibration {
  id                    String   @id @default(cuid())
  tenantId              String?
  tenant                Tenant?  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  epoch                 Int      @default(1)
  brierScore            Float    // Pérdida cuadrática media (MSE)
  logLoss               Float    // Log Loss
  improvementPercentage Float    @default(0)
  weightsJson           String   @db.Text // Hiperparámetros calibrados
  sampleCount           Int      @default(0)
  triggerReason         String   @default("MANUAL")
  createdAt             DateTime @default(now())

  @@index([tenantId])
  @@index([epoch])
  @@map("rsi_calibrations")
}

model RsiPredictionAudit {
  id                String    @id @default(cuid())
  tenantId          String?
  tenant            Tenant?   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  employeeId        String
  predictedScore    Float     // Score predicho (0-100)
  predictedTurnover Float     // Probabilidad predicha (0.0 - 1.0)
  actualOutcome     Int?      // 0 = Permaneció, 1 = Renunció
  resolvedAt        DateTime?
  createdAt         DateTime  @default(now())

  @@index([tenantId])
  @@index([employeeId])
  @@index([actualOutcome])
  @@map("rsi_prediction_audits")
}
```

---

## 4. Especificación de Endpoints REST de la API

Todas las rutas están protegidas bajo autenticación Bearer JWT y roles `ADMIN`, `HR` o `ACCOUNTING`.

### 4.1 `GET /api/intelligence/rsi/metrics`
Obtiene las métricas actuales del motor RSI, hiperparámetros activos e historial completo de épocas.

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "currentEpoch": 4,
    "currentBrierScore": 0.0842,
    "currentLogLoss": 0.2150,
    "improvementPercentage": 54.5,
    "totalAuditedPredictions": 128,
    "resolvedOutcomeCount": 42,
    "activeParameters": {
      "beta_salary": -0.92,
      "beta_absence": 0.41,
      "beta_perf": 1.15,
      "beta_no_promo": 0.28,
      "k_weibull": 1.27,
      "lambda_weibull": 47.5
    },
    "calibrationHistory": [
      { "epoch": 1, "brierScore": 0.185, "improvementPercentage": 0 },
      { "epoch": 2, "brierScore": 0.142, "improvementPercentage": 23.2 },
      { "epoch": 3, "brierScore": 0.108, "improvementPercentage": 41.6 },
      { "epoch": 4, "brierScore": 0.0842, "improvementPercentage": 54.5 }
    ]
  }
}
```

### 4.2 `POST /api/intelligence/rsi/calibrate`
Dispara manualmente una época de optimización estocástica RSI.

### 4.3 `POST /api/intelligence/rsi/simulate`
Simula la resolución de un desenlace de empleado (Permanencia / Renuncia) y ejecuta la automejora en vivo.

**Cuerpo de Petición:**
```json
{
  "employeeId": "emp_clx98231",
  "actualOutcome": 1
}
```

---

## 5. Diseño Experimental para la Publicación Científica

Para presentar estos hallazgos en congresos (IEEE/ACM/Springer), se define el siguiente protocolo de experimentación empírica:

1. **Línea Base (Baseline):** Evaluación del modelo de riesgo estático tradicional sin calibración ($Brier_0 = 0.185$).
2. **Tratamiento (RSI Closed-Loop):** Ejecución del bucle de automejora a lo largo de 50 épocas sintéticas.
3. **Métrica Primaria:** Reducción porcentual acumulada de Brier Loss ($>40\%$).
4. **Prueba de Hipótesis:** Test de rangos con signo de Wilcoxon entre las distribuciones de error de predicción del modelo baseline vs. modelo RSI con nivel de significancia $\alpha = 0.01$.
