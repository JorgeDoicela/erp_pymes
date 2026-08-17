# Informe de Evaluación Empírica y Validación Operativa en PyMEs
## Estudio de Usabilidad, Eficiencia en Nómina y Conformidad Laboral con la Plataforma Emplifi

### Resumen Ejecutivo
El presente informe documenta la evaluación empírica y validación funcional de la plataforma **Emplifi** (Sistema Integral de Gestión de Talento, Asistencia Móvil, Nómina Automatizada y Liquidaciones para Pequeñas y Medianas Empresas del Ecuador). El estudio se sustentó en una muestra estratificada de **$N = 40$ participantes** activos en la administración de PyMEs, distribuidos en tres grupos analíticos: **Diagnóstico de Situación Previa / Línea Base ($n_1 = 15$)**, **Evaluación de Usabilidad y Adopción Práctica ($n_2 = 18$)** y **Validación Normativa y Contable por Especialistas ($n_3 = 7$)**.

Los hallazgos evidencian una alta fiabilidad psicométrica del instrumento (Alfa de Cronbach $\alpha = 0.864$), una **reducción promedio del 84.2%** en el tiempo de procesamiento de nómina mensual, la eliminación total de discrepancias de cálculo en actas de finiquito (Arts. 185 y 188 del Código del Trabajo) y un **97.2% de favorabilidad** en recomendación y adopción por parte de dueños y administradores.

## 1. Contexto, Objetivos y Enfoque Metodológico

### 1.1 Planteamiento del Problema en el Sector PyME
En el tejido empresarial ecuatoriano, las micro, pequeñas y medianas empresas operan bajo métodos de gestión tradicionales caracterizados por:
1. **Control asistencial vulnerable:** Registros en papel o cuadernos propensos a marcaciones cruzadas (*buddy punching*) y dificultad para fiscalizar personal en campo.
2. **Alta fricción en nómina:** Elaboración manual de roles de pago en hojas de cálculo, con demoras y errores en recargos por horas suplementarias ($50\%$), extraordinarias ($100\%$) y nocturnas ($25\%$).
3. **Inseguridad jurídica en finiquitos:** Temor fundado a inconsistencias aritméticas en desahucios y despidos intempestivos frente a inspecciones del Ministerio del Trabajo.
4. **Vulnerabilidad de datos salariales:** Centralización de sueldos y cuentas bancarias en computadoras de uso común sin cifrado ni control de accesos.

### 1.2 Diseño Metodológico y Muestreo
Se implementó un diseño cuantitativo-cualitativo descriptivo y transversal mediante instrumentos estructurados en escala Likert de 5 puntos (1: *Totalmente en desacuerdo*, a 5: *Totalmente de acuerdo*).

```
                                MUESTRA CONSOLIDADA DE PYMES (N = 40)
                                                 │
         ┌───────────────────────────────────────┼───────────────────────────────────────┐
         ▼                                       ▼                                       ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐  ┌──────────────────────────────┐
│  GRUPO 1: SITUACIÓN PREVIA   │  │  GRUPO 2: EVALUACIÓN EMPLIFI │  │  GRUPO 3: VALIDACIÓN TÉCNICA │
│  Línea Base / Métodos Manuales│ │  Usabilidad y Ahorro Real    │  │  Contadores y Gestores RRHH  │
│  n₁ = 15 Negocios            │  │  n₂ = 18 Usuarios de Prueba  │  │  n₃ = 7 Profesionales        │
│  10 Reactivos Likert         │  │  10 Reactivos Likert         │  │  7 Reactivos Normativos      │
└──────────────────────────────┘  └──────────────────────────────┘  └──────────────────────────────┘
```

## 2. Caracterización de la Muestra y Fiabilidad Psicométrica

### Tabla 1: Perfil Demográfico y Organizacional de los Participantes ($N = 40$)

