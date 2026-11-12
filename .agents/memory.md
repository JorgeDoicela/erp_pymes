# Memoria del Proyecto — ERP PYMES

Este archivo almacena el contexto operativo, decisiones de interfaz y lecciones aprendidas exclusivas del sistema ERP PYMES.

---

## 1. Decisiones de Diseño y Arquitectura Consolidadas

* **Estándar Visual:** Enterprise B2B minimalista (Holded / Xero / Linear).
* **Superficie:** Fondo `#f9fafb`, tarjetas `#ffffff` con borde `1px solid #e5e7eb` y esquinas de 4px a 6px.
* **Prohibiciones Absolutas:** Cero emojis, cero gradientes, cero sombras en tablas y cero cajas de colores para badges decorativos.
* **Tipografía de Cifras:** Valores financieros, RUCs y fechas con `font-mono tabular-nums`.
* **Arquitectura Backend (Pure Nested Vertical Slices):** 100% de los dominios organizados en Bounded Contexts modulares (`backend/src/modules/`, 21 módulos expuestos en `src/modules/index.js`). Los módulos compuestos (`attendance`, `payroll`, `employees`, `performance`, `reports`, `tenants`, `compliance`, `notifications`, `intelligence`) albergan sub-carpetas de rebanadas verticales anidadas (`/tracking`, `/absences`, `/shifts`, `/calculation`, `/config`, `/directory`, etc.), cada una encapsulando su propio controlador, servicio, repositorio y rutas. Los módulos atómicos (`auth`, `accounting`, `audit`, etc.) operan como single-slice directo. Todo inter-dominio se comunica únicamente vía el contrato público del módulo (`../<modulo>/index.js`), eliminando imports profundos cruzados. Prohibido Prisma ORM directo en controladores.
* **Arquitectura de Pruebas (`backend/tests/`):** Estructura jerárquica desacoplada organizada en 5 categorías: `architecture/` (monolito modular, repositorios), `core/` (cifrado, utilidades financieras, middlewares, seguridad, salud, validación DTO), `integration/` (regresiones multimodulares, auditoría de cálculos), `modules/<dominio>/` (pruebas unitarias por bounded context: `attendance`, `compliance`, `employees`, `intelligence`, `payroll`, `recruitment`, `signatures`) y `stress/` (scripts de carga y estrés de motores estocásticos).
* **Transversales y Núcleo (`src/core/`):** Enrutador central en `backend/src/core/router.js`, export canónico en `src/core/index.js`, middlewares transversales en `src/core/middleware/` (`errorHandler`, `performance`, `rateLimit`, `validate`), almacenamiento en `src/core/storage/` (`blob.service.js`, `upload.middleware.js`), utilidades en `src/core/utils/` (`asyncHandler`, `financialUtils`) y criptografía de campo en `src/core/security/encryption.js`. Middlewares de dominio residen co-ubicados dentro de sus Bounded Contexts (`modules/auth/auth.middleware.js`, `modules/tenants/organization/tenant.middleware.js`, `modules/tenants/superadmin/superAdmin.middleware.js`, `modules/system/maintenance.middleware.js`) y se exponen en sus respectivos `index.js`. Carpetas obsoletas `src/middleware/` y `src/utils/` fueron eliminadas por completo (cero proxies y cero duplicación horizontal).
* **Persistencia Pura en Servicios:** Controladores y servicios de dominio delegan la persistencia a sus repositorios (`performanceRepository`, `contractRepository`, `recruitmentRepository`), eliminando consultas crudas a Prisma ORM fuera de la capa de infraestructura.

---

## 2. Historial de Decisiones y Lecciones Aprendidas

