# Un Marco de Inteligencia Artificial Autorrecursiva, Causal y Federada para la Analítica de Talento Humano en Arquitecturas SaaS Multi-Tenant
*(An Autonomous Self-Improving, Causal, and Federated AI Framework for People Analytics in Multi-Tenant SaaS Architectures)*

## 1. Identificación y Diagnóstico del Problema en las Pequeñas y Medianas Empresas (PyMEs)

### 1.1. Fragmentación Operativa y Gestión Manual No Estructurada
En las Pequeñas y Medianas Empresas (PyMEs), la gestión del talento humano presenta una marcada fragmentación operativa. La administración de expedientes personales, el control asistencial, la consolidación de rubros salariales y la evaluación del desempeño se realizan mediante herramientas desconectadas como hojas de cálculo aisladas y registros en papel. Esta dispersión genera los siguientes inconvenientes técnicos:
- **Ausencia de fuente única de verdad (*Single Source of Truth*):** Discrepancias entre los registros de asistencia, las solicitudes de licencias o vacaciones y los acumulados de nómina.
- **Elevada ineficiencia procedimental:** Alto consumo de tiempo administrativo en tareas de digitación y reconciliación manual.
- **Propensión al error humano:** Fallos recurrentes en la transcripción de datos, cómputo monetario e interpretación de políticas internas.

### 1.2. Subjetividad y Sesgo en la Evaluación del Talento (Ausencia de Métricas Multidimensionales)
Las PyMEs carecen de modelos cuantitativos estandarizados para medir el desempeño e identificar el potencial de su personal:
- **Sesgos de apreciación cualitativa:** Evaluaciones basadas en criterios discrecionales propensas al efecto de recencia o favoritismo.
- **Métricas unidimensionales:** Análisis de colaboradores mediante indicadores aislados (como puntualidad o volumen de ventas), ignorando la complejidad del rendimiento integral.
- **Carencia de modelos predictivos y adaptativos:** Imposibilidad de detectar tempranamente riesgos de rotación voluntaria (*turnover*) o agotamiento laboral (*burnout*), lo que ocasiona la pérdida imprevista de personal clave y elevados costos de reemplazo.

### 1.3. Complejidad en el Cálculo de Nómina, Finiquitos y Cumplimiento Normativo
El cumplimiento de la legislación laboral y tributaria (Código de Trabajo del Ecuador, normativa IESS y SRI) exige alta precisión aritmética y apego a reglas de negocio dinámicas:
- **Cálculo de rubros variables y recargos:** Errores en la determinación de horas suplementarias ($50\%$), extraordinarias ($100\%$), recargos nocturnos ($25\%$), desprendimientos de anticipos y retenciones tributarias.
- **Algoritmos de liquidación legal (Offboarding):** El cómputo de actas de finiquito por renuncia voluntaria (`VOLUNTARY_RESIGNATION`), despido intempestivo (`UNFAIR_DISMISSAL`) o fin de contrato (`CONTRACT_END`) requiere aplicar de forma exacta las indemnizaciones por despido intempestivo (Art. 188), bonificación por desahucio (Art. 185: $25\%$ por año completo), y las proporcionales de décima tercera remuneración, décima cuarta remuneración (sobre el Salario Básico Unificado de $\$460.00$ USD) y vacaciones no gozadas ($1.25$ días por mes). El cálculo manual introduce riesgos de inconsistencia financiera y litigiosidad laboral.
- **Inexistencia de trazabilidad inmutable:** Ausencia de registros de auditoría que permitan reconstruir históricamente las mutaciones de datos ante inspecciones reguladoras.

### 1.4. Inseguridad de la Información y Vulneración de la Privacidad de Datos Personales
La administración no centralizada expone información sensible:
- **Almacenamiento no cifrado:** Salarios nominales, cuentas bancarias e identificaciones personales almacenados en texto plano.
- **Controles de asistencia vulnerables:** Sistemas de marcado tradicional propensos a suplantación de identidad (*buddy punching*).
- **Incumplimiento de protección de datos (LOPDP / GDPR):** Carencia de mecanismos de consentimiento explícito, minimización de datos, aislamiento multi-tenant y control de acceso basado en roles (*RBAC*).

### 1.5. Barreras de Acceso a Sistemas de Grado Corporativo
Las plataformas de gestión de recursos humanos de nivel corporativo (*ERP/HRM*) imponen costos inalcanzables de licenciamiento e infraestructura para el presupuesto de una PyME. Asimismo, las soluciones de bajo costo existentes carecen de aislamiento multi-inquilino (*multi-tenancy*) estricto y de motores estocásticos de analítica avanzada e Inteligencia Artificial adaptativa.

---

## 2. Solución Tecnológica: Arquitectura SaaS con Scoring Multidimensional y Cuatrilogía de Motores Científicos de IA

Para resolver la problemática diagnosticada, se desarrolló una plataforma SaaS multi-inquilino (*shared-database, shared-schema*) sustentada en una arquitectura en capas (Clean Architecture), aislamiento lógico estricto, motores matemáticos especializados y una **Cuatrilogía de Motores de Inteligencia Artificial de Vanguardia**.

