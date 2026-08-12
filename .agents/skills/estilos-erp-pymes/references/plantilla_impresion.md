# Plantilla de Impresión de Documentos (Facturas, Comprobantes y Rol de Pagos)

Esta plantilla HTML/CSS define el estándar visual para generar documentos impresos o exportados a PDF (Facturas, Cotizaciones, Comprobantes de Pago, Rol de Nómina) cumpliendo los criterios de diseño del ERP PYME.

---

## 1. Reglas Estilísticas de Impresión (@media print)

```css
@media print {
  /* Configuración de Hoja A4 / Carta con Márgenes Limpios */
  @page {
    size: A4;
    margin: 15mm 15mm 15mm 15mm;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    color: #111827 !important;
    background: #ffffff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Ocultar elementos de UI no imprimibles */
  .no-print, nav, header, footer, .sidebar, .topbar, .btn {
    display: none !important;
  }

  /* Contenedor Imprimible */
  .print-document {
    width: 100%;
    margin: 0 auto;
    padding: 0;
    box-shadow: none !important;
  }

  /* Tablas Imprimibles */
  .print-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
    margin-bottom: 15px;
  }

  .print-table th {
    background-color: #f3f4f6 !important;
    color: #111827 !important;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 0.05em;
    border-bottom: 2px solid #e5e7eb;
    padding: 8px;
    text-align: left;
  }

  .print-table td {
    padding: 8px;
    border-bottom: 1px solid #f3f4f6;
    font-size: 11px;
  }

  .font-tabular {
    font-family: 'JetBrains Mono', monospace;
    font-variant-numeric: tabular-nums lining-nums;
  }

  .text-right {
    text-align: right;
  }
}
```

---

## 2. Estructura HTML Estándar para Factura / Comprobante

```html
<div class="print-document">
  <!-- Encabezado del Documento: Datos Emisor vs Receptor -->
  <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
    <div>
      <h2 style="margin: 0; font-size: 20px; color: #111827;">EMPRESA PYME S.A.</h2>
      <p style="margin: 4px 0 0 0; color: #4b5563; font-size: 11px;">RUC: 1790000000001</p>
      <p style="margin: 2px 0 0 0; color: #4b5563; font-size: 11px;">Av. Principal #123 y Calle Secundaria</p>
      <p style="margin: 2px 0 0 0; color: #4b5563; font-size: 11px;">Quito - Ecuador | Tel: (02) 2345-678</p>
    </div>
    
    <div style="text-align: right;">
      <span style="display: inline-block; padding: 4px 8px; background: #e0e7ff; color: #3730a3; font-weight: 700; border-radius: 4px; font-size: 11px;">FACTURA ELECTRÓNICA</span>
      <h3 style="margin: 6px 0 0 0; font-size: 16px; color: #111827;" class="font-tabular">N° 001-002-000004589</h3>
      <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 11px;"><strong>Fecha:</strong> 12/08/2026</p>
      <p style="margin: 2px 0 0 0; color: #6b7280; font-size: 11px;"><strong>Vencimiento:</strong> 12/09/2026</p>
    </div>
  </div>

  <!-- Información del Cliente / Beneficiario -->
  <div style="margin-top: 20px; display: flex; justify-content: space-between; background: #f9fafb; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
    <div>
      <span style="font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: 600;">Cliente / Razon Social</span>
      <p style="margin: 2px 0 0 0; font-weight: 600; font-size: 12px; color: #111827;">Comercializadora del Norte Cía. Ltda.</p>
      <p style="margin: 2px 0 0 0; color: #4b5563; font-size: 11px;">RUC/CI: 1798887776001</p>
    </div>
    <div>
      <span style="font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: 600;">Contacto & Dirección</span>
      <p style="margin: 2px 0 0 0; color: #4b5563; font-size: 11px;">Av. Amazonas N34-120 y República</p>
      <p style="margin: 2px 0 0 0; color: #4b5563; font-size: 11px;">Email: facturacion@norte.com.ec</p>
    </div>
  </div>

  <!-- Tabla de Detalle de Items -->
  <table class="print-table">
    <thead>
      <tr>
        <th style="width: 10%;">Código</th>
        <th style="width: 45%;">Descripción</th>
        <th style="width: 10%; text-align: center;">Cant.</th>
        <th style="width: 15%; text-align: right;">P. Unitario</th>
        <th style="width: 20%; text-align: right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="font-tabular">PRD-001</td>
        <td>Licencia de Software ERP PYME (Anual)</td>
        <td style="text-align: center;" class="font-tabular">1</td>
        <td style="text-align: right;" class="font-tabular">$450.00</td>
        <td style="text-align: right;" class="font-tabular">$450.00</td>
      </tr>
      <tr>
        <td class="font-tabular">SRV-004</td>
        <td>Capacitación e Implementación en Sitio (Horas)</td>
        <td style="text-align: center;" class="font-tabular">5</td>
        <td style="text-align: right;" class="font-tabular">$35.00</td>
        <td style="text-align: right;" class="font-tabular">$175.00</td>
      </tr>
    </tbody>
  </table>

  <!-- Totales y Resumen Financiero -->
  <div style="display: flex; justify-content: space-between; margin-top: 15px;">
    <div style="width: 55%; font-size: 10px; color: #6b7280;">
      <p style="margin: 0; font-weight: 600; text-transform: uppercase; color: #374151;">Forma de Pago:</p>
      <p style="margin: 2px 0 0 0;">Transferencia Bancaria - Banco Pichincha Cta. Cte. #2100123456</p>
      <p style="margin: 6px 0 0 0; font-style: italic;">Documento generado automáticamente por Sistema ERP PYME.</p>
    </div>

    <div style="width: 40%;">
      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <tr>
          <td style="padding: 4px 0; color: #4b5563;">Subtotal 15%:</td>
          <td style="padding: 4px 0; text-align: right;" class="font-tabular">$625.00</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #4b5563;">Subtotal 0%:</td>
          <td style="padding: 4px 0; text-align: right;" class="font-tabular">$0.00</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #4b5563;">IVA (15%):</td>
          <td style="padding: 4px 0; text-align: right;" class="font-tabular">$93.75</td>
        </tr>
        <tr style="border-top: 2px solid #111827; font-weight: 700; font-size: 13px;">
          <td style="padding: 6px 0; color: #111827;">TOTAL VALOR:</td>
          <td style="padding: 6px 0; text-align: right; color: #111827;" class="font-tabular">$718.75</td>
        </tr>
      </table>
    </div>
  </div>
</div>
```
