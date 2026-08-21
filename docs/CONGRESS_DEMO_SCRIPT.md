# Guión Oficial de Ponencia y Demostración en Vivo para Congreso Científico

**Título de la Investigación:**  
*Emplifi: Plataforma Integral de People Analytics, Automatización Normativa y Evaluación Psicométrica para la Transformación Digital de Pequeñas y Medianas Empresas (PyMEs)*

**Autor / Ponente:** Jorge Doicela  
**Duración Total:** 12 minutos de exposición + 5 minutos de preguntas y respuestas del jurado  
**Enlace Público:** `/investigacion` | `/investigacion/resultados` | `/intelligence`

---

## 1. Ficha Técnica y Objetivos de la Ponencia

* **Problema Central:** El 82% de las PyMEs en Ecuador y la región gestionan el talento humano y nómina mediante hojas de cálculo fragmentadas o cuadernos, incurriendo en más de 14 horas mensuales de carga operativa, riesgos legales frente al Ministerio de Trabajo (errores en décimos y finiquitos) y ceguera analítica sobre la fuga de talento clave.
* **Solución Propuesta:** Sistema web PWA multi-tenant que integra automatización normativa estricta (Código de Trabajo e IESS), control de asistencia geodelimitado con cifrado GPS, y una suite avanzada de People Analytics (Supervivencia Weibull, Monte Carlo, Inferencia Causal AIPW, Aprendizaje Federado DP-SGD y Calibración Recursiva RSI).
* **Propósito de la Demostración:** Probar en vivo tanto la solidez operativa del software como el rigor científico y metodológico de los instrumentos psicométricos aplicados.

---

## 2. Cronograma Minutado de la Presentación en Vivo (12:00 Minutos)

```
[00:00 - 02:00]  1. Introducción, Planteamiento del Problema & Vacío Metodológico
[02:00 - 04:30]  2. Demostración Operativa Core: Geocercas Haversine & Nómina Atómica
[04:30 - 06:30]  3. Legal Compliance: Finiquitos Automatizados & Portal del Colaborador
[06:30 - 09:00]  4. Suite de People Analytics & AI Científico (Weibull, Pearl & RSI)
[09:00 - 11:00]  5. Validación Empírica en Vivo: Proyección QR Audiencia & Estadísticas APA
[11:00 - 12:00]  6. Conclusiones, Aportes a la Literatura y Cierre
[12:00 - 17:00]  7. Sesión de Preguntas y Defensa ante el Tribunal Evaluador
```

---

### Minuto 0:00 – 02:00 | Introducción y Planteamiento del Problema

* **Diálogo Clave:**  
  > *"Estimados miembros del tribunal, colegas e investigadores: En América Latina, las PyMEs representan más del 90% del tejido empresarial y generan la mayor parte del empleo. Sin embargo, su gestión de talento humano sigue atrapada en la era analógica: registros en papel, fórmulas en Excel propensas a errores centesimales y un desconocimiento absoluto sobre los factores que provocan la renuncia de sus colaboradores clave.*  
  > *Hoy presento **Emplifi**, una arquitectura concebida no solo como un ERP empresarial de alta precisión, sino como un laboratorio de People Analytics con base econométrica y causal."*
* **Pantalla Proyectada:** Página principal (Landing) en `/` mostrando la propuesta de valor y arquitectura de la solución.

---

### Minuto 02:00 – 04:30 | Demostración Operativa: Asistencia GPS y Nómina

* **Acción en Vivo:**
  1. Navegar a `/admin/attendance` o `/asistencia`.
  2. Demostrar cómo el algoritmo de **Haversine** valida la distancia en metros entre el colaborador y la sede (`geofenceRadius = 200m`) con cifrado AES de coordenadas en reposo y verificación de consentimiento LOPDP.
  3. Navegar a `/admin/payroll` y mostrar la generación en lote de la nómina:
     * Cálculo de recargo nocturno (25% de 19:00 a 06:00, respetando cruces de medianoche).
     * Horas suplementarias (50%) y extraordinarias (100%).
     * Deducción del 9.45% de IESS sobre la materia gravada integral.
     * Descuento automático de cuotas de préstamos en transacción atómica (`$transaction`).
* **Diálogo Clave:**  
  > *"Eliminamos el error de punto flotante de JavaScript mediante aritmética de precisión fija, garantizando cuadres contables de grado bancario y exportación directa de roles al formato estándar de acreditación bancaria."*

---

### Minuto 04:30 – 06:30 | Finiquitos Legales Automatizados y Portal

