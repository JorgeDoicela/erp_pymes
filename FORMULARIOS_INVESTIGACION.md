# Instrumentos de Investigación y Encuestas de Validación Metodológica
## "Un Marco de Inteligencia Artificial Autorrecursiva, Causal y Federada para la Analítica de Talento Humano en Arquitecturas SaaS Multi-Tenant (Emplifi)"

---

## INTRODUCCIÓN Y CONTEXTO DEL SISTEMA (EMPLIFI)

La presente batería de instrumentos forma parte del proceso de validación experimental y científica del sistema **Emplifi**, una plataforma SaaS multi-inquilino de gestión estratégica del talento humano diseñada para Pequeñas y Medianas Empresas (PyMEs). 

La plataforma integra una **Cuatrilogía de Motores de Inteligencia Artificial**:
1. **Motor RSI (Recursive Self-Improvement):** Automejora recursiva de parámetros de rotación Weibull mediante Descenso de Gradiente Estocástico (SGD) y minimización de Brier Score / LogLoss.
2. **Motor Causal AI:** Inferencia contrafactual basada en *Do-Calculus* de Judea Pearl con Propensity Score Matching (PSM) e Inverse Probability Weighting (IPW) para simulación *What-If* y cálculo de ROI neto.
3. **Motor Aprendizaje Federado (FedAvg + DP-SGD):** Colaboración inter-empresarial con privacidad diferencial garantizada por recorte de gradientes $L_2$ e inyección de ruido Gaussiano $(\epsilon, \delta)$.
4. **Motor MORL (Multi-Objective Reinforcement Learning):** Vector Q-Learning para la optimización conjunta de costo y retención sobre la Frontera de Eficiencia de Pareto.

Asimismo, la plataforma cuenta con módulos de **Asistencia Geoespacial Haversine y Biometría FIDO2/WebAuthn**, **Nómina y Finiquito conforme al Código de Trabajo del Ecuador**, **Contabilidad Financiera Aislada**, **Scoring Multidimensional 5D**, **Simulación Monte Carlo (Box-Muller)** e **Incubadora de Emprendimiento Interno**.

---

## Formulario 1 — PRE-SISTEMA
**"Diagnóstico de la Gestión del Talento Humano en PyMEs (Línea Base)"**

* **Destinatarios:** Administradores, directores/analistas de RRHH, gerentes financieros o dueños de PyMEs.  
* **Objetivo:** Construir la línea base del problema operacional, legal, analítico y tecnológico antes de la adopción del sistema.  
* **Tiempo estimado:** 8-10 minutos.

### Sección A: Perfil Demográfico y Caracterización Organizacional
1. **Cargo actual en la organización:**  
   [ ] Gerente General / Dueño  
   [ ] Director / Jefe de Recursos Humanos  
   [ ] Contador / Administrador Financiero  
   [ ] Analista de Personal / Operaciones  
   [ ] Otro (especifique): _______________
2. **Tamaño de la plantilla de colaboradores:**  
   [ ] Microempresa (1 - 9 empleados)  
   [ ] Pequeña empresa (10 - 49 empleados)  
   [ ] Mediana empresa (50 - 199 empleados)  
   [ ] Empresa grande (> 200 empleados)
3. **Sector económico principal:**  
   [ ] Tecnología / Servicios Profesionales  
   [ ] Comercio / Distribución  
   [ ] Manufactura / Producción  
   [ ] Salud / Educación  
   [ ] Otro: _______________
4. **Experiencia profesional en gestión de talento:** `< 2 años` / `2 - 5 años` / `6 - 10 años` / `> 10 años`
5. **Herramientas actuales utilizadas para la gestión humana:**  
   [ ] Hojas de cálculo aisladas (Excel / Google Sheets)  
   [ ] Archivos físicos en papel  
   [ ] Software tradicional de nómina local  
   [ ] Plataforma SaaS / ERP  
   [ ] Ninguna herramienta centralizada

### Sección B: Fragmentación Operativa y Marcado de Asistencia (Escala Likert 1=Nunca, 5=Siempre)
*"En la operativa diaria de su empresa..."*

