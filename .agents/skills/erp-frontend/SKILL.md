---
name: erp-frontend
description: >-
  Activa esta skill en toda tarea del frontend de Norma ERP (frontend/src, React 19 + Vite 7 + Tailwind 3 +
  React Router 7): páginas, componentes, hooks, services de cliente, rutas, guards por rol, Design System
  en core/ui, formularios, tablas, estados de carga/error y división de componentes grandes. Se usa junto
  con desarrollo-frontend (global) y estilos-erp-pymes (local).
---

# Frontend Norma ERP — Arquitectura por Dominio

**Rol:** Ingeniero Frontend Senior de Norma ERP (React 19, Vite 7, React Router 7, Tailwind CSS 3). Construyes y refactorizas módulos de interfaz manteniendo separación estricta entre presentación, estado (custom hooks) y transporte HTTP (`@core/api/httpClient`), bajo el estándar estético sobrio de ERPs financieros de referencia (Holded, Xero, Linear).

Presupone `erp-ingenieria-software`. Las reglas de diseño de producto, flujos UX, colores, tipografía, tablas y botones viven en `erp-ux-ui-diseno` y `estilos-erp-pymes`; esta skill define estructura, capas y contratos.

---

## 1. Mapa del Frontend

```
frontend/src/
├── main.jsx / App.jsx            # Bootstrap, rutas (React.lazy por página), RequireAuth por rol
├── index.css                     # Tailwind + tokens
├── core/                         # Compartido y estable (alias @core)
│   ├── api/httpClient.js         # Única instancia axios: token Bearer, 401/402/403/503, timeout 30 s
│   ├── ui/                       # Design System: Button, Input, Select, Table*, Modal, Tabs, EmptyState, Skeleton...
│   ├── feedback/                 # ErrorBoundary, ErrorState, Loading, MaintenanceBanner
│   ├── layout/                   # MainLayout, DashboardLayout, Header, Sidebar, Footer
│   ├── hooks/                    # Hooks transversales (useAutoSync)
│   ├── utils/                    # formatters.js (moneda, fechas), validationUtils.js
│   ├── constants/                # roles.js (ROLES, isSuperAdmin), modules.jsx (catálogo de navegación)
│   └── pwa/                      # Instalación, offline, recarga
└── modules/<dominio>/            # alias @modules
    ├── pages/                    # Contenedores enrutables (orquestan hooks y componen)
    ├── components/[<feature>/]   # Presentacionales del dominio
    ├── hooks/                    # useX: estado, efectos, llamadas a services
    ├── services/                 # <recurso>.service.js: llamadas HTTP vía httpClient
    ├── utils/ constants/         # Funciones puras y constantes del dominio
    └── index.js                  # Contrato público del dominio
```

---

## 2. Responsabilidades por Capa

| Capa | Hace | No hace |
|---|---|---|
| `services/*.service.js` | Llamar a `httpClient`, construir query params, devolver `response.data` normalizado, propagar el error original (el mensaje se extrae de `error.response?.data?.message` con un helper único en `core/api/`; si no existe, crearlo una sola vez en vez de repetir la lógica por servicio) | Manejar estado React, mostrar toasts, recibir `token` |
| `hooks/use*.js` | Estado `{ data, status, error }`, efectos, invalidación/recarga, toasts de resultado de mutaciones | JSX, estilos, lógica de presentación |
| `pages/*.jsx` | Leer params de ruta, invocar hooks, componer layout, decidir estados (loading/error/empty/success) | Llamadas HTTP directas, transformaciones extensas de datos |
| `components/*.jsx` | Renderizar a partir de props y emitir eventos (`onSave`, `onSelect`) | Llamar services o `httpClient`, leer `localStorage` |
| `core/ui/*` | Primitivas visuales genéricas sin conocimiento de dominio | Importar desde `@modules` |

Flujo único: `page -> hook -> service -> httpClient -> API`.

---

## 3. Reglas Obligatorias

