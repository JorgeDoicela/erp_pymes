# Plan de Recuperación ante Desastres (DRP) - RNF-25

## 1. Escenarios de Fallo
### A. Caída del Servidor (Backend)
- **Síntoma**: Los usuarios reciben errores 500 o "Network Error".
- **Acción**: Reiniciar el servicio usando `npm run dev` (desarrollo) o verificar el gestor de procesos (PM2).

### B. Corrupción de Base de Datos
- **Síntoma**: Errores de Prisma en consultas básicas o datos incoherentes.
- **Recuperación**:
    1. Identificar el último backup válido en la carpeta `/backend/backups`.
    2. Ejecutar la restauración mediante el comando:
       `psql "DATABASE_URL" < backups/archivo.sql`
    3. Reiniciar el servidor.

### C. Fallo en Generación de Nómina
- **Síntoma**: La nómina se queda en estado "PENDING" pero no muestra detalles.
- **Recuperación**: Gracias al mecanismo de **transacciones (rollback)** implementado, el sistema revertirá cualquier cambio parcial. Simplemente elimine el borrador e intente de nuevo.

## 2. Estrategia de Respaldo
- **Frecuencia**: Se recomienda ejecutar `node scripts/db-backup.js` diariamente.
- **Ubicación**: Los archivos se almacenan en `backend/backups/`. En producción, estos deben moverse a una ubicación externa (S3, Dropbox, etc.).

## 4. Contacto de Emergencia
- Administrador de Sistemas: [Nombre]
- Soporte Técnico: [Correo]

---
&copy; 2026 - Mendoza y Doicela - HR System
