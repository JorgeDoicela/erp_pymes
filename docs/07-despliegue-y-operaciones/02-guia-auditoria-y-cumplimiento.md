# 02. Guía de Auditoría, Seguridad y Cumplimiento Normativo

## 1. Checklist de Cumplimiento de Seguridad (ISO 27001 / LOPDP)

Esta guía detalla los controles técnicos implementados en EMPLIFI que deben validarse periódicamente durante las auditorías de sistemas y seguridad.

| Control de Seguridad | Mecanismo Implementado | Método de Verificación |
|---|---|---|
| Cifrado de Datos Sensibles | Cifrado AES-256-GCM en reposo para salarios y cuentas | Verificar registros hex en tabla `employees` directamente via `psql` |
| Hashing de Contraseñas | Bcrypt con cost factor 10 | Confirmar que el atributo `password` inicie con `$2b$10$` |
| Control de Acceso (RBAC) | Middlewares `authenticate` y `authorizeRole` | Probar peticiones con token de rol `employee` hacia rutas `/api/audit` |
| Registro de Cambios | Asignación automática en `AuditLog` | Consultar la vista `/admin/audit` o la tabla `audit_logs` |
| Seguridad HTTP | Helmet (CSP, HSTS, DENY iframe, nosniff) | Escanear cabeceras HTTP con `curl -I http://localhost:4000/api` |
| Protección de Archivos | Middlewares `protectStaticFiles` en `/uploads` | Intentar acceder directamente a un CV sin cabecera `Authorization` |

---

## 2. Procedimiento de Auditoría de Código y Respaldo

1. **Rotación de Claves Criptográficas**:
 - `ENCRYPTION_KEY` y `JWT_SECRET` deben ser gestionados como secretos en variables de entorno seguras (Vercel Secret / AWS Secrets Manager) y rotarse periódicamente.
2. **Respaldo de Base de Datos**:
 - Programar respaldos diarios comprimidos de PostgreSQL (`pg_dump`) preservando el historial de logs de auditoría por un mínimo de 5 años por regulaciones laborales.
