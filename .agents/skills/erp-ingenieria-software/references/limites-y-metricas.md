# Límites y Métricas — Línea Base y Plan de Reducción

Línea base medida el 2026-11-12 con `audit-architecture.mjs --errors-only` sobre `backend/src` y `frontend/src` (501 archivos, excluyendo `data/` y pruebas). Para regenerar:

```bash
node .agents/skills/erp-ingenieria-software/scripts/audit-architecture.mjs --errors-only
```

---

## 1. Resumen de la Línea Base

| Regla | Errores | Naturaleza |
|---|---|---|
| `line-limit` | 93 | Archivos sobre el umbral bloqueante (backend y frontend) |
| `prisma-outside-repository` | 25 | Servicios, jobs y middlewares que importan `database/db.js` |
| `secret-default` | 10 | `process.env.*SECRET/KEY/TOKEN || '...'` |
| `axios-outside-http-core` | 3 | `analytics/api/intelligenceClient.js`, `attendance/components/BiometricSettings.jsx`, `attendance/hooks/useBiometricAuth.js` |
| `cross-module-deep-import` | 3 | `whatsapp` importa `sustainability/llmProvider.service.js` y `sustainability/sustainabilityRag.service.js` directamente |
| `fetch-in-ui` | 2 | `auth/pages/Login.jsx`, `auth/pages/ResetPassword.jsx` |

> [!IMPORTANT]
> La línea base es deuda registrada, no un estándar. Ningún cambio puede aumentar estos conteos. Toda tarea que toque uno de estos archivos debe dejarlo igual o mejor (regla del Boy Scout).

---

## 2. Archivos Críticos (Mayor Prioridad de Descomposición)

| Archivo | Líneas | Descomposición recomendada |
|---|---|---|
| `backend/src/modules/intelligence/predictive/intelligence.service.js` | ~2900 | Un servicio por motor (scoring, Monte Carlo, ANOVA, series) + repositorio `intelligence.repository.js` |
| `backend/src/modules/payroll/calculation/payrollCalculation.service.js` | ~1240 | Separar cálculo de ingresos, deducciones IESS, impuesto a la renta, provisiones (décimos, fondos de reserva) como estrategias puras + orquestador |
| `backend/src/modules/sustainability/sustainability.repository.js` | ~1235 | Repositorio de corpus, repositorio vectorial `pgvector`, repositorio ODS 8 agregado |
| `backend/src/modules/sustainability/sustainabilityFineTuning.service.js` | ~1150 | Exportador ChatML, muestreo estratificado, plantillas de prompt |
| `backend/src/modules/intelligence/predictive/intelligence.controller.js` | ~730 | Un controlador por sub-recurso |
| `frontend/src/modules/payroll/pages/BenefitsManagement.jsx` | ~1170 | Página contenedora + `components/benefits/*` + `hooks/useBenefits.js` |
| `frontend/src/modules/recruitment/pages/ApplicationDetails.jsx` | ~1090 | Pestañas como componentes + hook de aplicación |
| `frontend/src/modules/attendance/pages/ShiftManagement.jsx` | ~1000 | Tabla, formulario y asignaciones separados + `useShifts.js` |

---

## 3. Patrón de Reducción Seguro

1. Escribir o reforzar pruebas de caracterización del comportamiento actual antes de mover código.
2. Extraer funciones puras primero (cálculos, mapeos, formateos) a módulos con nombre de intención.
3. Mover acceso a Prisma al repositorio del slice; el servicio pasa a recibir el repositorio por constructor.
4. Mantener el contrato público del `index.js` estable; los consumidores no deben cambiar.
5. Ejecutar `npm run test`, `npm run lint` y el script de auditoría con `--files` sobre los archivos tocados.
6. Commits atómicos `refactor(<dominio>): ...` independientes de cambios funcionales.

---

## 4. Justificación de los Umbrales

* **400 líneas backend / 350 frontend:** por encima de este tamaño la mediana del repositorio (86 líneas backend, 122 frontend) se multiplica por más de 3, y los archivos que lo superan concentran la mayoría de responsabilidades mezcladas detectadas en auditorías previas.
* **200 líneas controller:** un controlador delgado solo extrae `req`, invoca al servicio y serializa; más de 200 líneas indica lógica de negocio filtrada.
* **60 líneas por función:** límite práctico para leer una función completa en pantalla y testearla con casos acotados.
* **7 dependencias por servicio:** umbral clásico de violación de SRP (Martin, Clean Code; Seemann, Dependency Injection).

