# 03. Motor de Evaluación de Desempeño 360 y Competencias

## 1. Arquitectura del Motor de Evaluación 360

El **Motor de Evaluación de EMPLIFI** permite realizar mediciones integrales del desempeño del personal mediante una arquitectura flexible de cuestionarios, rúbricas y agregadores estadísticos.

```
                  ┌──────────────────────────────┐
                  │    Plantilla de Evaluación    │
                  └──────────────┬───────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  Autoevaluación  │   │ Evaluacion Par   │   │  Evaluación Boss │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                 ▼
                  ┌──────────────────────────────┐
                  │     Agregador de Puntajes    │
                  │   Ponderación por Rol (360)  │
                  └──────────────┬───────────────┘
                                 ▼
                  ┌──────────────────────────────┐
                  │     Informe de Resultados    │
                  └──────────────────────────────┘
```

---

## 2. Componentes del Modelo de Evaluación

1. **Competencias y Rúbricas**: Evaluación de habilidades técnicas (ej. arquitectura, backend, SQL) y habilidades blandas (ej. liderazgo, comunicación, trabajo en equipo).
2. **Evaluadores (`EvaluationReviewer`)**: Asignación dinámica de evaluadores múltiples para un mismo colaborador.
3. **Ponderación Puntuativa**: Matriz de pesos porcentuales por tipo de evaluador:
   - Autoevaluación: 15%
   - Evaluación de Pares: 35%
   - Evaluación del Supervisor Directo: 50%

---

## 3. Seguimiento de Objetivos Estratégicos (OKRs / KPIs)

El motor conecta la evaluación cualitativa con el cumplimiento cuantitativo registrado en `EmployeeGoal`:
- **Cálculo de Progreso**: $$\text{Progreso (\%)} = \min\left(100, \left(\frac{\text{currentValue}}{\text{targetValue}}\right) \times 100\right)$$
- **Nivel de Cumplimiento**: Clasificado en `PAGO_EXCEDIDO`, `COMPLETADO`, `EN_PROGRESO` o `RETRASADO`.
