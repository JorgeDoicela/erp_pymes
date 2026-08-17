# Instrumentos de Investigación Científica — Proyecto Emplifi

## Protocolo de Evaluación y Validación del Sistema SaaS de Gestión del Talento Humano e Inferencia Causal para PyMEs

---

### Presentación y Metodología

El presente documento reúne los tres instrumentos de recolección de datos diseñados para la evaluación empírica y validación científica de la plataforma **Emplifi** (Sistema de Gestión de Recursos Humanos, Inferencia Causal, Automejora Recursiva RSI y Privacidad Diferencial en PyMEs).

Los cuestionarios emplean una escala cuali-cuantitativa ordinal de tipo Likert de 5 puntos:

- **1:** Muy en desacuerdo / Nunca
- **2:** En desacuerdo / Rara vez
- **3:** Neutral / Indiferente
- **4:** De acuerdo / Frecuentemente
- **5:** Muy de acuerdo / Siempre

---

## Módulo General: Caracterización Demográfica y Organizacional

*(Este módulo se aplica como sección inicial en todos los instrumentos)*

### 1. Datos del Encuestado y la Organización

1. **Cargo u Ocupación Principal:**
   - [ ] Gerente General / Dueño
   - [ ] Director / Jefe de Recursos Humanos
   - [ ] Contador / Administrador Financiero
   - [ ] Analista de Personal / Operaciones
   - [ ] Docente / Investigador Académico
   - [ ] Otro Profesional

2. **Tamaño de la Empresa:**
   - [ ] Microempresa (1 - 9 empleados)
   - [ ] Pequeña empresa (10 - 49 empleados)
   - [ ] Mediana empresa (50 - 199 empleados)
   - [ ] Empresa grande (> 200 empleados)

3. **Sector Económico:**
   - [ ] Tecnología / Servicios Profesionales
   - [ ] Comercio / Distribución
   - [ ] Manufactura / Producción
   - [ ] Salud / Educación
   - [ ] Servicios Financieros / Banca
   - [ ] Otro Sector

4. **Años de Experiencia Profesional:**
   - [ ] < 2 años
   - [ ] 2 - 5 años
   - [ ] 6 - 10 años
   - [ ] > 10 años

5. **Grado Académico Máximo (Exclusivo Evaluación de Expertos):**
   - [ ] Licenciatura / Ingeniería
   - [ ] Maestría / MSc
   - [ ] Doctorado / PhD

---

## Formulario 1: Diagnóstico Pre-Sistema (Línea Base)

**Objetivo:** Establecer la línea base operacional, deficiencias en marcación, opacidad salarial y costos de rotación en PyMEs que utilizan métodos tradicionales (Excel, papel, supervisión intuitiva).

### Reactivos de Evaluación (Escala Likert 1 a 5)

| # | Afirmación / Reactivo | 1 | 2 | 3 | 4 | 5 |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **F1.1** | El registro de asistencia y tardanzas en su empresa se realiza manualmente o en listas de papel/Excel. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F1.2** | Se han registrado casos de marcación por terceros (*buddy punching*) o falsificación de presencialidad. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F1.3** | Es difícil verificar el cumplimiento geográfico del personal itinerante, de campo o teletrabajo. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F1.4** | La consolidación de horas extra (50%), extraordinarias (100%) y recargos nocturnos insume horas de trabajo manual al cierre de mes. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F1.5** | La información de contratos, expedientes y asistencias está dispersa en archivos independientes sin centralización. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F1.6** | Las evaluaciones de desempeño se basan en la percepción intuitiva del evaluador sin métricas cuantitativas unificadas. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F1.7** | Se carece de un índice sintético que consolide Desempeño, Asistencia, Retención y Objetivos SMART. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F1.8** | Es difícil anticipar con precisión la renuncia inesperada de colaboradores clave antes de su salida efectiva. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F1.9** | Los cálculos de liquidación laboral (desahucio Art. 185, despido intempestivo Art. 188, 13ro y 14to sueldo) son propensos a errores manuales. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F1.10** | Los datos salariales y cuentas bancarias se almacenan sin encriptación de grado bancario en la red local. | [ ] | [ ] | [ ] | [ ] | [ ] |

### Sección Cualitativa Opcional

**Observaciones o Problemáticas Adicionales:**
```
____________________________________________________________________________________________________
____________________________________________________________________________________________________
____________________________________________________________________________________________________
```

---

