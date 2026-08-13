# 06 - Sistema de Notificaciones Multi-Tenant y Gobernanza de Seguridad

## 1. Visión General del Sistema
El sistema de notificaciones de la plataforma ERP para PYMEs gestiona alertas operativas, avisos de vencimientos (documentos, contratos), estados de ausencias, evaluaciones de desempeño y avisos de cierre de nómina.

El sistema garantiza un **aislamiento absoluto multi-tenant** en base de datos, capa API y eventos en tiempo real mediante WebSockets.

---

## 2. Arquitectura de Aislamiento Multi-Tenant (Fail-Closed)

### 2.1 Modelo de Datos y Contexto Asíncrono
- **Base de Datos (Prisma):** La entidad `Notification` se encuentra vinculada a `Employee` (`recipientId`).
- **Contexto Asíncrono (`AsyncLocalStorage`):** Cada petición HTTP autenticada inyecta el `tenantId` en la memoria del hilo de ejecución a través de `tenantStorage`. El middleware global de Prisma (`$use`) intercepta consultas `findMany`, `findFirst`, `count`, `updateMany`, `deleteMany` e inyecta la restricción `where: { recipient: { tenantId } }` o `where: { tenantId }`.

### 2.2 Principio Fail-Closed (Zero Trust)
- Si una petición de un usuario regular llega sin un `tenantId` válido en la sesión o en los encabezados, la API rechaza inmediatamente la consulta con el código HTTP `400 TENANT_ID_REQUIRED`.
- Se prohíbe el fallback laxo `tenantId ? { tenantId } : {}` para prevenir lecturas accidentales de la base de datos global de todas las empresas.

### 2.3 Procesos Batch y Cron Jobs
- Dado que los trabajos en segundo plano (Cron Jobs) se ejecutan fuera del contexto de una petición HTTP con JWT, los administradores a notificar se consultan filtrando explícitamente por el `tenantId` de la entidad procesada:
  ```javascript
  const admins = await prisma.employee.findMany({
      where: {
          role: 'admin',
          isActive: true,
          tenantId: document.employee.tenantId
      }
  });
  ```

---

## 3. Notificaciones en Tiempo Real (WebSockets / Socket.io)

### 3.1 Servidor de Sockets ([socketService.js](file:///home/jorge/Proyectos/erp_pymes/backend/src/services/notifications/socketService.js))
- Autenticación mediante tokens JWT.
- Salas aisladas por empresa: `tenant_${tenantId}`.
- Emisión punto a punto (`sendToUser`) y por empresa (`sendToTenant`).

### 3.2 Cliente Frontend ([useNotificationSocket.js](file:///home/jorge/Proyectos/erp_pymes/frontend/src/hooks/useNotificationSocket.js))
- Hook reactivo en cliente que gestiona la conexión Socket.io, autenticación de sesión y recepción instantánea del evento `'new_notification'`.
- Notificaciones flotantes en UI mediante `react-hot-toast` y actualización del contador sin necesidad de *polling* constante.

---

## 4. Endpoints de la API REST (`/api/notifications`)

| Método | Ruta | Descripción | Acceso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Obtiene el historial de notificaciones del usuario (máximo 50). | Autenticado |
| `GET` | `/api/notifications/unread-count` | Retorna `{ count: N }` mediante agregación rápida en BD. | Autenticado |
| `PATCH` | `/api/notifications/:id/read` | Marca una notificación específica como leída. | Autenticado (Owner) |
| `PATCH` | `/api/notifications/read-all` | Marca todas las notificaciones del usuario como leídas. | Autenticado |
| `GET` | `/api/notifications/preferences` | Obtiene las preferencias de canal (App / Email) del empleado. | Autenticado |
| `PUT` | `/api/notifications/preferences` | Actualiza canales habilitados por tipo de alerta. | Autenticado |

---

## 5. Gobernanza de Seguridad en Endpoints Administrativos

- **Protección de `/api/seed` y `/api/migrate`:**
  - Ambas rutas requieren explícitamente el middleware `authenticate` y `authorize(['superadmin'])`.
  - Exigen que la variable de entorno `SEED_SECRET` esté configurada en el servidor y coincida de forma estricta con el parámetro enviado en la petición, rechazando cualquier intento de bypass con valores vacíos o nulos.
