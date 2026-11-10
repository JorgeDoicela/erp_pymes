# Alineación Estratégica con el ODS 8 — Trabajo Decente y Crecimiento Económico

Este documento formaliza la vinculación exclusiva y directa de la plataforma **Emplifi (ERP PYMES)** con el **Objetivo de Desarrollo Sostenible 8 de la Organización de las Naciones Unidas (ONU): Promover el crecimiento económico inclusivo y sostenible, el empleo y el trabajo decente para todos**.

---

## 1. Justificación y Problemática Estructural

En América Latina y el Ecuador, las Pequeñas y Medianas Empresas (PyMEs) generan la mayor parte del empleo privado, pero enfrentan barreras críticas para garantizar condiciones laborales estandarizadas y sostenibles:

1. **Informalidad Contractual y Desprotección:** Alta rotación no registrada, contratos verbales o en formatos estáticos sin control de vencimientos, exponiendo al trabajador a la incertidumbre y a la empresa a contingencias laborales.
2. **Precarización en la Remuneración:** Errores sistemáticos en el cálculo manual de horas suplementarias, recargos nocturnos, fondos de reserva y décimos, generando desconfianza y disputas laborales.
3. **Evasión o Retraso en Seguridad Social:** Dificultad para conciliar y declarar oportunamente las aportaciones patronales y personales ante el Instituto Ecuatoriano de Seguridad Social (IESS).
4. **Vulnerabilidad en Procesos de Desvinculación:** Liquidaciones arbitrarias, falta de transparencia en causales de despido o desahucio y liquidación inexacta de haberes pendientes.

Emplifi aborda este problema estructurando un sistema de gestión empresarial y de recursos humanos que convierte la normativa laboral ecuatoriana en reglas de negocio programáticas, deterministas y auditables, garantizando el trabajo formal y digno en la pequeña y mediana empresa.

---

## 2. Metas Específicas de la ONU y Cobertura Funcional

```mermaid
flowchart TD
    subgraph ONU["Agenda 2030 — ODS 8"]
        ODS8["ODS 8: Trabajo Decente y Crecimiento Económico"]
        M83["Meta 8.3: Formalización de PyMEs y Emprendimiento"]
        M85["Meta 8.5: Trabajo Decente e Igualdad Salarial"]
        M88["Meta 8.8: Protección de Derechos Laborales"]
    end

    subgraph Emplifi["Módulos Transaccionales de Emplifi"]
        C1["Gestión de Contratos y Expediente Digital"]
        C2["Módulo de Emprendimiento e Incubadora"]
        C3["Motor de Nómina de Alta Precisión (Decimal.js)"]
        C4["Control de Asistencia con Geocerca y Turnos"]
        C5["Motor de Liquidación Legal (Offboarding)"]
        C6["Firmas Digitales QR y Verificación Pública"]
    end

    ODS8 --> M83 & M85 & M88

    M83 -->|Estandarización y Trazabilidad| C1
    M83 -->|Cap Table, Hitos y Rondas| C2
    M85 -->|Cálculo Salarial Exacto y Sin Sesgos| C3
    M88 -->|Jornadas Justas y Horas Extras| C4
    M88 -->|Finiquito Justo según Código de Trabajo| C5
    M88 -->|Transparencia Criptográfica| C6
```

---

## 3. Matriz de Trazabilidad Cruzada

| Meta de la ONU                               | Requerimiento Operativo                                                         | Componente Técnico en Emplifi                                               | Impacto Demostrable                                                                                      |
| :------------------------------------------- | :------------------------------------------------------------------------------ | :-------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------- |
| **8.3 (Formalización y Crecimiento PyME)**   | Sustituir la informalidad laboral mediante contratos formalizados y auditables. | `contract.service.js`, `contractCronJob.js`                                 | 100% de colaboradores con contrato tipificado, expediente digital y alerta automática de vencimientos.   |
| **8.3 (Emprendimiento e Innovación)**        | Apoyar la maduración y escalabilidad de nuevas empresas emergentes.             | `entrepreneurship.service.js`                                               | Registro de rondas de inversión, tablas de capitalización y seguimiento de hitos de crecimiento.         |
| **8.5 (Salario Justo y No Discriminación)**  | Liquidar sueldos y aportes sin deducciones indebidas ni errores de redondeo.    | `payrollCalculationService.js`, `financialUtils.js`                         | Liquidación con 20 dígitos de precisión decimal (`ROUND_HALF_UP`), garantizando remuneraciones íntegras. |
| **8.5 (Seguridad Social)**                   | Garantizar la afiliación obligatoria y aportación exacta al IESS.               | `payrollCalculationService.js` (retención personal 9.45% / patronal 11.15%) | Generación de comprobantes desglosados y conciliables con las planillas del IESS.                        |
| **8.8 (Jornada Justa y Derechos Laborales)** | Proteger la jornada laboral legal y retribuir el trabajo extraordinario.        | `attendanceService.js`, geofencing, WebAuthn                                | Reconocimiento automático de horas suplementarias (25%, 50%) y extraordinarias (100%).                   |
| **8.8 (Desvinculación Legal)**               | Eliminar despidos intempestivos sin indemnización reglamentaria.                | `offboardingService.js`                                                     | Cálculo de actas de finiquito ajustadas estrictamente al Código del Trabajo (Arts. 185, 188).            |
