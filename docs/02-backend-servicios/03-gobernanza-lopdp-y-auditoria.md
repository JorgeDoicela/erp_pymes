# 03. Gobernanza de Datos, LOPDP y Auditoría

## 1. Protección de Datos Personales y Sensibles (LOPDP / ISO 27001)

En cumplimiento con la **Ley Orgánica de Protección de Datos Personales (LOPDP)** y estándares internacionales de ciberseguridad, EMPLIFI implementa medidas técnicas y organizativas para salvaguardar la privacidad del trabajador:

1. **Cifrado Fuerte en Reposo**: Campos como el salario (`salary`), número de cuenta bancaria (`accountNumber`), tipo de cuenta y cédula de identidad (`identityCard`) se protegen en PostgreSQL mediante cifrado autenticado **AES-256-GCM**.
2. **Consentimiento Explícito de Rastreo (Geofencing)**: La recolección de ubicaciones GPS (`entryLatitude`, `entryLongitude`, `exitLatitude`, `exitLongitude`) está condicionada a la activación previa de las banderas `trackingConsent` y `trackingConsentDate` por parte del empleado.
3. **Control de Archivos Sensibles (Uploads Protegidos)**: Las hojas de vida (`resumes`) y evidencias médicas de ausencias no se exponen públicamente. Las peticiones a `/uploads/resumes/` o `/uploads/evidence/` requieren autenticación explícita y pasan por el middleware `protectStaticFiles`.

---

## 2. Sistema de Auditoría Inmutable (`AuditLog`)

Cada modificación crítica ejecutada en la plataforma (creación de empleados, cambios salariales, aprobación de permisos, ajustes de rol) registra de forma síncrona un evento de auditoría en la tabla `audit_logs`.

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  entity      String   // Entidad modificada: "Employee", "Payroll", "AbsenceRequest"
  entityId    String   // ID del registro impactado
  action      String   // Accion ejecutada: "CREATE", "UPDATE", "DELETE", "APPROVE"
  performedBy String   // ID o email del usuario ejecutante
  details     String   // Payload de cambios formateado en JSON / Texto
  ip          String?  // Direccion IP de origen
  timestamp   DateTime @default(now())
}
```

---

## 3. Trazabilidad Operativa y Logs de Desempeño (RNF-13)

- **Request Logger**: Registra cada petición HTTP entrante con su verbo, ruta, código de respuesta HTTP y latencia en milisegundos.
- **Performance Logger**: Identifica consultas o ejecuciones que excedan los umbrales recomendados de latencia para alertar al equipo de arquitectura.
