# 01. Motor Documental y Generación de PDF

## 1. Descripción del Motor Documental

El **Motor Documental de EMPLIFI** se encarga de estructurar, renderizar y gestionar los documentos físicos digitales del personal, como contratos laborales, comprobantes individuales de pago (roles de pago) y certificados de trabajo.

```
Datos Estructurados (JSON/DB) ──► Plantilla HTML/CSS (Templates) ──► Motor PDF Engine (PDFKit/Puppeteer) ──► Documento PDF ──► Almacenamiento Protegido
```

---

## 2. Tipos de Documentos Soportados

1. **Contratos Laborales (`Contract`)**: Renderiza clausulado legal, salario acordado, tipo de relación laboral y fecha de inicio/finalización.
2. **Roles de Pago Individuales (`PayrollDetail`)**: Desglosa ingresos (salario base, bonos, horas extras), egresos (aportes, retenciones, anticipos) y neto a recibir.
3. **Certificados de Trabajo**: Certificados automáticos con código de verificación QR y firma digital del Departamento de Talento Humano.

---

## 3. Almacenamiento y Seguridad de Documentos

- Los documentos generados se vinculan a la entidad `Document` en la base de datos con su `mimeType`, `originalName` y `expiryDate`.
- La ruta física `/uploads/documents/` se encuentra resguardada bajo control de acceso JWT, impidiendo descargas públicas o directas sin previa autorización.