### 2.1. Arquitectura Multi-Inquilino con Aislamiento Estricto
- **Inyección de contexto asíncrono:** Mediante `AsyncLocalStorage` y un interceptor en la capa de persistencia (middleware de Prisma ORM), cada solicitud HTTP resuelve e inyecta dinámicamente el `tenantId`.
- **Segregación lógica incontaminable:** Todas las operaciones de lectura, actualización y eliminación incorporan automáticamente la restricción `WHERE tenantId = context.tenantId` sobre las 43 entidades del modelo relacional, impidiendo fugas cruzadas de datos entre empresas.
- **Control de acceso basado en roles (RBAC):** Definición jerárquica de permisos (`superadmin`, `admin`, `hr`, `employee`), restringiendo la visibilidad de datos sensibles exclusivamente a roles autorizados. El rol `superadmin` opera bajo un esquema de supervisión en modo solo lectura para los tenants de la plataforma.

### 2.2. Modelo Matemático de Scoring Multidimensional y Salud Organizacional
La plataforma reemplaza la evaluación cualitativa por un índice cuantitativo compuesto ($S_{overall}$), estructurado a partir de 5 dimensiones vectoriales independientes:

1. **Retención ($S_{ret}$):**
   $$S_{ret} = 100 - \text{Riesgo}_{\text{Weibull}}$$
   Calculado mediante el complemento del score de riesgo derivado del modelo de supervivencia de Weibull.

2. **Desempeño ($S_{perf}$):**
   $$S_{perf} = \frac{1}{N} \sum_{i=1}^{N} \text{Score}_i$$
   Promedio móvil ponderado de las evaluaciones 360° continuas registradas.

3. **Asistencia ($S_{att}$):**
   $$S_{att} = \max\left(0, 100 - (7 \times A) - (2 \times T)\right)$$
   Donde $A$ representa el número de ausencias e $T$ el número de tardanzas en los últimos 90 días, penalizando la impuntualidad y el ausentismo.

4. **Crecimiento ($S_{growth}$):**
   $$S_{growth} = \frac{1}{M} \sum_{j=1}^{M} \text{Progreso}_{\text{SMART}, j}$$
   Porcentaje medio de avance en los objetivos estratégicos registrados.

5. **Compromiso (*Engagement Score*, $S_{eng}$):**
   $$S_{eng} = \text{round}\left(0.40 S_{perf} + 0.35 S_{growth} + 0.25 S_{att}\right)$$
   Índice sintético del level de compromiso observable.

**Score Global Compuesto ($S_{overall}$):**
$$S_{overall} = 0.25 S_{ret} + 0.30 S_{perf} + 0.20 S_{att} + 0.15 S_{eng} + 0.10 S_{growth}$$

Este modelo clasifica automáticamente al personal en categorías de rendimiento (*Top Performer* $\ge 80$, *Good Performer* 60-79, *Needs Improvement* 40-59, *At Risk* $< 40$), proporcionando una métrica objetiva y auditable.

### 2.3. Motor Analítico Predictivo, Simulador Estocástico y Estadística Inferencial
- **Modelo Proporcional de Riesgos de Weibull:** Modela el tiempo hasta el abandono laboral mediante la función de supervivencia:
  $$S(t) = \exp\left(-\left(\frac{t}{\lambda}\right)^k \cdot e^{\beta X}\right)$$
  Con parámetros $\lambda=48$ meses, $k=1.25$, y covariables $\beta X$ (ratio salarial vs. media departamental, ausencias, tardanzas, tendencia en evaluaciones y tipo de contrato).
- **Simulador Monte Carlo (What-If Estocástico):** Ejecuta 2,000 iteraciones en paralelo utilizando la transformación de Box-Muller para generar variables aleatorias normales. Evalúa el Retorno de Inversión (ROI) e intervalos de confianza del 95% ($p_{2.5}$, mediana $p_{50}$, $p_{97.5}$).
- **Comparativa Interdepartamental (ANOVA de un factor y Prueba $t$ de Welch):** Determina la significancia estadística ($p < 0.05$) de las variaciones de desempeño entre departamentos mediante la distribución $F(k-1, N-k)$ y la prueba $t$ de Welch para varianzas desiguales.

### 2.4. Cuatrilogía de Motores Científicos de Inteligencia Artificial de Vanguardia

#### 2.4.1. Motor 1: Automejora Recursiva (Recursive Self-Improvement - RSI Engine)
Auto-calibra los hiperparámetros del modelo predictivo ($\vec{\beta}, k, \lambda$) en tiempo real tras la resolución de eventos reales (salida de un empleado o actualización de evaluaciones) mediante la minimización de la pérdida cuadrática Brier Score y Log Loss con Descenso de Gradiente Estocástico (SGD):
$$\text{BrierScore} = \frac{1}{N} \sum_{i=1}^{N} (p_i - y_i)^2$$