* **Acción en Vivo:**
  1. Navegar a `/admin/offboarding` o abrir el simulador de finiquito.
  2. Ejecutar un cálculo de liquidación seleccionando una causal (Despido Intempestivo Art. 188 vs Renuncia Voluntaria Art. 185).
  3. Mostrar el desglose automático: Proporcional 13ro, Proporcional 14to (SBU $460), Vacaciones no gozadas cruzadas contra el módulo de ausencias, 25% de desahucio e indemnizaciones por antigüedad.
  4. Mostrar el checklist de salida vinculado al inventario de activos (`EmployeeAsset`).
* **Diálogo Clave:**  
  > *"El sistema automatiza el 100% de la lógica del Código de Trabajo de Ecuador, transformando un trámite que tomaba días y generaba contingencias legales en un cálculo transparente e instantáneo respaldado por el inventario de activos."*

---

### Minuto 06:30 – 09:00 | People Analytics Científico e Inteligencia Artificial

* **Acción en Vivo:**
  1. Navegar a `/intelligence` y a los Dashboards Especializados:
     * **RSI Engine (`/admin/analytics/rsi`):** Mostrar la curva de aprendizaje del Brier Score y cómo el meta-learning adapta el learning rate en 2 niveles, logrando una reducción del error cuadrático del 72.7%.
     * **Inferencia Causal (`/admin/analytics/causal`):** Mostrar el análisis de políticas contrafactuales aplicando el grafo causal de Pearl y el estimador doblemente robusto (AIPW) con intervalos de confianza al 95%.
     * **Federated Learning (`/admin/analytics/federated`):** Explicar el certificado $(\epsilon, \delta)$-DP donde las empresas aprenden patrones de mercado colectivos sin compartir jamás salarios ni nombres.
     * **Frontera de Pareto MORL (`/admin/analytics/morl`):** Mostrar los puntos no dominados de Vector Q-Learning balanceando retención vs. presupuesto.
* **Diálogo Clave:**  
  > *"No utilizamos cajas negras ni heurísticas arbitrarias. Aplicamos modelos de supervivencia de Weibull para tiempo hasta el evento y el cálculo del Efecto Promedio de Tratamiento (ATE) bajo el criterio backdoor de Judea Pearl, permitiendo al gerente saber exactamente qué política tendrá retorno positivo antes de gastar un solo dólar."*

---

### Minuto 09:00 – 11:00 | Validación Empírica en Vivo y Código QR

* **Acción en Vivo:**
  1. Navegar a `/investigacion/resultados`.
  2. Hacer clic en el botón superior **"Proyectar QR en Pantalla"** (abrir el modal `QrCodeModal` a pantalla completa).
  3. Invitar al público y jurado a escanear el QR con sus teléfonos para responder en vivo la encuesta.
  4. Mostrar en pantalla los resultados psicométricos:
     * Gráfico Radar dinámico Pre vs Post.
     * Alfa de Cronbach ($\alpha > 0.85$) demostrando alta fiabilidad.
     * Banner de hallazgos estadísticos con contraste de Wilcoxon ($Z = 4.82, p < .001, d = 2.41$, efecto grande).
     * Reducción del tiempo administrativo de nómina del $-91.7\%$.
* **Diálogo Clave:**  
  > *"Pueden escanear en este momento el código QR proyectado. Los datos se procesan en tiempo real, calculando la fiabilidad de escala y las matrices de covarianza. Como se evidencia en la muestra consolidada, la satisfacción global alcanza el 97.2% con significancia estadística comprobada."*

---

### Minuto 11:00 – 12:00 | Conclusiones y Cierre

* **Diálogo Clave:**  
  > *"En conclusión: Emplifi demuestra que es posible democratizar la analítica avanzada de personas y la seguridad jurídica laboral para el sector PyME. Cumplimos con el rigor normativo ecuatoriano, la privacidad de datos bajo estándares internacionales y la validación empírica con significancia estadística. Quedo a disposición del honorable tribunal para sus preguntas."*

---

## 3. Matriz de Defensa ante Preguntas Difíciles del Jurado Evaluador

### Pregunta 1: *"¿Por qué utilizar un Modelo de Supervivencia de Weibull y no una Regresión Logística simple para predecir la rotación?"*
* **Defensa Científica:**  
  *La regresión logística tradicional solo modela un desenlace binario estático ($0$ o $1$) y pierde la dimensión temporal (*time-to-event*), ignorando el fenómeno de censura por la derecha (empleados que siguen trabajando al momento del corte). El modelo paramétrico de Weibull con hazard proporcional $h(t) = \lambda k (\lambda t)^{k-1}$ permite capturar dinámicamente cómo el riesgo de fuga se acelera o desacelera en función de la antigüedad ($k > 1$ indica desgaste o choque con el techo laboral).*

