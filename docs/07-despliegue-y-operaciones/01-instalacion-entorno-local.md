# 01 — Instalación y Configuración del Entorno Local

## 1. Pre-requisitos

| Herramienta | Versión mínima |
|------------|----------------|
| Node.js | 20 LTS |
| npm | 10.x |
| Docker Desktop | 4.x |
| Docker Compose | 2.x |
| Git | 2.x |

## 2. Clonación y Configuración

```bash
# Clonar el repositorio
git clone <url-repositorio>
cd recursos_humanos

# Configurar variables de entorno del backend
cd backend
cp .env.example .env
# Editar .env con los valores locales
```

### 2.1 Variables de Entorno del Backend (`.env`)

```env
DATABASE_URL="postgresql://admin_rh:password@localhost:5432/db_recursos_humanos?schema=public"
JWT_SECRET="clave-super-secreta-de-al-menos-64-caracteres-para-desarrollo"
ENCRYPTION_KEY="tu-clave-hex-de-32-bytes-aqui"
RP_ID="localhost"
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:5174"
PORT=5000
FRONTEND_URL="http://localhost:5173"
CLIENT_URL="http://localhost:5173"
EMAIL_USER="tu-email@gmail.com"
EMAIL_PASS="tu-app-password-de-gmail"
SEED_SECRET="clave-seed-local"
```

## 3. Opción A: Levantamiento con Docker Compose (Recomendado)

```bash
# Desde la raíz del repositorio
docker compose up --build -d

# Verificar que todos los servicios están running
docker compose ps

# Ver logs del backend
docker compose logs -f backend

# Ver logs del frontend
docker compose logs -f frontend
```

La primera vez, Docker Compose:
1. Descarga las imágenes de PostgreSQL 15 y Redis 7.
2. Construye la imagen del backend (Node.js 20).
3. Ejecuta `npx prisma migrate deploy` automáticamente.
4. Construye la imagen del frontend (Vite + Nginx).
5. Inicia todos los servicios en orden de healthcheck.

La aplicación estará disponible en `http://localhost`.

## 4. Opción B: Levantamiento Manual (Solo base de datos con Docker)

```bash
# 1. Iniciar solo PostgreSQL y Redis con Docker
docker compose up -d db redis

# 2. Backend (modo desarrollo con hot reload)
cd backend
npm install
npx prisma migrate dev       # Ejecuta migraciones y genera el cliente Prisma
npm run dev                  # Nodemon en puerto 5000

# 3. Frontend (en otra terminal)
cd frontend
npm install
npm run dev                  # Vite en puerto 5173
```

## 5. Seed de Datos Iniciales

Para cargar datos de ejemplo en la base de datos:

```bash
# Opción 1: Desde la línea de comandos (backend debe estar corriendo)
cd backend
npm run seed

# Opción 2: Via HTTP (con SEED_SECRET configurado)
curl -X POST http://localhost:5000/api/seed \
  -H "Content-Type: application/json" \
  -d '{"secret": "tu-seed-secret"}'
```

El seed crea:
- 1 empresa (tenant) de ejemplo con plan GROWTH.
- 1 usuario administrador.
- Empleados de ejemplo con diferentes departamentos.
- Configuración de nómina base.
- Turnos y horarios de ejemplo.

## 6. Gestión de Base de Datos

```bash
# Ver y editar datos visualmente
cd backend
npx prisma studio    # Abre Prisma Studio en http://localhost:5555

# Ejecutar nueva migración
npx prisma migrate dev --name descripcion_del_cambio

# Aplicar migraciones en producción (sin crear nueva migración)
npx prisma migrate deploy

# Regenerar cliente Prisma (después de cambios en schema.prisma)
npx prisma generate
```

## 7. Testing

```bash
# Backend
cd backend
npm test            # Ejecuta pruebas con Vitest + Supertest

# Frontend
cd frontend
npm test            # Ejecuta pruebas con Vitest + Testing Library
```

## 8. URLs de Desarrollo

| Servicio | URL |
|---------|-----|
| Frontend (SPA) | http://localhost:5173 |
| Backend API | http://localhost:5000/api |
| Healthcheck | http://localhost:5000/health |
| Prisma Studio | http://localhost:5555 |