| # | Afirmación | 1 | 2 | 3 | 4 | 5 |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| 6 | El registro de asistencia y tardanzas se realiza de forma manual o en hojas impresas. | | | | | |
| 7 | Se han detectado casos de marcación por terceros o suplantación de presencia (*buddy punching*). | | | | | |
| 8 | Es difícil verificar si el personal en modalidad campo/teletrabajo marca dentro del área autorizada. | | | | | |
| 9 | La consolidación de horas extra, recargos nocturnos y atrasos requiere horas de trabajo manual. | | | | | |
| 10 | La información de expedientes, contratos y asistencias se encuentra dispersa en múltiples archivos. | | | | | |

### Sección C: Evaluación del Desempeño y Métrica Multidimensional (Likert 1=Muy en desacuerdo, 5=Muy de acuerdo)
| # | Afirmación | 1 | 2 | 3 | 4 | 5 |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| 11 | Las evaluaciones de desempeño se realizan de forma intuitiva o con criterios subjetivos. | | | | | |
| 12 | Se carece de una métrica cuantitativa única que integre Desempeño 360°, Asistencia, Retención y Objetivos SMART. | | | | | |
| 13 | Es difícil identificar anticipadamente a los colaboradores con alto riesgo de renuncia voluntaria. | | | | | |
| 14 | Las promociones o aumentos de sueldo se otorgan sin un sustento analítico o de evidencia empírica. | | | | | |

### Sección D: Rotación, Costos y Decisiones Preventivas
| # | Pregunta | Opción / Tipo |
|:---:|:---|:---:|
| 15 | ¿Con qué frecuencia la empresa sufre la renuncia inesperada de talento clave? | Frecuentemente (1-5) |
| 16 | ¿Cuánto estima que le cuesta a su empresa reemplazar a un colaborador clave (reclutamiento, inducción, curva de aprendizaje)? | Valor estimado ($ USD) |
| 17 | ¿Ha aplicado intervenciones de retención preventivas (aumentos, teletrabajo, bonos) basadas en datos analíticos? | Sí / No / En ocasiones |

### Sección E: Nómina, Finiquitos y Cumplimiento Normativo (Likert 1-5)
| # | Afirmación | 1 | 2 | 3 | 4 | 5 |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| 18 | Los cálculos de finiquito (desahucio Art. 185, despido intempestivo Art. 188, proporcionales 13ro/14to) son manuales y propensos a error. | | | | | |
| 19 | Han existido reclamos o inconsistencias en los pagos de horas suplementarias (50%) o extraordinarias (100%). | | | | | |
| 20 | Los salarios, cuentas bancarias y cédulas se almacenan en texto plano sin cifrado de grado bancario. | | | | | |

---

## Formulario 2 — POST-SISTEMA
**"Evaluación de Usabilidad, Impacto Operativo e Inteligencia Causal (UAT)"**

* **Destinatarios:** Evaluadores que hayan interactuado de forma práctica con las funcionalidades de **Emplifi** (Panel 5D, Marcado WebAuthn/Haversine, Simulador Causal, MORL y Generación de Finiquitos).  
* **Objetivo:** Medir el cambio percibido en la eficiencia, usabilidad, confianza analítica y toma de decisiones.  
* **Tiempo estimado:** 12-15 minutos.

### Sección A: Usabilidad de Interfaz y Experiencia de Usuario (System Usability Scale adaptado) (Likert 1-5)
| # | Afirmación | 1 | 2 | 3 | 4 | 5 |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| 1 | La navegación entre los 19 módulos (Empleados, Asistencia, Nómina, IA, Contabilidad) es fluida e intuitiva. | | | | | |
| 2 | La visualización gráfica del Score Multidimensional 5D permite comprender rápidamente el estado del empleado. | | | | | |
| 3 | El proceso de marcación de asistencia con geocerca (Haversine) y biometría (WebAuthn Passkeys) es rápido y claro. | | | | | |
| 4 | Recomendaría la interfaz de este sistema para la gestión diaria de una PyME. | | | | | |

### Sección B: Scoring Multidimensional 5D e IA Predictiva de Rotación (Likert 1-5)
| # | Afirmación | 1 | 2 | 3 | 4 | 5 |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| 5 | El cálculo unificado de Scoring 5D ($S_{overall} = 0.25 S_{ret} + 0.30 S_{perf} + 0.20 S_{att} + 0.15 S_{eng} + 0.10 S_{growth}$) refleja fielmente el valor del colaborador. | | | | | |
| 6 | La curva de supervivencia de Weibull ayuda a identificar con precisión el horizonte temporal de riesgo de renuncia. | | | | | |
| 7 | El mecanismo de automejora recursiva (RSI Engine) genera confianza al reducir el error (Brier Score) automáticamente con eventos reales. | | | | | |
| 8 | Las alertas preventivas de rotación permiten tomar medidas a tiempo antes de perder personal estratégico. | | | | | |

