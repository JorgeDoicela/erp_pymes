# Plan de Recuperación ante Desastres (Disaster Recovery Plan - DRP)

## 1. Métricas de Recuperación (RPO y RTO)

El plan de recuperación ante desastres establece las siguientes métricas de continuidad del servicio:

- **Recovery Point Objective (RPO)**: $\le 1\text{ hora}$ (Pérdida máxima de datos tolerada mediante respaldos periódicos).
- **Recovery Time Objective (RTO)**: $\le 30\text{ minutos}$ (Tiempo máximo de restablecimiento del servicio).

---

## 2. Matriz de Escenarios de Fallo y Protocolos de Respuesta

### 2.1. Caída de la Instancia de la API (Backend Node.js)
- **Diagnóstico**: Interrupción de respuestas HTTP con código `502 Bad Gateway` o `503 Service Unavailable`.
- **Procedimiento de Recuperación**:
  1. Verificar el gestor de procesos del sistema (`systemctl status hr-backend` o PM2).
  2. Inspeccionar logs de error en `/var/log/hr-backend/error.log`.
  3. Ejecutar reinicio del servicio: `systemctl restart hr-backend`.

### 2.2. Corrupción o Pérdida de Base de Datos PostgreSQL
- **Diagnóstico**: Excepciones de conexión Prisma Client (`P1001: Can't reach database server`).
- **Procedimiento de Restauración**:
  1. Detener las peticiones entrantes hacia la API REST.
  2. Restaurar el último dump válido de PostgreSQL mediante `pg_restore`:
     ```bash
     pg_restore --clean --no-owner --dbname=db_recursos_humanos backups/db_backup_latest.dump
     ```
  3. Ejecutar `npx prisma migrate deploy` para asegurar consistencia del esquema.
  4. Reiniciar el backend y verificar la integridad de claves cifradas AES-256-GCM.

### 2.3. Fallo durante Transacciones Críticas (Nómina o Evaluaciones)
- **Mecanismo Preventivo**: El motor de nómina y procesamiento de pagos ejecuta transacciones atómicas mediante `prisma.$transaction([])`.
- **Garantía de Consistencia**: Si ocurre una interrupción durante la generación de detalles de nómina, la transacción realiza un *rollback* completo a nivel de base de datos, impidiendo estados inconsistentes o duplicidades.

---

## 3. Política de Respaldos de Información

- **Frecuencia de Respaldos**: Respaldos automatizados de base de datos ejecutados mediante tarea cron cada 6 horas (`pg_dump -Fc`).
- **Almacenamiento Off-Site**: Réplica comprimida de respaldos transmitida hacia almacenamiento seguro externo (AWS S3 con cifrado en reposo).