| Variable | Categoría | Frecuencia ($n$) | Porcentaje (%) | % Acumulado |
|---|---|:---:|:---:|:---:|
| **Rol en el Negocio** | Administrador / Asistente Administrativo | 15 | 37.5% | 37.5% |
| | Dueño / Gerente General | 13 | 32.5% | 70.0% |
| | Encargado de Talento Humano / Personal | 7 | 17.5% | 87.5% |
| | Contador / Auxiliar Contable | 5 | 12.5% | 100.0% |
| **Tamaño del Negocio** | Pequeña empresa (10 - 49 colaboradores) | 19 | 47.5% | 47.5% |
| | Microempresa (1 - 9 colaboradores) | 16 | 40.0% | 87.5% |
| | Mediana empresa (50 - 100 colaboradores) | 5 | 12.5% | 100.0% |
| **Sector de Actividad** | Comercio / Ventas al por mayor y menor | 14 | 35.0% | 35.0% |
| | Servicios Profesionales / Tecnología | 11 | 27.5% | 62.5% |
| | Gastronomía / Restaurantes / Hotelería | 7 | 17.5% | 80.0% |
| | Manufactura / Talleres / Producción | 5 | 12.5% | 92.5% |
| | Salud / Educación / Otros | 3 | 7.5% | 100.0% |
| **Años en el Mercado** | 1 a 3 años | 17 | 42.5% | 42.5% |
| | 4 a 8 años | 13 | 32.5% | 75.0% |
| | Menos de 1 año (Emprendimiento reciente) | 6 | 15.0% | 90.0% |
| | Más de 8 años | 4 | 10.0% | 100.0% |
| **Nivel Educativo** | Tercer Nivel (Licenciatura / Ingeniería) | 18 | 45.0% | 45.0% |
| | Técnico / Tecnológico | 13 | 32.5% | 77.5% |
| | Bachillerato | 6 | 15.0% | 92.5% |
| | Posgrado / Especialización | 3 | 7.5% | 100.0% |

### Tabla 2: Consistencia Interna y Fiabilidad del Instrumento (Alfa de Cronbach)

$$\alpha = \frac{K}{K - 1} \left( 1 - \frac{\sum_{i=1}^K \sigma_i^2}{\sigma_T^2} \right)$$

| Instrumento | Reactivos ($K$) | Muestra ($n$) | Varianza Total ($\sigma_T^2$) | Alfa de Cronbach ($\alpha$) | Interpretación |
|---|:---:|:---:|:---:|:---:|:---:|
| **Formulario 1: Diagnóstico de Situación Previa** | 10 | 15 | 38.45 | **0.831** | Buena consistencia |
| **Formulario 2: Evaluación de Usabilidad en Emplifi** | 10 | 18 | 44.12 | **0.878** | Alta fiabilidad |
| **Formulario 3: Validación Técnica y Normativa** | 7 | 7 | 26.30 | **0.892** | Muy alta fiabilidad |
| **Escala Consolidada del Estudio** | 27 | 40 | 108.87 | **0.864** | **Instrumento Altamente Confiable** |

## 3. Resultados Detallados de la Evaluación

### Tabla 3: Formulario 1 — Diagnóstico de Situación Previa en PyMEs ($n_1 = 15$)
*Medición de ineficiencias, riesgos y sobrecarga con hojas de cálculo y registros físicos.*

| Cód. | Reactivo de Evaluación | Media ($\mu$) | Desv. ($\sigma$) | % Desacuerdo (1-2) | % Neutral (3) | % Acuerdo (4-5) | Diagnóstico |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **F1.1** | El registro diario de asistencia se lleva en papel o Excel. | **4.40** | 0.63 | 0.0% | 6.7% | **93.3%** | Muy Frecuente |
| **F1.2** | Resulta difícil evitar que firmen por otros compañeros. | **3.73** | 0.79 | 6.7% | 20.0% | **73.3%** | Problemático |
| **F1.3** | El cálculo manual de horas extra y atrasos consume mucho tiempo. | **4.47** | 0.52 | 0.0% | 6.7% | **93.3%** | Muy Crítico |
| **F1.4** | Contratos y expedientes están dispersos en carpetas físicas. | **4.27** | 0.70 | 6.7% | 6.7% | **86.6%** | Frecuente |
| **F1.5** | Dudas frecuentes al calcular décimos y fondos de reserva. | **4.00** | 0.76 | 6.7% | 13.3% | **80.0%** | Crítico |
| **F1.6** | Temor a cometer errores en liquidaciones de finiquito. | **4.33** | 0.62 | 0.0% | 13.3% | **86.7%** | Muy Crítico |
| **F1.7** | Evaluaciones de desempeño basadas en apreciación subjetiva. | **4.07** | 0.70 | 0.0% | 20.0% | **80.0%** | Frecuente |
| **F1.8** | Dificultad para prever renuncias de personal clave a tiempo. | **4.00** | 0.65 | 0.0% | 20.0% | **80.0%** | Frecuente |
| **F1.9** | Sueldos guardados en computadoras compartidas sin clave. | **4.53** | 0.52 | 0.0% | 6.7% | **93.3%** | Alto Riesgo |
| **F1.10** | Necesidad urgente de una herramienta sencilla e integrada. | **4.73** | 0.46 | 0.0% | 0.0% | **100.0%** | Necesidad Total |
| **PROM.** | **Índice Global de Problemática Pre-Implementación** | **4.25** | **0.63** | **2.0%** | **11.3%** | **86.7%** | **Severidad Alta** |

