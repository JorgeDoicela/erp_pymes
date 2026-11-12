---
name: erp-infraestructura-deploy
description: >
  Activa esta skill en tareas de Docker, Docker Compose, Nginx, GitHub Actions
  (ci.yml, deploy.yml, rollback.yml), despliegue en AWS EC2 por SSH, imágenes
  en GHCR, variables de entorno, hooks Husky, Conventional Commits y reglas
  de protección de ramas (main y develop) en Norma ERP.
---

# Infraestructura, CI/CD y Despliegue — Norma ERP

**Rol:** Ingeniero DevOps y SysAdmin Senior de Norma ERP. Administras la topología Docker Compose (`db`, `redis`, `backend`, `frontend`, `gateway`), los workflows de GitHub Actions (`ci.yml`, `deploy.yml`, `rollback.yml`), el despliegue en AWS EC2 vía GHCR + SSH, los scripts de backup y la protección de ramas en GitHub.

**Combinar siempre con:** `sysadmin` (global) + `erp-ingenieria-software` (base transversal) + `erp-seguridad-multitenant`.

---

## 1. Topología de Contenedores (Docker Compose)

Archivo base: `docker-compose.yml` en la raíz del proyecto.

| Servicio | Imagen / Build | Puerto Interno | Rol y Dependencias |
|----------|---------------|----------------|--------------------|
| `db` | `pgvector/pgvector:pg15` | `5432` | Base de datos PostgreSQL 15 con extensión vectorial `pgvector`. Volumen persistente `postgres_data`. Healthcheck con `pg_isready`. |
| `redis` | `redis:7-alpine` | `6379` | Caché en memoria, sesiones, colas y rate-limiting. Healthcheck con `redis-cli ping`. |
| `backend` | `./backend/Dockerfile` (`node:20-slim`) | `3000` | API REST Express 5 + Prisma 5 + ONNX runtime. Depende de `db` (healthy) y `redis` (healthy). Ejecuta `entrypoint.sh`. |
| `frontend` | `./frontend/Dockerfile` (multi-stage Vite -> Nginx) | `80` | SPA React 19 servida por Nginx interno. |
| `gateway` | `nginx:alpine` | `80`, `443` | Reverse proxy principal, terminación TLS/SSL (`./certs`), enrutamiento `/api` -> `backend:3000` y `/` -> `frontend:80`. |

### 1.1 Reglas de Dockerfiles y Contenedores

1. **Imágenes base fijas:** Usar tags específicos (`node:20-slim`, `pgvector/pgvector:pg15`, `redis:7-alpine`). Prohibido usar `latest`.
2. **Dependencias nativas de Prisma y ONNX:** El contenedor `backend` requiere `openssl`, `ca-certificates` y `curl` (para healthchecks). No cambiar a `alpine` en el backend porque rompe los binarios de `@huggingface/transformers` (ONNX Runtime requiere `glibc`).
3. **Multi-stage en Frontend:** Compilar siempre en etapa `builder` (`node:20-alpine`) y copiar únicamente `dist/` a la etapa final `nginx:alpine`.
4. **Secuencia de arranque (`backend/entrypoint.sh`):**
   - `npx prisma migrate deploy` (aplica migraciones versionadas).
   - Nota de deuda técnica: eliminar `prisma db push --accept-data-loss` de producción una vez verificada la paridad de migraciones.
   - `node prisma/seed.js` (idempotente, condicionado a `RUN_SEED`).
   - `node src/modules/sustainability/data/syncHuggingFaceModels.js ensure` (verifica/descarga artefactos ONNX e índice desde Hugging Face Hub si faltan).
   - `exec node src/server.js` (reemplaza el proceso shell para recibir señales `SIGTERM` / `SIGINT` limpiamente).
5. **Redes y volúmenes:** Todos los servicios se comunican por la red interna `erp_network`. Solo `gateway` expone puertos públicos en producción (`80` y `443`).

---

## 2. Pipelines CI/CD (GitHub Actions)

Directorio: `.github/workflows/`.

### 2.1 Integración Continua (`ci.yml`)

Se dispara en `push` y `pull_request` hacia `develop` y `main`. Consta de 3 jobs obligatorios:

| Job (Check requerido) | Responsabilidad |
|-----------------------|-----------------|
| `Security & Secret Scan` | Ejecuta `secretlint` y auditoría de secretos en el árbol de código. |
| `Backend QA & Architecture` | Levanta servicio `pgvector:pg15` de prueba, ejecuta `npm ci`, `prisma generate`, `npm run lint`, `npm test` y el script de auditoría arquitectónica. |
| `Frontend QA & Build` | Ejecuta `npm ci`, `npm run lint`, `npm test` y verifica que `npm run build` compile sin errores ni advertencias críticas. |

### 2.2 Despliegue Continuo (`deploy.yml`)

Se dispara en `push` a `main` o manualmente (`workflow_dispatch`). Grafo de ejecución (DAG):

```
detect-changes
  ├─► backend-qa  ─► build-and-push-backend (GHCR) ─┐
  └─► frontend-qa ─► build-and-push-frontend (GHCR) ┴─► deploy-ec2 (SSH) ─► post-deploy-healthcheck
```

1. **Registro de imágenes:** GitHub Container Registry (`ghcr.io/<owner>/erp_pymes-backend` y `frontend`), etiquetadas con el SHA del commit y `latest`.
2. **Despliegue remoto:** Vía `appleboy/ssh-action` hacia la instancia AWS EC2 de producción:
   - Login en GHCR desde EC2.
   - `docker compose pull` de los servicios actualizados.
   - `docker compose up -d --remove-orphans`.
   - Limpieza de imágenes huérfanas (`docker image prune -f`).
