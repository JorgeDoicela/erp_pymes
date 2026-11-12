---
name: erp-ingenieria-software
description: >-
  Base transversal obligatoria para cualquier cambio de código en Norma ERP (backend, frontend, IA, scripts).
  Define principios SOLID aplicados al stack real, límites duros de líneas y complejidad, política de
  acoplamiento (desacoplado vs semidesacoplado), patrones de diseño aprobados, reglas de reutilización y el
  procedimiento de verificación con el script de auditoría arquitectónica.
---

# Ingeniería de Software Norma ERP — Base Transversal

Esta skill se activa antes que cualquier skill de capa (`erp-backend`, `erp-frontend`, `erp-ia-rag`, etc.). Define el "cómo" se escribe código en el proyecto; las skills de capa definen el "dónde" y el "con qué".

---

## 1. Procedimiento Obligatorio por Tarea

1. **Diagnóstico:** Identificar la causa raíz y el bounded context afectado (`backend/src/modules/<dominio>` o `frontend/src/modules/<dominio>`).
2. **Ubicación:** Confirmar en qué capa vive el cambio (routes, controller, service, repository, dto, hook, service de cliente, componente). Si no encaja en ninguna, el diseño es incorrecto.
3. **Reutilización primero:** Buscar en `backend/src/core/`, `frontend/src/core/` y en el `index.js` del dominio antes de crear utilidades nuevas.
4. **Implementación dentro de límites** (sección 4).
5. **Pruebas:** Toda regla de negocio nueva o corregida lleva prueba en `backend/tests/modules/<dominio>/` o junto al componente (`__tests__/`).
6. **Verificación:**
   ```bash
   node .agents/skills/erp-ingenieria-software/scripts/audit-architecture.mjs --files <archivos modificados>
   npm run lint
   npm run test
   ```
7. **Reporte:** Indicar archivos tocados, decisiones y deuda técnica detectada (no corregida) con su causa raíz.

---

## 2. Arquitectura de Software Profesional (Clean / Hexagonal / DDD Táctico)

Norma ERP se rige por principios de arquitectura empresarial de grado de producción, combinando **Monolito Modular**, **Pure Nested Vertical Slices**, **Clean Architecture** y **DDD Táctico pragmático**:

1. **Bounded Contexts y Fronteras Estrictas:**
   - Cada módulo en `backend/src/modules/<dominio>` y `frontend/src/modules/<dominio>` constituye un *Bounded Context* con vocabulario y responsabilidades acotadas (`payroll`, `accounting`, `employees`, `attendance`, `contracts`, `sustainability`, `intelligence`).
   - El archivo `index.js` de la raíz de cada dominio actúa como **Published Language / Facade**. Todo lo que no se exporta en `index.js` es privado del módulo.
2. **Regla de Dependencia (Inversión Arquitectónica):**
   - El núcleo de negocio (`*.service.js`) contiene las reglas del dominio (cálculos del Código del Trabajo, cuadre de partida doble, validaciones de negocio) y **no conoce detalles de transporte HTTP ni de infraestructura**.
   - **Prohibición expresa:** Los objetos `req`, `res`, `next` o cabeceras HTTP jamás entran a un `service` ni a un `repository`. El `controller` traduce de HTTP a primitivos/DTOs de dominio, y el `errorHandler` traduce `AppError` de dominio a códigos de estado HTTP.
3. **DDD Táctico Pragmático:**
   - **Value Objects Inmutables:** El dinero (`Decimal.js`), las fechas laborales canónicas (`America/Guayaquil`), las cédulas/RUC validados y las coordenadas cifradas se tratan como objetos de valor inmutables; nunca como `Number` o `String` crudos sin validar.
   - **Agregados y Consistencia Transaccional:** Toda mutación que abarque múltiples tablas que deben ser consistentes al instante (ej. crear asiento contable + líneas `Debe`/`Haber` cuadradas, o provisionar tenant + admin inicial) se ejecuta dentro de una única transacción atómica (`prisma.$transaction`) encapsulada en el repositorio.
4. **Idempotencia y Resiliencia en Operaciones Críticas:**
   - Operaciones financieras, de nómina, liquidación, mayorización contable, jobs cron y webhooks de WhatsApp deben diseñarse para ser **idempotentes** (ejecutar dos veces la misma solicitud con la misma clave/periodo no debe duplicar pagos ni asientos contables).
5. **Fitness Functions Arquitectónicas (Gobernanza Continua):**
   - La arquitectura no se protege solo con documentos, sino con verificaciones ejecutables: `backend/tests/architecture/modularMonolith.test.js`, `repositories.test.js` y el script `audit-architecture.mjs`. Ningún cambio puede degradar estas métricas.