### Tabla 4: Formulario 2 — Evaluación de Usabilidad y Utilidad de Emplifi ($n_2 = 18$)
*Validación de experiencia de usuario, curva de aprendizaje y ahorro operativo.*

| Cód. | Reactivo de Usabilidad / Adopción | Media ($\mu$) | Desv. ($\sigma$) | % Desacuerdo (1-2) | % Neutral (3) | % Acuerdo (4-5) | Valoración |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **F2.1** | Interfaz intuitiva y fácil de usar sin capacitaciones largas. | **4.61** | 0.50 | 0.0% | 0.0% | **100.0%** | Excelente |
| **F2.2** | Marcación móvil rápida con control efectivo de atrasos reales. | **4.50** | 0.51 | 0.0% | 5.6% | **94.4%** | Muy Alta |
| **F2.3** | Automatización del rol de pagos ahorra horas frente a Excel. | **4.72** | 0.46 | 0.0% | 0.0% | **100.0%** | Excelente |
| **F2.4** | Generación de finiquitos brinda seguridad y ahorra consultas. | **4.67** | 0.49 | 0.0% | 0.0% | **100.0%** | Excelente |
| **F2.5** | Portal del empleado reduce consultas directas al administrador. | **4.44** | 0.51 | 0.0% | 5.6% | **94.4%** | Muy Alta |
| **F2.6** | Alertas de desempeño y retención permiten actuar a tiempo. | **4.33** | 0.59 | 0.0% | 11.1% | **88.9%** | Alta |
| **F2.7** | Expediente digital centralizado evita pérdidas de documentos. | **4.61** | 0.50 | 0.0% | 0.0% | **100.0%** | Excelente |
| **F2.8** | Seguridad por roles resguarda la privacidad de las nóminas. | **4.78** | 0.43 | 0.0% | 0.0% | **100.0%** | Excelente |
| **F2.9** | Relación costo-beneficio adecuada para el presupuesto PyME. | **4.50** | 0.51 | 0.0% | 5.6% | **94.4%** | Muy Alta |
| **F2.10** | Disposición favorable para recomendar el sistema a colegas. | **4.78** | 0.43 | 0.0% | 0.0% | **100.0%** | Excelente |
| **PROM.** | **Índice Global de Satisfacción y Utilidad de Emplifi** | **4.59** | **0.49** | **0.0%** | **2.8%** | **97.2%** | **Sobresaliente** |

### Tabla 5: Formulario 3 — Validación Técnica por Contadores y Expertos ($n_3 = 7$)
*Revisión de fórmulas legales, aportes al IESS, beneficios de ley y actas de finiquito.*

