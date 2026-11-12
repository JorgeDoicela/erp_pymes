---
name: erp-base-de-datos
description: >-
  Activa esta skill al modificar backend/prisma (schema.prisma, migraciones, seeds), crear modelos o
  columnas, índices, relaciones, consultas Prisma complejas, transacciones, pgvector o el interceptor
  multi-tenant de backend/src/database/db.js en Norma ERP (PostgreSQL 15 + pgvector, Prisma 5).
---

# Base de Datos Norma ERP — PostgreSQL 15, Prisma 5 y pgvector

Presupone `erp-ingenieria-software` y `erp-backend`. Para datos sensibles activar también `erp-seguridad-multitenant`.

---

## 1. Estado Actual del Esquema

| Elemento | Valor |
|---|---|
| Archivo | `backend/prisma/schema.prisma` (~1350 líneas, 64 modelos, 0 enums, 131 `@@index`) |
| Motor | PostgreSQL 15 con extensión `vector` (imagen `pgvector/pgvector:pg15`) |
| IDs | `String @id @default(cuid())` |
| Tablas | Todas con `@@map("snake_case")`; campos Prisma en `camelCase` |
| Auditoría temporal | `createdAt @default(now())`, `updatedAt @updatedAt` |
| Multi-tenant | `tenantId` directo en 23 modelos; el resto hereda por relación (`employee.tenantId`, `payroll.tenantId`, etc.) |
| Datos cifrados | `Employee.salary` (String cifrado AES), coordenadas de geocerca |
| Vectorial | `embedding vector(768)` con índice HNSW `vector_cosine_ops` (migración `20261112000000_add_pgvector_rag_index`) |
| Migraciones | `backend/prisma/migrations/` (26 migraciones, formato `YYYYMMDDHHMMSS_descripcion_snake`) |
| Seeds | `backend/prisma/seeds/<dominio>/` (11 dominios) con barril `seeds/index.js`, orquestado por `prisma/seed.js` |
| `binaryTargets` | `native`, `debian-openssl-3.0.x` (imagen `node:20-slim`), `rhel-openssl-*` |

---

## 2. Procedimiento para Agregar o Modificar un Modelo

1. Diseñar el modelo según las consultas reales (filtros, ordenamientos, joins).
2. Aplicar convenciones:
   ```prisma
   model OvertimeRequest {
     id         String   @id @default(cuid())
     employeeId String
     employee   Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
     date       DateTime
     hours      Decimal  @db.Decimal(6, 2)
     type       String
     status     String   @default("PENDING")
     createdAt  DateTime @default(now())
     updatedAt  DateTime @updatedAt

     @@index([employeeId, date])
     @@index([status])
     @@map("overtime_requests")
   }
   ```
3. **Registrar el aislamiento multi-tenant** en `backend/src/database/db.js`:
   * `tenantId` directo -> `DIRECT_TENANT_MODELS`.
   * Relación directa a `Employee` -> `EMPLOYEE_RELATION_MODELS`.
   * Relación indirecta -> `INDIRECT_RELATION_MAP` con la ruta hasta `tenantId`.
   Omitir este paso deja el modelo sin filtro automático de tenant (fuga de datos entre empresas).
4. Crear la migración versionada:
   ```bash
   npm run prisma:migrate -- --name add_overtime_requests
   ```
5. Revisar el SQL generado en `migrations/<timestamp>_add_overtime_requests/migration.sql` (índices, `NOT NULL` con default o backfill, tipos).
6. Agregar seed del dominio en `prisma/seeds/<dominio>/` solo si es catálogo o dato demo necesario, y exportarlo en `seeds/index.js`.
7. Implementar el repositorio del slice (ver `erp-backend`) y pruebas.
8. Documentar en `docs/04-base-de-datos/01-esquema-relacional-norma.md`.

---

## 3. Reglas de Modelado

* **Dinero:** columnas nuevas con `Decimal @db.Decimal(14, 2)` (montos) o `@db.Decimal(6, 4)` (tasas). El legado en `Float`/`String` no se replica; `salary` permanece `String` por cifrado.
* **Estados y tipos:** el esquema no usa enums Prisma; los valores válidos se definen como constantes congeladas en el DTO del slice (`OVERTIME_STATUSES`) y se validan con `z.enum`. Introducir enums Prisma requiere migración de datos planificada (deuda registrada en `erp-backend`).
* **Claves foráneas:** índice explícito en toda FK usada en filtros; compuesto cuando la consulta filtra por varias columnas (`@@index([tenantId, status])`).
* **Unicidad por tenant:** usar `@@unique([tenantId, code])`, nunca `@unique` global para datos de empresa (el legado `Employee.email @unique` es global por diseño de login).
* **Borrado:** `onDelete: Cascade` solo para dependientes sin valor legal propio; documentos laborales, nómina y asientos contables usan estados (`CANCELLED`, `VOID`) en lugar de borrado físico (obligación de conservación).
* **Fechas de calendario** (sin hora legal): persistir a las `12:00:00Z` del día para evitar corrimientos por zona horaria (`parseCanonicalCalendarDate`).
* **Nulos:** `tenantId` nullable existe por compatibilidad con superadmin/plataforma; en modelos nuevos de tenant, `tenantId String` obligatorio.

---

## 4. Reglas de Consulta

| Regla | Detalle |
|---|---|
| Proyección explícita | `select` con los campos necesarios; `include` solo con `select` anidado. Nunca devolver `password` |
| Sin N+1 | Cargar relaciones en la misma consulta o con `findMany({ where: { id: { in } } })`; prohibido `await` dentro de `for` sobre colecciones de BD |
| Filtrado en BD | Prohibido traer colecciones completas para filtrar con `Array.filter` |
| Paginación | `skip`/`take` + `count` en `$transaction([...])` |
| Transacciones | `prisma.$transaction(async (tx) => ...)` para escrituras multi-entidad; todo dentro usa `tx` |
| Bypass de tenant | `runWithoutTenantFilter` solo en verificaciones internas de plataforma, documentado en el código con la justificación |
| SQL crudo | `$queryRaw` con plantillas parametrizadas (nunca `$queryRawUnsafe` con interpolación). Necesario para `pgvector` (`<=>`) |

---

## 5. pgvector y Corpus RAG

* Dimensión fija 768 (`intfloat/multilingual-e5-base`). Cambiar de modelo de embeddings exige nueva columna o re-vectorización completa con migración.
* Búsqueda: `ORDER BY embedding <=> $1::vector LIMIT k` con índice HNSW; combinar con filtro por `tenantId` para documentos privados.
* Hidratación idempotente por `contentHash` (`sustainabilityRepository.ensurePgVectorCorpusSeeded`); no duplicar filas.

---

## 6. Migraciones en Entornos

| Entorno | Comando permitido | Prohibido |
|---|---|---|
| Local | `npm run prisma:migrate` (`migrate dev`) | Editar migraciones ya aplicadas en `develop`/`main` |
| CI | `prisma generate` (vía `postinstall`) | Conexión a BD de producción |
| Producción | `prisma migrate deploy` (entrypoint) | `prisma db push --accept-data-loss` (presente hoy en `entrypoint.sh`; deuda crítica), cambios manuales por SQL |

Toda migración destructiva (drop de columna, cambio de tipo) se hace en dos despliegues: (1) agregar columna nueva + backfill + código compatible; (2) eliminar la columna antigua.

---

## 7. Verificación

```bash
npx --prefix backend prisma validate
npx --prefix backend prisma format
npm --prefix backend run test
```

Confirmar con el desarrollador la aplicación local de la migración (`npm run prisma:migrate`) y revisar `migration.sql` en el PR.

