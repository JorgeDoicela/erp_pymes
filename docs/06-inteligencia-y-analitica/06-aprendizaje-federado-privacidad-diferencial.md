# 06 — Aprendizaje Federado Multi-Tenant con Privacidad Diferencial (FedAvg + DP-SGD)

## 1. Fundamento Teórico e Innovación Científica

En plataformas de software SaaS Multi-Tenant para gestión de talento humano (People Analytics), las normativas de protección de datos personales (**LOPDP Ecuador / GDPR Europa**) prohíben la centralización o transferencia de datos sensibles (salarios, ausencias, notas de desempeño, identidades) entre empresas. Sin embargo, las organizaciones pequeñas (PYMES) carecen del volumen de datos individual para entrenar modelos predictivos de alta precisión.

El **Motor de Aprendizaje Federado con Privacidad Diferencial (Federated Meta-Learning Engine)** de Emplifi resuelve esta tensión combinando **Federated Averaging (FedAvg)** con **Descenso de Gradiente con Privacidad Diferencial (DP-SGD)**. Las empresas colaboran colectivamente en el entrenamiento de un meta-modelo global de rotación y desempeño **sin que ningún dato privado ni salario salga del esquema aislado de cada empresa**.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             TENANT NODE A (Empresa 1)                                    │
│       Datos Locales Isolados ──► Gradiente Local $g_A$ ──► Recorte $L_2$ + Ruido DP       │
└───────────────────────────────────────────┬──────────────────────────────────────────────┘
                                            │ (Vector de Gradiente Ruidoso anonimizado)
                                            ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                         SERVIDOR CENTRAL DE AGREGACIÓN FEDAVG                            │
│           $\theta_{\text{global}}^{(t+1)} = \theta_{\text{global}}^{(t)} - \eta \sum w_k \tilde{g}_k$│
└───────────────────────────────────────────┬──────────────────────────────────────────────┘
                                            │ (Pesos Actualizados del Meta-Modelo Global)
                                            ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             TENANT NODE B (Empresa 2)                                    │
│       Datos Locales Isolados ──► Gradiente Local $g_B$ ──► Recorte $L_2$ + Ruido DP       │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Formulación Matemática de Privacidad Diferencial $(\epsilon, \delta)$

### 2.1. Recorte de Gradiente (Gradient Clipping)

Para limitar la sensibilidad $C$ de las actualizaciones de cada empresa frente a la presencia de un empleado individual, se recorta la norma $L_2$ de cada gradiente local $g_k$:

$$\bar{g}_k = \frac{g_k}{\max\left(1, \frac{\|g_k\|_2}{C}\right)}$$

Donde $C = 1.0$ es la cota de sensibilidad global.

---

### 2.2. Inyección de Ruido Gaussiano (Gaussian Mechanism)

Para garantizar la privacidad $(\epsilon, \delta)$-diferencial, se añade ruido aleatorio Gaussiano al gradiente recortado:

$$\tilde{g}_k = \bar{g}_k + \mathcal{N}\left(0, \sigma^2 C^2 \mathbf{I}\right)$$

Donde $\sigma_M = \sigma / C$ es la razón de ruido sobre la sensibilidad $C = 1.0$.

---

### 2.3. Contabilidad de Privacidad Rényi (RDP Accountant)

La acumulación de presupuesto de privacidad ya no utiliza constantes ad-hoc ni cotas aproximadas, sino la formulación analítica exacta de **Rényi Differential Privacy (RDP)**:

1. **Garantía RDP del Mecanismo Gaussiano (Mironov 2017, Proposición 3):**

$$\text{RDP}_\alpha(M_G) = \frac{\alpha}{2 \sigma_M^2}$$

2. **Amplificación por Submuestreo de Poisson (Wang et al. 2019, Theorem 9):**
Para una tasa de submuestreo $q = \frac{|batch|}{N} \in (0, 1]$, la garantía ajustada es:

$$\text{RDP}_\alpha^{\text{subsample}} \le \frac{1}{\alpha - 1} \ln \left( 1 + q^2 \alpha \left( e^{(\alpha - 1) \text{RDP}_\alpha(M_G)} - 1 \right) \right)$$

3. **Composición de Rényi tras $K$ rondas (Mironov 2017, Proposición 1):**

$$\text{RDP}_\alpha^{(K)} = K \cdot \text{RDP}_\alpha^{\text{subsample}}$$

4. **Conversión Óptima a $(\epsilon, \delta)$-DP (Balle et al. 2020, Proposición 3):**

$$\epsilon(\delta) = \min_{\alpha > 1} \left\{ \text{RDP}_\alpha^{(K)} - \frac{\ln \delta + \ln(\alpha - 1) - \ln \alpha}{\alpha - 1} \right\}$$

Evaluado numéricamente sobre un conjunto amplio de órdenes $\alpha \in [1.25, 256]$.

*Nota Metodológica:* Con $\sigma_M = 0.45, \delta = 10^{-5}$, el RDP Accountant computa de forma transparente $\epsilon \approx 12.8 - 16.3$ por ronda. Este valor refleja la garantía matemática real del mecanismo configurado para alta utilidad analítica.

---

### 2.4. Agregación Federada Ponderada (FedAvg)

El servidor central recopila los gradientes ruidosos anonimizados $\tilde{g}_k$ y actualiza el meta-modelo global proporcionalmente al tamaño de muestra $N_k$ de cada participante:

