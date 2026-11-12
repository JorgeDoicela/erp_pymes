---
name: erp-ia-rag
description: >
  Activa esta skill en tareas del sistema de IA de Norma ERP: RAG legal,
  LLM multi-proveedor, WhatsApp (skills registry, 2FA), neuralRetriever,
  legalEvaluator, motores predictivos (intelligence/), embeddings pgvector,
  sincronización de modelos HuggingFace y fine-tuning.
---

# IA, RAG y Motores Predictivos — Norma ERP

**Rol:** Ingeniero de IA, RAG y Motores Predictivos de Norma ERP. Mantienes y evolucionas el pipeline RAG legal (`sustainability/`), el enrutador multi-proveedor LLM (`llmProvider.service.js`), la recuperación neuronal con Bi-Encoder/Cross-Encoder ONNX y `pgvector` (`neuralRetriever.service.js`), el auditor determinístico anti-alucinación (`legalEvaluator.service.js`), el asistente conversacional de WhatsApp (`whatsapp/`) y los motores predictivos (`intelligence/predictive/`).

**Combinar siempre con:** `erp-ingenieria-software` (base transversal) +
`erp-backend` (anatomía de slice) + `erp-seguridad-multitenant` + `erp-testing-calidad`.

---

## 1. Mapa de Directorios Real

```
backend/src/modules/
├── sustainability/                    # RAG legal, ODS 8 y cumplimiento laboral/tributario
│   ├── index.js                       # Contrato público del módulo
│   ├── neuralRetriever.service.js     # Bi-Encoder + Cross-Encoder ONNX QUInt8 + pgvector
│   ├── legalEvaluator.service.js      # Auditoría determinística anti-alucinación + Decimal.js
│   ├── sustainabilityRag.service.js   # Orquestador RAG principal
│   ├── sustainability.service.js      # Métricas ODS 8 e ingesta documental
│   ├── sustainability.repository.js   # Acceso a datos, pgvector HNSW (768d) y FTS
│   ├── sustainability.controller.js
│   ├── sustainability.routes.js
│   ├── sustainability.dto.js
│   ├── sustainabilityFineTuning.service.js
│   ├── llmProvider.service.js         # Estrategia multi-proveedor LLM
│   └── data/                          # Modelos ONNX, corpus legal indexado y syncHuggingFaceModels.js
├── intelligence/
│   ├── analytics/                     # Analítica descriptiva y KPIs
│   ├── entrepreneurship/              # Inteligencia de negocio PYME
│   └── predictive/                    # Motores estocásticos y deep learning tabular
│       ├── intelligence.controller.js
│       ├── intelligence.service.js
│       ├── rsi.service.js             # Relative Strength Index organizacional
│       ├── causalInference.service.js # Inferencia causal
│       ├── federatedLearning.service.js # Aprendizaje federado cross-tenant
│       ├── morl.service.js            # Multi-Objective Reinforcement Learning
│       ├── ftTransformer.service.js   # Feature Tokenizer Transformer
│       └── temporalAttention.service.js # Atención temporal sobre series
└── whatsapp/                          # Integración WhatsApp Business Cloud API
    ├── whatsapp.controller.js
    ├── whatsapp.service.js
    ├── whatsappAi.service.js
    ├── whatsappSecurity.service.js
    ├── whatsappConfirmation.service.js
    ├── whatsapp.repository.js
    ├── whatsapp.routes.js
    └── skills/                        # Registro de habilidades conversacionales (whatsappSkill.registry.js)
```

---

## 2. Pipeline RAG Legal (Flujo Obligatorio)

```
Consulta del usuario
  │
  ▼
1. neuralRetriever.service.js
   ├─ Embedding de consulta con Bi-Encoder local (intfloat/multilingual-e5-base, 768d)
   ├─ Búsqueda híbrida: similitud coseno en pgvector + coincidencia léxica
   └─ Re-ranking neuronal con Cross-Encoder ONNX QUInt8
  │
  ▼
2. legalEvaluator.service.js (Auditoría Anti-Alucinación)
   ├─ Verificación de existencia y vigencia de artículos citados en el corpus
   ├─ Recálculo determinístico con Decimal.js (IESS 9.45% / 11.15%, fondos de reserva 8.33%, décimos, liquidación)
   └─ Cálculo de score de confianza por fragmento
  │
  ▼
3. llmProvider.service.js
   ├─ Resolución del proveedor activo (resolveActiveConfig)
   ├─ Inyección de contexto legal verificado y restricciones del sistema
   └─ Síntesis de respuesta trazable
  │
  ▼
4. sustainabilityRag.service.js
   └─ Entrega de respuesta con fuentes verificadas y metadatos de auditoría
```

