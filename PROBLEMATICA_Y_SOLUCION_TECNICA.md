# Planteamiento del Problema, Justificación e Impacto Tecnológico de la Plataforma SaaS de Gestión del Talento Humano

## 1. Identificación y Diagnóstico del Problema en las Pequeñas y Medianas Empresas (PyMEs)

### 1.1. Fragmentación Operativa y Gestión Manual No Estructurada
En las Pequeñas y Medianas Empresas (PyMEs), la gestión del talento humano presenta una marcada fragmentación operativa. La administración de expedientes personales, el control asistencial, la consolidación de rubros salariales y la evaluación del desempeño se realizan mediante herramientas desconectadas como hojas de cálculo aisladas y registros en papel. Esta dispersión genera los siguientes inconvenientes técnicos:
- **Ausencia de fuente única de verdad (*Single Source of Truth*):** Discrepancias entre los registros de asistencia, las solicitudes de licencias o vacaciones y los acumulados de nómina.
- **Elevada ineficiencia procedimental:** Alto consumo de tiempo administrativo en tareas de digitación y reconciliación manual.
- **Propensión al error humano:** Fallos recurrentes en la trascripción de datos, cómputo monetario e interpretación de políticas internas.

### 1.2. Subjetividad y Sesgo en la Evaluación del Talento (Ausencia de Métricas Multidimensionales)
Las PyMEs carecen de modelos cuantitativos estandarizados para medir el desempeño e identificar el potencial de su personal:
- **Sesgos de apreciación cualitativa:** Evaluaciones basadas en criterios discrecionales propensas al efecto de recencia o favoritismo.
- **Métricas unidimensionales:** Análisis de colaboradores mediante indicadores aislados (como puntualidad o volumen de ventas), ignorando la complejidad del rendimiento integral.
- **Carencia de modelos predictivos:** Imposibilidad de detectar tempranamente riesgos de rotación voluntaria (*turnover*) o agotamiento laboral (*burnout*), lo que ocasiona la pérdida imprevista de personal clave y elevados costos de reemplazo.

### 1.3. Complejidad en el Cálculo de Nómina, Finiquitos y Cumplimiento Normativo
El cumplimiento de la legislación laboral y tributaria (Código de Trabajo del Ecuador, normativa IESS y SRI) exige alta precisión aritmética y apego a reglas de negocio dinámicas:
- **Cálculo de rubros variables y recargos:** Errores en la determinación de horas suplementarias ($50\%$), extraordinarias ($100\%$), recargos nocturnos ($25\%$), desprendimientos de anticipos y retenciones tributarias.
- **Algoritmos de liquidación legal (Offboarding):** El cómputo de actas de finiquito por renuncia voluntaria (`VOLUNTARY_RESIGNATION`), despido intempestivo (`UNFAIR_DISMISSAL`) o fin de contrato (`CONTRACT_END`) requiere aplicar de forma exacta las indemnizaciones por despido intempestivo (Art. 188), bonificación por desahucio (Art. 185: $25\%$ por año completo), y las proporcionales de décima tercera remuneración, décima cuarta remuneración (sobre el Salario Básico Unificado de $\$460.00$ USD) y vacaciones no gozadas ($1.25$ días por mes). El cálculo manual introduce riesgos de inconsistencia financiera y litigiosidad laboral.
- **Inexistencia de trazabilidad inmutable:** Ausencia de registros de auditoría que permitan reconstruir históricamente las mutaciones de datos ante inspecciones reguladoras.

### 1.4. Inseguridad de la Información y Vulneración de la Privacidad de Datos Personales
La administración no centralizada expone información sensible:
- **Almacenamiento no cifrado:** Salarios nominales, cuentas bancarias e identificaciones personales almacenados en texto plano.
- **Controles de asistencia vulnerables:** Sistemas de marcado tradicional propensos a suplantación de identidad (*buddy punching*).
- **Incumplimiento de protección de datos (LOPDP):** Carencia de mecanismos de consentimiento explícito, minimización de datos y control de acceso basado en roles (*RBAC*).

### 1.5. Barreras de Acceso a Sistemas de Grado Corporativo
Las plataformas de gestión de recursos humanos de nivel corporativo (*ERP/HRM*) imponen costos inalcanzables de licenciamiento e infraestructura para el presupuesto de una PyME. Asimismo, las soluciones de bajo costo existentes carecen de aislamiento multi-inquilino (*multi-tenancy*) estricto y de motores estocásticos de analítica avanzada.

---

## 2. Solución Tecnológica: Arquitectura SaaS con Scoring Multidimensional y Motores Especializados

Para resolver la problemática diagnosticada, se desarrolló una plataforma SaaS multi-inquilino (*shared-database, shared-schema*) sustentada en una arquitectura en capas (Clean Architecture), aislamiento lógico estricto, motores matemáticos especializados y analítica predictiva.

### 2.1. Arquitectura Multi-Inquilino con Aislamiento Estricto
- **Inyección de contexto asíncrono:** Mediante `AsyncLocalStorage` y un interceptor en la capa de persistencia (middleware de Prisma ORM), cada solicitud HTTP resuelve e inyecta dinámicamente el `tenantId`.
- **Segregación lógica incontaminable:** Todas las operaciones de lectura, actualización y eliminación incorporan automáticamente la restricción `WHERE tenantId = context.tenantId` sobre las 41 entidades del modelo relacional, impidiendo fugas cruzadas de datos entre empresas.
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
   Índice sintético del nivel de compromiso observable.

