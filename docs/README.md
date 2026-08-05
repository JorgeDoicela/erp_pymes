# EMPLIFI — Portal de Documentación del Proyecto

Bienvenido al centro principal de documentación de **EMPLIFI** (Sistema de Gestión Integral de Recursos Humanos & Analítica).

Este repositorio concentra tanto la especificación técnica modular de ingeniería de software como los artefactos formales de gestión de proyecto (Metodología Scrum).

---

## 🗺️ Mapa General de Módulos de Documentación

```
docs/
├── 01-arquitectura/           # 🏛️ Macro/Micro arquitectura, Clean Arch y patrones
├── 02-backend-servicios/      # ⚙️ Catálogo API REST, RBAC, SSO, cifrado AES-256 y LOPDP
├── 03-motores-especializados/ # 🔧 PDF, Geofencing GPS, Evaluaciones 360°, Biometría y Notificaciones
├── 04-base-de-datos/          # 🗄️ Esquema relacional Prisma / PostgreSQL y catálogos
├── 05-frontend-web/           # 💻 Arquitectura React + Vite, componentes UI y resiliencia Axios
├── 06-inteligencia-y-analitica/# 📊 Indicadores clave (eNPS, turnover) y analítica predictiva
├── 07-despliegue-y-operaciones/# 🚀 Instalación local, auditoría, DRP y guía de testing
├── 08-artefactos-scrum/       # 📋 Requerimientos, Historias de Usuario, Sprints y Backlog (.docx)
└── README.md                  # 📖 Portal Maestro de Navegación
```

---

## 📚 Secciones Principales

### 1. 🏛️ [01. Arquitectura del Sistema](01-arquitectura/)
- **[00-arquitectura-general.md](01-arquitectura/00-arquitectura-general.md)**: Visión integral de arquitectura y componentes del sistema.
- **[01-macro-arquitectura-clean-arch.md](01-arquitectura/01-macro-arquitectura-clean-arch.md)**: Arquitectura en capas (Presentación, Servicios, Persistencia) y secuencias HTTP.
- **[02-micro-arquitecturas-patrones.md](01-arquitectura/02-micro-arquitecturas-patrones.md)**: Repository Pattern, interceptores middleware y cifrado AES-256-GCM.

### 2. ⚙️ [02. Servicios Backend y API REST](02-backend-servicios/)
- **[01-especificacion-api-rest.md](02-backend-servicios/01-especificacion-api-rest.md)**: Catálogo de 50+ endpoints REST con DTOs, verbos HTTP y parámetros.
- **[02-autenticacion-sso-y-rbac.md](02-backend-servicios/02-autenticacion-sso-y-rbac.md)**: Matriz de roles y permisos RBAC (`admin`, `hr`, `employee`, `accounting`, `entrepreneur`).
- **[03-gobernanza-lopdp-y-auditoria.md](02-backend-servicios/03-gobernanza-lopdp-y-auditoria.md)**: Cumplimiento de ley LOPDP, AuditLog y protección de archivos estáticos.
- **[04-workflow-evaluaciones-y-nomina.md](02-backend-servicios/04-workflow-evaluaciones-y-nomina.md)**: Algoritmos de cálculo de nómina, horas extras y ausencias.
- **[05-encriptacion-salarios-y-seguridad.md](02-backend-servicios/05-encriptacion-salarios-y-seguridad.md)**: Cifrado AES-256-GCM, PBKDF2, Helmet, CORS y variables de entorno.

### 3. 🔧 [03. Motores Especializados](03-motores-especializados/)
- **[01-motor-documental-pdf.md](03-motores-especializados/01-motor-documental-pdf.md)**: Generación dinámica de contratos, roles de pago y certificados en PDF.
- **[02-motor-asistencia-y-geofencing.md](03-motores-especializados/02-motor-asistencia-y-geofencing.md)**: Cálculo de geocercas GPS mediante fórmula Haversine y tolerancias de marcación.
- **[03-motor-evaluacion-desempeno-360.md](03-motores-especializados/03-motor-evaluacion-desempeno-360.md)**: Rúbricas cuantitativas, evaluadores par/jefe/auto y ponderaciones.
- **[04-motor-biometrico-y-seguridad.md](04-motor-biometrico-y-seguridad.md)**: Integración de credenciales biométricas y seguridad de credenciales.
- **[05-motor-notificaciones-multicanal.md](05-motor-notificaciones-multicanal.md)**: Notificaciones in-app, correos SMTP y preferencias de usuario.

