# 02 — Scoring Multidimensional de Empleados

## 1. Descripción General

La función `getEmployeeScoring` genera un **score compuesto por empleado** a partir de 5 dimensiones independientes. Este score permite clasificar a los colaboradores en categorías de rendimiento organizacional y sirve como insumo para la toma de decisiones de recursos humanos.

## 2. Fuentes de Datos

Para cada empleado activo, el sistema recupera:
- Últimas 30 ausencias registradas.
- Últimas 5 evaluaciones de desempeño.
- Últimos 10 objetivos registrados.
- Registros de asistencia de los últimos 90 días.

## 3. Dimensiones del Score

### Dimensión 1: Retención (Retention Score)

```
retentionScore = 100 − riesgoWeibull

Donde riesgoWeibull = calculateRetentionRiskScore(emp, avgSalary).score
```

Un empleado con alta probabilidad de rotación tiene score de retención bajo. Un empleado con baja probabilidad tiene score alto (máx. 100).

### Dimensión 2: Desempeño (Performance Score)

```
Si tiene evaluaciones:
    performanceScore = Σ(finalScore || overallScore || 70) / cantidadEvaluaciones

Si no tiene evaluaciones:
    performanceScore = 65   (valor neutro por defecto)
```

Los campos `finalScore` y `overallScore` son intentados en ese orden para compatibilidad con diferentes versiones del formulario de evaluación.

### Dimensión 3: Asistencia (Attendance Score)

```
attendanceScore = max(0, 100 − (totalAbsences × 7) − (totalLates × 2))
```

Donde:
- `totalAbsences` = número de ausencias registradas en el período analizado.
- `totalLates` = número de registros de asistencia con `isLate = true` en 90 días.
- Cada ausencia penaliza 7 puntos (indicativa de días sin trabajar).
- Cada tardanza penaliza 2 puntos (indicativa de impuntualidad).
- El mínimo es 0 (nunca negativo).

### Dimensión 4: Crecimiento (Growth Score)

```
Si tiene objetivos registrados:
    growthScore = Σ(goal.progress || 0) / cantidadObjetivos

Si no tiene objetivos:
    growthScore = 60   (valor neutro por defecto)
```

El campo `progress` de `EmployeeGoal` representa el porcentaje de avance (0-100) de cada objetivo SMART.

### Dimensión 5: Engagement Score (Score Compuesto de Compromiso)

El engagement es un índice compuesto que pondera las dimensiones anteriores:

```
engagementScore = round(
    performanceScore × 0.40 +
    growthScore      × 0.35 +
    attendanceScore  × 0.25
)
```

Esta dimensión captura el nivel de compromiso observable a través del comportamiento laboral: rendimiento, progreso en objetivos y presencia.

## 4. Score Global (Overall Score)

El score global pondera las 5 dimensiones:

```
overallScore = retentionScore  × 0.25
             + performanceScore × 0.30
             + attendanceScore  × 0.20
             + engagementScore  × 0.15
             + growthScore      × 0.10
```

**Justificación de pesos:**
- **Desempeño (30%):** Es la dimensión principal de valor del colaborador.
- **Retención (25%):** El riesgo de abandono impacta directamente en la continuidad.
- **Asistencia (20%):** Presencia física es requisito base de productividad.
- **Engagement (15%):** Indicador compuesto de compromiso observado.
- **Crecimiento (10%):** Progreso en objetivos, valioso pero a largo plazo.

## 5. Clasificación de Categorías

| overallScore | Categoría |
|-------------|-----------|
| ≥ 80 | Top Performer |
| 60-79 | Good Performer |
| 40-59 | Needs Improvement |
| < 40 | At Risk |

## 6. Estructura de Respuesta

```json
{
  "employees": [
    {
      "employeeId": "clx...",
      "employeeName": "Jorge Doicela",
      "department": "Tecnología",
      "position": "Desarrollador",
      "scores": {
        "retention": 72,
        "performance": 85,
        "attendance": 90,
        "engagement": 82,
        "growth": 68,
        "overall": 80
      },
      "category": "Top Performer"
    }
  ],
  "summary": {
    "total": 20,
    "topPerformers": 5,
    "goodPerformers": 10,
    "needsImprovement": 3,
    "atRisk": 2,
    "avgOverallScore": 72.4
  }
}
```

Los empleados se ordenan de mayor a menor `overallScore`.

## 7. Salud Organizacional (getOrganizationalHealth)

La función `getOrganizationalHealth` agrega los scores de los módulos individuales en un índice de salud organizacional global:

```
retentionHealth    = 100 − (highRiskCount / totalEmployees × 100)
performanceHealth  = 100 − (decliningCount / totalEmployees × 100)
attendanceHealth   = max(0, 100 − (suspiciousAbsences.length / totalEmployees × 50))
departmentHealth   = (excellent + good) / totalDepts × 100

overallHealth = retentionHealth    × 0.30
              + performanceHealth  × 0.25
              + attendanceHealth   × 0.20
              + departmentHealth   × 0.25
```

| overallHealth | Nivel |
|--------------|-------|
| ≥ 80 | Excelente |
| 60-79 | Bueno |
| 40-59 | Regular |
| < 40 | Crítico |

Los KPIs organizacionales calculados incluyen:
- `totalEmployees`: Total de empleados activos.
- `avgTenure`: Antigüedad media en años (calculada sobre `hireDate`).
- `rotationRate`: Porcentaje de empleados en "Alto Riesgo" respecto al total.
- `satisfactionIndex`: Equivalente al `overallHealth` redondeado.
