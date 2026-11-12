# Deuda Técnica Backend Registrada (No Replicar)

Inventario verificado el 2026-11-12. Cada punto describe el estado actual, por qué es incorrecto y la solución arquitectónica. Corregir solo en tareas explícitas o cuando el archivo se toque por otra razón (regla del Boy Scout).

| # | Ubicación | Estado actual | Causa raíz / riesgo | Solución correcta |
|---|---|---|---|---|
| 1 | `core/middleware/errorHandler.js` | Clasifica errores por texto (`err.message.includes('Salario')`, `'Empleado no encontrado'`) | Servicios lanzan `Error` genérico en lugar de `AppError` | Migrar servicios a subclases de `AppError` y eliminar ramas por texto |
| 2 | `modules/auth/auth.middleware.js` y otros 9 archivos | `process.env.JWT_SECRET \|\| 'secret_key_change_me'` y similares | Arranque inseguro si falta la variable | Validar variables obligatorias en `config/env.js` al arrancar (fail-fast) y leer desde ahí |
| 3 | `modules/auth/auth.middleware.js` | Acepta token por `req.query.token` | Tokens en URL quedan en logs de Nginx e historial | Limitar a rutas de descarga firmadas con token de un solo uso |
| 4 | `modules/auth/auth.middleware.js` `authorize` | `superadmin` pasa cualquier `authorize([...])` | Contradice el aislamiento LOPDP del superadmin | `authorize` no debe conceder bypass; rutas de plataforma usan `superAdmin.middleware.js` |
| 5 | 25 servicios, jobs y middlewares | Importan `database/db.js` directamente | Violación de capas; impide mocks limpios | Mover consultas al repositorio del slice e inyectarlo |
| 6 | `attendance/absences/absence.controller.js` | Configuración de Multer, `console.log(req.body)`, validación manual de estado | Controlador con múltiples responsabilidades y fuga de PII en logs | Usar `core/storage/upload.middleware.js`, DTO Zod para `status`, eliminar logs |
| 7 | `whatsapp/whatsappAi.service.js`, `whatsapp/skills/requestVacation.skill.js` | Importan `sustainability/llmProvider.service.js` y `sustainabilityRag.service.js` directo | Import profundo entre dominios | Exportar desde `sustainability/index.js` e importar del contrato público |
| 8 | `prisma/schema.prisma` | 0 enums; estados y roles como `String` | Valores inválidos posibles en BD | Introducir enums Prisma con migración de datos, o validar con constantes congeladas + DTO |
| 9 | Respuestas HTTP | Coexisten envelope `{ success, data }` y objetos planos | Contrato inconsistente para el cliente | Envelope uniforme en código nuevo; migrar legado junto al consumidor |
| 10 | `backend/entrypoint.sh` | `prisma db push --accept-data-loss` después de `migrate deploy` en producción | Puede borrar columnas en producción sin migración versionada | Solo `prisma migrate deploy`; el drift se corrige con migraciones (ver `erp-base-de-datos`) |
| 11 | Archivos sobre límite | 93 archivos (ver `erp-ingenieria-software/references/limites-y-metricas.md`) | Responsabilidades mezcladas | Descomposición incremental con pruebas de caracterización |