### Sección C: Motor Causal Contrafactual (*What-If Simulator*) (Likert 1-5)
| # | Afirmación | 1 | 2 | 3 | 4 | 5 |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| 9 | El simulador de intervenciones causales (*Do-Calculus*) permite evaluar escenarios hipotéticos (ej. incremento salarial 10%, teletrabajo 2 días/sem) de forma clara. | | | | | |
| 10 | El cálculo del Efecto Promedio del Tratamiento (ATE) y la proyección del ROI Neto en dólares facilitan la justificación presupuestaria ante Gerencia. | | | | | |
| 11 | El control de sesgos de confusión mediante Propensity Score Matching (PSM) aporta objetividad frente al juicio puramente subjetivo. | | | | | |

### Sección D: Optimización Multiobjetivo MORL y Frontera de Pareto (Likert 1-5)
| # | Afirmación | 1 | 2 | 3 | 4 | 5 |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| 12 | La Frontera Eficiente de Pareto permite visualizar claramente el compromiso (*trade-off*) entre inversión financiera ($) y porcentaje de retención alcanzado. | | | | | |
| 13 | Las recomendaciones de políticas de retención no dominadas facilitan la selección de la mejor estrategia según el presupuesto disponible. | | | | | |

### Sección E: Seguridad, Privacidad Federada y Cumplimiento Normativo (Likert 1-5)
| # | Afirmación | 1 | 2 | 3 | 4 | 5 |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| 14 | El cifrado AES-256-GCM de salarios, IBAN y coordenadas GPS ofrece garantías suficientes para la protección de datos (LOPDP / GDPR). | | | | | |
| 15 | La posibilidad de participar en Aprendizaje Federado (FedAvg + DP-SGD) sabiendo que los datos salariales no salen de la empresa ni se revelan genera confianza. | | | | | |
| 16 | La generación automática de actas de finiquito y liquidaciones conforme al Código de Trabajo del Ecuador reduce el riesgo de litigios laborales. | | | | | |

### Sección F: Medición de Impacto y Feedback Directo
| # | Pregunta | Tipo de Respuesta |
|:---:|:---|:---:|
| 17 | ¿En qué porcentaje estima que el sistema reduce el tiempo dedicado a tareas administrativas de RRHH y nómina? | Selección: `< 20%` / `20-40%` / `41-60%` / `> 60%` |
| 18 | ¿Cuál de las siguientes innovaciones considera de mayor valor para su organización? (Seleccione hasta 2) | [ ] Scoring 5D Unificado<br>[ ] Marcación Geoespacial y WebAuthn<br>[ ] Simulador Causal de ROI<br>[ ] Optimización Presupuestaria Pareto MORL<br>[ ] Finiquitos y Nómina Automatizada Ecuatoriana |
| 19 | Comentarios o sugerencias para optimizar la plataforma: | Texto libre |

---

## Formulario 3 — EVALUACIÓN DE EXPERTOS
**"Validación Metodológica y Científica de la Cuatrilogía de Motores de IA"**

* **Destinatarios:** Docentes universitarios, investigadores en IA / Data Science, ingenieros de software senior, expertos en gestión humana y jurados de evaluación de proyectos/revistas indexadas.  
* **Objetivo:** Evaluar la validez teórica, corrección algorítmica, novedad en la ingeniería y rigor científico del marco propuesto.  
* **Tiempo estimado:** 20-25 minutos.

### Sección A: Datos de Identificación del Experto
1. **Grado académico máximo:** `Licenciatura / Ingeniería` / `Maestría / MSc` / `Doctorado / PhD`
2. **Área principal de especialización:**  
   [ ] Inteligencia Artificial / Machine Learning / Data Science  
   [ ] Ingeniería de Software / Arquitecturas SaaS  
   [ ] Estadística / Econometría / Modelado Estocástico  
   [ ] Gestión del Talento Humano / Desarrollo Organizacional
