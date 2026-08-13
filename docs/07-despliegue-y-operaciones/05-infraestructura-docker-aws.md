# 05 — Infraestructura Docker y Despliegue en AWS

## 1. Arquitectura de Contenedores

El sistema opera con 4 contenedores orquestados mediante Docker Compose:

```
┌──────────────────────────────────────────────────────────┐
│ Red Interna: rh_network (bridge)                         │
│                                                          │
│  ┌──────────┐    ┌──────────────────┐    ┌───────────┐  │
│  │PostgreSQL│    │ Node.js Backend  │    │  Nginx +  │  │
│  │  :5432   │◄───│   Express API    │◄───│   React   │  │
│  │(rh_postgres)  │   :5000          │    │  :80/443  │  │
│  └──────────┘    │ (rh_backend)     │    │(rh_frontend)  │
│                  └──────┬───────────┘    └───────────┘  │
│  ┌──────────┐           │                               │
│  │  Redis   │◄──────────┘                               │
│  │  :6379   │                                           │
│  │(rh_redis)│                                           │
│  └──────────┘                                           │
└──────────────────────────────────────────────────────────┘
```

## 2. Servicios Docker Compose

### 2.1 Base de Datos PostgreSQL

```yaml
db:
  image: postgres:15-alpine
  container_name: rh_postgres
  restart: always
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
    interval: 5s
    timeout: 5s
    retries: 5
  volumes:
    - postgres_data:/var/lib/postgresql/data
```

El volumen `postgres_data` persiste los datos de PostgreSQL fuera del ciclo de vida del contenedor.

### 2.2 Caché Redis

```yaml
redis:
  image: redis:7-alpine
  container_name: rh_redis
  restart: always
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
```

Redis actualmente está configurado en el compose para disponibilidad futura como adaptador de Socket.IO y caché de sesiones.

### 2.3 Backend API

```yaml
backend:
  build: ./backend
  container_name: rh_backend
  restart: always
  environment:
    PORT: 5000
    DATABASE_URL: postgresql://...@db:5432/...
    REDIS_URL: redis://redis:6379
    JWT_SECRET: ...
    ENCRYPTION_KEY: ...
    RP_ID: erp.jorgedoicela.com
  healthcheck:
    test: ["CMD-SHELL", "curl -sf http://localhost:5000/health || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 90s
  volumes:
    - uploads_data:/app/uploads
  depends_on:
    db:
      condition: service_healthy
    redis:
      condition: service_healthy
```

El `start_period: 90s` concede tiempo suficiente para que Prisma ejecute migraciones pendientes al iniciar. El healthcheck usa el endpoint `/health` del backend (sin consultar BD).

El volumen `uploads_data` persiste los archivos subidos (contratos, CVs, documentos de identidad) independientemente del ciclo del contenedor.

### 2.4 Frontend + Nginx

```yaml
frontend:
  build: ./frontend
  container_name: rh_frontend
  restart: always
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - /var/www/recursos_humanos/certs:/etc/nginx/certs:ro
  depends_on:
    backend:
      condition: service_healthy
```

El frontend solo arranca cuando el backend ya responde al healthcheck, eliminando el error 502 (Bad Gateway) durante el cold start. Los certificados SSL/TLS se montan desde el sistema de archivos del host AWS EC2 como volumen de solo lectura.

## 3. Dockerfile del Backend

El proceso de build del backend:
1. `node:20-alpine` como imagen base (ligera).
2. `COPY package*.json ./` + `npm ci --only=production` para instalar dependencias de producción.
3. `npx prisma generate` en el postinstall para generar el cliente Prisma.
4. `COPY . .` para copiar el código fuente.
5. `CMD ["node", "src/server.js"]` como comando de inicio.

Al arrancar, el servidor ejecuta `npx prisma migrate deploy` antes de iniciar Express para aplicar migraciones pendientes de forma automática en el entorno productivo.

## 4. Dockerfile del Frontend

1. **Build stage:** `node:20-alpine` para ejecutar `npm run build` (Vite produce `dist/`).
2. **Serve stage:** `nginx:alpine` para servir los activos estáticos del directorio `dist/`.

La configuración de Nginx incluye:
- Proxy inverso para `/api/*` → `http://backend:5000`
- Proxy inverso para `/uploads/*` → `http://backend:5000`
- `try_files $uri $uri/ /index.html` para soporte de rutas SPA (React Router).
- Redirección HTTP → HTTPS.
- Configuración SSL con certificados del volumen montado.