## Formulario 2: Evaluación Post-Sistema (UAT, Usabilidad e Inteligencia Causal)

**Objetivo:** Evaluar la usabilidad del sistema Emplifi, la precisión del Scoring Multidimensional 5D, la confianza en el simulador contrafactual Causal ATE y el cumplimiento del Código del Trabajo de Ecuador.

### Reactivos de Evaluación (Escala Likert 1 a 5)

| # | Afirmación / Reactivo | 1 | 2 | 3 | 4 | 5 |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **F2.1** | La navegación entre los módulos de la plataforma Emplifi es estructurada, fluida e intuitiva. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F2.2** | El Scoring Multidimensional 5D ofrece una visión objetiva del desempeño y potencial del colaborador. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F2.3** | El fichaje con geocerca Haversine y biometría Passkey (FIDO2/WebAuthn) es rápido y elimina marcaciones fraudulentas. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F2.4** | La curva de supervivencia de Weibull ayuda a identificar horizontes temporales de riesgo de deserción en el personal. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F2.5** | El motor de automejora recursiva (RSI Engine) genera confianza al calibrar el error predictivo automáticamente. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F2.6** | El simulador Causal (*Do-Calculus*) permite proyectar el impacto de aumentos salariales o teletrabajo mediante escenarios contrafactuales. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F2.7** | El cálculo del Efecto Promedio del Tratamiento (ATE) y el ROI financiero en USD facilita justificar presupuesto ante la Gerencia. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F2.8** | La Frontera de Pareto (MORL) permite balancear eficazmente el costo del presupuesto vs la tasa de retención lograda. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F2.9** | El cifrado AES-256-GCM de datos sensibles y salarios satisface los requerimientos de privacidad de la LOPDP. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F2.10** | La generación automática de finiquitos conforme al Código del Trabajo de Ecuador elimina errores en las liquidaciones. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F2.11** | Recomendaría Emplifi para la gestión integral del talento humano y nómina en empresas de su sector. | [ ] | [ ] | [ ] | [ ] | [ ] |

### Sección Cualitativa Opcional

**Comentarios de Experiencia de Usuario e Impacto Operativo:**
```
____________________________________________________________________________________________________
____________________________________________________________________________________________________
____________________________________________________________________________________________________
```

---

## Formulario 3: Evaluación de Expertos e Investigadores Académicos

**Objetivo:** Someter a juicio de expertos la validez teórica, la precisión algorítmica y el rigor científico de la cuatrilogía de motores de IA (RSI, Causal Inference, MORL Pareto, Federated DP-SGD).

### Reactivos de Evaluación (Escala Likert 1 a 5)

| # | Afirmación / Reactivo | 1 | 2 | 3 | 4 | 5 |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **F3.1** | El modelo proporcional de Weibull con covariables es teóricamente adecuado para modelar la tasa de riesgo (*hazard rate*) de deserción. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F3.2** | La implementación de *Do-Calculus* e *Inverse Probability Weighting* (IPW) proporciona estimaciones no sesgadas del ATE. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F3.3** | El recorte de gradientes y la adición de ruido Gaussiano (DP-SGD) garantizan la privacidad diferencial formal ($\varepsilon, \delta$) entre tenants. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F3.4** | La aproximación de la Frontera de Pareto mediante Aprendizaje por Refuerzo Multiobjetivo (MORL) resuelve el trade-off costo-retención. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F3.5** | La calibración recursiva por descenso de gradiente disminuye la pérdida Brier (*Brier Score*) sobre eventos reales de rotación. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F3.6** | La combinación de Haversine truncado y biometría FIDO2 ofrece un esquema robusto de no-repudio de presencia física/remota. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F3.7** | La parametrización de las leyes laborales del Ecuador en los motores de liquidación es precisa y rigurosa. | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F3.8** | Este marco integrado posee un valor científico e innovador apto para publicación en revistas internacionales indexadas (Scopus / Web of Science). | [ ] | [ ] | [ ] | [ ] | [ ] |

### Sección Cualitativa Opcional

**Dictamen Científico del Evaluador / Sugerencias de Arbitraje:**
```
____________________________________________________________________________________________________
____________________________________________________________________________________________________
____________________________________________________________________________________________________
```

---

*Nota de Confidencialidad: Los instrumentos presentados forman parte del protocolo de investigación del proyecto Emplifi. El tratamiento de la información se rige por principios de anonimización estricta y uso académico exclusivo.*
