# 02. Catálogos del Sistema y Parámetros de Normativa Laboral

## 1. Catálogos Estandarizados del Sistema

EMPLIFI abstrae las reglas de negocio en catálogos y enumeraciones configurables que garantizan la consistencia de datos a lo largo de toda la plataforma.

### 1.1. Tipos de Contrato Laboral (`Contract.type`)
- `INDEFINIDO`: Contrato a tiempo indefinido con periodo de prueba.
- `EVENTUAL`: Contrato por obra o servicio determinado.
- `PARCIAL_PERMANENTE`: Jornada parcial de trabajo.
- `PASANTIA`: Convenio de prácticas pre-profesionales o pasantías formativas.

### 1.2. Clasificación de Ausencias y Permisos (`AbsenceRequest.type`)
- `VACACIONES`: Solicitud con débito a la bolsa anual de días de vacaciones (`vacationDays`).
- `ENFERMEDAD`: Permiso médico respaldado obligatoriamente por certificado o evidencia adjunta.
- `MATERNIDAD_PATERNIDAD`: Licencias legales por nacimiento o adopción.
- `CALAMIDAD_DOMESTICA`: Permiso por emergencia familiar justificada.
- `DOMESTICO_PERSONAL`: Permisos personales sin sueldo o compensables.

---

## 2. Parámetros de Cómputo de Nómina (`PayrollConfig`)

La tabla `PayrollConfig` centraliza las constantes exigidas por las leyes de seguridad social y código del trabajo:

| Parámetro | Valor por Defecto | Descripción |
|---|---|---|
| `workingDays` | 30 días | Base de días mensuales para cálculo salarial |
| `iessPersonalRatio` | 9.45% | Porcentaje de aporte individual del trabajador |
| `iessEmployerRatio` | 11.15% | Porcentaje de aporte patronal de la empresa |
| `overtimeMultiplierStandard` | 1.50 (50%) | Recargo por horas suplementarias |
| `overtimeMultiplierExtra` | 2.00 (100%) | Recargo por horas extraordinarias o feriados |
| `nightShiftSurcharge` | 1.25 (25%) | Recargo por jornada nocturna |
