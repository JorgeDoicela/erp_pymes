# Motor de Notificaciones y Comunicación Multicanal (WebSockets + Email + In-App)

## 1. Arquitectura del Despachador de Eventos

El motor de notificaciones (`NotificationService`) coordina el despacho multicanal de alertas generadas por eventos del dominio (aprobación de ausencias, vencimiento de contratos, recordatorios de evaluaciones, emisión de nómina o alertas proactivas de rotación).

```
Evento de Negocio (Ej. Contrato por Vencer / Evaluación Pendiente)
                           │
                           ▼
          [checkPreferences(employeeId, type, channel)]
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
       Notificación    WebSocket     Servicio SMTP
         In-App       (Socket.IO)    (Nodemailer)
    (`notifications`) (en tiempo real) (Correo HTML)
```

## 2. Evaluación de Preferencias (`checkPreferences`)

Antes de emitir cualquier alerta, el servicio consulta la entidad `NotificationPreference` del destinatario:

```javascript
async checkPreferences(employeeId, type, channel) {
    const prefs = await prisma.notificationPreference.findUnique({
        where: { employeeId }
    });
    if (!prefs || !prefs.preferences) return true; // Habilitado por defecto

    // Formato JSON: { "CONTRACT_EXPIRATION": { "email": false, "inApp": true } }
    const typePrefs = prefs.preferences[type];
    if (!typePrefs) return true;

    return typePrefs[channel] !== false; // Solo 'false' explícito desactiva el canal
}
```

Si el canal o tipo no está configurado explícitamente en la preferencia del usuario, se activa por defecto (principio de notificación segura).

## 3. Canales de Entrega

### 3.1 Canal In-App (`createNotification`)

Registra un objeto `Notification` en la base de datos vinculado al destinatario:

- Campos: `recipientId`, `title`, `message`, `type`, `relatedEntity`, `relatedEntityId`, `isRead`.
- Cada notificación creada se emite inmediatamente vía WebSocket al usuario activo:
  ```javascript
  socketService.sendToUser(data.recipientId, 'new_notification', notification);
  ```

### 3.2 Canal WebSockets en Tiempo Real (`socketService`)

El servidor `Socket.IO` implementa autenticación basada en JWT y salas jerárquicas por tenant:

1. **Autenticación por Socket (`authenticate`):** El cliente envía su token JWT al conectarse. El servidor descodifica el token y registra el mapeo `userId → socketId` en un `Map` en memoria (`userSockets`).
2. **Salas de Tenant (`join_tenant`):** Al autenticarse, el socket se une automáticamente a la sala `tenant_<tenantId>`. Si el usuario no pertenece a la empresa y no es `superadmin`, el acceso a la sala es **rechazado**.
3. **Despacho Puntuado:**
   - `sendToUser(userId, event, data)`: Emite directamente al `socketId` del usuario si está conectado.
   - `sendToTenant(tenantId, event, data)`: Emite a todos los clientes conectados de la empresa (`tenant_<tenantId>`).
   - `broadcast(event, data)`: Emite a todos los clientes conectados globalmente.

### 3.3 Canal de Correo Electrónico (`emailService`)

Utiliza `Nodemailer` configurado con transporte SMTP (puerto, host, credenciales desde `.env`):

- **Plantillas HTML:** Formato de correo responsivo con encabezado institucional, cuerpo con detalles de la alerta y botón de acción directa.
- **Mapeo de eventos a correo:** Alertas de vencimiento de contrato (`sendContractExpirationAlert`), recordatorios de evaluaciones (`sendEvaluationReminder`), cierres de nómina y recuperación de contraseñas.

## 4. Tipos de Alerta Soportados

| Tipo de Alerta | Canales | Destinatarios | Disparador |
|----------------|---------|---------------|------------|
| `CONTRACT_EXPIRATION` | In-App + Email + Socket | Administradores de la empresa | `contractCronJob` (diario 08:00 AM) |
| `EVALUATION_REMINDER` | In-App + Email + Socket | Evaluadores asignados | `performanceCronJob` |
| `PAYROLL_CLOSING` | In-App + Socket | Administradores | `payrollCronJob` (5 días antes de cierre) |
| `PAYROLL_REVIEW` | In-App + Socket | Administradores | `payrollCronJob` (3 días antes de pago) |
| `PAYROLL_CONFIRM` | In-App + Socket | Administradores | `payrollCronJob` (1 día antes de pago) |
| `ABSENCE_STATUS` | In-App + Socket | Empleado solicitante | Aprobación/Rechazo de ausencias |
| `ANNOUNCEMENT_NEW` | In-App + Socket (Tenant) | Todos los empleados de la empresa | Creación de anuncio oficial |
