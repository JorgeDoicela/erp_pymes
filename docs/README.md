# Documentación Técnica — Emplifi

Documentación técnica del sistema de gestión de talento humano Emplifi. Cada sección corresponde a un dominio funcional o capa técnica del sistema.

## Índice de Secciones

### 01 — Arquitectura del Sistema
- [00 — Arquitectura General](./01-arquitectura/00-arquitectura-general.md)
- [01 — Clean Architecture y Macro-Estructura](./01-arquitectura/01-macro-arquitectura-clean-arch.md)
- [02 — Micro-Arquitecturas y Patrones](./01-arquitectura/02-micro-arquitecturas-patrones.md)

### 02 — Backend y Servicios
- [01 — Especificación de API REST](./02-backend-servicios/01-especificacion-api-rest.md)
- [02 — Autenticación, SSO y RBAC](./02-backend-servicios/02-autenticacion-sso-y-rbac.md)
- [03 — Gobernanza, LOPDP y Auditoría](./02-backend-servicios/03-gobernanza-lopdp-y-auditoria.md)
- [04 — Workflows de Evaluaciones y Nómina](./02-backend-servicios/04-workflow-evaluaciones-y-nomina.md)
- [05 — Encriptación de Salarios y Seguridad](./02-backend-servicios/05-encriptacion-salarios-y-seguridad.md)

### 03 — Motores Especializados
- [01 — Motor de Cálculo de Nómina](./03-motores-especializados/01-motor-calculo-nomina.md)
- [02 — Motor de Liquidación Legal (Offboarding)](./03-motores-especializados/02-motor-liquidacion-legal.md)
- [03 — Motor de Asistencia y Geocerca](./03-motores-especializados/03-motor-asistencia-geocerca.md)

### 04 — Base de Datos
- [01 — Esquema Relacional Emplifi](./04-base-de-datos/01-esquema-relacional-emplifi.md)
- [02 — Catálogos y Normativa Laboral](./04-base-de-datos/02-catalogos-y-normativa-laboral.md)

### 05 — Frontend Web
- [01 — Arquitectura React y Vite](./05-frontend-web/01-arquitectura-react-vite.md)
- [02 — Componentes UI y Layout](./05-frontend-web/02-componentes-ui-y-layout.md)
- [03 — Integración API y Resiliencia](./05-frontend-web/03-integracion-api-y-resiliencia.md)

### 06 — Inteligencia y Analítica
- [01 — Módulo de IA y Analítica Predictiva](./06-inteligencia-y-analitica/01-modulo-ia-y-reportes-predictivos.md)
- [02 — Scoring Multidimensional de Empleados](./06-inteligencia-y-analitica/02-scoring-multidimensional.md)
- [03 — Simulador Monte Carlo y ANOVA](./06-inteligencia-y-analitica/03-monte-carlo-y-anova.md)
- [04 — Motor de Automejora Recursiva (RSI Engine)](./06-inteligencia-y-analitica/04-motor-automejora-recursiva-rsi.md)
- [05 — Motor de Inferencia Causal Contrafactual (Causal AI)](./06-inteligencia-y-analitica/05-motor-inferencia-causal-contrafactual.md)
- [06 — Aprendizaje Federado Multi-Tenant (DP-SGD)](./06-inteligencia-y-analitica/06-aprendizaje-federado-privacidad-diferencial.md)
- [07 — Motor de Aprendizaje por Refuerzo Multiobjetivo (MORL & Frontera de Pareto)](./06-inteligencia-y-analitica/07-optimizacion-multiobjetivo-frontera-pareto-morl.md)

### 07 — Despliegue y Operaciones
- [01 — Instalación y Entorno Local](./07-despliegue-y-operaciones/01-instalacion-entorno-local.md)
- [02 — Guía de Auditoría y Cumplimiento](./07-despliegue-y-operaciones/02-guia-auditoria-y-cumplimiento.md)
- [03 — Plan de Recuperación ante Desastres](./07-despliegue-y-operaciones/03-plan-recuperacion-desastres.md)
- [04 — Guía de Testing](./07-despliegue-y-operaciones/04-guia-testing.md)
- [05 — Infraestructura Docker y Despliegue AWS](./07-despliegue-y-operaciones/05-infraestructura-docker-aws.md)

### 08 — Artefactos Scrum
- [Backlog y Épicas](./08-artefactos-scrum/)

---

## Convenciones

- Todas las rutas de API tienen el prefijo `/api/`
- La autenticación se realiza mediante `Authorization: Bearer <JWT>`
- El contexto de empresa se transmite en `req.user.tenantId` (automático desde el JWT) o mediante la cabecera `x-tenant-id` (solo SuperAdmin)
- Los identificadores de entidades utilizan CUID (Prisma) o UUID v4 según el modelo
- Los campos monetarios y los salarios se almacenan encriptados con AES-256-GCM
- Las coordenadas GPS se truncan a 4 decimales (~11m de precisión) antes de encriptarse