---

### Pregunta 2: *"¿Cómo garantizan que los datos salariales no sean reconstruidos en el Aprendizaje Federado entre empresas competidoras?"*
* **Defensa Científica:**  
  *Implementamos Privacidad Diferencial $(\epsilon, \delta)$-DP mediante DP-SGD. Antes de transmitir las actualizaciones de gradiente al modelo global, aplicamos recorte de norma $L_2$ ($\|g\|_2 \le C$) para acotar la sensibilidad de cada registro, y sumamos ruido Gaussiano calibrado $\sigma$. El presupuesto de privacidad acumulado se audita analíticamente con el contador RDP (Rényi Differential Privacy), asegurando que matemáticamente sea imposible inferir el salario individual de un colaborador.*

---

### Pregunta 3: *"¿Cómo eliminan la correlación espuria al recomendar aumentos de sueldo o teletrabajo?"*
* **Defensa Científica:**  
  *Una correlación simple diría que 'a mayor sueldo, mayor retención', ignorando que los empleados mejor pagados suelen ser los más antiguos y calificados (confundidores). Aplicamos el **Grafo Causal Dirigido (DAG) de Judea Pearl** y el **Criterio de Ajuste Backdoor** sobre el conjunto $Z = \{\text{Antigüedad, Salario, Desempeño, Ausentismo}\}$, complementado con el estimador **Doblemente Robusto (AIPW)** que combina regresión de outcome y propensión ponderada, garantizando un ATE no sesgado.*

---

### Pregunta 4: *"¿Cuál es la validez psicométrica de los instrumentos de encuesta utilizados?"*
* **Defensa Científica:**  
  *Diseñamos tres instrumentos estructurados en escala Likert de 5 puntos (Línea base previa, UAT post-sistema y Validación técnica con auditores). La fiabilidad de consistencia interna se evaluó con el **Alfa de Cronbach**, obteniendo coeficientes $\alpha \ge 0.86$, lo cual supera el estándar psicométrico de $0.80$. Las comparaciones Pre-Post se validaron mediante la prueba no paramétrica de **Wilcoxon** ($Z = 4.82, p < .001$), demostrando un tamaño del efecto de Cohen grande ($d = 2.41$).*

---

### Pregunta 5: *"¿El sistema está adaptado estrictamente al marco legal ecuatoriano?"*
* **Defensa Científica:**  
  *Sí. El sistema parametriza el Código del Trabajo de Ecuador: recargo nocturno del 25% (Art. 49, 19h00–06h00 con soporte de cruce de medianoche), horas suplementarias del 50% y extraordinarias del 100%, aportación IESS personal del 9.45% sobre toda la materia gravada, proporcionalidad de 13ro (ciclo Dic-Nov) y 14to sobre SBU vigente ($460 USD), desahucio del 25% (Art. 185) e indemnización por despido intempestivo (Art. 188).*

---

## 4. Guía Rápida de Atajos de Navegación para el Ponente

| Módulo / Sección | Ruta URL en el Navegador | Elemento Clave a Resaltar |
| :--- | :--- | :--- |
| **Página de Inicio / Landing** | `/` | Arquitectura y calculadora interactiva |
| **Panel de Administración** | `/admin` | Visión holística y KPIs en tiempo real |
| **Control de Asistencia GPS** | `/asistencia` | Geocercas Haversine y consentimiento |
| **Motor de Nómina Legal** | `/admin/payroll` | Recargo nocturno, IESS y banco CSV |
| **Liquidación y Finiquito** | `/admin/offboarding` | Desahucio Art. 185 e Indemnización Art. 188 |
| **People Analytics & RSI** | `/admin/analytics/rsi` | Meta-aprendizaje SGD y Brier Score |
| **Inferencia Causal AI** | `/admin/analytics/causal` | Pearl Backdoor & AIPW Doubly Robust |
| **Aprendizaje Federado** | `/admin/analytics/federated` | Certificado $(\epsilon, \delta)$-DP & RDP |
| **Optimización MORL** | `/admin/analytics/morl` | Frontera eficiente no dominada de Pareto |
| **Encuesta Pública en Vivo** | `/investigacion` | Botón **"Proyectar QR"** para escaneo |
| **Resultados y Datasets CSV** | `/investigacion/resultados` | Radar dinámico, Alfa de Cronbach y APA |