1. **HTTP solo vía `@core/api/httpClient`.** Prohibido importar `axios` o usar `fetch` fuera de `core/api`. Prohibido pasar `token` como argumento: el interceptor lo inyecta.
2. **Reutilizar el Design System.** Antes de escribir un `<button>`, `<input>`, `<table>` o modal, usar `@core/ui`. Si falta una variante, se agrega al componente de `core/ui` (OCP por mapa de variantes), no se duplica en el módulo.
3. **Ciclo de vida completo** en toda vista con datos: `loading` (`Skeleton` / `TableSkeleton`), `error` (`ErrorState` con reintento), `empty` (`EmptyState`), `success`.
4. **Límites:** componente 250 / 350 líneas, hook 120 / 200, JSX retornado ≤ 120 líneas, ≤ 8 props por componente (si se superan, agrupar en objetos de dominio o dividir).
5. **Imports entre dominios** solo por el barril: `import { EmployeeProfileHeader } from '@modules/employees'`. `App.jsx` es el único consumidor autorizado de rutas profundas para `React.lazy`.
6. **Rutas nuevas:** página registrada con `lazy()` en `App.jsx`, protegida por `RequireAuth` con roles de `@core/constants`, y entrada en `core/constants/modules.jsx` si aparece en navegación. `superadmin` nunca accede a rutas operativas de tenants.
7. **Formateo:** moneda, fechas y números con `@core/utils/formatters`; cifras con `font-mono tabular-nums`. Prohibido reimplementar `formatCurrency` en módulos.
8. **Estado:** local con `useState`/`useReducer`; compartido entre páginas de un dominio con hook dedicado; global solo sesión (`token`, `user` en `localStorage` gestionado por el módulo `auth`). No introducir Redux/Zustand sin decisión arquitectónica registrada.
9. **Inmutabilidad y efectos:** respetar `react-hooks/exhaustive-deps`; sin `setState` sincrónico dentro de efectos para derivar datos (usar `useMemo`); cancelar peticiones o ignorar respuestas obsoletas al desmontar.
10. **Accesibilidad:** `label` asociado (`htmlFor`), `aria-label` en botones de solo icono, foco visible, navegación por teclado en modales (`Escape` cierra).
11. **PropTypes** declarados en componentes reutilizables de `core/ui` y componentes de dominio exportados por el barril (el proyecto usa JS; `prop-types` es el contrato de props).

---

## 4. Procedimiento para Dividir un Componente Grande

1. Identificar secciones visuales (cabecera, filtros, tabla, formulario, modal) y la lógica de datos.
2. Extraer la lógica de datos a `hooks/use<Feature>.js` devolviendo `{ data, status, error, actions }`.
3. Extraer cada sección a `components/<feature>/<Seccion>.jsx` con props explícitas.
4. La página queda como contenedor < 150 líneas que compone secciones.
5. Agregar prueba de render básico y de interacción crítica en `__tests__/`.
6. Ejecutar `npm --prefix frontend run test`, `npm --prefix frontend run lint`, `npm --prefix frontend run build`.

Plantilla de referencia: [plantilla-modulo.md](references/plantilla-modulo.md).

---

## 5. Deuda Conocida (No Replicar)

* Services que reciben `token` y construyen cabeceras manualmente (`employees/services/employee.service.js`).
* `limit=1000` para traer listados completos; usar paginación del backend.
* `axios` directo en `analytics/api/intelligenceClient.js`, `attendance/components/BiometricSettings.jsx`, `attendance/hooks/useBiometricAuth.js`; `fetch` en `auth/pages/Login.jsx` y `ResetPassword.jsx`.
* 50+ páginas sobre 350 líneas (ver `erp-ingenieria-software/references/limites-y-metricas.md`).

---

## 6. Verificación

```bash
npm --prefix frontend run lint
npm --prefix frontend run test
npm --prefix frontend run build
node .agents/skills/erp-ingenieria-software/scripts/audit-architecture.mjs --files <archivos frontend modificados>
```

Comprobación visual: pedir al desarrollador validar en `npm run dev:frontend` en escritorio (1280 px+) y móvil (360 px) cuando el cambio sea de UI.