### 4. 🗄️ [04. Base de Datos](04-base-de-datos/)
- **[01-esquema-relacional-emplifi.md](04-base-de-datos/01-esquema-relacional-emplifi.md)**: Especificación técnica del esquema relacional Prisma / PostgreSQL.
- **[02-catalogos-y-normativa-laboral.md](04-base-de-datos/02-catalogos-y-normativa-laboral.md)**: Catálogos del sistema, enums y coeficientes de cálculo de nómina.

### 5. 💻 [05. Frontend Web](05-frontend-web/)
- **[01-arquitectura-react-vite.md](05-frontend-web/01-arquitectura-react-vite.md)**: Single Page Application (SPA), React Router DOM v6 y guardias `RequireAuth`.
- **[02-componentes-ui-y-layout.md](05-frontend-web/02-componentes-ui-y-layout.md)**: Catálogo técnico de 45+ vistas organizadas por módulos de negocio.
- **[03-integracion-api-y-resiliencia.md](05-frontend-web/03-integracion-api-y-resiliencia.md)**: Cliente Axios centralizado, interceptor de token, refresco 401 y modo mantenimiento 503.

### 6. 📊 [06. Inteligencia y Analítica](06-inteligencia-y-analitica/)
- **[01-modulo-ia-y-reportes-predictivos.md](06-inteligencia-y-analitica/01-modulo-ia-y-reportes-predictivos.md)**: Indicadores de gestión (rotación, eNPS) y proyecciones.

### 7. 🚀 [07. Despliegue y Operaciones](07-despliegue-y-operaciones/)
- **[01-instalacion-entorno-local.md](07-despliegue-y-operaciones/01-instalacion-entorno-local.md)**: Guía paso a paso de instalación local, PostgreSQL, Prisma 7 y seeders.
- **[02-guia-auditoria-y-cumplimiento.md](07-despliegue-y-operaciones/02-guia-auditoria-y-cumplimiento.md)**: Lista de verificación de auditoría y seguridad.
- **[03-plan-recuperacion-desastres.md](07-despliegue-y-operaciones/03-plan-recuperacion-desastres.md)**: Plan de Recuperación ante Desastres (DRP) y estrategia RPO/RTO.
- **[04-guia-testing.md](07-despliegue-y-operaciones/04-guia-testing.md)**: Estrategia de pruebas unitarias e integración de backend/frontend.

### 8. 📋 [08. Artefactos de Gestión Scrum](08-artefactos-scrum/)
Documentos formales elaborados durante las fases de análisis, diseño y ejecución del proyecto:
1. **[1. Introducción y Modulos.docx](08-artefactos-scrum/1.%20Introducci%C3%B3n%20y%20Modulos.docx)**: Alcance funcional e introducción.
2. **[2. Requerimientos.docx](08-artefactos-scrum/2.%20Requerimientos.docx)**: Especificación de requerimientos funcionales y no funcionales.
3. **[3. Roles.docx](08-artefactos-scrum/3.%20Roles.docx)**: Matriz de roles del equipo y del sistema.
4. **[4. Factibilidad.docx](08-artefactos-scrum/4.%20Factibilidad.docx)**: Estudio de factibilidad técnica, operativa y económica.
5. **[5. Historias de usuario.docx](08-artefactos-scrum/5.%20Historias%20de%20usuario.docx)** / **[5.1. Historias de usuario.docx](08-artefactos-scrum/5.1.%20Historias%20de%20usuario.docx)**: Historias de usuario detalladas.
6. **[6. Product Backlog.docx](08-artefactos-scrum/6.%20Product%20Backlog.docx)**: Pila del producto priorizada.
7. **[7. Sprints.docx](08-artefactos-scrum/7.%20Sprints.docx)** / **[7.1. Sprints.docx](08-artefactos-scrum/7.1.%20Sprints.docx)**: Planificación y revisión de Sprints.
8. **[8. Tecnologias y arquitectura.docx](08-artefactos-scrum/8.%20Tecnologias%20y%20arquitectura.docx)**: Fundamentación tecnológica.

---

## ⚡ Enlaces de Acceso Rápido

- 🚀 **[Guía de Instalación Local](07-despliegue-y-operaciones/01-instalacion-entorno-local.md)**
- 🔒 **[Seguridad y Cifrado AES-256](02-backend-servicios/05-encriptacion-salarios-y-seguridad.md)**
- 💻 **[Arquitectura Frontend React](05-frontend-web/01-arquitectura-react-vite.md)**
- 🧪 **[Guía de Testing](07-despliegue-y-operaciones/04-guia-testing.md)**
- 🛠️ **[Plan de Recuperación DRP](07-despliegue-y-operaciones/03-plan-recuperacion-desastres.md)**

---
&copy; 2026 **Mendoza y Doicela** — Sistema EMPLIFI
