# 04. Workflows de Negocio: Evaluación de Desempeño y Cálculo de Nómina

## 1. Workflow de Generación y Cálculo de Nómina

El motor de nómina en EMPLIFI procesa el pago periódico consolidando salario base, ausencias injustificadas, horas extras y deducciones legales.

```mermaid
flowchart TD
 Start([Inicio Proceso Nómina]) --> FetchConfig[Obtener PayrollConfig: días laborales, % retención, % horas extras]
 FetchConfig --> FetchEmployees[Obtener lista de Empleados Activos]
 FetchEmployees --> LoopEmployees{Procesar Empleado}
 LoopEmployees --> DecryptSalary[Descifrar Salario Base (AES-256-GCM)]
 DecryptSalary --> CalcAttendance[Calcular Horas Extras + Recargos Nocturnos desde Attendance]
 CalcAttendance --> CalcBenefits[Sumar Beneficios Activos: Bonos, Seguros]
 CalcBenefits --> CalcDeductions[Calcular Aporte Individual / Retenciones]
 CalcDeductions --> GenerateDetail[Crear Registro en PayrollDetail]
 GenerateDetail --> LoopEmployees
 LoopEmployees -- Finalizado --> SaveBatch[Guardar Registro de Nómina en Estado Procesado]
 SaveBatch --> End([Fin de Proceso Nómina])
```

### 1.1. Reglas de Cálculo Monetario
- **Salario Proporcional**: $$\text{Salario Trabajado} = \left(\frac{\text{Salario Base}}{30}\right) \times (\text{Días Trabajados} - \text{Días Ausente Injustificado})$$
- **Horas Extras Suplementarias (50%)**: $$\text{Valor Hora Extra 50\%} = \left(\frac{\text{Salario Base}}{240}\right) \times 1.5 \times \text{Horas 50\%}$$
- **Horas Extraordinarias / Festivas (100%)**: $$\text{Valor Hora Extra 100\%} = \left(\frac{\text{Salario Base}}{240}\right) \times 2.0 \times \text{Horas 100\%}$$

---

## 2. Workflow de Evaluación de Desempeño 360 y Objetivos (OKRs/KPIs)

El ciclo de gestión del desempeño permite alinear los objetivos del colaborador con las evaluaciones semestrales o anuales.

1. **Creación de Objetivos**: El empleado o manager define metas (`EmployeeGoal`) con métricas objetivo, fechas límite y niveles de prioridad (`HIGH`, `MEDIUM`, `LOW`).
2. **Creación de Plantilla de Evaluación**: Recursos Humanos genera una plantilla de evaluación (`EmployeeEvaluation`) con secciones de competencias técnicas, blandas y grado de cumplimiento de metas.
3. **Asignación de Evaluadores**: Se vinculan evaluadores (Supervisores o Pares en `EvaluationReviewer`).
4. **Respuesta y Tabulación**: Los evaluadores completan los cuestionarios con puntuaciones numéricas (1 a 5). El sistema promedia automáticamente los puntajes ponderados y genera un resultado consolidado (`EvaluationResults`).
