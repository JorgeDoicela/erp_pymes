# 03 — Gobernanza, LOPDP y Auditoría

## 1. Marco Normativo Aplicable

El sistema está diseñado para operar en Ecuador bajo los principios de la **Ley Orgánica de Protección de Datos Personales (LOPDP)** y el **Código de Trabajo del Ecuador**. Las decisiones de implementación relacionadas con privacidad, encriptación y consentimiento se alinean con estos marcos normativos.

## 2. Principios de Protección de Datos Implementados

### 2.1 Minimización de Datos

- Las coordenadas GPS se truncan a **4 decimales** (~11 metros de precisión) antes de encriptarse, evitando almacenar la ubicación exacta del empleado.
- El dataset anonimizado exportable (`generateAcademicDataset`) no contiene nombres, cédulas, correos, salarios nominales ni coordenadas.
- Los logs de auditoría registran la acción y el actor, pero no el contenido completo de los datos modificados en campos sensibles.

### 2.2 Consentimiento Explícito

El campo `Employee.trackingConsent` (boolean) controla el almacenamiento de coordenadas GPS. El empleado debe aceptar explícitamente los términos de privacidad en su perfil para que el sistema almacene su ubicación durante el registro de asistencia.

Si `trackingConsent = false` y la geocerca está activada, el sistema rechaza el registro de asistencia con un mensaje explicando el motivo, en lugar de ignorar silenciosamente el consentimiento.

### 2.3 Encriptación de Datos Sensibles

Ver documentación detallada en [`05-encriptacion-salarios-y-seguridad.md`](./05-encriptacion-salarios-y-seguridad.md).

Resumen: Los campos `salary`, `bankName`, `accountNumber`, coordenadas GPS de asistencia y coordenadas de geocerca son encriptados con AES-256-GCM. La clave maestra se deriva desde `ENCRYPTION_KEY` del entorno y nunca se almacena en la base de datos.

### 2.4 Acceso Controlado

Los salarios y datos bancarios están encriptados en la base de datos y solo son desencriptados en los servicios con la clave maestra del entorno. No existen endpoints que devuelvan el salario en texto plano de forma directa en los listados masivos; el campo `salary` en las respuestas de empleado solo es accesible para `admin` y `hr`.

## 3. Sistema de Auditoría

### 3.1 Modelo `AuditLog`

Cada operación crítica genera un registro de auditoría:

| Campo | Descripción |
|-------|-------------|
| `entity` | Nombre de la entidad afectada (Employee, Payroll, OffboardingProcess...) |
| `entityId` | ID del registro específico |
| `action` | Tipo de acción (CREATE, UPDATE, DELETE, START_OFFBOARDING, CONFIRM_PAYROLL...) |
| `performedBy` | ID del usuario que realizó la acción |
| `details` | Descripción textual o JSON del cambio |
| `createdAt` | Timestamp UTC de la operación |
| `tenantId` | Empresa a la que pertenece el registro |

### 3.2 Características del Registro de Auditoría

- **No bloqueante:** El registro de auditoría se realiza de forma asíncrona con `.catch()` para no interrumpir el flujo principal si falla.
- **Dentro de transacciones:** Para operaciones críticas como confirmación de nómina y offboarding, el log de auditoría se incluye dentro de la transacción Prisma para garantizar consistencia.
- **Multi-tenant:** Los logs están vinculados al `tenantId` y son accesibles solo desde el tenant correspondiente.

### 3.3 Operaciones Auditadas

| Operación | Entidad | Acción |
|---------|---------|--------|
| Crear empleado | Employee | CREATE |
| Actualizar empleado | Employee | UPDATE |
| Desactivar empleado | Employee | DEACTIVATE |
| Confirmar nómina | Payroll | CONFIRM_PAYROLL |
| Iniciar offboarding | OffboardingProcess | START_OFFBOARDING |
| Aprobar solicitud de ausencia | AbsenceRequest | APPROVE / REJECT |
| Aprobar anticipo de sueldo | SalaryAdvance | APPROVE / REJECT |
| Actualizar configuración | SystemSetting | UPDATE |

### 3.4 Consulta de Logs

Los administradores acceden a los logs de auditoría mediante `GET /api/audit/logs` con filtros por:
- Entidad (`entity`)
- Acción (`action`)
- Rango de fechas (`startDate`, `endDate`)
- Actor (`performedBy`)

## 4. Retención de Datos

No se implementa eliminación automática de registros históricos. Los registros de empleados desactivados (soft delete) se conservan indefinidamente para:
- Cálculos de liquidación legal.
- Trazabilidad de nóminas históricas.
- Cumplimiento de obligaciones de conservación de registros laborales (mínimo 7 años en Ecuador según normativa del IESS).

## 5. Segregación de Roles para Datos Sensibles

| Dato | Admin | HR | Employee |
|------|-------|-----|----------|
| Salario (propio) | ✓ | ✓ | ✓ |
| Salario (otros empleados) | ✓ | ✓ | ✗ |
| Cuenta bancaria (propia) | ✓ | ✓ | ✓ |
| Cuenta bancaria (otros) | ✓ | ✗ | ✗ |
| Coordenadas GPS de asistencia | ✓ | ✓ | Solo propio |
| Logs de auditoría | ✓ | ✓ | ✗ |
| Dataset analítico | ✓ | ✓ | ✗ |

## 6. Modo Mantenimiento

El `maintenanceMiddleware` verifica si el tenant está en modo mantenimiento programado antes de procesar cada petición protegida. Durante el mantenimiento:
- Los endpoints GET de lectura siguen funcionando.
- Las operaciones de escritura (POST, PUT, DELETE) son rechazadas con HTTP 503 y un mensaje descriptivo.

Este mecanismo permite realizar actualizaciones de base de datos o migraciones controladas sin derribar el servicio completamente.