---

## 3. Principios SOLID Aplicados al Stack

| Principio | Aplicación concreta en Norma ERP |
|---|---|
| SRP | Un servicio por agregado o caso de uso coherente (`absence.service.js` no calcula nómina). Un componente React renderiza; un hook orquesta estado; un service de cliente habla HTTP. |
| OCP | Variaciones por estrategia o registro, no por `if/else` creciente: `PROVIDER_CONFIGS` en `llmProvider.service.js`, `WhatsappSkillRegistry`, variantes de `Button` por mapa `VARIANTS`. |
| LSP | Repositorios sustituibles por mocks con la misma firma; cada skill de WhatsApp implementa el mismo contrato (`prepareDraft`, `executeConfirmedAction`). |
| ISP | Barriles `index.js` exportan solo lo que otros dominios consumen. No exportar helpers internos "por si acaso". |
| DIP | Servicios reciben dependencias por constructor con valores por defecto (patrón de `AccountingService`): `constructor({ accountingRepo = defaultRepo, auditRepo = defaultAuditRepo } = {})`. Se exporta la clase y una instancia por defecto. |

Principios complementarios: DRY con criterio (duplicar dos veces es tolerable, la tercera obliga a extraer), KISS, YAGNI (no construir abstracciones sin segundo consumidor real), Ley de Demeter (no encadenar `a.b.c.d` entre capas), Tell-Don't-Ask en servicios de dominio.

---

## 4. Límites Duros de Código

| Elemento | Advertencia | Bloqueante | Acción al superar |
|---|---|---|---|
| `*.service.js`, `*.repository.js`, otros backend | 300 | 400 | Dividir por sub-caso de uso o crear slice anidado |
| `*.controller.js` | 150 | 200 | Mover lógica al servicio; dividir controlador por recurso |
| `*.routes.js` | 80 | 120 | Separar sub-routers por recurso |
| `*.dto.js` | 200 | 250 | Un archivo DTO por recurso |
| Componente `.jsx` (pages y components) | 250 | 350 | Extraer subcomponentes a `components/<feature>/` y lógica a `hooks/` |
| Hook `use*.js` | 120 | 200 | Separar hooks de lectura y mutación |
| Service de cliente frontend | 200 | 250 | Separar por recurso REST |
| Función / método | 40 | 60 | Extraer funciones con nombre de intención |
| Profundidad de anidamiento | 3 | 4 | Guard clauses y retornos tempranos |
| Parámetros posicionales | 3 | 4 | Objeto de parámetros desestructurado |
| Dependencias por servicio | 5 | 7 | El servicio tiene más de una responsabilidad |
| Complejidad ciclomática por función | 10 | 15 | Tablas de decisión, estrategias o mapas |

Reglas de aplicación:

* **Código nuevo:** Prohibido crear archivos o funciones por encima del umbral bloqueante.
* **Código legado sobre el límite** (ver [limites-y-metricas.md](references/limites-y-metricas.md)): regla del Boy Scout. Si una tarea toca un archivo sobre el límite, el archivo no puede crecer; la lógica nueva se crea en un módulo extraído. Las refactorizaciones de reducción son tareas explícitas, no efectos colaterales de un bugfix.
* Excepciones permitidas únicamente: archivos de datos o catálogos estáticos (`data/`, constantes normativas, `schema.prisma`, seeds de catálogos). Deben declararlo en el encabezado JSDoc.

---

## 5. Política de Acoplamiento

| Nivel | Cuándo aplicarlo | Mecanismo |
|---|---|---|
| **Desacoplado** (por defecto entre dominios) | Dominio A necesita datos o acciones de dominio B | Importar solo desde `modules/<B>/index.js`; inyectar el servicio o repositorio de B por constructor |
| **Desacoplado por eventos** | Efectos secundarios no críticos (notificaciones, auditoría, correo) | Llamar a `notificationService` / `auditRepository` del contrato público; nunca bloquear la transacción principal por un canal externo |
| **Semidesacoplado** (permitido dentro de un dominio) | Slices hermanos del mismo dominio compuesto (`payroll/calculation` y `payroll/config`) | Importación relativa directa permitida entre slices del mismo dominio, sin ciclos |
| **Acoplado** (prohibido) | — | Imports profundos a otro dominio (`../../employees/directory/employee.repository.js`), Prisma fuera de repositorios, componentes que llaman `httpClient` directamente |