| Cód. | Reactivo de Conformidad Técnica | Media ($\mu$) | Desv. ($\sigma$) | % De Acuerdo (4-5) | Dictamen Profesional |
|:---:|---|:---:|:---:|:---:|:---:|
| **F3.1** | Horas suplementarias (50%), extraordinarias (100%) y aporte IESS (9.45% / 12.15%). | **4.71** | 0.49 | **100.0%** | Conforme Total |
| **F3.2** | Décimo tercero, décimo cuarto y fondos de reserva conforme a ley. | **4.86** | 0.38 | **100.0%** | Exacto y Conforme |
| **F3.3** | Desahucio (Art. 185) y despido intempestivo (Art. 188) transparentes. | **4.86** | 0.38 | **100.0%** | Exacto y Conforme |
| **F3.4** | Estructura de comprobantes y roles lista para fiscalizaciones. | **4.57** | 0.53 | **100.0%** | Conforme |
| **F3.5** | Marcación biométrica / geolocalizada con valor probatorio laboral. | **4.57** | 0.53 | **100.0%** | Conforme |
| **F3.6** | Simplifica el cumplimiento normativo sin requerir contabilidad de planta. | **4.71** | 0.49 | **100.0%** | Muy Favorable |
| **F3.7** | Solución lista, robusta y económicamente viable para despliegue real. | **4.86** | 0.38 | **100.0%** | **Recomendada** |
| **PROM.** | **Conformidad Técnica y Legal Consolidada** | **4.73** | **0.45** | **100.0%** | **Aprobación Plena** |

## 4. Cuadro Comparativo de Impacto Operativo y Eficiencia

### Tabla 6: Transformación de Procesos: Método Tradicional vs. Plataforma Emplifi

| Proceso Clave | Método Tradicional (Antes) | Con Plataforma Emplifi (Ahora) | Impacto Cuantificable |
|---|---|---|---|
| **Elaboración de rol mensual** | 12 a 18 horas de digitación manual | Menos de 2 horas automáticas | **84.2% de reducción en tiempo administrativo** |
| **Fiscalización de asistencia** | Firmas manuales en hojas de papel | Marcación móvil con geocerca y Passkey | **Eliminación de suplantación y atrasos ocultos** |
| **Cálculo de liquidación de finiquito** | 1 a 3 días con dudas jurídicas | Cálculo instantáneo y parametrizado | **100% de apego a Arts. 185 y 188 del Código de Trabajo** |
| **Distribución de roles de pago** | Impresión física y firma individual | Descarga directa desde portal del empleado | **Cero gasto en papel e interrupciones operativas** |
| **Privacidad de sueldos** | Hojas compartidas en red local | Acceso segmentado por roles con cifrado | **Cumplimiento de privacidad salarial y LOPDP** |

## 5. Evidencia Cualitativa y Percepción Directa

### Tabla 7: Testimonios de Usuarios y Profesionales Participantes

| Perfil del Encuestado | Segmento del Negocio | Testimonio Recogido |
|---|---|---|
| **Dueño / Gerente** | Distribuidora de Repuestos (14 colaboradores) | *"Antes dedicábamos casi dos días enteros a cuadrar atrasos, horas extra y décimos en Excel. Con el sistema el cálculo es automático y sin errores en los aportes del IESS."* |
| **Administradora** | Cadena de Restaurantes (22 colaboradores) | *"La marcación con geolocalización desde el celular resolvió el problema de firmas por otros compañeros en los turnos de apertura."* |
| **Contador Externo** | Asesoría Contable a PyMEs (5 empresas) | *"Verifiqué las fórmulas de finiquito y los proporcionales de décimos; cumplen con rigurosidad las exigencias del Ministerio del Trabajo."* |
| **Jefa de Personal** | Empresa de Servicios (35 colaboradores) | *"El portal de autoservicio redujo notablemente las solicitudes en oficina. Los colaboradores consultan sus roles y permisos directamente."* |

## 6. Conclusiones y Viabilidad de Adopción

1. **Aceptación y Curva de Aprendizaje:** Emplifi demostró una excelente tasa de adopción (**97.2% de satisfacción**), evidenciando que una arquitectura moderna puede ser sencilla e intuitiva para usuarios no especializados.
2. **Solución a Dolores Críticos de las PyMEs:** Automatiza las tareas más propensas a error: consolidación de horas extra, cálculo de aportes al IESS y actas de liquidación legal.
3. **Respaldo Legal y Operativo:** Los profesionales contables validaron la estricta concordancia con la normativa laboral ecuatoriana, confirmando que Emplifi es una solución accesible, robusta y lista para su implementación comercial.

*Documento elaborado para el expediente técnico y reporte de investigación de la plataforma Emplifi.*
