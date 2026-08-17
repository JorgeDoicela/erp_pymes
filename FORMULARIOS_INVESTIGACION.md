# Módulo de Investigación Científica y Encuestas de Validación Metodológica Integrado
## "Un Marco de Inteligencia Artificial Autorrecursiva, Causal y Federada para la Analítica de Talento Humano en Arquitecturas SaaS Multi-Tenant (Emplifi)"

---

## 1. INTRODUCCIÓN Y ARQUITECTURA DEL MÓDULO PÚBLICO DE INVESTIGACIÓN

El proyecto **Emplifi** incorpora un **Módulo Web Integrado de Investigación Científica**, disponible públicamente en la plataforma sin requerir el uso de formularios externos (Google Forms / Microsoft Forms). 

Esta infraestructura permite capturar datos primarios de manera estandarizada, analizar el impacto operativo del sistema en tiempo real, calcular métricas de fiabilidad científica (Alfa de Cronbach, ATE, distribuciones Likert), exportar datasets anonimizados para análisis estadístico (SPSS, R, Stata) y ejecutar un **Motor de Sembrado Sintético con IA / Monte Carlo** protegido exclusivamente para los administradores de la investigación.

### Rutas Web del Módulo de Investigación
* **Formulario Interactivo de Encuestas:** `/investigacion`
* **Tablero de Resultados y Estadísticas Públicas (Live Dashboard):** `/investigacion/resultados`

---

## 2. ESTRUCTURA DE LOS 3 INSTRUMENTOS DE INVESTIGACIÓN

### Formulario 1 — PRE-SISTEMA
**"Diagnóstico de la Gestión del Talento Humano en PyMEs (Línea Base)"**
* **Destinatarios:** Administradores, directores/analistas de RRHH, gerentes financieros o dueños de PyMEs.
* **Objetivo:** Construir la línea base sobre problemas operativos, marcación manual, dispersión de datos, subjetividad en evaluaciones y riesgos en liquidaciones de nómina previa a la adopción de Emplifi.
* **Métrica Principal:** Medición de la carga administrativa previa y el grado de vulnerabilidad legal.

### Formulario 2 — POST-SISTEMA
**"Evaluación de Usabilidad, Impacto Operativo e Inteligencia Causal (UAT)"**
* **Destinatarios:** Usuarios y evaluadores que interactúan con los 19 módulos de Emplifi.
* **Objetivo:** Medir usabilidad percibida (System Usability Scale adaptado), confianza en el simulador Causal ATE (*Do-Calculus*), efectividad del Scoring 5D, usabilidad del fichaje geolocalizado Haversine y Passkeys FIDO2, y cumplimiento del Código del Trabajo del Ecuador.
* **Métrica Principal:** Porcentaje de reducción de carga operativa manual y ganancia en efectividad analítica.

### Formulario 3 — EVALUACIÓN DE EXPERTOS
**"Validación Metodológica y Científica de la Cuatrilogía de Motores de IA"**
* **Destinatarios:** Docentes universitarios, investigadores en IA/Machine Learning, ingenieros de software senior y expertos en gobernanza de datos.
* **Objetivo:** Validar la solidez algorítmica y teórica del marco propuesto:
  1. **Motor RSI (Recursive Self-Improvement):** Minimización de Brier Score sobre parámetros Weibull por descenso de gradiente.
  2. **Motor Causal AI:** Estimación no sesgada del Efecto Promedio del Tratamiento (ATE) e IPW.
  3. **Motor Aprendizaje Federado (FedAvg + DP-SGD):** Garantía de $(\epsilon, \delta)$-privacidad diferencial entre tenants.
  4. **Motor MORL (Multi-Objective Reinforcement Learning):** Optimización sobre la Frontera Eficiente de Pareto.

---

## 3. ARQUITECTURA TÉCNICA Y BASE DE DATOS

### Modelo Prisma ORM (`ResearchSurveyResponse`)
```prisma
model ResearchSurveyResponse {
  id              String   @id @default(cuid())
  surveyType      String   // PRE_SYSTEM, POST_SYSTEM, EXPERT_EVAL
  respondentRole  String
  companySize     String
  economicSector  String
  experienceYears String?
  academicDegree  String?
  answers         Json     // Matriz de respuestas Likert (1-5) y comentarios
  isSynthetic     Boolean  @default(false)
  ipHash          String?
  userAgent       String?
  createdAt       DateTime @default(now())

  @@index([surveyType])
  @@index([isSynthetic])
  @@map("research_survey_responses")
}
```

### Rutas API REST Backend (`/api/research`)
| Método | Endpoint | Acceso | Descripción |
| text | text | text | text |
| `POST` | `/api/research/submit` | Público | Registra una respuesta orgánica de encuesta. |
| `GET` | `/api/research/results` | Público | Devuelve estadísticas agregadas, promedios y Alfa de Cronbach. |
| `GET` | `/api/research/export/csv` | Público | Descarga el dataset anonimizado en CSV. |
| `POST` | `/api/research/seed` | **Restringido (Admin)** | Genera $N$ respuestas sintéticas realistas con distribución probabilística. |
| `DELETE` | `/api/research/responses/synthetic` | **Restringido (Admin)** | Elimina respuestas sintéticas de simulación. |

---

## 4. FORMULACIÓN Y VALIDACIÓN CIENTÍFICA

### 4.1. Alfa de Cronbach ($\alpha$) para Fiabilidad de Escala

Para garantizar que los ítems de la escala Likert tengan consistencia interna adecuada ($\alpha \ge 0.70$), el servicio recalcula automáticamente el coeficiente:

$$\alpha = \frac{K}{K - 1} \left(1 - \frac{\sum_{i=1}^K \sigma_{y_i}^2}{\sigma_X^2}\right)$$

Donde $K$ es el número de preguntas Likert en la encuesta, $\sigma_{y_i}^2$ es la varianza de cada ítem e $\sigma_X^2$ es la varianza total de las puntuaciones compuestas.

### 4.2. Motor de Sembrado Sintético de Datos con IA (Monte Carlo)

Para completar el tamaño de muestra objetivo ($N$) solicitado para la publicación de artículos científicos en revistas indexadas, el sistema incluye un generador estocástico calibrado que:
* Mantiene correlaciones realistas entre el tamaño de la empresa y la percepción de fragmentación operacional.
* Modela la respuesta Likert usando una distribución Normal multivariada acotada en $[1, 5]$.
* Etiqueta de manera transparente cada registro mediante `isSynthetic = true` para posibilitar análisis comparativos entre datos puramente humanos y datos sintéticos.
* **Control de Seguridad:** El sembrado exige verificación estricta del rol `ADMIN` / `SUPERADMIN` mediante sesión JWT activa.

---

## 5. GUÍA DE EXPORTACIÓN Y ANÁLISIS ACADÉMICO

1. Ingrese a `/investigacion/resultados` en el sistema.
2. Haga clic en **"Exportar Dataset CSV"** para obtener el archivo `emplifi_research_dataset.csv`.
3. Importe el CSV en SPSS, R o Python para ejecutar pruebas de hipótesis ($\chi^2$, ANOVA de un vía o regresiones logísticas).
4. Utilice la función **"PDF Reporte"** para generar la versión impresa en alta definición de los gráficos de Recharts para los anexos de su artículo científico.