3. **Verificación post-deploy:** Comprobación del endpoint `/api/health` y estado `healthy` de los contenedores; si falla, dispara rollback automático.

### 2.3 Rollback (`rollback.yml`)

Workflow manual (`workflow_dispatch`) que recibe el `image_tag` (SHA anterior estable), actualiza los contenedores en EC2 a esa versión y verifica el healthcheck. Nota: los rollbacks de código no revierten migraciones destructivas de base de datos; por ello toda migración debe ser retrocompatible (expand-and-contract).

---

## 3. Gobernanza Git y Protección de Ramas

### 3.1 Ramas y Rulesets Activos en GitHub

| Rama | Ruleset ID | Propósito | Reglas Aplicadas |
|------|-----------|-----------|------------------|
| `main` | `26961019` (`main-protection`) | Producción estable | Bloqueo total de escritura para colaboradores (`creation`, `update`, `deletion`, `non_fast_forward`), PR obligatorio, 3 checks de CI obligatorios (`Security & Secret Scan`, `Backend QA & Architecture`, `Frontend QA & Build`), resolución de conversaciones, historial lineal, **Exclusividad de Bypass únicamente para el Repository Admin (`Jorge Doicela`)**. |
| `develop` | `26961066` (`develop-protection`) | Integración del equipo | Prohibido push directo (`update` restringido a PR), eliminaciones y force-push bloqueados, PR obligatorio (0 aprobaciones requeridas para agilizar flujo, pero los 3 checks de CI son estrictamente obligatorios antes de merge), resolución de conversaciones obligatoria, Admin en lista de bypass. |
| `<nombre_apellido>` | — | Ramas de trabajo por desarrollador | Ej. `jorge_doicela`, `derek_murillo`. Se crean desde `develop` y se integran a `develop` exclusivamente vía Pull Request con CI en verde. |

### 3.2 Flujo de Trabajo Diario

```
Rama personal (jorge_doicela / derek_murillo)
  │
  ├─► Pull Request ──► CI (3 checks en verde) ──► Merge a develop
                                                     │
                                                     ▼ (Solo Admin: Jorge Doicela)
                                               Pull Request a main
                                                     │
                                                     ▼
                                               Deploy automático a AWS EC2
```

### 3.3 Hooks Locales (Husky) y Commits

- **`pre-commit`:** Ejecuta `lint-staged` (ESLint + Prettier en archivos modificados) y `secretlint`.
- **`commit-msg`:** Valida formato **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `ci:`, `perf:`).
- **`pre-push`:** Ejecuta la suite de pruebas (`npm test`).
- **Prohibición absoluta:** Nunca usar `--no-verify` para saltar hooks locales salvo emergencia de producción autorizada explícitamente por el administrador.

---

## 4. Gestión de Variables de Entorno y Secretos

El archivo `.env.example` documenta las 9 secciones requeridas:
1. Servidor y Entorno (`NODE_ENV`, `PORT`, `FRONTEND_URL`).
2. Base de Datos y Redis (`DATABASE_URL`, `REDIS_URL`).
3. Seguridad y Autenticación (`JWT_SECRET`, `JWT_EXPIRES_IN`, `ENCRYPTION_KEY` de 32 bytes hex, `SUPERADMIN_BOOTSTRAP_*`).
4. WebAuthn / Biometría (`RP_ID`, `RP_NAME`, `RP_ORIGIN`).
5. Proveedores LLM e IA (`ACTIVE_LLM_PROVIDER`, `DEEPSEEK_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`).
6. WhatsApp Business API (`WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`).
7. Correo SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`).
8. Almacenamiento y Firma Electrónica (`UPLOAD_DIR`, `MAX_FILE_SIZE`).
9. Monitoreo y Rate Limiting.

### Reglas de Variables de Entorno

- **Sincronización obligatoria:**Toda variable nueva leída con `process.env.<VAR>` debe agregarse en el mismo PR a `.env.example` con un valor placeholder seguro (nunca credenciales reales).
- **Sin defaults inseguros en código:** Prohibido `process.env.JWT_SECRET || 'secret'`. Validar existencia al arrancar el servidor (`src/config/`).

---

## 5. Scripts Operativos del Proyecto

| Script | Ruta | Propósito |
|--------|------|-----------|
| Backup de BD | `scripts/db/backup-db.sh` | Dump comprimido (`pg_dump` + `gzip`) con rotación de copias. Ejecutar antes de migraciones mayores en producción. |
| Reparación de slugs | `scripts/maintenance/fix-corrupt-slugs.mjs` | Script de mantenimiento idempotente para normalizar slugs de tenants. |
| Pruebas de estrés | `scripts/test/stress-test.mjs` | Pruebas de carga concurrente sobre endpoints críticos. |
| Auditoría arquitectónica | `.agents/skills/erp-ingenieria-software/scripts/audit-architecture.mjs` | Valida límites de líneas, aislamiento de capas e imports prohibidos. |

---

## 6. Verificación antes de Cerrar Tareas de Infraestructura

```bash
# Validar sintaxis de Docker Compose
docker compose config -q

# Ejecutar auditoría de secretos
npx secretlint "**/*"

# Verificar estado de rulesets en GitHub (requiere gh CLI autenticado)
gh api repos/:owner/:repo/rulesets
```

