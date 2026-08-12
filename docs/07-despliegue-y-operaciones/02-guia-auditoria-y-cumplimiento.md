# Guía de Auditoría, Seguridad y Cumplimiento Normativo

## 1. Lista de Verificación de Controles de Seguridad (ISO 27001 / LOPDP)

Esta especificación detalla los controles técnicos implementados en el sistema para auditorías de seguridad e infraestructura:

| Control de Seguridad | Mecanismo Implementado | Método de Verificación Técnica |
|---|---|---|
| **Cifrado de Datos Sensibles** | AES-256-GCM en reposo para atributos salariales. | Verificar que el campo `salary` en PostgreSQL contenga la estructura `<SALT>:<IV>:<TAG>:<CIPHERTEXT>`. |
| **Hashing de Credenciales** | Bcrypt con factor de costo 10. | Confirmar que el atributo `password` inicie con el prefijo `$2b$10$`. |
| **Control de Acceso (RBAC)** | Middlewares `authenticateToken` y `authorizeRoles`. | Probar solicitudes HTTP con token de rol `employee` hacia endpoints `/api/audit` (debe retornar `403 Forbidden`). |
| **Trazabilidad de Eventos** | Inserción síncrona en la entidad `AuditLog`. | Inspeccionar la tabla `audit_logs` ante eventos de actualización o eliminación. |
| **Hardening de Cabeceras HTTP** | Helmet (CSP, HSTS, DENY iframe, nosniff). | Comprobar cabeceras HTTP ejecutando `curl -I http://localhost:4000/api/system/status`. |
| **Protección de Archivos Adjuntos** | Middleware `protectStaticFiles` en `/uploads/`. | Verificar que solicitudes sin token JWT a `/uploads/resumes/` sean rechazadas con `401 Unauthorized`. |

---

## 2. Procedimiento de Auditoría de Claves y Respaldos

1. **Gestión y Rotación de Secretos**:
   - `ENCRYPTION_KEY` y `JWT_SECRET` deben gestionarse mediante gestores de secretos en entorno de producción (AWS Secrets Manager o HashiCorp Vault).
2. **Resguardo de Auditoría Inmutable**:
   - Los registros de la tabla `audit_logs` deben preservarse por un mínimo de 5 años conforme a las regulaciones laborales y de auditoría de sistemas.
