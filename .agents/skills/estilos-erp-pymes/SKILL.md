---
name: estilos-erp-pymes
description: >-
  Activa esta skill para aplicar el estándar de diseño de ERPs empresariales de referencia (estilo Holded, Xero, Linear): limpio, funcional, de alto contraste, sobrio y confiable.
---

# Estándar de Diseño ERP Empresarial (Holded / Xero / Linear)

Esta habilidad define el estándar visual para sistemas ERP y landing pages que se entregan a empresas reales. El objetivo es una interfaz que comunique **control, precisión, sobriedad y profesionalismo** desde el primer vistazo — sin artificios decorativos ni sobrecarga de elementos.

---

## 1. Principios Fundamentales

| Principio | Regla |
|---|---|
| Fondos | Blanco puro `#ffffff` sobre superficie `#f9fafb` |
| Bordes | `1px solid #e5e7eb` — nunca más grueso, nunca decorativo |
| Esquinas | `border-radius: 4px` a `6px` máximo. Cero `rounded-2xl` |
| Sombras | Prohibidas en tarjetas y tablas. Solo sombra sutil en modales/drawers (`shadow-xl`) o botones primarios (`shadow-xs`) |
| Animaciones | Solo transición de color en hover `150ms`. Sin flotar ni escalar |
| Emojis | PROHIBIDOS |
| Badges con fondos de color | PROHIBIDOS los cuadros y pastillas flotantes con fondos de color (`bg-emerald-50`, `bg-blue-50`, `bg-gray-100`, etc.) como adorno o relleno decorativo. Usar texto tipográfico sobrio |
| Falso Affordance | PROHIBIDO encerrar información estática en cajas con borde y fondo que parezcan botones interactivos. La información de confianza y características va en texto corrido o con separadores discretos (`·`) |
| Íconos SVG | MÍNIMOS Y ESTRICTAMENTE JUSTIFICADOS. Prohibido poner un SVG en cada encabezado, párrafo, badge o ítem de lista. Solo para acciones de navegación (flecha de botón primario, chevron de dropdown/acordeón, buscador, cerrar modal) |
| Gradientes | PROHIBIDOS en UI operativa y comercial |
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

/* Estados semánticos en texto sobrio */
--status-active:    #166534;
--status-trial:     #92400e;
--status-suspended: #991b1b;
```

---

## 4. Tablas — El Corazón Operativo

Las tablas deben parecerse a una hoja de cálculo limpia, no a tarjetas apiladas:

- Header: `bg-gray-50/50 border-b border-gray-200 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider`
- Filas: `border-b border-gray-100 hover:bg-gray-50/60 transition-colors`
- Densidad compacta: `py-2 px-3`
- Densidad cómoda: `py-3 px-4`
- Iniciales/avatares: `bg-gray-100 text-gray-700 font-mono font-semibold text-xs`
- **Neutralidad de celdas:** Cero botones o dropdowns coloreados fila por fila. Todos los selectores de fila y botones de acción son neutros (`bg-white border-gray-200 text-gray-700 hover:bg-gray-50`). Los estados son texto neutro (`text-gray-700 font-medium`).

---

## 5. Cero Bloques de KPIs Superiores — Diseño Directo a Tabla Operativa

**PROHIBIDO poner bloques, tarjetas flotantes o filas de KPIs gigantes en la parte superior de las páginas operativas** (ej. "Total Colaboradores 0", "Expedientes Completos 0", etc.). Estos bloques ocupan espacio innecesario y delatan interfaces generadas por IA.

Un ERP profesional (estilo Linear, Holded, Xero) va **directo a la acción y a los datos**:

1. **Encabezado Limpio:** Solo categoría, título del módulo, subtítulo conciso y botones de acción principal.
2. **Pestañas con Contadores Integrados:** El estado del sistema y los filtros se expresan como contadores tabulares en las propias pestañas o filtros:
   ```
   [ Todos (17) ]  [ Por Validar (2) ]  [ Incompletos (5) ]  [ Completos (10) ]
   ```
3. **Barra de Herramientas Directa:** Buscador y selectores de departamento/fecha alineados con las pestañas.
4. **La Tabla o Directorio es la Protagonista:** El usuario ve inmediatamente la información que necesita gestionar sin tener que hacer scroll sobre cajas decorativas de números.
5. **Paneles Laterales Estrictamente Opcionales:** Si un módulo requiere métricas financieras agregadas (ej. balance contable), se coloca en una columna lateral derecha compacta de 1 sola columna, jamás como un muro horizontal gigante que tape la tabla principal.

---

## 6. Landing Pages y Vistas Públicas — Directo al Valor PyME

Las páginas de aterrizaje y comerciales de un ERP PyME deben evitar sobrecarga de información:

1. **Propuesta de Valor Directa:** Resolver los dolores reales del negocio (Nómina legal, Asistencia GPS, Expedientes, Finiquitos) sin jerga técnica excesiva ni catálogos de 15 módulos con códigos `MOD-01`.
2. **Hero Limpio:**
   - H1 conciso y contundente con buen respiro visual.
   - Botón de acción principal claro y botón secundario sobrio.
   - Tira de confianza en texto corrido o separadores tipográficos (`·`), **sin cajitas de colores ni falso affordance**.
3. **Mockups Realistas:** Vistas operativas limpias con tipografía cuidada, sin minúsculas forzadas ni pastillas verdes/azules decorativas.
4. **Planes de Precios:** Tarjetas blancas sobrias con precios tabulares (`font-mono tabular-nums`) y listas de características con puntos o guiones discretos, evitando saturar de íconos `FiCheck` en cada línea.
5. **Logotipos y Headers:** Logo de marca limpio sin duplicar el texto al lado de la imagen.

---

## 7. Navegación por Pestañas

```
Tabs horizontales con borde inferior activo 2px #111827.
Texto inactivo: #6b7280.
Sin fondo en el tab activo.
```

---

## 8. Formularios e Inputs (Form System)

```
Label:       text-xs font-medium text-gray-600 mb-1 (no uppercase)
Input/Select:bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20
Placeholder: text-gray-400
Ayuda/Error: text-[11px] text-gray-400 (ayuda) / text-red-600 font-medium (error)
```

---

## 9. Jerarquía Estándar de Botones

| Tipo | Clases Tailwind | Uso |
|---|---|---|
| Primario | `bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer shadow-xs` | Acción principal del módulo/modal |
| Secundario | `border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer` | Cancelar, exportar, ver más |
| Tabla / Acción | `border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 text-xs px-2.5 py-1 rounded transition-colors` | Botones dentro de celdas |
| Destructivo | `border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium px-3 py-1.5 rounded transition-colors` | Eliminar, suspender |

---

## 10. Modales y Paneles Laterales (Drawers)

```
Backdrop:  bg-gray-900/50 flex items-center justify-center p-4
Dialog:    bg-white border border-gray-200 rounded max-w-xl w-full overflow-hidden shadow-xl
Header:    px-5 py-4 border-b border-gray-200 flex items-center justify-between (título text-base font-semibold text-gray-900)
Body:      p-5 space-y-4 max-h-[80vh] overflow-y-auto
Footer:    px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2
```

---

## 11. Estados Vacíos (Empty States)

- **Regla:** Cero ilustraciones 3D, cero dibujitos SVG.
- **Patrón:** `p-12 text-center text-gray-400 text-sm`
  - Título: `text-sm font-medium text-gray-700`
  - Descrip: `text-xs text-gray-400 mt-1`
  - Botón opcional neutro o primario