3. **Años de experiencia en docencia, investigación o industria:** `< 5 años` / `5 - 10 años` / `11 - 20 años` / `> 20 años`
4. **Producción científica activa:** ¿Ha publicado artículos en revistas indexadas (Scopus / Web of Science / IEEE)? `Sí` / `No`

### Sección B: Evaluación de Validez Científica por Motor de IA (Escala 1=Completamente Inválido, 5=Completamente Válido)

#### 1. Motor RSI (Automejora Recursiva)
| # | Criterio Metodológico | 1 | 2 | 3 | 4 | 5 |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| 5 | El uso del modelo proporcional de riesgos de Weibull para modelar el tiempo hasta el abandono laboral es teóricamente adecuado. | | | | | |
| 6 | La minimización estocástica de Brier Score y LogLoss mediante SGD para auto-calibrar $(\vec{\beta}, k, \lambda)$ ante eventos auditados (`rsiPredictionAudit`) es rigurosa. | | | | | |

#### 2. Motor Causal AI (Inferencia Contrafactual)
| # | Criterio Metodológico | 1 | 2 | 3 | 4 | 5 |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| 7 | La aplicación del *Causal Do-Calculus* de Judea Pearl con Propensity Score Matching (PSM) e Inverse Probability Weighting (IPW) para aislar sesgos de confusión es metodológicamente sólida. | | | | | |
| 8 | La estimación del Efecto Promedio del Tratamiento (ATE) y la proyección del ROI financiero neto ofrecen un sustento econométrico apropiado para decisiones gerenciales. | | | | | |

#### 3. Motor Aprendizaje Federado con Privacidad Diferencial (FedAvg + DP-SGD)
| # | Criterio Metodológico | 1 | 2 | 3 | 4 | 5 |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| 9 | El algoritmo Weighted FedAvg combinado con recorte de gradientes en norma $L_2$ ($C=1.0$) e inyección de ruido Gaussiano satisface las garantías matemáticamente rigurosas de Privacidad Diferencial $(\epsilon, \delta)$. | | | | | |
| 10 | El mecanismo de control de presupuesto de privacidad por tenant (`TenantPrivacyBudget`) previene ataques de reconstrucción en arquitecturas multi-tenant compartidas. | | | | | |

#### 4. Motor MORL (Aprendizaje por Refuerzo Multiobjetivo)
| # | Criterio Metodológico | 1 | 2 | 3 | 4 | 5 |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| 11 | La formulación del problema de retención vs. costo como un Proceso de Decisión de Markov Vectorial (Vectorial MDP) y la resolución vía Vector Q-Learning es científicamente acertada. | | | | | |
| 12 | La construcción de la Frontera de Eficiencia de Pareto mediante escalarización de preferencias $w_1 R_1 + w_2 R_2$ ofrece una solución óptima en el sentido de Pareto. | | | | | |

### Sección C: Evaluación de Ingeniería de Software y Pertinencia para PyMEs (Likert 1-5)
| # | Afirmación | 1 | 2 | 3 | 4 | 5 |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| 13 | La arquitectura multi-tenant con aislamiento dinámico vía `AsyncLocalStorage` y Prisma ORM garantiza la segregación lógica incontaminable de datos. | | | | | |
| 14 | La integración armoniosa de los 4 motores de IA en un pipeline SaaS unificado constituye un aporte de ingeniería de software novedoso e inédito para PyMEs. | | | | | |
| 15 | El nivel de complejidad computacional y matemática está equilibrado para ejecutarse eficientemente en entornos de producción web. | | | | | |

### Sección D: Evaluación Cualitativa Abierta
| # | Pregunta | Respuesta Abierta |
|:---:|:---|:---|
| 16 | **Fortalezas Científicas:** ¿Cuáles son los principales aportes teóricos o prácticos que destaca de este marco de IA? | |
| 17 | **Oportunidades de Mejora / Trabajo Futuro:** ¿Qué aspectos o variables adicionales recomendaría explorar en futuras versiones? | |
| 18 | **Dictamen de Publicabilidad:** De acuerdo a su criterio técnico, ¿este trabajo reúne los requisitos de novedad y rigor para ser publicado en una revista indexada o presentado en un congreso internacional? | [ ] Sí, sin modificaciones<br>[ ] Sí, con revisiones menores<br>[ ] Requiere modificaciones sustanciales<br>[ ] No recomendado |
