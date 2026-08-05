# EMPLIFI — Plataforma ERP para PYMEs

[![Estado del Proyecto](https://img.shields.io/badge/Estado-Producción_Lista-success.svg)](#)
[![Stack Backend](https://img.shields.io/badge/Backend-Node.js_v20+_|_Express_v5-blue.svg)](#)
[![ORM](https://img.shields.io/badge/ORM-Prisma_v7.0-indigo.svg)](#)
[![Base de Datos](https://img.shields.io/badge/Base_de_Datos-PostgreSQL_v14+-blue.svg)](#)
[![Frontend](https://img.shields.io/badge/Frontend-React_v19_|_Vite_v6-61dafb.svg)](#)
[![Seguridad](https://img.shields.io/badge/Seguridad-AES--256--GCM_|_PBKDF2_|_RBAC-red.svg)](#)

> **EMPLIFI** es una solución web empresarial integral para la administración del talento humano, control de asistencia asistido por geocercas GPS, procesamiento automatizado de nómina, evaluación de desempeño 360°, inteligencia de negocios con analítica predictiva de *turnover*, e incubadora de proyectos.

---

## Portal de Documentación del Proyecto

Toda la documentación técnica detallada, guías de arquitectura, modelos de datos, APIs y operaciones del sistema han sido organizados en el directorio **[`docs/`](docs/)**:

* **[Centro Principal de Documentación](docs/README.md)** — Portal maestro de navegación del proyecto y artefactos Scrum.

### Módulos Destacados de Documentación
- **[01. Arquitectura del Sistema](docs/01-arquitectura/)**: Clean Architecture, macro/micro patrones y diagramas de flujo.
- **[02. Servicios Backend y API REST](docs/02-backend-servicios/)**: Especificación de 50+ endpoints, RBAC, SSO y seguridad.
- **[03. Motores Especializados](docs/03-motores-especializados/)**: PDF, Geocercas GPS (Haversine), Evaluaciones 360°, Biometría y Notificaciones.
- **[04. Base de Datos](docs/04-base-de-datos/)**: Esquema relacional Prisma / PostgreSQL y catálogos normativos.
- **[05. Frontend Web](docs/05-frontend-web/)**: SPA React, Vite, catálogo de 45+ componentes UI e interceptores Axios.
- **[06. Inteligencia y Analítica](docs/06-inteligencia-y-analitica/)**: Indicadores clave (eNPS, rotación) y analítica predictiva.
- **[07. Despliegue y Operaciones](docs/07-despliegue-y-operaciones/)**: Guía de instalación, auditoría, testing y DRP.
- **[08. Artefactos Scrum](docs/08-artefactos-scrum/)**: Requerimientos, Historias de Usuario, Sprints y Product Backlog (.docx).

---

## Stack Tecnológico

| Capa | Tecnologías Clave |
|---|---|
| **Backend API** | Node.js (v20+), Express (v5.1.0 ES Modules), Helmet, CORS |
| **Persistencia & ORM** | PostgreSQL 14+, Prisma ORM (v7.0.0 con `prisma.config.ts`) |
| **Seguridad & Cifrado** | AES-256-GCM (Salarios cifrados), PBKDF2 (100,000 iteraciones), JWT (Bearer), Bcrypt |
| **Frontend Web** | React 19.2.0, Vite, Tailwind CSS, Lucide Icons, Recharts, Framer Motion |
| **Comunicación HTTP** | Axios con Interceptores de Auth, 401 Refresh & 503 Maintenance Guard |

---

## Requisitos Previos

Asegúrate de contar con los siguientes elementos instalados antes del despliegue:

* **Node.js** v20.x o superior ([Descargar Node.js](https://nodejs.org/))
* **PostgreSQL** v14.x o superior ([Descargar PostgreSQL](https://www.postgresql.org/download/))
* **Git** v2.x o superior ([Descargar Git](https://git-scm.com/))
* **npm** (incluido con Node.js)

---

## Guía Rápida de Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone <URL-DEL-REPOSITORIO>
cd recursos_humanos
```

### 2. Configurar la Base de Datos PostgreSQL
Crea la base de datos principal desde `psql` o pgAdmin:
```sql
CREATE DATABASE db_recursos_humanos;
```

### 3. Configurar e Iniciar el Backend
```bash
cd backend

# Instalar dependencias
npm install

# Generar archivo de variables de entorno
copy .env.example .env # En Windows
# cp .env.example .env # En Linux/macOS
```

Configura tu archivo `backend/.env`:
```env
PORT=4000
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/db_recursos_humanos?schema=public
ENCRYPTION_KEY=tu_clave_de_encriptacion_hex_64_caracteres
JWT_SECRET=tu_jwt_secret_seguro
FRONTEND_URL=http://localhost:5173
```

> **Generar ENCRYPTION_KEY Segura (64 hex characters)**:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

Ejecutar migraciones de Prisma y poblar la base de datos con datos de prueba:
```bash
# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Poblado completo de datos (Seeders)
node -r dotenv/config prisma/seed.js

# Iniciar servidor backend en desarrollo
npm run dev
```
El servidor backend estará disponible en: `http://localhost:4000`

### 4. Configurar e Iniciar el Frontend Web
En una nueva ventana de terminal:
```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo Vite
npm run dev
```
El cliente web estará disponible en: `http://localhost:5173`

---

## Usuarios de Prueba (Seeders)

Una vez ejecutados los seeders, se activarán las siguientes credenciales predeterminadas para pruebas de roles:

| Rol | Correo Electrónico | Contraseña | Capacidades |
|---|---|---|---|
| **Administrador General** | `admin@emplifi.com` | `123456` | Acceso total, auditoría, parámetros, nómina y gestión global |
| **Empleado de Prueba** | `empleado@test.com` | `123456` | Autogestión, marcación GPS, consulta de roles de pago y permisos |

---

## Estructura del Proyecto

```
recursos_humanos/
├── backend/ # Servidor de API REST (Express + Prisma ORM)
│ ├── prisma/ # Esquema relacional (schema.prisma) y seeders
│ ├── src/
│ │ ├── controllers/ # Controladores HTTP de la API
│ │ ├── services/ # Lógica de negocio y algoritmos de cálculo
│ │ ├── repositories/ # Capa de acceso a datos Prisma
│ │ ├── middleware/ # Autenticación JWT, RBAC, Helmet y CORS
│ │ └── database/ # Instancia y configuración del cliente DB
│ ├── prisma.config.ts # Configuración de Prisma 7
│ └── package.json
├── frontend/ # Aplicación Cliente SPA (React + Vite)
│ ├── src/
│ │ ├── api/ # Cliente Axios centralizado con interceptores
│ │ ├── components/ # Componentes UI reutilizables (Sidebar, Cards, Tables)
│ │ ├── pages/ # 45+ Vistas agrupadas por módulos
│ │ ├── services/ # Servicios de integración frontend-backend
│ │ └── App.jsx # Enrutador principal y guards de navegación
│ └── package.json
├── docs/ # ÚNICO DIRECTORIO DE DOCUMENTACIÓN DEL PROYECTO
│ ├── 01-arquitectura/ # Arquitectura, Clean Arch y patrones
│ ├── 02-backend-servicios/ # API REST, RBAC, SSO, cifrado AES-256 y LOPDP
│ ├── 03-motores-especializados/ # PDF, Geocercas GPS, Evaluaciones 360 y Biometría
│ ├── 04-base-de-datos/ # Esquema relacional Prisma / PostgreSQL y catálogos
│ ├── 05-frontend-web/ # Arquitectura React + Vite y componentes UI
│ ├── 06-inteligencia-y-analitica/ # Módulo de Analítica Predictiva
│ ├── 07-despliegue-y-operaciones/ # Guías de instalación, auditoría, DRP y testing
│ ├── 08-artefactos-scrum/ # Artefactos formales de metodología Scrum (.docx)
│ └── README.md # Índice y portal maestro de navegación
└── README.md # Guía ejecutiva y de inicio rápido (Raíz)
```

---

## Seguridad y Verificación

Para validar de forma automatizada que el sistema de cifrado **AES-256-GCM** y las reglas de seguridad operan correctamente:

```bash
cd backend
node validate-implementation.js
```
Este comando ejecuta la suite de verificación comprobando 11 controles criticos de seguridad y cifrado de datos salariales.

---

## Autores & Créditos

Desarrollado con estándares de ingeniería de software por **Jorge Doicela**.

&copy; 2026 EMPLIFI — Todos los derechos reservados.

