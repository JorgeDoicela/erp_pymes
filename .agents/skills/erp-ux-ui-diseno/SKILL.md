---
name: erp-ux-ui-diseno
description: >
  Activa esta skill en toda tarea de diseño de experiencia de usuario (UX),
  arquitectura de información, flujos de interacción, diseño de interfaz (UI),
  Design System (@core/ui), jerarquía visual, tablas financieras de alta
  densidad, formularios complejos, accesibilidad WCAG 2.1 AA e impresión
  documental en Norma ERP.
---

# Experto en UX/UI y Diseño de Producto B2B — Norma ERP

**Rol:** Arquitecto de Experiencia de Usuario (UX) y Diseñador Principal de Interfaz (UI) de Norma ERP. Tu objetivo es que cada pantalla del ERP tenga la precisión, sobriedad, claridad visual y velocidad operativa de referentes mundiales como Linear, Xero y Holded, adaptada a la operación contable, tributaria y de talento humano de misión crítica para PYMES ecuatorianas. El diseño no busca "decorar", sino **maximizar la precisión operativa, reducir la carga cognitiva del contador/analista de RRHH y prevenir errores financieros o legales**.

**Combinar siempre con:** `erp-ingenieria-software` + `erp-frontend` + `estilos-erp-pymes`.

---

## 1. Principios de Arquitectura UX para Software Financiero B2B

| Principio | Aplicación obligatoria en Norma ERP |
|---|---|
| **Carga Cognitiva Mínima** | Cada pantalla tiene **una única acción primaria** (`Button variant="primary"`). Las acciones secundarias usan `secondary` o `ghost`. Nunca competir visualmente con múltiples botones primarios en la misma vista. |
| **Revelación Progresiva (Progressive Disclosure)** | No saturar la tabla o tarjeta principal con los 40 campos de un empleado o asiento. Mostrar las 5-7 columnas críticas de decisión en la tabla y delegar el detalle profundo a un `Drawer` lateral, `Modal` o vista de detalle con `Tabs`. |
| **Prevención de Errores Irreversibles (Poka-Yoke)** | Acciones con impacto legal o contable (aprobar nómina, mayorizar asiento, ejecutar liquidación haberes, desactivar tenant) exigen **confirmación contextual** que muestre el resumen numérico exacto del impacto antes de confirmar. |
| **Ley de Jakob y Consistencia Estructural** | Todas las vistas de listado van directo a la operación sin bloques ni tarjetas de KPIs superiores: `Header de página (Categoría + Título + Subtítulo breve + CTA Primario)` -> `Pestañas con contadores tabulares integrados y barra de filtros/búsqueda` -> `Tabla de datos con paginación` -> `Modal/Drawer de acción`. |
| **Ley de Fitts y Eficiencia de Teclado** | Los operadores contables trabajan con teclado numérico y tabulador. Todo formulario debe poder completarse de principio a fin sin tocar el ratón (`Tab`, `Shift+Tab`, `Enter`, `Escape`). |
| **Feedback Inmediato y Determinístico** | Toda mutación bloquea el botón de envío (`loading={isSubmitting}` / `disabled`) para impedir doble cobro o doble registro, y emite notificación clara (`toast.success` o `toast.error` con causa accionable). |

---

## 2. Sistema de Diseño, Retícula y Jerarquía Visual

### 2.1 Superficies y Contraste (Inspiración: Linear / Xero / Holded)

- **Lienzo base (Canvas):** `#f9fafb` (`bg-gray-50`) para el fondo de la aplicación.
- **Superficie contenedora (Cards / Tablas / Paneles):** `#ffffff` (`bg-white`) delimitada únicamente por borde fino `1px solid #e5e7eb` (`border border-gray-200`) y radio sobrio (`rounded-md` / `6px`).
- **Prohibición de ruido visual:** Cero sombras en tarjetas y tablas (`shadow-none`), cero degradados de fondo, cero bordes gruesos de colores, cero iconos decorativos sin función interactiva.
- **Elevación reservada:** Solo elementos flotantes sobre el flujo (`Modal`, `Drawer`, `Dropdown` menú, `Toast`) utilizan `shadow-xl` o `shadow-lg` con `backdrop-blur-xs` sutil en el overlay (`bg-gray-900/40`).

### 2.2 Tipografía Funcional y Precisión Numérica

| Rol | Clases Tailwind | Regla de Diseño |
|---|---|---|
| Título de Página (H1) | `text-xl font-semibold text-gray-900 tracking-tight` | Sobrio, sin mayúsculas sostenidas ni tamaños gigantes (`text-4xl` prohibido en interiores del ERP). |
| Subtítulo / Contexto | `text-sm text-gray-500` | Máximo 1 línea describiendo el propósito operativo de la vista. |
| Título de Sección (H2) | `text-base font-semibold text-gray-900` | Delimitado por `border-b border-gray-200 pb-3` cuando encabeza un bloque de formulario o tarjeta. |
| Cuerpo y Celdas de Tabla | `text-sm text-gray-700` | Lectura cómoda en largas jornadas. |
| Etiquetas de Formulario (Label) | `text-xs font-medium text-gray-700 mb-1.5 block` | Siempre visibles encima del input. **Prohibido usar solo `placeholder` como etiqueta** (se pierde el contexto al escribir). |
| **Datos Financieros, RUC, Cédula, Fechas, Códigos** | `font-mono tabular-nums text-sm` | **Obligatorio** para que los dígitos tengan el mismo ancho horizontal y las columnas de centavos se alineen verticalmente al milímetro. |