**Score Global Compuesto ($S_{overall}$):**
$$S_{overall} = 0.25 S_{ret} + 0.30 S_{perf} + 0.20 S_{att} + 0.15 S_{eng} + 0.10 S_{growth}$$

Este modelo clasifica automáticamente al personal en categorías de rendimiento (*Top Performer* $\ge 80$, *Good Performer* 60-79, *Needs Improvement* 40-59, *At Risk* $< 40$), proporcionando una métrica objetiva y auditable.

### 2.3. Motor Analítico Predictivo y Simulador Estocástico
- **Modelo Proporcional de Riesgos de Weibull:** Modela el tiempo hasta el abandono laboral mediante la función de supervivencia:
  $$S(t) = \exp\left(-\left(\frac{t}{\lambda}\right)^k \cdot e^{\beta X}\right)$$
  Con parámetros $\lambda=24$ meses, $k=1.5$ (riesgo creciente en el tiempo), y covariables $\beta X$ (ratio salarial vs. media departamental, ausencias, tardanzas, tendencia en evaluaciones y tipo de contrato).
- **Simulador Monte Carlo (What-If Estocástico):** Ejecuta 2,000 iteraciones en paralelo utilizando la transformación de Box-Muller para generar variables aleatorias normales. Evalúa el Retorno de Inversión (ROI) e intervalos de confianza del 95% ($p_{2.5}$, mediana $p_{50}$, $p_{97.5}$) ante escenarios de ajuste salarial, programas de bienestar u optimización de horas extra, complementado con análisis de sensibilidad (Tornado Chart).
- **Comparativa Interdepartamental (ANOVA de un factor y Prueba $t$ de Welch):** Determina la significancia estadística ($p < 0.05$) de las variaciones de desempeño entre departamentos mediante la distribución $F(k-1, N-k)$ y la prueba $t$ de Welch para varianzas desiguales.

### 2.4. Motores Especializados de Nómina, Liquidación Legal y Asistencia Geoespacial
- **Motor de Nómina de Alta Precisión:** Utiliza la librería `Decimal.js` (20 dígitos de precisión, redondeo `ROUND_HALF_UP`) para el cálculo batch de salarios proporcionales, recargos nocturnos, horas extra, beneficios y amortización de anticipos.
- **Motor de Liquidación Legal (Offboarding):** Calcula automáticamente las actas de finiquito ajustadas al Código de Trabajo del Ecuador, determinando los proporcionales de 13ro y 14to sueldo, vacaciones no gozadas, desahucio (Art. 185) e indemnización por despido intempestivo (Art. 188 con tope de 25 meses).
- **Motor de Asistencia Geoespacial y Biometría WebAuthn:** Aplica la fórmula de Haversine para verificar el radio de geocerca (por defecto 200m), integra verificación anti-VPN/proxy via `ip-api.com` y soporta autenticación biométrica FIDO2/WebAuthn (`@simplewebauthn`).

### 2.5. Gobernanza de Datos, Criptografía y Auditoría
- **Cifrado Simétrico AES-256-GCM:** Cifrado en capa de aplicación con vector de inicialización de 96 bits (IV) y etiqueta de autenticación de 128 bits (authTag) para salarios, cuentas bancarias y coordenadas GPS.
- **Minimización de Datos (LOPDP):** Truncamiento de coordenadas geográficas a 4 decimales (~11m de precisión) y verificación del consentimiento explícito (`trackingConsent`).
- **Trazabilidad Inmutable:** Inserción de registros de auditoría (`AuditLog`) vinculados a cada mutación de datos sensible.

---

## 3. Justificación de la Creación del Sistema

La plataforma responde a la necesidad de transformar la gestión tradicional en las PyMEs a través de tres pilares fundamentales:

### 3.1. Democratización del Análisis Cuantitativo de Datos en PyMEs
El sistema pone al alcance de pequeñas y medianas empresas herramientas analíticas cuantitativas avanzadas (modelos de supervivencia de Weibull, simulación Monte Carlo, prueba ANOVA) previamente reservadas a grandes corporaciones, empaquetadas en una arquitectura SaaS de bajo costo de mantenimiento.

### 3.2. Reducción de la Deuda Técnica Operativa y Mitigación de Riesgos Legales
La automatización de las reglas de negocio de nómina y desvinculación elimina la dependencia de procesos manuales propensos a error, garantizando el cumplimiento estricto de la legislación laboral vigente y reduciendo el riesgo de sanciones, multas o litigios laborales.

### 3.3. Transición de la Gestión Empírica a la Toma de Decisiones Basada en Evidencia
El motor de Scoring Multidimensional provee a la dirección un marco de evaluación cuantitativo, holístico y transparente. Las decisiones sobre promociones, incentivos, capacitación y desvinculaciones dejan de sustentarse en apreciaciones subjetivas o intuiciones, fundamentándose en evidencia empírica auditable.