* **2026-11-11 (Entrenamiento en Google Colab GPU + Publicación en Hugging Face Hub `doiceladev`):**
  * Se ejecutó el entrenamiento completo de las dos fases en Google Colab mediante `colab.exe`:
    1. **Fase 1 (en GPU NVIDIA A100-SXM4-40GB):** Entrenamiento del Bi-Encoder (`intfloat/multilingual-e5-base`, 2 épocas, 118 steps) y del Cross-Encoder Evaluador (`unicamp-dl/mMiniLM-L6-v2-mmarco-v2`, 2 épocas, 236 steps, separación de score `1.0000` vs `0.0000`) en 52.6s, exportando el índice neuronal real `backend/src/modules/sustainability/data/trained_retriever_index.json` (1,880 artículos + 800 términos de vocabulario).
    2. **Fase 2 (en GPU NVIDIA L4 22.03 GB VRAM en `bfloat16`):** Fine-Tuning LoRA (`r=16`, `lora_alpha=32`, `40,370,176` parámetros entrenables) sobre `Qwen/Qwen2.5-7B-Instruct` durante 3 épocas (`Train Loss: 0.7676`, `Eval Loss: 0.5329`), exportando `training_report_a100.json` y `qwen25_ecuador_ods8_lora.zip` (144.61 MB con `adapter_model.safetensors`, `adapter_config.json` y `Modelfile` de Ollama) y cerrando las sesiones de Colab (`0` sesiones activas).
    3. **Integración con Hugging Face Hub (`doiceladev`) y Auto-Hidratación AWS EC2:** Se publicaron ambos modelos y datasets en `https://huggingface.co/doiceladev/norma-erp-ecuador-retriever-e5` y `https://huggingface.co/doiceladev/norma-erp-ecuador-qwen2.5-7b-lora`, se descargaron todos los artefactos a `backend/src/modules/sustainability/data/` (incluyendo `models/qwen25-ecuador-ods8-lora/`), se agregó soporte del proveedor `huggingface` (`https://router.huggingface.co/v1`) en `llmProvider.service.js` y `GlobalLegalAssistantWidget.jsx`, se creó el sincronizador `backend/src/modules/sustainability/data/syncHuggingFaceModels.js` (`status`, `pull --full-lora`, `ensure`) integrado en `backend/entrypoint.sh` para auto-hidratación en AWS EC2, y se documentó la arquitectura de despliegue en `docs/07-despliegue-y-operaciones/05-infraestructura-docker-aws.md` y `docs/09-sostenibilidad-ods/04-asistente-ia-rag-y-fine-tuning-slm.md`.

* **2026-11-11 (Implementación Profesional del Canal WhatsApp Cloud API + DeepSeek / Gemini + RAG Legal):**
  * Se diseñó e implementó el módulo de producción `backend/src/modules/whatsapp/` bajo el estándar Pure Nested Vertical Slices.
  * **Decisiones Arquitectónicas Clave:**
    1. **Desacoplamiento de Transporte e Inteligencia:** Meta Cloud API opera estrictamente como canal de mensajería (Webhook HTTP POST entrante y Graph API v21.0 saliente). El razonamiento e inferencia se ejecutan en el backend utilizando las credenciales directas del desarrollador (`DEEPSEEK_API_KEY` o `GEMINI_API_KEY`), garantizando soberanía de datos y cero dependencia de modelos de Meta.
    2. **Reutilización del 100% del Motor RAG Legal Ecuatoriano:** Si el colaborador formula preguntas sobre el Código del Trabajo, IESS o despidos, se delega directamente a `sustainabilityRagService.processQuery()`, aprovechando los 1,880 artículos indexados, el Cross-Encoder reranker y la calculadora `Decimal.js`.
    3. **Resolución Determinista de Identidad Multi-Tenant (LOPDP):** El sistema normaliza el número remitente (`whatsappSecurityService.normalizePhoneNumberVariants`) a variantes canónicas E.164 y nacionales (`5939...`, `09...`), localizando el colaborador en `prisma.employee`. Si el número no está dado de alta en la nómina, se emite una respuesta protocolar informando que debe registrarse con Recursos Humanos.
    4. **Seguridad Perimetral y Resiliencia:** Validación criptográfica de firma HMAC-SHA256 (`x-hub-signature-256`), control de idempotencia en memoria con TTL de 15 minutos para evitar procesamiento repetido ante reintentos de Meta, y rate limiting por número de teléfono.
    5. **Conformidad de Pruebas y Cero Regresiones:** 4 suites unitarias dedicadas en `backend/tests/modules/whatsapp/` (35/35 pruebas en verde), suite completa de backend pasando al 100% (32/32 suites, 228/228 tests en verde), 0 errores en `tsc --noEmit` y 0 errores en `eslint .`.


