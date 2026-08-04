# 02. Catálogo Técnico de Vistas y Componentes UI

## 1. Estructura de Vistas del Cliente Frontend

El cliente web de EMPLIFI contiene **45+ vistas especializadas** organizadas en módulos dentro de `src/pages/`.

```
src/pages/
├── landing/            # Home.jsx (Página pública principal)
├── auth/               # Login.jsx, ResetPassword.jsx
├── dashboard/          # AdminDashboard, EmployeeDashboard, IntelligentDashboard, AdminSettings
├── employees/          # RegisterEmployee, EmployeeList, EmployeeProfile
├── attendance/         # AttendancePage, ShiftManagement, AdminAbsences
├── payroll/            # PayrollConfiguration, PayrollGenerator, MyPayments, BenefitsManagement
├── performance/        # EvaluationDashboard, CreateEvaluation, AssignEvaluation, MyEvaluations, TakeEvaluation, EvaluationResults, MyGoals
├── recruitment/        # RecruitmentDashboard, CreateJobVacancy, CareersPage, JobApplication, VacancyDetails, ApplicationDetails
├── analytics/          # AnalyticsDashboard
├── reports/            # TurnoverReport, PerformanceReport, PayrollCostReport, SatisfactionReport, CustomReport, AttendanceReports
├── contracts/          # ExpiringContracts
├── notifications/      # NotificationsPage, NotificationSettings
├── audit/              # AuditLogsPage
├── accounting/         # AccountingDashboard, ChartOfAccounts, JournalEntries, TrialBalance, PeriodsManagement, CostCenterManagement
└── entrepreneurship/  # Dashboard, ProjectForm, ProjectDetails
```

---

## 2. Descripción Técnica por Módulo de Pantallas

### 2.1. Autenticación y Dashboards Principales
- **`Home.jsx`**: Portada de acceso público e información institucional.
- **`Login.jsx`**: Formulario de autenticación con `handleLogin`, almacenamiento de JWT en `localStorage` y redirección condicional por rol.
- **`ResetPassword.jsx`**: Formulario de restablecimiento de contraseña validando el token de URL.
- **`AdminDashboard.jsx`**: Tablero general para roles `admin` y `hr` con contadores de personal activo, asistencias del día, contratos por vencer y ausencias pendientes.
- **`EmployeeDashboard.jsx`**: Tablero de autogestión para rol `employee` con accesos rápidos a marcación GPS, permisos y roles de pago.
- **`IntelligentDashboard.jsx`**: Tablero de analítica avanzada con predicciones de turnover y métricas financieras.
- **`AdminSettings.jsx`**: Configuración de parámetros globales del sistema (modo mantenimiento, geocercas globales, ips permitidas).

### 2.2. Gestión de Empleados
- **`RegisterEmployee.jsx`**: Formulario de alta de personal con campos cifrados (`salary`, `identityCard`, `accountNumber`).
- **`EmployeeList.jsx`**: Tabla con filtros por departamento, rol, estado activo/inactivo, búsqueda por texto y exportación.
- **`EmployeeProfile.jsx`**: Ficha técnica individual con pestañas de Datos Personales, Habilidades (`Skill`), Historial Laboral (`WorkHistory`), Contratos (`Contract`) y Documentos (`Document`).

### 2.3. Asistencia, Ausencias y Turnos
- **`AttendancePage.jsx`**: Componente de marcación GPS interactivo que calcula coordenadas del navegador (`navigator.geolocation`) y valida el radio de geocerca contra la API.
- **`ShiftManagement.jsx`**: Grilla de configuración de turnos de trabajo, horarios de entrada/salida, minutos de descanso y tolerancias.
- **`AdminAbsences.jsx`**: Panel de revisión de solicitudes de permisos con visualización de evidencias adjuntas y botones de Aprobación/Rechazo.

### 2.4. Nómina y Beneficios
- **`PayrollConfiguration.jsx`**: Panel de ajuste de días laborales base, porcentajes IESS y rubros obligatorios/opcionales.
- **`PayrollGenerator.jsx`**: Interfaz de procesamiento masivo de nómina mensual con pre-calculadora de horas extras y deducciones.
- **`MyPayments.jsx`**: Vista de consulta y descarga de comprobantes individuales de pago para el empleado.
- **`BenefitsManagement.jsx`**: Asignación de beneficios adicionales (bonos, seguro médico, fondo de reserva).

### 2.5. Evaluaciones de Desempeño y Objetivos
- **`EvaluationDashboard.jsx`**: Consolidado de procesos de evaluación activos.
- **`CreateEvaluation.jsx`**: Creador de plantillas de evaluación con rúbricas cuantitativas y cualitativas.
- **`AssignEvaluation.jsx`**: Matriz de asignación de evaluadores (pares/supervisores).
- **`TakeEvaluation.jsx`**: Formulario de llenado de evaluación asignada.
- **`EvaluationResults.jsx`**: Gráficos spider/radar de competencias y puntuación final.
- **`MyGoals.jsx`**: Tablero de gestión de OKRs/KPIs con barra de progreso interactiva.

### 2.6. Reclutamiento y Selección
- **`RecruitmentDashboard.jsx`**: Pipeline Kanban de candidatos por etapa de selección (Postulado, Entrevista, Evaluado, Contratado).
- **`CreateJobVacancy.jsx`**: Publicador de ofertas de trabajo con requerimientos y rango salarial.
- **`CareersPage.jsx`**: Portal público de empleos para postulantes externos.
- **`JobApplication.jsx`**: Formulario de postulación con subida de archivo PDF CV.
- **`ApplicationDetails.jsx`**: Expediente del candidato con notas internas, agenda de entrevistas y calificaciones.

### 2.7. Contabilidad Financiera (Módulo `acc_*`)
- **`AccountingDashboard.jsx`**: Panel de control contable con resumen de activos, pasivos, ingresos y egresos.
- **`ChartOfAccounts.jsx`**: Árbol interactivo del plan de cuentas contables.
- **`JournalEntries.jsx`**: Registro y consulta de asientos contables del libro diario.
- **`TrialBalance.jsx`**: Reporte de balance de comprobación de sumas y saldos.
- **`PeriodsManagement.jsx`**: Apertura y cierre de períodos contables mensuales/anuales.
- **`CostCenterManagement.jsx`**: Gestión de centros de costos operativos.

### 2.8. Emprendimiento e Incubadora (Módulo `ent_*`)
- **`Dashboard.jsx`**: Métrica de proyectos en incubación, valoración total y puntajes de innovación.
- **`ProjectForm.jsx`**: Formulario de registro de proyectos con narrativa de pitch.
- **`ProjectDetails.jsx`**: Expediente del proyecto con pestañas de Cap Table (Equity), Rondas de Inversión, Entrevistas de Descubrimiento, Hitos Kanban y Documentos.
