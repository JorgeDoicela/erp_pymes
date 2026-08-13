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

Donde la escala de ruido $\sigma$ se parametriza como:

$$\sigma = \frac{\sqrt{2 \ln(1.25 / \delta)}}{\epsilon}$$

Para un nivel de protección LOPDP/GDPR estándar con $\delta = 10^{-5}$ y $\epsilon_{\text{ronda}} = 0.35$, la escala de ruido se fija en $\sigma \approx 0.45$.

---

### 2.3. Agregación Federada Ponderada (FedAvg)

El servidor central recopila los gradientes ruidosos anonimizados $\tilde{g}_k$ y actualiza el meta-modelo global proporcionalmente al tamaño de muestra $N_k$ de cada participante:

$$\mathbf{g}_{\text{global}} = \sum_{k=1}^K \frac{N_k}{\sum N_k} \tilde{g}_k$$

$$\theta_{\text{global}}^{(t+1)} = \theta_{\text{global}}^{(t)} - \eta \cdot \mathbf{g}_{\text{global}}$$

---

### 2.4. Contabilidad de Presupuesto de Privacidad ($\epsilon$-Budget Tracker)

Cada ronda de entrenamiento consume una fracción del presupuesto de privacidad acumulado de la empresa:

$$\epsilon_{\text{gastado}}^{(t+1)} = \epsilon_{\text{gastado}}^{(t)} + \Delta \epsilon$$

Cuando $\epsilon_{\text{gastado}} \ge \epsilon_{\text{max}} = 10.0$, el sistema inhabilita temporalmente aportes adicionales de ese tenant para prevenir ataques de inferencia por acumulación.

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

## 6. Diseño Experimental para la Publicación Científica (Ciberseguridad & IA)

1. **Evaluación de Trade-off Privacidad vs. Precisión:** Medir la precisión del meta-modelo global bajo distintos niveles de ruido ($\sigma \in [0.1, 1.0]$ y $\epsilon \in [0.5, 5.0]$).
2. **Comparativa de Convergencia:** Demostrar que el meta-modelo federado FedAvg sobre 10 tenants supera en precisión a 10 modelos aislados entrenados individualmente.
3. **Resistencia a Ataques:** Probar la invulnerabilidad frente a ataques de inversión de modelo (*Model Inversion Attack*) mediante la garantía formal $(\epsilon, \delta)$.
