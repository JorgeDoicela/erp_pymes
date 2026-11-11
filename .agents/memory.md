# Memoria del Proyecto — ERP PYMES

Este archivo almacena el contexto operativo, decisiones de interfaz y lecciones aprendidas exclusivas del sistema ERP PYMES.

---

## 1. Decisiones de Diseño y Arquitectura Consolidadas

* **Estándar Visual:** Enterprise B2B minimalista (Holded / Xero / Linear).
* **Superficie:** Fondo `#f9fafb`, tarjetas `#ffffff` con borde `1px solid #e5e7eb` y esquinas de 4px a 6px.
* **Prohibiciones Absolutas:** Cero emojis, cero gradientes, cero sombras en tablas y cero cajas de colores para badges decorativos.
* **Tipografía de Cifras:** Valores financieros, RUCs y fechas con `font-mono tabular-nums`.
* **Arquitectura Backend (Monolito Modular):** 100% de los dominios de negocio encapsulados verticalmente en `backend/src/modules/` (21 módulos exportados vía `src/modules/index.js`). Enrutador central en `backend/src/core/router.js` y adaptador local de archivos en `backend/src/core/storage/blob.service.js`. Las capas horizontales legadas (`controllers/`, `services/`, `repositories/`, `routes/`, `jobs/`) fueron eliminadas.

---

## 2. Historial de Decisiones y Lecciones Aprendidas

* **2026-11-10 (Cierre de Migración Modular Fases 4 y 5):**
  * Se modularizaron los bloques pendientes (`audit`, `biometrics`, `skills`, `communication`, `tenants`, `notifications`, `reports`, `intelligence`, `auth`, `system`) y se trasladó `payrollCronJob.js` a `src/modules/payroll/payroll.jobs.js`.
  * En `tenants`, se unificó la transacción de creación de empresa + settings + configuración de nómina + turno + admin en `tenantRepository.provisionTenantWithAdmin` para evitar duplicación entre onboarding público y alta desde SuperAdmin.
  * En `reports`, se centralizó la construcción de CSV con BOM UTF-8 en `export.service.js`.
  * Se actualizaron todos los imports y mocks de `backend/tests/` y `backend/prisma/seeds/offboarding.js` hacia `src/modules/` y `src/core/`, logrando 26/26 archivos Vitest (156/156 tests en verde), 0 errores en `tsc --noEmit` y 0 errores en `eslint .`.
