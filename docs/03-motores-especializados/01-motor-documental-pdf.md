# Motor Documental y Generación de Archivos PDF

## 1. Especificación del Motor de Renderizado PDF

El motor documental se encarga de transformar datos estructurados desde PostgreSQL en documentos electrónicos PDF formateados. El proceso de conversión se basa en plantillas dinámicas HTML5/CSS3 procesadas en el backend Node.js.

```
Datos de Entidad (JSON / Prisma)
       │
       ▼
 Plantilla HTML5 + Estilos CSS (Templates)
       │
       ▼
 Generator Engine (PDFKit / Puppeteer)
       │
       ▼
 Documento Binario (Application/PDF)
       │
       ▼
 Depósito de Archivos Protegido (/uploads/documents/)
```

---

## 2. Tipos de Documentos Generados

### 2.1. Comprobantes Individuales de Pago (Roles de Pago)
- **Generador**: `generatePayslipPDF.js`
- **Contenido**: Desglose de ingresos (salario proporcional a días laborados, recargos de horas extras al $50\%$ y $100\%$, comisiones, bonos) y egresos (aporte personal IESS del $9.45\%$, retenciones del Impuesto a la Renta, cuotas de anticipos de sueldo).

### 2.2. Actas de Finiquito y Liquidaciones Legales
- **Generador**: `generateSettlementPDF.js`
- **Contenido**: Cómputo de haberes por terminación de la relación laboral conforme al Código del Trabajo (Ecuador):
  - Proporcional de Décimo Tercer Sueldo (Art. 111).
  - Proporcional de Décimo Cuarto Sueldo (Art. 113).
  - Compensación por Vacaciones No Gozadas (Art. 69).
  - Bonificación por Desahucio ($25\%$ de la última remuneración por año cumplido, Art. 185).
  - Indemnización por Despido Intempestivo (Art. 188).

### 2.3. Certificados Laborales con Verificación Digital QR
- **Generador**: `generateCertificatePDF.js`
- **Contenido**: Membrete oficial de la empresa (`Tenant`), nombres completos del trabajador, número de identificación (`identityCard`), cargo, departamento, salario mensual base y antigüedad acumulada.
- **Mecanismo de Autenticidad QR**: Incorpora un código QR que codifica una dirección de validación pública con un hash SHA-256 único formado por `hash(tenantId + employeeId + issueTimestamp + SECRET)`.

---

## 3. Seguridad y Control de Almacenamiento

- **Entidad `Document`**: Almacena los metadatos de cada archivo generado (`id`, `employeeId`, `title`, `type`, `fileUrl`, `mimeType`, `size`, `createdAt`).
- **Control de Descarga**: Los archivos residentes en `/uploads/documents/` no son accesibles públicamente. Cada descarga requiere autenticación JWT con validación del rol `admin`, `hr` o el usuario propietario del expediente.