## 5. Variables de Entorno de Producción

| Variable | Descripción |
|---------|-------------|
| `DATABASE_URL` | URI completa de PostgreSQL (incluye host `db`, puerto, usuario, contraseña y base de datos) |
| `REDIS_URL` | URI de Redis (`redis://redis:6379`) |
| `JWT_SECRET` | Clave secreta para firmar JWT (mínimo 64 caracteres en producción) |
| `ENCRYPTION_KEY` | Clave hex de 32 bytes para AES-256-GCM (datos sensibles) |
| `RP_ID` | Relying Party ID para WebAuthn (dominio sin protocolo: `erp.jorgedoicela.com`) |
| `ALLOWED_ORIGINS` | Lista de dominios HTTPS permitidos para CORS y WebAuthn |
| `CLIENT_URL` | URL del frontend para redirecciones de correo (restablecimiento de contraseña) |
| `EMAIL_USER` | Correo de envío para Nodemailer |
| `EMAIL_PASS` | Contraseña de aplicación del correo (no la contraseña personal) |
| `SEED_SECRET` | Clave para proteger el endpoint `/api/seed` |

## 6. Healthcheck y Resiliencia

- `restart: always` en todos los servicios garantiza reinicio automático en caso de crash.
- El backend depende de PostgreSQL y Redis con `condition: service_healthy`, garantizando que no intente conectarse antes de que estén listos.
- El frontend depende del backend con `condition: service_healthy`, garantizando que Nginx no sirva peticiones de API antes de que el backend esté disponible.
- El endpoint `/health` del backend responde sin consultar la base de datos, retornando solo el status del proceso Node.js.

## 7. Dominio de Producción

El sistema está desplegado en:
- **Dominio:** `https://erp.jorgedoicela.com`
- **Servidor:** AWS EC2
- **Proxy:** Nginx con certificados SSL/TLS
- **Base de datos:** PostgreSQL 15 en contenedor con volumen persistente

## 8. Actualización (Deployment)

Para actualizar la aplicación en producción:

```bash
# En el servidor AWS EC2
cd /var/www/recursos_humanos

# 1. Obtener cambios
git pull origin main

# 2. Reconstruir y reiniciar (sin downtime si hay al menos 1 réplica)
docker compose up --build -d

# 3. Verificar estado
docker compose ps
docker compose logs --tail=50 backend
```

Las migraciones de Prisma se aplican automáticamente al iniciar el contenedor del backend mediante `prisma migrate deploy`.

## 9. Optimización de Carga, Resiliencia y Protección de Recursos (SaaS PyME)

Gracias a una arquitectura eficiente, modular y de baja huella de cómputo, la plataforma puede permitirse ofrecer **precios sumamente económicos y accesibles (\$0.50/emp) con 45 días de prueba gratuita**, democratizando el software para pequeñas y medianas empresas (PyMEs) sin comprometer la rentabilidad ni la estabilidad del servidor.

Esta infraestructura optimizada garantiza el rendimiento durante campañas masivas o presentaciones en congresos mediante los siguientes mecanismos:

1. **Aislamiento Multi-Tenant y Licenciamiento:**
   - Interceptor de datos Prisma que fuerza el aislamiento lógico por `tenantId`.
   - Control de cuotas de empleados (`maxEmployees`) por plan (Essential: 25, Growth: 100), previniendo el acaparamiento de memoria o CPU por un solo inquilino.
2. **Limitación de Tasa (Rate Limiting Anti-DDoS):**
   - Middleware `rateLimit.middleware.js` aplicado en los endpoints de autenticación, recuperación y registro público (`/auth/login`, `/tenants/register`).
3. **Gestión de Memoria y Rendimiento:**
   - Límite estricto de payload HTTP (`express.json({ limit: '20mb' })`) para evitar ataques por agotamiento de RAM.
   - Middleware de métricas en tiempo real `performance.middleware.js` para monitorear tiempos de respuesta.
4. **Caché y Re-autosanación:**
   - Redis 7 gestiona el estado y WebSockets en memoria sin impactar el almacenamiento en disco de PostgreSQL.
   - Contenedores Docker configurados con `restart: always` y `healthcheck` activo para reinicios transparentes en milisegundos ante picos de uso inusuales.