* **2026-11-11 (Auditoría y Consolidación del Módulo de IA, RAG Legal Ecuatoriano, Fine-Tuning QLoRA y ODS 8):**
  * Se auditó integralmente el módulo `sustainability` (documentación `docs/09-sostenibilidad-ods/`, backend `backend/src/modules/sustainability/`, frontend `frontend/src/modules/sustainability/`, scripts de extracción de los 4 PDFs oficiales y entrenamiento QLoRA).
  * **Correcciones de Causa Raíz Aplicadas:**
    1. **Fusión Híbrida Densa + Cross-Encoder (`trained_retriever_index.json`):** Se implementó en `sustainability.repository.js` y `legalEvaluator.service.js` la proyección vectorial densa (128 dimensiones, similitud coseno) y el boost del Cross-Encoder a partir de `trained_retriever_index.json` (`articles[].embedding`, `articles[].crossEncoderScore` y `queryVocabularyEmbeddings`), y se actualizó el cuaderno `docs/09-sostenibilidad-ods/Entrenamiento_IA_Norma_ERP_Colab.ipynb` para exportar este esquema unificado más el `Modelfile` de Ollama tras el fine-tuning QLoRA en Google Colab.
    2. **Exportación Completa y Estratificada del Corpus PDF (`includeFullPdfCorpus`):** Se corrigió `sustainabilityFineTuning.service.js`, `sustainability.repository.js` y `FineTuningExportModal.jsx` para propagar `includeFullPdfCorpus` y aplicar muestreo estratificado uniforme a lo largo de los 4 PDFs oficiales (275 muestras ChatML por defecto o 3,835 muestras con corpus íntegro).
    2. **Auditoría Anti-Alucinación en `legalEvaluator.service.js` y `sustainabilityRag.service.js`:** Se incorporó la inyección automática de la `Nota de Auditoría del Evaluador Legal (Anti-Alucinación)` cuando un LLM externo cita artículos inexistentes o fuera del corpus recuperado (`unverifiedArticles`), exponiendo además `unverifiedArticles` en el objeto `evaluationAudit` y ampliando la verificación matemática `Decimal.js` a todos los rubros (`totalSettlement`, `totalDebit`, `netSalary`, `totalOvertimePay`, `totalSupp50`).
    3. **Resolución de API Keys por Proveedor (`llmProvider.service.js`):** Se priorizó la clave de entorno específica del proveedor seleccionado (`DEEPSEEK_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `ANTHROPIC_API_KEY`) antes del fallback genérico `AI_API_KEY`, evitando colisiones entre proveedores.
    4. **Aislamiento LOPDP y RBAC en `sustainability.routes.js` y `sustainability.repository.js`:** Se habilitó el acceso al asistente legal (`POST /api/sustainability/advisor/query`) para todos los roles autenticados del ERP (`admin`, `hr`, `accounting`, `manager`, `employee`, `entrepreneur`, `superadmin`) dado que `GlobalLegalAssistantWidget` opera transversalmente en `MainLayout.jsx`. En cambio, en `GET /api/sustainability/ods8` y `getOds8AggregatedData(tenantId)` se blindó el aislamiento multi-tenant LOPDP para impedir que consultas sin `tenantId` (o de `superadmin`) agreguen o desencripten salarios de colaboradores de los tenants.
    5. **Conectividad Interna de Docker (`docker-compose.yml`):** Se fijó `DATABASE_URL` y `REDIS_URL` del servicio `backend` hacia los hosts internos de la red Docker (`@db:5432` y `redis://redis:6379`) interpolando `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_DB`, evitando que el `DATABASE_URL` de desarrollo local (`localhost:5433`) en `.env` desviara la conexión dentro del contenedor.

* **2026-11-11 (Aislamiento Estricto de SuperAdmin y Cumplimiento de Protección de Datos):**
  * Por normativa de protección de datos (LOPDP / GDPR) y separación estricta de responsabilidades SaaS, el rol `superadmin` administra exclusivamente la infraestructura de la plataforma (empresas, planes, métricas de plataforma y auditoría global), quedando completamente aislado y desprovisto de acceso a los datos privados y operativos de los tenants.
  * Se corrigió `RequireAuth` en `App.jsx` para bloquear de raíz cualquier navegación de `superadmin` a rutas operativas de empresas (`/admin`, `/admin/*`, `/attendance`, `/performance`, `/recruitment`, `/empleado`), redirigiéndolo directamente a `/superadmin/dashboard`.
  * Se eliminó el selector de empresas en `Header.jsx`, la inyección de cabecera `x-tenant-id` en `httpClient.js` y los banners de "Modo Supervisión SuperAdmin (Solo Lectura)" e "Inspección de Empresa" en `DashboardLayout.jsx`.
  * Se eliminaron los permisos operativos residuales de `roles.js` (`canManageEmployees`, `canManagePayroll`, etc.) para `superadmin` y la redirección post-login en `Login.jsx` ahora envía a `superadmin` directamente a `/superadmin/dashboard`.
  * Imagen `rh-frontend:latest` reconstruida y actualizada en el contenedor Docker.


* **2026-11-11 (Auditoría Integral de Duplicación de Herramientas, Dependencias y UI):**
  * Se auditó todo el monorepo en busca de herramientas y componentes redundantes:
    1. UI Form System: `InputField.jsx` y `SelectField.jsx` duplicaban `Input.jsx` y `Select.jsx`. Se enriquecieron `Input` y `Select` con soporte nativo de tooltip `help` y `placeholder`, reduciendo `InputField` y `SelectField` a alias retrocompatibles. En `EmployeeHelpers.jsx`, se eliminaron sus declaraciones locales duplicadas de `InputField`, `SelectField` y `EmptyState` en favor del Design System en `@core/ui`.
    2. Utilidades Financieras y Formateadores: Se eliminó la reimplementación local de `formatCurrency` en `ExecutiveKPIBanner.jsx`, centralizándola en `frontend/src/core/utils/formatters.js`.
    3. Librerías de Iconos y Dependencias: Se eliminó el paquete redundante `@heroicons/react` migrando los 4 archivos consumidores a `react-icons/hi2`, y se limpiaron dependencias no utilizadas (`@simplewebauthn/browser` y `socket.io-client` en backend; `canvg` y `react-is` en frontend).
  * Validación integral superada: 35/35 suites Vitest (189/189 tests en verde), 0 errores en `tsc --noEmit`, 0 errores en ESLint (backend y frontend) y build de producción de Vite exitoso.

* **2026-11-11 (Organización Modular de Seeds en Base de Datos):**
  * Se modularizó la carpeta `backend/prisma/seeds/` en 11 directorios de dominio (`common`, `tenants`, `employees`, `attendance`, `payroll`, `performance`, `recruitment`, `accounting`, `communication`, `entrepreneurship`, `intelligence`) y se creó el barril canónico `seeds/index.js`.
  * Se corrigió la importación rota en `offboarding.js` hacia el contrato público `src/modules/employees/index.js`.
  * `seed.js` unificó sus 21 imports directos en una sola importación de dominio desde `./seeds/index.js`.
  * Validación integral superada: 26/26 suites Vitest (159/159 tests en verde), 0 errores en `tsc --noEmit` y 0 errores en `eslint .`.

* **2026-11-11 (Organización Modular y Jerárquica de la Suite de Pruebas):**
  * Se reorganizó la carpeta plana `backend/tests/` (26 archivos) en una taxonomía profesional limpia: `architecture/`, `core/`, `integration/`, `modules/<dominio>/` y `stress/`.
  * Se ajustaron los paths relativos de importación y mocks de Vitest según su profundidad (`../../src/` y `../../../src/`).
  * Validación integral superada: 26/26 suites Vitest (159/159 tests en verde), 0 errores en `tsc --noEmit` y 0 errores en `eslint .`.

* **2026-11-11 (Migración a Pure Nested Vertical Slices en Backend):**
  * Se migró la arquitectura modular de `backend/src/modules/` a Rebanadas Verticales Anidadas puras (Nested Vertical Slices) en los 9 módulos compuestos: `attendance` (absences, shifts, tracking), `payroll` (advances, benefits, calculation, config), `employees` (directory, lifecycle, records), `performance` (evaluations, goals), `reports` (analytics, exports), `tenants` (organization, superadmin), `compliance` (labor, statutory), `notifications` (alerts, channels) e `intelligence` (analytics, entrepreneurship, predictive).
  * Los módulos atómicos (`accounting`, `audit`, `auth`, `biometrics`, `communication`, `contracts`, `documents`, `recruitment`, `signatures`, `skills`, `sustainability`, `system`) se mantienen como single slices autónomos.
  * Se blindaron los contratos públicos en los barriles `index.js` de cada módulo para evitar acoplamiento profundo inter-dominio.
  * Pruebas y validaciones completas: 26/26 suites Vitest (159/159 tests en verde), 0 errores en `tsc --noEmit` y 0 errores en `eslint .`.

* **2026-11-11 (Eliminación de Capas Duplicadas y Cierre Limpio de Vertical Slices):**
  * Se auditaron y eliminaron las 12 parejas de archivos duplicados y carpetas legacy (`src/middleware/` y `src/utils/`).
  * Se migró la totalidad de las 69 referencias residuales en rutas, servicios, seeds y tests hacia sus ubicaciones canónicas en `src/core/` y `src/modules/<dominio>/`.
  * Se eliminó el duplicado huérfano `seedSustainability.js` en el módulo de sostenibilidad.
  * Para evitar ciclos de dependencia en tiempo de ejecución (ESM), las rutas importan directamente el middleware de su bounded context correspondiente (`auth.middleware.js`, `tenant.middleware.js`, `superAdmin.middleware.js`).
  * Validación integral superada: 26/26 suites Vitest (159/159 tests en verde), 0 errores en `tsc --noEmit` y 0 errores en `eslint .`.

* **2026-11-10 (Cierre de Migración Modular Fases 4 y 5):**
  * Se modularizaron los bloques pendientes (`audit`, `biometrics`, `skills`, `communication`, `tenants`, `notifications`, `reports`, `intelligence`, `auth`, `system`) y se trasladó `payrollCronJob.js` a `src/modules/payroll/payroll.jobs.js`.
  * En `tenants`, se unificó la transacción de creación de empresa + settings + configuración de nómina + turno + admin en `tenantRepository.provisionTenantWithAdmin` para evitar duplicación entre onboarding público y alta desde SuperAdmin.
  * En `reports`, se centralizó la construcción de CSV con BOM UTF-8 en `export.service.js`.
  * Se actualizaron todos los imports y mocks de `backend/tests/` y `backend/prisma/seeds/offboarding.js` hacia `src/modules/` y `src/core/`, logrando 26/26 archivos Vitest (156/156 tests en verde), 0 errores en `tsc --noEmit` y 0 errores en `eslint .`.
