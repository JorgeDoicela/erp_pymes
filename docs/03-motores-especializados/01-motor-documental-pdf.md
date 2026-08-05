# 01. Motor Documental y Generación de PDF

## 1. Descripción del Motor Documental

El **Motor Documental de EMPLIFI** se encarga de estructurar, renderizar y gestionar los documentos físicos digitales del personal, como contratos laborales, comprobantes individuales de pago (roles de pago) y certificados de trabajo.

```
Datos Estructurados (JSON/DB) ──► Plantilla HTML/CSS (Templates) ──► Motor PDF Engine (PDFKit/Puppeteer) ──► Documento PDF ──► Almacenamiento Protegido
```

---

## 2. Tipos de Documentos Soportados y Utilidades del Cliente

1. **Roles de Pago Individuales (`generatePayslipPDF.js`)**:
 - Desglosa ingresos (salario ganado por días trabajados, bonos, horas extras), egresos (descuentos de ley, anticipos de sueldo) y líquido a recibir.
2. **Acta de Finiquito y Liquidación Legal (`generateSettlementPDF.js`)**:
 - Renderiza el desglose legal completo de haberes al término de la relación laboral: 13er sueldo proporcional, 14to sueldo proporcional (SBU), vacaciones no gozadas, desahucio (Art. 185) e indemnización por despido intempestivo (Art. 188). Incluye declaración de satisfacción y bloques de firma formal para ambas partes.
3. **Certificados de Trabajo Oficiales (`generateCertificatePDF.js`)**:
 - Certificado laboral emitido en 1 clic desde el portal del empleado. Renderiza membrete oficial, cédula, cargo, departamento, salario base y fecha de ingreso.
 - **Validación de Autenticidad QR:** Genera un recuadro de seguridad con código QR matriz y código hash único de autenticación (`CERT-ID-TIMESTAMP`) para verificación institucional externa.

---

## 3. Almacenamiento y Seguridad de Documentos

- Los documentos generados se vinculan a la entidad `Document` en la base de datos con su `mimeType`, `originalName` y `expiryDate`.
- La ruta física `/uploads/documents/` se encuentra resguardada bajo control de acceso JWT, impidiendo descargas públicas o directas sin previa autorización.
