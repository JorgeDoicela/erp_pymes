# Proyecto PERN Stack

## Tecnologías

- **Stack**: PERN (PostgreSQL + Express + React + Node) con Prisma como ORM.
- **Backend**: Node.js, Express, Prisma, Helmet, CORS, dotenv, Nodemon (solo para desarrollo).
- **Base de datos**: PostgreSQL (usada con Prisma).
- **Frontend**: React 19 + Vite.
- **Estilos / Build**: TailwindCSS, PostCSS, Autoprefixer, esbuild, Rollup.
- **Calidad / Tooling**: ESLint, @eslint/js, eslint-plugin-react-hooks, tipos `@types/react` / `@types/react-dom`.
- **Otras librerías visibles en lockfiles**: react-refresh, react-dom, scheduler, zod, etc.

## Requisitos recomendados

- **Node.js**: usar versión moderna (recomendado: Node 20.x).
- **npm** (incluido con Node).
- **PostgreSQL** accesible (o usar contenedor Docker).
- **Git**.

## Pasos para configurar el proyecto (Windows / PowerShell)

Clonar e instalar respetando `package-lock.json`:

```powershell
# 1) Clonar repositorio
git clone <URL-del-repositorio>
cd <nombre-del-repositorio>

# 2) Backend
cd backend
# Usar npm ci para instalar según package-lock.json (más reproducible)
npm ci

# Crear archivo .env con DATABASE_URL antes de generar/migrar
# Ejemplo:
# DATABASE_URL="postgresql://USER:PASS@HOST:PORT/DATABASE"

# Generar cliente de Prisma
npx prisma generate

# Opcional: aplicar migraciones si hay (requiere DB accesible)
# npm run prisma:dev

# Arrancar servidor en desarrollo
npm run dev

# En otra terminal: Frontend
cd ..\frontend
npm ci
# Arrancar Vite (desarrollo)
npm run dev
# Para build de producción
# npm run build
```

## Notas rápidas

- Si `npm ci` falla por falta de lockfile actualizado, usar `npm install`.
- Asegurar que `.env` contenga `DATABASE_URL` correcto antes de ejecutar `prisma:migrate` o `prisma generate`.
- Para desarrollo simultáneo abrir **dos terminales**: uno en `backend` y otro en `frontend`.
- Si prefieres usar Docker para PostgreSQL, crea un contenedor y apunta `DATABASE_URL` al contenedor.
- Si necesitas que los comandos se ajusten a tu ruta específica (por ejemplo: `C:\Users\ismae\Desktop\Sistemas Web\recursos_humanos`), indícalo.
