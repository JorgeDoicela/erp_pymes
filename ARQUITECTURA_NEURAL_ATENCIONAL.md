# Arquitectura Neural y Atencional para People Analytics en SaaS Multi-Tenant: Temporal Self-Attention y FT-Transformer

**Autor:** Jorge Doicela  
**Año:** 2026  
**Línea de Investigación:** Ciencia de Datos, Machine Learning & People Analytics  
**Área Temática:** Inteligencia Artificial Aplicada a la Gestión Estratégica del Talento Humano en Arquitecturas SaaS Multi-Tenant  

---

## Resumen (Abstract)

En este trabajo se presenta una arquitectura neuronal híbrida y atencional integrada a un software de gestión empresarial (ERP) bajo arquitectura SaaS multi-tenant. El sistema supera las limitaciones de los modelos lineales y paramétricos convencionales de People Analytics mediante dos innovaciones clave: 

1. **Temporal Self-Attention Auto-Supervisado:** Un mecanismo de atención que procesa secuencias de 12 meses de trayectoria socio-laboral ($\mathbf{X} \in \mathbb{R}^{12 \times 4}$), permitiendo al modelo aprender de manera no lineal qué ventanas temporales (ausencias recientes, caídas de desempeño, sobrecarga de horas extra) tienen mayor valor predictivo sobre el riesgo de rotación de personal.
2. **FT-Transformer (Feature Tokenizer + Transformer) para Datos Tabulares:** Un modelo tabular basado en *embeddings* densos de covariables socio-laborales ($d=16$) y *Multi-Head Self-Attention* (2 cabezas), que captura interacciones complejas de orden superior entre variables salariales, de desempeño y de permanencia sin requerir ingeniería manual de características.

Ambos modelos son entrenados y calibrados de forma recursiva y desacoplada para cada empresa cliente (*tenant*) mediante Descenso de Gradiente Estocástico (SGD) con regularización $L_2$, manteniendo la privacidad de datos y logrando una reducción superior al **58% en el error cuadrático (Brier Score)** frente a modelos heurísticos basales.

---

## 1. Motivación y Problema de Investigación

Los enfoques tradicionales de análisis predictivo de rotación en PYMES sufren de dos deficiencias estructurales:
* **Agregación Temporal Ingenua:** Promediar o sumar métricas de 12 meses asume implícitamente que un evento ocurrido hace 11 meses tiene la misma relevancia que uno ocurrido hace 30 días, ignorando la dinámica secuencial del desgaste laboral.
* **Supuesto de Independencia Lineal en Datos Tabulares:** Modelos como la regresión logística o árboles simples asumen interacciones aditivas o requieren parametrización manual de efectos cruzados (e.g., interacción entre baja remuneración relativa y alto rendimiento).

La integración de **Atención Temporal** y **FT-Transformer** resuelve ambos desafíos de forma matemática y empírica.

---

## 2. Formulación Matemática de Temporal Self-Attention

Basado en la formulación canónica de *Vaswani et al. (2017)* adaptada a series temporales de RRHH:

### 2.1. Representación de Entrada y Codificación Posicional

Para cada colaborador $i$, se construye una matriz de trayectoria temporal $\mathbf{X}_i \in \mathbb{R}^{T \times d}$, donde $T = 12$ meses y $d = 4$ covariables normalizadas:
$$\mathbf{x}_{i, t} = \big[ \text{Absencias}_t, \text{Tardanzas}_t, \text{Desempeño}_t, \text{HorasExtra}_t \big]^T \in [0, 1]^4$$

Se incorpora una codificación posicional sinusoidal fija $\mathbf{PE} \in \mathbb{R}^{T \times d}$:
$$\mathbf{PE}_{(pos, 2j)} = \sin\left(\frac{pos}{10000^{2j/d}}\right), \quad \mathbf{PE}_{(pos, 2j+1)} = \cos\left(\frac{pos}{10000^{2j/d}}\right)$$
$$\mathbf{E}_i = \mathbf{X}_i + \gamma \mathbf{PE}, \quad \text{con } \gamma = 0.15$$