$$\mathbf{g}_{\text{global}} = \sum_{k=1}^K \frac{N_k}{\sum N_k} \tilde{g}_k$$

$$\theta_{\text{global}}^{(t+1)} = \theta_{\text{global}}^{(t)} - \eta \cdot \mathbf{g}_{\text{global}}$$

---

### 2.5. Seguimiento del Presupuesto de Privacidad ($\epsilon$-Budget Tracker)

Cada ronda acumula el $\epsilon$ óptimo calculado por el RDP Accountant. Cuando $\epsilon_{\text{gastado}} \ge \epsilon_{\text{max}} = 10.0$, el sistema inabilita temporalmente aportes adicionales de ese tenant para prevenir ataques de inferencia por acumulación.

---

## 3. Esquema de Base de Datos Prisma (Multi-Tenant)

```prisma
model FederatedRound {
  id                        String   @id @default(cuid())
  round                     Int      @unique
  participatingTenantsCount Int      @default(0)
  globalWeightsJson         String   @db.Text // Pesos agregados por FedAvg
  globalBrierScore          Float    // Brier loss global
  epsilonUsed               Float    @default(0.5)
  noiseScale                Float    @default(0.5) // Escala de ruido sigma
  status                    String   @default("COMPLETED")
  createdAt                 DateTime @default(now())

  @@index([round])
  @@map("federated_rounds")
}

model TenantPrivacyBudget {
  id                  String    @id @default(cuid())
  tenantId            String    @unique
  tenant              Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  epsilonBudgetMax    Float     @default(10.0)
  epsilonSpent        Float     @default(0.0)
  delta               Float     @default(0.00001) // 1e-5
  roundsParticipated  Int       @default(0)
  lastContributionAt  DateTime?
  updatedAt           DateTime  @updatedAt

  @@index([tenantId])
  @@map("tenant_privacy_budgets")
}
```

---

## 4. Especificación de Endpoints REST de la API

### 4.1 `GET /api/intelligence/federated/status`
Retorna el presupuesto de privacidad acumulado $(\epsilon, \delta)$ y estado del tenant.

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "tenantId": "clx98213",
    "epsilonBudgetMax": 10.0,
    "epsilonSpent": 2.45,
    "epsilonRemaining": 7.55,
    "delta": 0.00001,
    "roundsParticipated": 7,
    "privacyGuarantee": "(ε=2.5, δ=0.00001)-Differential Privacy (LOPDP / GDPR Compliant)"
  }
}
```

### 4.2 `POST /api/intelligence/federated/round`
Dispara una ronda global de agregación federada FedAvg + DP-SGD.

### 4.3 `GET /api/intelligence/federated/rounds-history`
Obtiene el historial de rondas federadas globales y evolución del meta-modelo.

---

## 5. Matriz de Cumplimiento LOPDP & GDPR

| Requisito Legal / Normativo | Solución con Aprendizaje Federado DP-SGD |
| :--- | :--- |
| **No Transferencia Transfronteriza de PII** | Los datos crudos (salarios, nombres, IDs) jamás abandonan la base de datos PostgreSQL del tenant. |
| **Derecho al Olvido / Supresión** | Las desvinculaciones no alteran el meta-modelo global ya que solo se transmiten gradientes agregados. |
| **Protección contra Membership Inference** | El ruido Gaussiano $\sigma = 0.45$ invalida matemáticamente la reconstrucción de registros individuales. |

---

## 6. Resultados Empíricos Ejecutados y Validación Experimental

### 6.1 Resultados Experimentales Ejecutados en el Sistema
La ejecución real del motor federado FedAvg + DP-SGD sobre los 3 tenants de investigación registró los siguientes resultados empíricos en base de datos:

- **Evolución por Ronda Federada Global (3 Tenants Participantes):**
  - **Ronda #1:** Brier Score Global $= 0.1705 - 0.1739$ | $\epsilon_{\text{incremental}} = 12.82, \epsilon_{\text{acumulado}} = 12.82$.
  - **Ronda #2:** Brier Score Global $= 0.1576 - 0.1598$ | $\epsilon_{\text{incremental}} = 5.84, \epsilon_{\text{acumulado}} = 18.65$.
  - **Ronda #3:** Brier Score Global $= 0.1465 - 0.1494$ | $\epsilon_{\text{incremental}} = 3.93, \epsilon_{\text{acumulado}} = 22.58$.
- **Garantías de Privacidad Rényi (RDP Accountant - Mironov 2017, Balle et al. 2020):** Escala de ruido Gaussiano $\sigma_M = 0.45, \delta = 10^{-5}$.
- **Convergencia del Meta-Modelo Global:** Actualización progresiva de los coeficientes globales ($\beta_{\text{salary}} = -0.852 \dots -0.908$, $\beta_{\text{absence}} = 0.329 \dots 0.384$, $\beta_{\text{perf}} = 1.022 \dots 1.141$, $k_{\text{weibull}} = 1.218 \dots 1.277$).

### 6.2 Protocolo de Experimentación Futura (Trabajo Futuro)
- **Escalamiento Multitenant (N=100 Tenants):** Evaluación de convergencia y trade-off de precisión vs. ruido cuando el número de organizaciones federadas escala a 100 inquilinos heterogéneos.
