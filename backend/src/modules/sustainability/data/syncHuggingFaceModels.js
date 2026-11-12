/**
 * Sincronizador Bidireccional de Artefactos de IA con Hugging Face Hub (doiceladev)
 *
 * Permite verificar (status), descargar (pull) o auto-hidratar en producción AWS EC2 (ensure)
 * los modelos entrenados y el índice neuronal híbrido del módulo de Sostenibilidad (ODS 8)
 * de Norma ERP directamente utilizando la API oficial de Hugging Face Hub.
 *
 * Uso:
 *   node backend/src/modules/sustainability/data/syncHuggingFaceModels.js status
 *   node backend/src/modules/sustainability/data/syncHuggingFaceModels.js pull
 *   node backend/src/modules/sustainability/data/syncHuggingFaceModels.js pull --full-lora
 *   node backend/src/modules/sustainability/data/syncHuggingFaceModels.js ensure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../../../..');
const DATA_DIR = __dirname;
const LORA_MODEL_DIR = path.join(DATA_DIR, 'models', 'qwen25-ecuador-ods8-lora');

function loadEnvFromRoot() {
  const candidates = [path.join(ROOT_DIR, '.env'), path.resolve(__dirname, '../../../../.env')];
  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const content = fs.readFileSync(envPath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) continue;
      const key = line.slice(0, eqIdx).trim();
      let val = line.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

loadEnvFromRoot();

const HF_TOKEN = process.env.HF_TOKEN || process.env.HUGGINGFACE_HUB_TOKEN || '';
const HF_NAMESPACE = process.env.HF_NAMESPACE || 'doiceladev';
const HF_RETRIEVER_REPO_ID =
  process.env.HF_RETRIEVER_REPO_ID || `${HF_NAMESPACE}/norma-erp-ecuador-retriever-e5`;
const HF_LORA_REPO_ID =
  process.env.HF_LORA_REPO_ID || `${HF_NAMESPACE}/norma-erp-ecuador-qwen2.5-7b-lora`;

const ESSENTIAL_ARTIFACTS = [
  {
    repoId: HF_RETRIEVER_REPO_ID,
    remote: 'trained_retriever_index.json',
    local: path.join(DATA_DIR, 'trained_retriever_index.json'),
    description: 'Índice Neuronal Híbrido (Bi-Encoder e5 + Cross-Encoder A100)',
  },
  {
    repoId: HF_LORA_REPO_ID,
    remote: 'training_report_a100.json',
    local: path.join(DATA_DIR, 'training_report_a100.json'),
    description: 'Telemetría de Entrenamiento GPU (Qwen2.5-7B-Instruct LoRA)',
  },
  {
    repoId: HF_LORA_REPO_ID,
    remote: 'adapter_config.json',
    local: path.join(LORA_MODEL_DIR, 'adapter_config.json'),
    description: 'Configuración PEFT LoRA (r=16, alpha=32)',
  },
  {
    repoId: HF_LORA_REPO_ID,
    remote: 'Modelfile',
    local: path.join(LORA_MODEL_DIR, 'Modelfile'),
    description: 'Manifiesto de Despliegue para Ollama',
  },
  {
    repoId: HF_LORA_REPO_ID,
    remote: 'README.md',
    local: path.join(LORA_MODEL_DIR, 'README.md'),
    description: 'Model Card Oficial (Derecho Laboral Ecuatoriano & ODS 8)',
  },
];

const HEAVY_LORA_ARTIFACTS = [
  {
    repoId: HF_LORA_REPO_ID,
    remote: 'adapter_model.safetensors',
    local: path.join(LORA_MODEL_DIR, 'adapter_model.safetensors'),
    description: 'Pesos Tensoriales LoRA en bfloat16 (154 MB)',
  },
  {
    repoId: HF_LORA_REPO_ID,
    remote: 'tokenizer.json',
    local: path.join(LORA_MODEL_DIR, 'tokenizer.json'),
    description: 'Vocabulario y Tokenizador Qwen2.5',
  },
  {
    repoId: HF_LORA_REPO_ID,
    remote: 'tokenizer_config.json',
    local: path.join(LORA_MODEL_DIR, 'tokenizer_config.json'),
    description: 'Configuración de Tokenizador ChatML',
  },
  {
    repoId: HF_LORA_REPO_ID,
    remote: 'chat_template.jinja',
    local: path.join(LORA_MODEL_DIR, 'chat_template.jinja'),
    description: 'Plantilla Jinja ChatML',
  },
];

async function checkWhoami() {
  if (!HF_TOKEN) {
    return { name: HF_NAMESPACE, anonymous: true };
  }
  const res = await fetch('https://huggingface.co/api/whoami-v2', {
    headers: { Authorization: `Bearer ${HF_TOKEN}` },
  });
  if (!res.ok) {
    throw new Error(`Error autenticando con Hugging Face (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

async function downloadFileFromRepo(repoId, remoteFilename, localPath) {
  const url = `https://huggingface.co/${repoId}/resolve/main/${remoteFilename}`;
  const headers = HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {};
  const res = await fetch(url, { headers, redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`No se pudo descargar ${remoteFilename} desde ${repoId} (HTTP ${res.status})`);
  }
  const arrayBuffer = await res.arrayBuffer();
  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  fs.writeFileSync(localPath, Buffer.from(arrayBuffer));
  return fs.statSync(localPath).size;
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function runStatus() {
  const who = await checkWhoami();
  console.log(`=== Estado de Integración Hugging Face Hub — Norma ERP ===`);
  console.log(
    `Cuenta vinculada: ${who.name}${who.anonymous ? ' (Acceso público lectura)' : ` (Token autenticado: ${who.auth?.accessToken?.displayName || 'activo'})`}`
  );
  console.log(`1. Retriever & Evaluador: https://huggingface.co/${HF_RETRIEVER_REPO_ID}`);
  console.log(`2. Qwen2.5-7B LoRA ODS 8: https://huggingface.co/${HF_LORA_REPO_ID}\n`);

  console.log('Artefactos instalados en el proyecto:');
  for (const item of [...ESSENTIAL_ARTIFACTS, ...HEAVY_LORA_ARTIFACTS]) {
    const exists = fs.existsSync(item.local);
    const sizeStr = exists ? formatSize(fs.statSync(item.local).size) : 'FALTANTE';
    const relPath = path.relative(ROOT_DIR, item.local).replace(/\\/g, '/');
    console.log(` [${exists ? 'OK' : '--'}] ${relPath} (${sizeStr}) — ${item.description}`);
  }
}

async function runPull(includeFullLora = false) {
  const who = await checkWhoami();
  console.log(`Descargando artefactos desde Hugging Face (${who.name})...`);

  const list = includeFullLora
    ? [...ESSENTIAL_ARTIFACTS, ...HEAVY_LORA_ARTIFACTS]
    : ESSENTIAL_ARTIFACTS;

  for (const item of list) {
    const bytes = await downloadFileFromRepo(item.repoId, item.remote, item.local);
    const relPath = path.relative(ROOT_DIR, item.local).replace(/\\/g, '/');
    console.log(` [OK] ${item.remote} (${formatSize(bytes)}) -> ${relPath}`);
  }
}

async function runEnsure() {
  const includeFullLora = process.env.HF_PULL_FULL_LORA === 'true';
  const list = includeFullLora
    ? [...ESSENTIAL_ARTIFACTS, ...HEAVY_LORA_ARTIFACTS]
    : ESSENTIAL_ARTIFACTS;

  const missing = list.filter(
    (item) => !fs.existsSync(item.local) || fs.statSync(item.local).size < 20
  );
  if (missing.length === 0) {
    console.log('[HF Sync] Todos los artefactos de IA están presentes localmente.');
    return;
  }

  console.log(
    `[HF Sync] Descargando ${missing.length} artefacto(s) faltante(s) desde Hugging Face Hub...`
  );
  for (const item of missing) {
    try {
      const bytes = await downloadFileFromRepo(item.repoId, item.remote, item.local);
      console.log(` [OK] Descargado ${item.remote} (${formatSize(bytes)})`);
    } catch (err) {
      console.warn(` [WARN] No se pudo sincronizar ${item.remote}: ${err.message}`);
    }
  }
}

const action = (process.argv[2] || 'status').toLowerCase();
const flags = new Set(process.argv.slice(3));

if (action === 'status') {
  runStatus().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
} else if (action === 'pull') {
  const fullLora =
    flags.has('--full-lora') || flags.has('--all') || process.env.HF_PULL_FULL_LORA === 'true';
  runPull(fullLora).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
} else if (action === 'ensure') {
  runEnsure().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
} else {
  console.log('Comandos soportados: status | pull [--full-lora] | ensure');
}