Excepción documentada: las rutas importan directamente `auth/auth.middleware.js`, `tenants/organization/tenant.middleware.js` y `tenants/superadmin/superAdmin.middleware.js` para evitar ciclos ESM en tiempo de carga. No se admiten nuevas excepciones sin registrarlas en esta skill.

---

## 6. Patrones de Diseño Aprobados

| Patrón | Uso en el proyecto | Referencia existente |
|---|---|---|
| Repository | Única puerta a Prisma | `accounting.repository.js` (`AccountingRepository`) |
| Service Layer + DI por constructor | Lógica de aplicación y dominio | `accounting.service.js` |
| Strategy / Configuration Map | Proveedores LLM, variantes UI, cálculos por tipo de contrato | `PROVIDER_CONFIGS`, `Button` `VARIANTS` |
| Registry | Extensión sin modificar el núcleo | `whatsappSkill.registry.js` |
| Middleware / Decorator | Preocupaciones transversales HTTP | `validate`, `authenticate`, `authorize`, `requireTenant`, `asyncHandler` |
| Facade | API pública de un dominio | `modules/<dominio>/index.js`, `frontend/src/core/ui/index.js` |
| Unit of Work | Operaciones multi-entidad atómicas | `prisma.$transaction` dentro del repositorio (`provisionTenantWithAdmin`) |
| Value Object | Dinero, fechas de calendario, cédula/RUC | `financial` (Decimal.js), `parseCanonicalCalendarDate`, `validateCedulaEcuatoriana` |
| Custom Hook (frontend) | Estado y efectos reutilizables | `useEmployees.js` |
| Container / Presentational | Páginas orquestan, componentes presentan | `pages/` vs `components/` |

Prohibido introducir patrones sin necesidad real (Abstract Factory, Visitor, buses de eventos genéricos, contenedores IoC externos). Ver catálogo con ejemplos en [patrones.md](references/patrones.md).

---

## 7. Convenciones de Código Transversales

* **Módulos ESM** con extensión explícita `.js` en imports relativos del backend.
* **Encabezado JSDoc** obligatorio por archivo: `@file`, `@description` fáctica, `@author Jorge Doicela`, `@copyright`, `@license Proprietary`.
* **JSDoc de tipos** en funciones públicas de servicios y repositorios (`@param`, `@returns`). El proyecto es JavaScript; el tipado se expresa con JSDoc y Zod.
* **Nombres:** archivos `camelCase.<capa>.js` en backend, `PascalCase.jsx` para componentes, `useX.js` para hooks; constantes `UPPER_SNAKE_CASE` congeladas con `Object.freeze`.
* **Sin números ni cadenas mágicas:** estados (`PENDING`, `APPROVED`), roles (`ROLES` de `config/roles.js`), límites legales en constantes nombradas.
* **Dinero:** siempre `financial` / `Decimal` (`core/utils/financialUtils.js`); prohibido aritmética de punto flotante sobre montos.
* **Fechas de calendario:** zona `America/Guayaquil`; usar helpers canónicos (`getEcuadorTodayIso`, `parseCanonicalCalendarDate`), nunca `new Date('YYYY-MM-DD')` para fechas laborales.
* **Logs:** sin `console.log` de depuración ni volcado de `req.body` (datos personales LOPDP). Los logs operativos deben ser estructurados y sin PII.
* **Errores:** lanzar subclases de `AppError`; prohibido `catch` vacío o que solo registra y continúa en flujos de negocio.

---

## 8. Antipatrones Prohibidos

1. Lógica de negocio en controladores o componentes de presentación.
2. Prisma importado fuera de `*.repository.js`, `database/` o seeds.
3. Imports profundos entre dominios (backend o frontend).
4. Duplicar componentes del Design System (`Input`, `Select`, `Modal`, `Table`, `EmptyState`) dentro de módulos.
5. Pasar `token` manualmente a services de cliente; el interceptor de `httpClient` ya lo inyecta.
6. Detección de errores por coincidencia de texto (`err.message.includes('Salario')`).
7. Secretos con valores por defecto en código (`process.env.JWT_SECRET || '...'`).
8. Booleanos de control múltiples en firmas (`fn(a, true, false, true)`).
9. Archivos "utils" genéricos sin dominio; toda utilidad pertenece a `core/` o a un dominio.

---

## 9. Recursos

* [limites-y-metricas.md](references/limites-y-metricas.md): inventario de archivos legados sobre el límite y plan de reducción.
* [patrones.md](references/patrones.md): ejemplos de referencia de cada patrón aprobado.
* [audit-architecture.mjs](scripts/audit-architecture.mjs): verificación automática de límites de líneas, imports entre dominios, uso de Prisma y `console.log`.

