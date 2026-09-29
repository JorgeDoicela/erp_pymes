# Reglas del Proyecto (ERP PYMES)

Este archivo define el stack tecnológico, arquitectura y estándares de diseño exclusivos del sistema **ERP PYMES** (gestión empresarial, inventarios, facturación y contabilidad para PYMES). Las directrices globales aplican automáticamente.

---

## 1. Filosofía de Producto y Estándar de Diseño (Holded / Xero / Linear)

* **Enfoque:** Sistema B2B financiero y operativo de alto control, precisión y sobriedad.
* **Reglas Visuales Cardinales:**
  - Fondos: Blanco puro `#ffffff` sobre superficie `#f9fafb`.
  - Bordes: `1px solid #e5e7eb` (fino y sobrio, nunca decorativo).
  - Esquinas: `rounded-[4px]` a `rounded-[6px]` máximo (prohibido `rounded-2xl`).
  - Sombras: Prohibidas en tarjetas y tablas; solo sombra sutil en modales (`shadow-xl`) o botones (`shadow-xs`).
  - Cifras y Valores: Monedas, RUCs y fechas **siempre** con `font-mono` y `tabular-nums`.
  - Cero Emojis, cero gradientes y cero falsos affordances (no encerrar texto plano en cajas tipo botón o badges de colores decorativos).
  - Iconos SVG: Mínimos y estrictamente justificados (navegación y acciones reales).

---

## 2. Orquestación y Activación de Skills (ERP PYMES)

* **Tareas de Frontend, UI y Componentes:**
  1. Activar skill global `desarrollo-frontend`.
  2. Activar skill local `estilos-erp-pymes`.
* **Tareas de Backend, APIs o Contabilidad:**
  1. Activar skill global `desarrollo-backend`.
* **Tareas de Documentación:** Activar skill global `documentacion`.