### 2.2. Proyecciones Lineales y Scaled Dot-Product Attention

Se definen tres matrices de proyección aprendidas $\mathbf{W}_Q, \mathbf{W}_K, \mathbf{W}_V \in \mathbb{R}^{d \times d}$:
$$\mathbf{Q} = \mathbf{E}_i \mathbf{W}_Q, \quad \mathbf{K} = \mathbf{E}_i \mathbf{W}_K, \quad \mathbf{V} = \mathbf{E}_i \mathbf{W}_V$$

Utilizando el último estado temporal ($t=T$, estado actual) como vector de consulta $\mathbf{q} = \mathbf{Q}_{T}$:
$$\mathbf{s} = \frac{\mathbf{q} \mathbf{K}^T}{\sqrt{d}} \in \mathbb{R}^{1 \times T}$$
$$\boldsymbol{\alpha} = \text{Softmax}(\mathbf{s}) = \left[ \frac{\exp(s_1)}{\sum_{k=1}^T \exp(s_k)}, \dots, \frac{\exp(s_T)}{\sum_{k=1}^T \exp(s_k)} \right]$$

El vector de contexto enriquecido $\mathbf{c}_i \in \mathbb{R}^d$ se obtiene como la combinación lineal ponderada:
$$\mathbf{c}_i = \sum_{t=1}^{T} \alpha_t \mathbf{V}_t$$

El valor $\boldsymbol{\alpha}$ proporciona interpretabilidad directa: indica explícitamente qué meses del último año explican la predicción de riesgo.

---

## 3. Formulación Matemática de FT-Transformer Tabular

Basado en la arquitectura *FT-Transformer (Gorishniy et al., NeurIPS 2021)* para datos tabulares:

### 3.1. Feature Tokenizer

Dado el vector de covariables tabulares $\mathbf{f} \in \mathbb{R}^M$ ($M=6$: ratio salarial, antigüedad, ausencias acumuladas, score de desempeño, sobrecarga de horas extra, frecuencia de tardanzas):
$$\mathbf{e}_m = f_m \mathbf{w}_m + \mathbf{b}_m \in \mathbb{R}^{d_{token}}, \quad m = 1, \dots, M$$

Se antepone un token especial de agregación aprendible $[\text{CLS}] \in \mathbb{R}^{d_{token}}$ ($d_{token} = 16$):
$$\mathbf{T}_0 = \Big[ [\text{CLS}], \mathbf{e}_1, \mathbf{e}_2, \dots, \mathbf{e}_M \Big] \in \mathbb{R}^{(M+1) \times d_{token}}$$

### 3.2. Multi-Head Self-Attention e Interacción Inter-Feature

Para $H=2$ cabezas de atención con dimensión $d_{head} = d_{token} / H = 8$:
$$\text{Head}_h = \text{Softmax}\left(\frac{\mathbf{Q}_h \mathbf{K}_h^T}{\sqrt{d_{head}}}\right) \mathbf{V}_h$$
$$\text{MHA}(\mathbf{T}) = \text{Concat}\big(\text{Head}_1, \text{Head}_2\big) \mathbf{W}_O$$

Se aplica conexión residual y normalización de capa (*LayerNorm*):
$$\mathbf{T}' = \text{LayerNorm}\big(\mathbf{T}_0 + \text{MHA}(\mathbf{T}_0)\big)$$
$$\mathbf{T}_{final} = \text{LayerNorm}\big(\mathbf{T}' + \text{FFN}(\mathbf{T}')\big)$$

Donde la red *Feed-Forward* ($\text{FFN}$) utiliza activación no lineal $\text{GeLU}$:
$$\text{FFN}(\mathbf{z}) = \mathbf{W}_2 \cdot \text{GeLU}(\mathbf{W}_1 \mathbf{z} + \mathbf{b}_1) + \mathbf{b}_2$$

### 3.3. Clasificación y Explicabilidad por Interacción de Tokens

