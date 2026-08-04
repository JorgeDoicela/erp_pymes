# 05. Motor de Notificaciones Multicanal

## 1. Descripción del Sistema de Notificaciones

El **Motor de Notificaciones de EMPLIFI** gestiona la emisión, priorización y entrega de alertas para garantizar la comunicación fluida entre Recursos Humanos y el personal.

```
Evento de Sistema (Contrato por vencer, Solicitud de Ausencia) ──► Evaluador de Preferencias (NotificationPreference) ──► Despachador Multicanal (In-App / Email)
```

---

## 2. Canales de Notificación y Entidades

1. **Notificaciones In-App (`Notification`)**:
   - Mensajes interactivos desplegados en la campana de notificaciones de la barra superior.
   - Estado de lectura (`isRead`), categorías (`INFO`, `WARNING`, `ACTION_REQUIRED`) y enlace de acción directa.
2. **Alertas de Correo Electrónico (SMTP / Nodemailer)**:
   - Envío automático de notificaciones para restablecimiento de contraseña, emisión de rol de pago y convocatorias a entrevistas de selección.

---

## 3. Preferencias del Usuario (`NotificationPreference`)

Cada empleado puede configurar sus canales y tipos de notificaciones recibidas:
- `emailNotifications`: `Boolean` (Activar/Desactivar avisos por correo).
- `pushNotifications`: `Boolean` (Alertas en navegador/dispositivo móvil).
- `contractExpiryAlerts`: `Boolean` (Avisos de vencimiento de contrato).
- `payrollAlerts`: `Boolean` (Notificación de disponibilidad de rol de pago).
