---
name: estilos-erp-pymes
description: >-
  Activa esta skill para aplicar el estándar de diseño de ERPs empresariales de referencia (estilo Holded, Xero, Linear): limpio, funcional, de alto contraste y confiable.
---

# Estándar de Diseño ERP Empresarial (Holded / Xero / Linear)

Esta habilidad define el estándar visual para sistemas ERP que se entregan a empresas reales. El objetivo es una interfaz que comunique **control, precisión y profesionalismo** desde el primer vistazo — sin artificios decorativos.

---

## 1. Principios Fundamentales

| Principio | Regla |
|---|---|
| Fondos | Blanco puro `#ffffff` sobre superficie `#f9fafb` |
| Bordes | `1px solid #e5e7eb` — nunca más grueso, nunca decorativo |
| Esquinas | `border-radius: 4px` a `6px` máximo. Cero `rounded-2xl` |
| Sombras | Prohibidas en tarjetas y tablas. Solo en modales/drawers (`shadow-xl`) |
| Animaciones | Solo transición de color en hover `150ms`. Sin flotar ni escalar |
| Emojis | PROHIBIDOS |
| Íconos SVG | Únicamente donde el texto solo no es suficiente (buscador, cerrar modal, paginación) |
| Gradientes | PROHIBIDOS en UI operativa |
| Colores | RESTRICCIÓN ABSOLUTA. Queda PROHIBIDO usar cualquier color o tono fuera de la paleta autorizada |

---

## 2. Tipografía y Cifras

```
Font stack: Inter, -apple-system, BlinkMacSystemFont, sans-serif

Etiquetas:  10px–11px · font-medium · uppercase · tracking-wider · #6b7280
Valores:    18px–24px · font-semibold · #111827 · font-mono · tabular-nums
Subtexto:   12px · #9ca3af
Cuerpo:     13px–14px · #374151
```

- Cifras financieras, RUCs, fechas y contadores **siempre** con `font-mono` y `font-variant-numeric: tabular-nums lining-nums`.

---

## 3. Paleta de Colores y Gobernanza Estricta

```css
/* Superficie */
--bg-app:      #f9fafb;
--bg-surface:  #ffffff;
--border:      #e5e7eb;
--border-dark: #d1d5db;

/* Texto */
--text-900:    #111827;
--text-600:    #4b5563;
--text-400:    #9ca3af;

/* Acento operativo único */
--accent:      #2563eb;   /* Solo en botón primario y enlace activo */
--accent-hover:#1d4ed8;

/* Estados semánticos */
--status-active:    #166534 sobre #f0fdf4;
--status-trial:     #92400e sobre #fffbeb;
--status-suspended: #991b1b sobre #fef2f2;
```

---

## 4. Tablas — El Corazón Operativo

Las tablas deben parecerse a una hoja de cálculo limpia, no a tarjetas apiladas:

- Header: `bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider`
- Filas: `border-b border-gray-100 hover:bg-gray-50/60 transition-colors`
- Densidad compacta: `py-2.5 px-4`
- Densidad cómoda: `py-4 px-4`
- Iniciales/avatares: `bg-gray-100 text-gray-700 font-mono font-semibold text-xs`
- **Neutralidad de celdas:** Cero botones o dropdowns coloreados fila por fila. Todos los selectores de fila y botones de acción son neutros (`bg-white border-gray-200 text-gray-700 hover:bg-gray-50`). La barra de progreso es sobria (`bg-gray-800`).

---

## 5. KPI / Métricas — Filas Sobrias Estilo Tabla Contable

**PROHIBIDO usar tarjetas flotantes de KPI, cajas gigantes ni bloques apilados arriba** (se ven "hechos por IA").

El encabezado debe ser 100% limpio: sólo categoría, título y botones de acción.

Las métricas financieras o de resumen deben mostrarse en un **panel lateral estilo informe contable / estado financiero**, con filas limpias donde el concepto está a la izquierda y el valor a la derecha:

```
┌──────────────────────────────────────────────────┐
│ MRR                                  $133.00 USD │
│ ARR proyectado                     $1,596.00 USD │
│ ARPU                              $66.50 / emp.  │
├──────────────────────────────────────────────────┤
│ Distribución por plan                            │
│ Essential                              2 (25%)   │
│ Growth                                 4 (50%)   │
│ Enterprise                             2 (25%)   │
├──────────────────────────────────────────────────┤
│ Estado del sistema                       HEALTHY │
└──────────────────────────────────────────────────┘
```

**Reglas estrictas:**
- **Encabezado principal:** Limpio, sin tarjetas de números ni filas de KPIs.
- **Formato de datos:** Filas compactas `px-4 py-2.5 border-b border-gray-100 flex items-center justify-between`.
- **Valores:** `text-xs font-semibold text-gray-900 font-mono` con `tabular-nums`.
- **Etiquetas:** `text-xs text-gray-500`.
- La **tabla principal del directorio** es la fuente de verdad detallada; el panel solo ofrece contexto financiero sobrio.

---

## 6. Navegación por Pestañas

```
Tabs horizontales con borde inferior activo 2px #111827.
Texto inactivo: #6b7280.
Sin fondo en el tab activo.
```

---

## 7. Formularios e Inputs (Form System)

```
Label:       text-xs font-medium text-gray-600 mb-1 (no uppercase)
Input/Select:bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20
Placeholder: text-gray-400
Ayuda/Error: text-[11px] text-gray-400 (ayuda) / text-red-600 font-medium (error)
```

---

## 8. Jerarquía Estándar de Botones

| Tipo | Clases Tailwind | Uso |
|---|---|---|
| Primario | `bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer` | Acción principal del módulo/modal |
| Secundario | `border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer` | Cancelar, exportar, ver más |
| Tabla / Acción | `border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 text-xs px-2.5 py-1 rounded transition-colors` | Botones dentro de celdas |
| Destructivo | `border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium px-3 py-1.5 rounded transition-colors` | Eliminar, suspender |

---

## 9. Modales y Paneles Laterales (Drawers)

```
Backdrop:  bg-gray-900/50 flex items-center justify-center p-4
Dialog:    bg-white border border-gray-200 rounded max-w-xl w-full overflow-hidden shadow-xl
Header:    px-5 py-4 border-b border-gray-200 flex items-center justify-between (título text-base font-semibold text-gray-900)
Body:      p-5 space-y-4 max-h-[80vh] overflow-y-auto
Footer:    px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2
```

---

## 10. Estados Vacíos (Empty States)

- **Regla:** Cero ilustraciones 3D, cero dibujitos SVG.
- **Patrón:** `p-12 text-center text-gray-400 text-sm`
  - Título: `text-sm font-medium text-gray-700`
  - Descrip: `text-xs text-gray-400 mt-1`
  - Botón opcional neutro o primario

---

## 11. Recursos

- [references/paleta_tokens.css](./references/paleta_tokens.css)
- [references/componentes_ejemplos.md](./references/componentes_ejemplos.md)
- [references/plantilla_impresion.md](./references/plantilla_impresion.md)
