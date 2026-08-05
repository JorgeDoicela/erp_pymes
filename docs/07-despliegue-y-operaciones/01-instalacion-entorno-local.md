# 01. Guía de Instalación y Despliegue en Entorno Local

## 1. Requisitos Previos del Sistema

Para ejecutar localmente el ecosistema **EMPLIFI**, asegúrese de contar con las siguientes herramientas instaladas:

- **Node.js**: v18.x o superior.
- **PostgreSQL**: v14.x o superior.
- **Git**: Versión reciente.
- **npm** o **yarn**: Gestor de paquetes Node.

---

## 2. Paso a Paso para la Instalación

### 2.1. Clonar el Repositorio
```bash
git clone <url-repositorio>
cd recursos_humanos
```

### 2.2. Configuración de Base de Datos PostgreSQL
Cree la base de datos vacía desde la consola `psql` o cliente visual (pgAdmin / DBeaver):
```sql
CREATE DATABASE db_recursos_humanos;
```

### 2.3. Configuración y Ejecución del Backend
```bash
cd backend
npm install
```

Cree el archivo `.env` en la raíz de `backend/`:
```env
PORT=4000
DATABASE_URL="postgresql://postgres:password@localhost:5432/db_recursos_humanos?schema=public"
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
JWT_SECRET="super-secret-key-emplifi-2026"
FRONTEND_URL="http://localhost:5173"
```

Ejecute las migraciones de Prisma y ejecute el seeder de prueba:
```bash
npx prisma migrate dev
node -r dotenv/config prisma/seed.js
npm run dev
```

### 2.4. Configuración y Ejecución del Frontend
```bash
cd ../frontend
npm install
npm run dev
```

La aplicación web estará disponible en `http://localhost:5173`.

---

## 3. Credenciales de Prueba Generadas por el Seeder

| Rol | Correo Electrónico | Contraseña |
|---|---|---|
| Administrador | `admin@emplifi.com` | `123456` |
| Empleado | `empleado@test.com` | `123456` |
