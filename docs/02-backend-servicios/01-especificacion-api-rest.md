# 01 — Especificación de API REST

## 1. Estructura General

Todos los endpoints tienen el prefijo base `/api`. Las rutas protegidas requieren el header `Authorization: Bearer <token>` y pertenecen al contexto del tenant del usuario autenticado.

**Punto de entrada único:** `/api` → `index.routes.js`  
**Rutas de sistema (sin autenticación):** `/api/system`

## 2. Autenticación

### POST `/api/auth/login`
Rate limit: 10 req / 15 min

**Request:**
```json
{ "email": "admin@empresa.com", "password": "contraseña" }
```

**Response 200:**
```json
{
  "token": "eyJ...",
  "employee": {
    "id": "clx...",
    "firstName": "Jorge",
    "lastName": "Doicela",
    "email": "admin@empresa.com",
    "role": "admin",
    "tenantId": "clx...",
    "department": "Administración",
    "position": "Gerente"
  }
}
```

### POST `/api/auth/forgot-password`
Rate limit: 5 req / 15 min. Envía correo con token de restablecimiento.

### POST `/api/auth/reset-password`
Restablece contraseña usando token temporal.

---

## 3. Gestión de Tenants

### POST `/api/tenants/register`
Registra una nueva empresa en la plataforma (crea tenant + usuario admin).

### GET `/api/tenants/me`
Devuelve datos del tenant activo del usuario autenticado.

---

## 4. SuperAdmin

### GET `/api/superadmin/tenants`
Lista todos los tenants del sistema (solo SuperAdmin).

### PUT `/api/superadmin/tenants/:id/status`
Actualiza el estado de suscripción de un tenant.

---

## 5. Empleados

### GET `/api/employees`
Lista empleados del tenant. Soporta paginación y filtros.

**Query params:** `page`, `limit`, `search`, `department`, `isActive`

### POST `/api/employees`
Crea un nuevo empleado. Encripta automáticamente: `salary`, `bankName`, `accountNumber`.

**Roles permitidos:** `admin`, `hr`