#### 2.4.2. Motor 2: Inferencia Causal Contrafactual (Causal AI Engine)
Adopta el **Causal Do-Calculus de Judea Pearl** para responder preguntas de tipo *"¿Qué pasaría si...?"* $P(Y \mid \text{do}(T = t))$. Utiliza **Propensity Score Matching (PSM)** con **Inverse Probability Weighting (IPW)** para eliminar el sesgo de confusión (*confounding bias*), estimando el **Efecto Promedio del Tratamiento (ATE)** y el ROI financiero neto de intervenciones organizacionales (aumentos salariales, teletrabajo, ascensos).

#### 2.4.3. Motor 3: Aprendizaje Federado Multi-Tenant con Privacidad Diferencial (FedAvg + DP-SGD)
Permite la colaboración en el aprendizaje entre empresas (*tenants*) mediante **Weighted Federated Averaging (FedAvg)**. Garantiza matemáticamente la privacidad de los salarios e identidades $(\epsilon, \delta)$ mediante **Recorte de Gradientes en Norma $L_2$** ($C=1.0$) e **Inyección de Ruido Gaussiano**:
$$\tilde{g}_k = \bar{g}_k + \mathcal{N}\left(0, \sigma^2 C^2 \mathbf{I}\right)$$
Cumpliendo estrictamente con la Ley Orgánica de Protección de Datos Personales (LOPDP Ecuador) y GDPR (Europa).

#### 2.4.4. Motor 4: Aprendizaje por Refuerzo Multiobjetivo con Frontera de Pareto (MORL Engine)
Resuelve el dilema gerencial entre retención de talento y costo presupuestario ($) mediante un **Proceso de Decisión de Markov Vectorial (Vectorial MDP)** y **Vector Q-Learning** con escalarización de preferencias $w_1 R_1 + w_2 R_2$. Extrae automáticamente la **Frontera Eficiente de Pareto**, identificando el conjunto inmejorable de políticas no dominadas.

### 2.5. Motores Especializados de Nómina, Liquidación Legal y Asistencia Geoespacial
- **Motor de Nómina de Alta Precisión:** Utiliza la librería `Decimal.js` (20 dígitos de precisión, redondeo `ROUND_HALF_UP`) para el cálculo batch de salarios proporcionales, recargos nocturnos, horas extra, beneficios y amortización de anticipos.
- **Motor de Liquidación Legal (Offboarding):** Calcula automáticamente las actas de finiquito ajustadas al Código de Trabajo del Ecuador, determinando los proporcionales de 13ro y 14to sueldo, vacaciones no gozadas, desahucio (Art. 185) e indemnización por despido intempestivo (Art. 188 con tope de 25 meses).
- **Motor de Asistencia Geoespacial y Detección Anti-VPN:** Aplica la fórmula de Haversine para la verificación geométrica del radio de geocerca (`geofenceRadius`), integra detección de proxy/VPN en tiempo real vía la API de `ip-api.com` y ejecuta cifrado simétrico AES-256-GCM con truncamiento a 4 decimales (~11m de precisión) para la protección de coordenadas GPS.

### 2.6. Gobernanza de Datos, Criptografía y Auditoría
- **Cifrado Simétrico AES-256-GCM:** Cifrado en capa de aplicación con IV de 96 bits y authTag de 128 bits para salarios, cuentas bancarias y coordenadas GPS.
- **Minimización de Datos (LOPDP / GDPR):** Truncamiento de coordenadas geográficas a 4 decimales (~11m de precisión) y verificación del consentimiento explícito (`trackingConsent`).
- **Trazabilidad Inmutable:** Inserción de registros de auditoría (`AuditLog`) vinculados a cada mutación de datos sensible.

---

## 3. Justificación de la Creación del Sistema

La plataforma responde a la necesidad de transformar la gestión tradicional en las PyMEs a través de tres pilares fundamentales:

### 3.1. Democratización de la Inteligencia Artificial Avanzada y el Análisis Cuantitativo en PyMEs
El sistema pone al alcance de pequeñas y medianas empresas herramientas analíticas cuantitativas y de IA de grado doctoral (Automejora Recursiva, Inferencia Causal, Aprendizaje Federado con Privacidad Diferencial y Optimización Pareto MORL) previamente exclusivas de gigantes tecnológicos, empaquetadas en una arquitectura SaaS de bajo costo de mantenimiento.

### 3.2. Reducción de la Deuda Técnica Operativa y Mitigación de Riesgos Legales
La automatización de las reglas de negocio de nómina y desvinculación elimina la dependencia de procesos manuales propensos a error, garantizando el cumplimiento estricto de la legislación laboral vigente y reduciendo el riesgo de sanciones, multas o litigios laborales.

### 3.3. Transición de la Gestión Empírica a la Toma de Decisiones Basada en Evidencia
El motor de Scoring Multidimensional y los simuladores causales/multiobjetivo proveen a la dirección un marco de evaluación cuantitativo, holístico y transparente. Las decisiones sobre promociones, aumentos, teletrabajo y presupuestos dejan de sustentarse en apreciaciones subjetivas o intuiciones, fundamentándose en evidencia empírica auditable.