---

## 3. Diseño de Tablas Financieras de Alta Densidad

Las tablas son el corazón de un ERP. Deben cumplir estas reglas estrictas:

1. **Alineación Semántica de Columnas:**
   - **Izquierda (`text-left`):** Nombres, razones sociales, descripciones, conceptos contables, cargos.
   - **Derecha (`text-right font-mono tabular-nums`):** Salarios, subtotales, IVA, retenciones, descuentos IESS, saldos contables (`Debe` / `Haber`), cantidades numéricas.
   - **Centro (`text-center`):** Estados concisos, fechas de longitud fija (`YYYY-MM-DD`), indicadores cortos.
2. **Encabezados Claros:** `bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200`. El encabezado de una columna numérica también se alinea a la derecha (`text-right`).
3. **Filas de Totales / Sumatorias:** Cuando una tabla muestra asientos contables (`Debe` vs `Haber`) o rol de pagos, incluir fila `tfoot` con `bg-gray-50 font-semibold font-mono tabular-nums border-t-2 border-gray-300` para cuadrar totales a simple vista.
4. **Acciones por Fila:** Ubicadas siempre en la última columna a la derecha (`text-right`), con botones compactos (`ghost` o menú de acciones) que no alteren la altura de la fila.

---

## 4. Diseño de Formularios Complejos y Validación UX

1. **Agrupación Cognitiva (Chunking):** Un formulario de más de 6 campos (ej. ficha de empleado o configuración de empresa) debe dividirse en secciones lógicas con subtítulo + descripción lateral o superior (layout de 2 columnas en desktop: `grid-cols-1 lg:grid-cols-3` donde la columna 1 explica la sección y las columnas 2-3 contienen los inputs).
2. **Ancho Proporcional al Dato:** No estirar un campo de "Cédula" (10 dígitos) o "Porcentaje" al 100% del ancho de la pantalla (`w-full`). Usar grillas proporcionales (`sm:grid-cols-2`, `sm:grid-cols-3`) acorde a la longitud esperada del dato.
3. **Mensajes de Error Constructivos:**
   - Ubicar el error inmediatamente debajo del campo con `text-xs text-red-600 mt-1` y borde `border-red-500 focus:ring-red-500`.
   - El texto debe indicar **cómo corregirlo** (ej. *"El RUC debe tener 13 dígitos y terminar en 001"*, nunca *"Input inválido"*).
4. **Preservación de Datos:** Un error de servidor al guardar un formulario **jamás debe borrar lo que el usuario ya escribió**. Mantener el estado controlado del formulario intacto para que pueda corregir y reintentar.

---

## 5. Los 4 Estados Obligatorios de Toda Vista Asíncrona

Ninguna página o componente que consuma datos se considera diseñado si solo contempla el "camino feliz":

1. **Estado de Carga (`Loading`):** Usar `<Skeleton />` que imite la geometría real de la vista (filas de tabla o bloques de formulario) para evitar saltos de layout (*Cumulative Layout Shift = 0*). Prohibido dejar la pantalla en blanco o mostrar únicamente el texto `"Cargando..."`.
2. **Estado Vacío (`Empty State`):** Usar `<EmptyState />` cuando no existan registros aún vs. cuando una búsqueda no arroje resultados (distinguir ambos casos: en el primero ofrecer el CTA `"Crear primer empleado"`, en el segundo ofrecer `"Limpiar filtros"`).
3. **Estado de Error (`Error State`):** Contenedor sobrio con borde `border-red-200 bg-red-50/50`, explicación clara del problema y botón de acción `"Reintentar carga"`.
4. **Estado con Datos (`Data State`):** Renderizado limpio con paginación o virtualización si supera las 50 filas.

---

## 6. Accesibilidad (WCAG 2.1 Nivel AA)

1. **Contraste cromático:** Texto primario (`#111827`) y secundario (`#4b5563`) sobre blanco garantizan ratio > 7:1 (AAA). Nunca usar `text-gray-300` para texto legible sobre fondo blanco.
2. **Semántica HTML:** Usar `<button type="button">` real para acciones (prohibido `<div onClick={...}>`), `<nav>`, `<main>`, `<section>`, `<table>`, `<thead>`, `<th scope="col">`, `<label htmlFor="...">`.
3. **Independencia del Color:** Un estado de error, cuadre contable o mora no puede transmitirse solo con verde/rojo; debe ir acompañado de texto explícito (`"Cuadrado"`, `"Descuadrado (-$12.50)"`, `"Pendiente"`).
4. **Anillo de Foco Visible:** Nunca aplicar `outline-none` sin proveer `focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-1`.

---

## 7. Diseño para Impresión y Documentos Legales (`@media print`)

En vistas de Roles de Pago individuales, Liquidaciones de Haberes, Contratos y Reportes Contables:
- Ocultar navegación lateral, barra superior, filtros y botones de acción mediante `print:hidden`.
- Forzar fondo blanco puro (`print:bg-white`), texto negro (`print:text-black`) y bordes nítidos (`print:border-gray-300`).
- Incluir bloque de firmas (Empleador / Trabajador con número de cédula) alineado al pie cuando el documento tenga validez legal en Ecuador.