---

## 3. Reglas Innegociables de IA y RAG

### 3.1 Proveedores LLM (`llmProvider.service.js`)
1. **Patrón Strategy Map:** Todos los proveedores (`deepseek`, `openai`, `gemini`, `groq`, `anthropic`, `local_ollama`, `huggingface`) se configuran en `PROVIDER_CONFIGS` y se resuelven mediante `resolveActiveConfig()`.
2. **Prohibido instanciar clientes LLM sueltos:** Ningún servicio fuera de `llmProvider.service.js` debe hacer `fetch` directo a APIs de OpenAI, DeepSeek o Gemini.
3. **Cero claves hardcodeadas:** Las API keys se leen de `process.env` o configuración cifrada del tenant. Si el proveedor falla o no tiene clave válida, lanzar `AppError` descriptivo o aplicar el fallback explícito configurado, nunca silenciar con `catch {}`.

### 3.2 Modelos ONNX Locales (`@huggingface/transformers`)
1. **Aislamiento de importación:** `@huggingface/transformers` solo puede importarse en `sustainability/neuralRetriever.service.js`, `sustainability/sustainabilityFineTuning.service.js` y `sustainability/data/syncHuggingFaceModels.js`.
2. **Carga perezosa (Singleton):** Los pipelines ONNX consumen memoria significativa; deben inicializarse como singletons reutilizables y nunca recrearse en cada request HTTP.
3. **Almacenamiento fuera de Git:** Los pesos `.onnx` viven en directorios ignorados por Git y se descargan o verifican en el arranque mediante `sustainability/data/syncHuggingFaceModels.js`.

### 3.3 Auditoría Anti-Alucinación (`legalEvaluator.service.js`)
1. **Paso obligatorio:** Toda respuesta del asistente legal o laboral que cite artículos del Código del Trabajo, Ley de Régimen Tributario Interno, normativa IESS o LOPDP, o que incluya cálculos numéricos, **debe** ser validada por `legalEvaluator`.
2. **Aritmética exacta:** El LLM nunca es la fuente de verdad aritmética. Los montos de nómina, indemnizaciones (Art. 185 Desahucio 25%, Art. 188 Despido Intempestivo) y aportaciones se calculan con `Decimal.js` en el evaluador determinístico.

### 3.4 Búsqueda Vectorial (`pgvector`)
1. **Aislamiento multi-tenant:** Si la tabla vectorial almacena documentos por empresa (`tenantId`), toda consulta `$queryRaw` con el operador `<=>` (distancia coseno) debe filtrar explícitamente `WHERE "tenantId" = ${tenantId}`.
2. **Parametrización segura:** Usar siempre tagged templates de Prisma (`prisma.$queryRaw\`...\``) para prevenir inyección SQL al pasar vectores o filtros.

### 3.5 Motores Predictivos (`intelligence/predictive/`)
1. **Desacoplamiento:** Cada motor (`rsi`, `causalInference`, `federatedLearning`, `morl`, `ftTransformer`, `temporalAttention`) debe operar sobre datos entregados por su repositorio correspondiente. Nota: existe deuda técnica documentada de llamadas directas a `prisma` en estos servicios que debe migrarse progresivamente a `*.repository.js`.
2. **Privacidad en Aprendizaje Federado:** `federatedLearning.service.js` solo agrega gradientes o pesos estadísticos anónimos entre tenants; jamás expone registros nominales de empleados ni salarios de un tenant a otro.

### 3.6 Asistente WhatsApp (`whatsapp/`)
1. **Verificación de firma HMAC:** Todo webhook entrante de Meta/WhatsApp debe validar la firma `X-Hub-Signature-256` antes de procesar el payload.
2. **Registro de Skills:** Las capacidades conversacionales se registran en `whatsapp/skills/` siguiendo el patrón Registry. Para agregar una nueva intención conversacional, crear una skill aislada y registrarla sin inflar `whatsapp.service.js`.
3. **2FA para operaciones sensibles:** Consultas o acciones que expongan roles de pago, certificados laborales o saldos requieren verificación de identidad previa vinculada al empleado del tenant.

---

## 4. Verificación antes de Cerrar Tareas de IA

```bash
# Linter sobre los módulos de IA y WhatsApp
npx --prefix backend eslint src/modules/sustainability/ src/modules/intelligence/ src/modules/whatsapp/

# Pruebas unitarias de RAG, Inteligencia y WhatsApp
npx --prefix backend vitest run tests/modules/sustainability/ tests/modules/intelligence/ tests/modules/whatsapp/

# Auditoría arquitectónica
node .agents/skills/erp-ingenieria-software/scripts/audit-architecture.mjs
```

