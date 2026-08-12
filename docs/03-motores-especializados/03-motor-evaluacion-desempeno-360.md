# Motor de Evaluación de Desempeño 360° y Medición de Competencias

## 1. Arquitectura del Motor de Evaluaciones

El motor de evaluación recopila y consolida mediciones cualitativas y cuantitativas provenientes de múltiples perspectivas (autoevaluación, supervisor, pares y subalternos).

```
                      ┌──────────────────────────────┐
                      │ Plantilla de Evaluación 360° │
                      └──────────────┬───────────────┘
                                     │
       ┌───────────────────────┬─────┴─────────┬───────────────────────┐
       ▼                       ▼               ▼                       ▼
┌──────────────┐        ┌─────────────┐  ┌───────────┐        ┌──────────────────┐
│ Autoevaluado │        │ Jefe Directo│  │ Pares (2) │        │ Subalternos (2)  │
└──────┬───────┘        └──────┬──────┘  └─────┬─────┘        └────────┬─────────┘
       │                       │               │                       │
       └───────────────────────┼───────────────┴───────────────────────┘
                               ▼
               ┌──────────────────────────────┐
               │ Agregador de Puntajes        │
               │ Ponderación Multidimensional │
               └──────────────┬───────────────┘
                              ▼
               ┌──────────────────────────────┐
               │ Calificación Consolidada 360  │
               └──────────────────────────────┘
```

---

## 2. Ponderación por Rol Evaluador

La puntuación final consolida los cuestionarios resueltos mediante la siguiente asignación de pesos:

$$\text{Puntaje Final 360} = (w_{\text{jefe}} \cdot \bar{S}_{\text{jefe}}) + (w_{\text{auto}} \cdot S_{\text{auto}}) + (w_{\text{pares}} \cdot \bar{S}_{\text{pares}}) + (w_{\text{sub}} \cdot \bar{S}_{\text{sub}})$$

Donde los pesos estandarizados corresponden a:
- **Jefe Directo ($w_{\text{jefe}}$)**: $40\%$ ($0.40$)
- **Autoevaluación ($w_{\text{auto}}$)**: $20\%$ ($0.20$)
- **Pares ($w_{\text{pares}}$)**: $20\%$ ($0.20$)
- **Subalternos ($w_{\text{sub}}$)**: $20\%$ ($0.20$)

---

## 3. Integración con Objetivos (KPIs / OKRs)

El desempeño cualitativo se complementa con la medición de objetivos individuales registrados en la entidad `EmployeeGoal`:

### 3.1. Cálculo del Porcentaje de Avance
$$\text{Progreso (\%)} = \min\left(100, \left( \frac{\text{currentValue}}{\text{targetValue}} \right) \times 100 \right)$$

### 3.2. Clasificación de Estado
- **`COMPLETED`**: Progreso $\ge 100\%$ dentro del plazo límite (`deadline`).
- **`ON_TRACK`**: Progreso acorde al tiempo transcurrido.
- **`AT_RISK`**: Quedan menos de 30 días para la fecha límite y el progreso es inferior al $70\%$.
- **`OVERDUE`**: Fecha límite superada con progreso $< 100\%$.