**Body mínimo requerido:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "identityCard": "string",
  "department": "string",
  "position": "string",
  "salary": "number",
  "hireDate": "ISO8601",
  "birthDate": "ISO8601",
  "address": "string",
  "phone": "string",
  "civilStatus": "Soltero|Casado|Divorciado|Viudo|Union Libre",
  "contractType": "Indefinido|Temporal|Por Obra|Prácticas",
  "password": "string"
}
```

### GET `/api/employees/:id`
Perfil completo de un empleado incluyendo contratos, documentos, habilidades e historial laboral.

### PUT `/api/employees/:id`
Actualización de datos del empleado. Los empleados solo pueden modificar su propio perfil; los administradores pueden modificar cualquier empleado.

### DELETE `/api/employees/:id`
Desactivación lógica (soft delete). Establece `isActive = false`.

---

## 6. Asistencia

### POST `/api/attendance`
Registra una acción de asistencia.

**Body:**
```json
{
  "identifier": "cedula_o_id_empleado",
  "type": "ENTRY | EXIT | BREAK_START | BREAK_END",
  "location": { "latitude": -0.1234, "longitude": -78.1234 }
}
```

**Validaciones ejecutadas:**
1. Resolución del empleado por cédula o ID.
2. Verificación de consentimiento de geolocalización.
3. Validación de geocerca (Haversine) si `enforceGeofence` o hay geocerca global.
4. Detección de VPN/Proxy mediante ip-api.com.
5. Validación de IP permitida si está configurada en `SystemSetting.allowedIPs`.

### GET `/api/attendance/status/:identifier`
Estado actual de asistencia de un empleado (NOT_STARTED · WORKING · ON_BREAK · COMPLETED).

### GET `/api/attendance`
Lista de registros de asistencia del tenant. Filtros: `employeeId`, `startDate`, `endDate`.

### PUT `/api/attendance/:id`
Corrección manual de registro (solo admin/hr).

---

## 7. Turnos

### GET `/api/shifts`
Lista todos los turnos del tenant.

### POST `/api/shifts`
Crea un nuevo turno con hora de inicio, fin, minutos de descanso y tolerancia de tardanza.

### POST `/api/shifts/:id/assign`
Asigna un turno a un empleado (crea `EmployeeSchedule`).

---

## 8. Ausencias

### GET `/api/absences`
Lista solicitudes de ausencia del tenant.

### POST `/api/absences`
Crea una solicitud de ausencia del empleado.

**Body:**
```json
{
  "type": "VACATION|SICK|PERSONAL|...",
  "startDate": "ISO8601",
  "endDate": "ISO8601",
  "reason": "string"
}
```

### PUT `/api/absences/:id/approve`
Aprueba o rechaza una solicitud (solo admin/hr).

---

## 9. Nómina

### POST `/api/payroll/generate`
**Roles:** `admin`

Genera la nómina para un período (mes/año). Proceso batch que calcula salario ganado, horas extra, recargo nocturno, bonificaciones y deducciones para todos los empleados con contrato activo.

**Body:** `{ "month": 8, "year": 2026 }`

### GET `/api/payroll`
Lista nóminas del tenant con paginación.

### GET `/api/payroll/:id`
Detalle de una nómina con todos los registros individuales.

### PUT `/api/payroll/:id/confirm`
Confirma la nómina (DRAFT → APPROVED). Aplica un proceso de validación de totales y procesa los beneficios one-time y cuotas de anticipos.

### PUT `/api/payroll/:id/pay`
Marca la nómina como pagada (APPROVED → PAID).

### GET `/api/payroll/:id/bank-file`
Genera archivo CSV bancario con datos de transferencia para pago.

### PUT `/api/payroll/detail/:detailId`
Ajuste manual de un registro individual de nómina (solo en estado DRAFT).

### DELETE `/api/payroll/:id`
Elimina una nómina en estado DRAFT.

---

## 10. Configuración de Nómina

### GET `/api/payroll/config`
Obtiene la configuración activa de nómina del tenant.

### POST `/api/payroll/config`
Crea una nueva configuración con ítems (deducciones e ingresos configurables).

### POST `/api/payroll/config/:id/items`
Agrega un ítem a la configuración (porcentaje o valor fijo).

---

## 11. Beneficios

### GET `/api/benefits`
Lista beneficios activos del tenant.

### POST `/api/benefits`
Crea un beneficio adicional para un empleado (comisión, bono, transporte, etc.).

**Frecuencias soportadas:** `MONTHLY`, `ONE_TIME`, `ANNUAL`

---

## 12. Anticipos de Sueldo

### POST `/api/salary-advances`
Crea una solicitud de anticipo de sueldo.

**Body:** `{ "employeeId": "...", "amount": 500, "installments": 3, "reason": "..." }`

### PUT `/api/salary-advances/:id/approve`
Aprueba o rechaza el anticipo.

---

## 13. Desempeño

### GET `/api/performance/templates`
Lista plantillas de evaluación del tenant.

### POST `/api/performance/templates`
Crea una plantilla de evaluación con criterios y escala de puntuación.

### POST `/api/performance/evaluations`
Crea una evaluación a partir de una plantilla y la asigna a un empleado con revisores.

### GET `/api/performance/evaluations/my`
Evaluaciones del empleado autenticado.

### PUT `/api/performance/evaluations/:id/submit`
El revisor envía sus respuestas y puntaje.

---

## 14. Objetivos

### GET `/api/goals`
Lista objetivos del empleado autenticado (o de todos los empleados para admin).

### POST `/api/goals`
Crea un objetivo SMART con valor objetivo, unidad de medida, prioridad y fecha límite.

### PUT `/api/goals/:id/progress`
Actualiza el progreso de un objetivo.

---

## 15. Contratación y Reclutamiento

Las rutas de reclutamiento son **mixtas**: algunas son públicas (portal de candidatos) y otras protegidas (gestión interna).

### GET `/api/recruitment/vacancies` (público)
Lista vacantes activas publicadas por el tenant.

### POST `/api/recruitment/vacancies/:id/apply` (público)
Permite a un candidato externo enviar su aplicación con CV.

### POST `/api/recruitment/vacancies` (protegido)
Crea una nueva vacante.

### GET `/api/recruitment/vacancies/:id/applications` (protegido)
Lista aplicaciones recibidas para una vacante.

### POST `/api/recruitment/applications/:id/interviews` (protegido)
Programa una entrevista.

### POST `/api/recruitment/applications/:id/evaluations` (protegido)
Registra una evaluación de candidato con calificaciones por criterio.

---

## 16. Inteligencia Analítica

### GET `/api/intelligence/dashboard`
Dashboard completo con todos los módulos analíticos calculados en paralelo mediante Promise.all.

### GET `/api/intelligence/retention`
Análisis de riesgo de rotación con modelo Weibull para todos los empleados activos.

### GET `/api/intelligence/scoring`
Scoring multidimensional de empleados (5 dimensiones ponderadas).

### GET `/api/intelligence/department-comparison`
Comparativa interdepartamental con ANOVA de un factor y prueba t de Welch.

### POST `/api/intelligence/montecarlo`
Simulador de escenarios What-If estocástico con N iteraciones (default 2,000).

### GET `/api/intelligence/predictive`
Predicción de rotación para los próximos 3 meses mediante regresión lineal simple.

### GET `/api/intelligence/performance`
Análisis de tendencias de desempeño e identificación de high performers.

### GET `/api/intelligence/alerts`
Alertas proactivas ordenadas por severidad y prioridad.

### GET `/api/intelligence/dataset`
Exporta dataset anonimizado en formato CSV o JSON.

---

## 17. Contabilidad

### GET `/api/accounting/accounts`
Lista el plan de cuentas jerárquico del tenant.

### POST `/api/accounting/accounts`
Crea una cuenta contable (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE).

### GET `/api/accounting/journal-entries`
Lista asientos contables del tenant.

### POST `/api/accounting/journal-entries`
Crea un asiento contable con líneas de débito/crédito. Valida que la suma de débitos = suma de créditos.

### PUT `/api/accounting/journal-entries/:id/post`
Aprueba y publica un asiento (DRAFT → POSTED).

### GET `/api/accounting/trial-balance`
Balance de comprobación: sumas de débitos y créditos por cuenta.

---

## 18. Biometría WebAuthn

### POST `/api/biometric/registration/options`
Genera las opciones de registro WebAuthn para el empleado autenticado.

### POST `/api/biometric/registration/verify`
Verifica y persiste la credencial biométrica registrada.

### POST `/api/biometric/login/options` (público)
Genera opciones de autenticación WebAuthn por email de empleado.

### POST `/api/biometric/login/verify` (público)
Verifica la aserción biométrica y emite un JWT si es válida.

---

## 19. Auditoría

### GET `/api/audit/logs`
Lista logs de auditoría del tenant. Soporta filtros por entidad, acción y rango de fechas.

---

## 20. Exportación

### GET `/api/export/employees`
Exporta el directorio de empleados en formato Excel (.xlsx).

### GET `/api/export/payroll/:id`
Exporta una nómina específica en formato PDF o Excel.

### GET `/api/export/attendance`
Exporta reportes de asistencia.

---

## 21. Anuncios

### GET `/api/announcements`
Lista anuncios del tenant activo del usuario.

### POST `/api/announcements`
Crea un anuncio con categoría, prioridad y opción de confirmación de lectura.

### PUT `/api/announcements/:id/read`
Marca un anuncio como leído por el empleado autenticado.

---

## 22. Cumplimiento Legal

### GET `/api/compliance/expiring-documents`
Lista documentos próximos a vencer con alertas de días restantes.

### GET `/api/compliance/checklist`
Estado del checklist de cumplimiento normativo del tenant.

---

## 23. Healthcheck

### GET `/health`
Responde `{ "status": "UP", "timestamp": "ISO8601" }` sin consultar la base de datos. Usado por Docker y balanceadores de carga para verificar disponibilidad del proceso.
