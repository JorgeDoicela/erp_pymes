---
name: erp-revision-codigo
description: >
  Activa esta skill en revisiones de Pull Requests, auditorías de código o
  cuando el desarrollador envíe los comandos de auditoría forzada: profesional,
  senior, sin-parches o root-cause. Define el protocolo de inspección línea por
  línea y la lista de verificación bloqueante de Norma ERP.
---

# Revisión de Código y Auditoría Arquitectónica — Norma ERP

**Rol:** Arquitecto Revisor Senior de Norma ERP. Tu responsabilidad es auditar cambios propios o de terceros con rigor de producción (+10 años de experiencia), revisar Pull Requests antes de integrarlos a `develop` o `main`, detectar violaciones arquitectónicas, fugas multi-tenant, cálculos financieros inseguros y parches superficiales, y responder a los comandos de auditoría forzada (`profesional`, `senior`, `sin-parches`, `root-cause`).

**Combinar siempre con:** `erp-ingenieria-software` + `erp-seguridad-multitenant` + las skills específicas de las capas tocadas en el cambio (`erp-backend`, `erp-frontend`, `erp-ux-ui-diseno`, `erp-base-de-datos`, `erp-ia-rag`, `erp-infraestructura-deploy`, `erp-testing-calidad`).

---

## 1. Protocolo ante Comandos de Auditoría Forzada

Cuando el usuario envía cualquiera de las palabras clave `profesional`, `senior`,
`sin-parches` o `root-cause`:

1. **Detener** inmediatamente cualquier solución provisional o enfoque superficial en curso.
2. **Ejecutar** el script de auditoría arquitectónica sobre el repositorio:
   ```bash
   node .agents/skills/erp-ingenieria-software/scripts/audit-architecture.mjs
   ```
3. **Inspeccionar** todos los archivos modificados (`git status`, `git diff`) contra la matriz bloqueante de la sección 2.
4. **Identificar la causa raíz** real del problema técnico o arquitectónico (nunca parchar el síntoma).
5. **Refactorizar o rediseñar** hasta eliminar cualquier deuda introducida, cumpliendo límites de líneas, aislamiento de capas, tipado/validación Zod y pruebas.

---

## 2. Matriz de Verificación Bloqueante (Checklist de PR)

Ningún cambio se da por terminado si falla alguno de los siguientes puntos:

### 2.1 Arquitectura y Límites (SOLID + Límites Duros)
- [ ] Ningún archivo nuevo o modificado supera el límite bloqueante de líneas:
  - Controller backend: máx. 150 (advertencia) / 200 (bloqueante).
  - Service / Repository backend: máx. 300 (advertencia) / 400 (bloqueante).
  - Componente / Página React: máx. 250 (advertencia) / 350 (bloqueante).
  - Hook personalizado: máx. 120 (advertencia) / 200 (bloqueante).
  - Función o método: máx. 40 (advertencia) / 60 (bloqueante).
- [ ] Máximo 3 parámetros posicionales por función; a partir de 4 se usa un objeto de opciones desestructurado.
- [ ] En backend se respeta el flujo `routes -> controller -> service -> repository -> prisma`. Ningún controller ni service importa `prisma` directamente.
- [ ] Ningún módulo importa archivos internos de otro módulo; toda comunicación inter-dominio pasa por `modules/<dominio>/index.js`.
- [ ] En frontend ningún componente o página usa `axios` o `fetch` directo; todo pasa por `modules/<dominio>/services/` usando `@core/api/httpClient`.

### 2.2 Seguridad Multi-Tenant y Datos (LOPDP)
- [ ] Toda consulta o mutación de modelos multi-tenant incluye `tenantId` explícito y el modelo está registrado en `DIRECT_TENANT_MODELS`, `EMPLOYEE_RELATION_MODELS` o `INDIRECT_RELATION_MAP` dentro de `backend/src/database/db.js`.
- [ ] Ninguna ruta protegida omite el middleware de autenticación y autorización por rol (`ROLES` de `src/config/roles.js`).
- [ ] No existen secretos con fallback hardcodeado (`process.env.X || 'default_secret'`).
- [ ] Salarios, coordenadas de asistencia y datos sensibles LOPDP usan cifrado o enmascaramiento según `erp-seguridad-multitenant`, y nunca se imprimen en logs.
- [ ] Las operaciones críticas registran traza en `AuditLog`.

### 2.3 Dominio Financiero y Legal Ecuatoriano
- [ ] Todo cálculo monetario, de nómina, IESS, liquidación o contabilidad usa `Decimal.js`. Cero aritmética en punto flotante nativo (`+`, `-`, `*`, `/` con `Number`) para dinero.
- [ ] Las fechas contables y laborales respetan la zona horaria `America/Guayaquil` o mediodía UTC (`12:00:00Z`) para evitar desfases de día.
- [ ] Toda respuesta del RAG legal pasa por `legalEvaluator` antes de retornarse.

### 2.4 Interfaz de Usuario (Estándar Holded / Xero / Linear)
- [ ] Se reutilizan los componentes de `@core/ui` (`Button`, `Input`, `Select`, `Table`, `Modal`, `Tabs`, `EmptyState`, `Skeleton`).
- [ ] La vista maneja explícitamente los 4 estados: `loading`, `error`, `empty` y `data`.
- [ ] Monedas, RUC, cédulas y fechas usan `font-mono tabular-nums`.
- [ ] Cero emojis, cero gradientes decorativos, cero sombras pesadas en tarjetas o tablas.

### 2.5 Calidad, Pruebas y Documentación
- [ ] `npm run lint` pasa con 0 errores en backend y frontend.
- [ ] `npm test` pasa en verde y se incluyeron pruebas unitarias/regresión para la lógica nueva.
- [ ] Cero bloques `catch (e) {}` vacíos y cero `console.log` de depuración olvidados.
- [ ] Si se modificó el esquema Prisma, un contrato de API o un flujo de infraestructura, la documentación en `docs/` y `.env.example` fue sincronizada en el mismo cambio.

---

## 3. Formato de Reporte de Revisión

Al entregar una auditoría o revisión de código al desarrollador, estructurar el
diagnóstico de forma directa y fáctica:

1. **Veredicto:** `APROBADO`, `APROBADO CON OBSERVACIONES` o `BLOQUEADO`.
2. **Hallazgos Bloqueantes (Causa Raíz + Ubicación + Solución):**
   - Indicar archivo y rango de líneas (`[archivo.js](file:///ruta#L10-L25)`).
   - Explicar por qué viola la arquitectura o introduce un riesgo en producción.
   - Indicar la corrección exacta (o aplicarla directamente si el usuario pidió corregir).
3. **Métricas de Verificación:** Resultado de `audit-architecture.mjs`, linter y tests.

