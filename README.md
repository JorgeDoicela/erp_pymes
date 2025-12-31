# EMPLIFI - Sistema de Recursos Humanos

Sistema integral de gestión de recursos humanos desarrollado con React + Vite (Frontend) y Express + Prisma + PostgreSQL (Backend).

## Características Principales

- **Gestión de Empleados**: Registro, actualización y seguimiento completo del personal
- **Control de Asistencia**: Registro de entrada/salida, gestión de turnos y ausencias
- **Nómina**: Configuración, generación y consulta de pagos
- **Evaluaciones de Desempeño**: Creación y asignación de evaluaciones
- **Reclutamiento**: Gestión de vacantes y aplicaciones
- **Reportes y Analytics**: Dashboard con métricas clave y reportes personalizados
- **Gestión Documental**: Almacenamiento de contratos y documentos de empleados

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (v18 o superior) - [Descargar aquí](https://nodejs.org/)
- **PostgreSQL** (v14 o superior) - [Descargar aquí](https://www.postgresql.org/download/)
- **Git** - [Descargar aquí](https://git-scm.com/)
- **npm** o **yarn** (viene con Node.js)

## Instalación

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd recursos_humanos
```

### 2. Configurar la Base de Datos

#### Opción A: Usando pgAdmin o psql

```sql
CREATE DATABASE db_recursos_humanos;
```

#### Opción B: Desde la línea de comandos

```bash
psql -U postgres
CREATE DATABASE db_recursos_humanos;
\q
```

### 3. Configurar el Backend

```bash
cd backend
npm install
```

Crea un archivo `.env` en la carpeta `backend/` basándote en `.env.example`:

```env
PORT=4000
DATABASE_URL="postgresql://usuario:password@localhost:5432/db_recursos_humanos?schema=public"
ENCRYPTION_KEY="tu-clave-de-encriptacion-de-64-caracteres-hex"
JWT_SECRET="tu-secret-jwt-super-seguro"
FRONTEND_URL="http://localhost:5173"
```

> **Importante**: Genera una clave de encriptación segura ejecutando:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 4. Ejecutar Migraciones de Base de Datos

```bash
cd backend
npx prisma migrate dev
```

### 5. Poblar la Base de Datos con Datos de Prueba

El proyecto incluye seeders completos para generar datos de demostración:

```bash
cd backend
node -r dotenv/config prisma/seed.js
```

Esto creará:
- Usuario administrador: `admin@emplifi.com` / `123456`
- Usuario empleado de prueba: `empleado@test.com` / `123456`
- 25+ empleados adicionales con datos completos
- Vacantes de trabajo, aplicaciones, entrevistas
- Evaluaciones de desempeño, objetivos
- Contratos, documentos, horarios
- Historial de nómina
- Encuestas de clima laboral

### 6. Configurar el Frontend

```bash
cd frontend
npm install
```

Crea un archivo `.env` en la carpeta `frontend/` (opcional):

```env
VITE_API_URL=http://localhost:4000
```

## Ejecutar el Proyecto

### Opción 1: Ejecutar Backend y Frontend por Separado

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
El servidor estará disponible en `http://localhost:4000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`

### Opción 2: Usando Docker (Si está configurado)

```bash
docker-compose up
```

## Usuarios de Prueba

Después de ejecutar el seeder, puedes iniciar sesión con:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@emplifi.com | 123456 |
| Empleado | empleado@test.com | 123456 |

## Estructura del Proyecto

```
recursos_humanos/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Esquema de base de datos
│   │   ├── seed.js                # Orquestador de seeders
│   │   └── seeds/                 # Módulos de seeding
│   ├── src/
│   │   ├── controllers/           # Controladores de rutas
│   │   ├── middleware/            # Middlewares (auth, etc.)
│   │   ├── routes/                # Definición de rutas
│   │   ├── services/              # Lógica de negocio
│   │   ├── repositories/          # Acceso a datos
│   │   ├── utils/                 # Utilidades (encriptación, etc.)
│   │   └── server.js              # Punto de entrada
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/                   # Configuración de Axios
│   │   ├── components/            # Componentes reutilizables
│   │   ├── pages/                 # Páginas/Vistas
│   │   ├── services/              # Servicios de API
│   │   └── App.jsx                # Componente principal
│   └── package.json
│
└── README.md
```

## Scripts Útiles

### Backend

```bash
# Desarrollo
npm run dev

# Reiniciar base de datos (¡CUIDADO: Borra todos los datos!)
npx prisma migrate reset

# Generar cliente de Prisma
npx prisma generate

# Abrir Prisma Studio (interfaz visual de DB)
npm run prisma:studio

# Ejecutar seeder solo para un módulo
node -r dotenv/config prisma/seed.js --only=users
node -r dotenv/config prisma/seed.js --only=recruitment
```

### Frontend

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview de build
npm run preview
```

## Solución de Problemas

### Error: "Cannot find module '@prisma/client'"
```bash
cd backend
npx prisma generate
```

### Error: "Port 4000 is already in use"
Cambia el puerto en `backend/.env` o detén el proceso que usa el puerto 4000.

### Error al conectar con PostgreSQL
Verifica que:
1. PostgreSQL esté corriendo
2. La URL de conexión en `.env` sea correcta
3. El usuario tenga permisos en la base de datos

### Pantalla en blanco en el frontend
1. Verifica que el backend esté corriendo
2. Revisa la consola del navegador para errores
3. Asegúrate de que `VITE_API_URL` sea correcto

## Tecnologías Utilizadas

### Backend
- **Express.js** - Framework web
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **bcryptjs** - Hash de contraseñas
- **Multer** - Upload de archivos

### Frontend
- **React 19** - Librería UI
- **Vite** - Build tool
- **React Router** - Navegación
- **Axios** - Cliente HTTP
- **Recharts** - Gráficos
- **Framer Motion** - Animaciones
- **Tailwind CSS** - Estilos

## Licencia

Este proyecto es privado y de uso educativo.

## Contribución

Para contribuir al proyecto:

1. Crea un fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Soporte

Para reportar problemas o solicitar nuevas características, abre un issue en el repositorio.

---

Desarrollado con dedicación para la gestión eficiente de recursos humanos