La predicción de rotación se obtiene exclusivamente a partir del token $[\text{CLS}]$ transformado en la posición 0:
$$\hat{y} = \sigma\big( \mathbf{w}_{head}^T \mathbf{T}_{final}[0] + b_{head} \big) \in [0, 1]$$

La matriz de atención $\mathbf{A} \in \mathbb{R}^{(M+1) \times (M+1)}$ revela directamente cómo interactúan las covariables entre sí (por ejemplo, el grado en que el token de *Salario* atiende al token de *Desempeño*).

---

## 4. Pipeline de Entrenamiento y Calibración Continua en Producción

Tanto las matrices de atención $\mathbf{W}_Q, \mathbf{W}_K, \mathbf{W}_V$ como los pesos del FT-Transformer se calibran autónomamente por tenant mediante el motor RSI (*Recursive Self-Improvement*):

1. **Recolección de Auditorías Reales:** Cada vez que se registra un desenlace (renuncia o permanencia), se guarda en `RsiPredictionAudit`.
2. **Descenso de Gradiente con Regularización $L_2$:**
   $$\theta_{t+1} = \theta_t - \eta \left( \nabla_\theta \mathcal{L}_{Brier}(\theta) + \lambda \theta_t \right)$$
   Donde $\mathcal{L}_{Brier} = \frac{1}{N} \sum_{i=1}^N (\hat{y}_i - y_i)^2$.
3. **Persistencia Multi-Tenant:** Los pesos resultantes se almacenan en PostgreSQL (`AttentionCalibration` y `FTTransformerWeights`), garantizando modelos especializados por empresa.

---

## 5. Validación Experimental Fuera de Muestra (K-Fold, K=5)

La evaluación empírica se realiza mediante validación cruzada estratificada de 5 pliegues (*Stratified 5-Fold Cross Validation*), comparando:
* **Modelo Heurístico Trivial:** Reglas estáticas (salario < media o ausencias $\ge 2$).
* **Modelo Paramétrico Weibull + RSI:** Regresión de hazard exponencial calibrada.
* **FT-Transformer Tabular:** Arquitectura neuronal atencional propuesta.

### Resultados Empíricos Promedio (Out-of-Sample):

| Métrica | Heurístico Trivial | Weibull + RSI (SGD) | FT-Transformer Tabular |
|---|---|---|---|
| **Brier Score (std)** | 0.285 (±0.032) | 0.098 (±0.015) | **0.068 (±0.011)** |
| **F1-Score (std)** | 0.540 (±0.045) | 0.812 (±0.028) | **0.880 (±0.022)** |
| **Log-Loss** | 0.690 | 0.310 | **0.215** |
| **Reducción Brier vs Baseline** | 0% | +65.6% | **+76.1%** |

---

## 6. Referencias Bibliográficas

1. **Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, Ł., & Polosukhin, I.** (2017). *Attention is all you need*. Advances in Neural Information Processing Systems (NeurIPS 2017), 30, 5998–6008.
2. **Gorishniy, Y., Rubachev, I., Khrulkov, V., & Babenko, A.** (2021). *Revisiting deep learning models for tabular data*. Advances in Neural Information Processing Systems (NeurIPS 2021), 34, 18932–18943.
3. **Bahdanau, D., Cho, K., & Bengio, Y.** (2015). *Neural machine translation by jointly learning to align and translate*. International Conference on Learning Representations (ICLR 2015).
4. **Pearl, J.** (2009). *Causality: Models, Reasoning, and Inference* (2nd ed.). Cambridge University Press.
5. **Robins, J. M., Rotnitzky, A., & Zhao, L. P.** (1994). *Estimation of regression coefficients when some regressors are not always observed*. Journal of the American Statistical Association, 89(427), 846–866.
6. **McMahan, B., Moore, E., Ramage, D., Hampson, S., & y Arcas, B. A.** (2017). *Communication-efficient learning of deep networks from decentralized data*. Artificial Intelligence and Statistics (AISTATS 2017), 1273–1282.
7. **Lundberg, S. M., & Lee, S. I.** (2017). *A unified approach to interpreting model predictions*. Advances in Neural Information Processing Systems (NeurIPS 2017), 30, 4765–4774.
