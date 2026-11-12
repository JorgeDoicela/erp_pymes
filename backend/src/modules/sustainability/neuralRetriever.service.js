/**
 * @file neuralRetriever.service.js
 * @description Motor de Inferencia Neuronal ONNX (Bi-Encoder + Cross-Encoder) para Norma ERP.
 * Ejecuta localmente en CPU (quantized INT8 ONNX via @huggingface/transformers):
 *  1. Bi-Encoder (`intfloat/multilingual-e5-base` fine-tuned 768-dim): vectoriza consultas y pasajes en vivo.
 *  2. Cross-Encoder (`unicamp-dl/mMiniLM-L6-v2` fine-tuned): re-rankea pares (consulta, artículo) con precisión jurídica.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODELS_BASE_DIR = path.resolve(__dirname, './data/models');
const BI_ENCODER_ID = 'bi-encoder';
const CROSS_ENCODER_ID = 'cross-encoder';

let transformersModulePromise = null;

async function loadTransformers() {
  if (!transformersModulePromise) {
    transformersModulePromise = import('@huggingface/transformers').then((mod) => {
      mod.env.allowRemoteModels = false;
      mod.env.allowLocalModels = true;
      mod.env.localModelPath = MODELS_BASE_DIR.endsWith(path.sep)
        ? MODELS_BASE_DIR
        : `${MODELS_BASE_DIR}${path.sep}`;
      return mod;
    });
  }
  return transformersModulePromise;
}

function hasQuantizedModel(modelSubdir) {
  const dir = path.join(MODELS_BASE_DIR, modelSubdir);
  return (
    fs.existsSync(path.join(dir, 'onnx', 'model_quantized.onnx')) &&
    fs.existsSync(path.join(dir, 'tokenizer.json')) &&
    fs.existsSync(path.join(dir, 'config.json'))
  );
}

class NeuralRetrieverService {
  constructor() {
    this._biPromise = null;
    this._cePromise = null;
    this._biBundle = null;
    this._ceBundle = null;
  }

  isDisabledByEnv() {
    if (process.env.DISABLE_NEURAL_ONNX === 'true') return true;
    if (process.env.NODE_ENV === 'test' && process.env.ENABLE_NEURAL_ONNX_TEST !== 'true') {
      return true;
    }
    return false;
  }

  hasBiEncoderFiles() {
    return !this.isDisabledByEnv() && hasQuantizedModel(BI_ENCODER_ID);
  }

  hasCrossEncoderFiles() {
    return !this.isDisabledByEnv() && hasQuantizedModel(CROSS_ENCODER_ID);
  }

  async getBiEncoder() {
    if (!this.hasBiEncoderFiles()) return null;
    if (this._biBundle) return this._biBundle;
    if (!this._biPromise) {
      this._biPromise = (async () => {
        const { AutoTokenizer, AutoModel } = await loadTransformers();
        const [tokenizer, model] = await Promise.all([
          AutoTokenizer.from_pretrained(BI_ENCODER_ID, { local_files_only: true }),
          AutoModel.from_pretrained(BI_ENCODER_ID, {
            dtype: 'q8',
            local_files_only: true,
          }),
        ]);
        this._biBundle = { tokenizer, model };
        return this._biBundle;
      })().catch((err) => {
        this._biPromise = null;
        throw err;
      });
    }
    return this._biPromise;
  }

  async getCrossEncoder() {
    if (!this.hasCrossEncoderFiles()) return null;
    if (this._ceBundle) return this._ceBundle;
    if (!this._cePromise) {
      this._cePromise = (async () => {
        const { AutoTokenizer, AutoModelForSequenceClassification } = await loadTransformers();
        const [tokenizer, model] = await Promise.all([
          AutoTokenizer.from_pretrained(CROSS_ENCODER_ID, { local_files_only: true }),
          AutoModelForSequenceClassification.from_pretrained(CROSS_ENCODER_ID, {
            dtype: 'q8',
            local_files_only: true,
          }),
        ]);
        this._ceBundle = { tokenizer, model };
        return this._ceBundle;
      })().catch((err) => {
        this._cePromise = null;
        throw err;
      });
    }
    return this._cePromise;
  }

  /**
   * Mean pooling con máscara de atención y normalización L2 sobre last_hidden_state [batch, seq, dim].
   * @private
   */
  meanPoolAndNormalize(lastHiddenState, attentionMask) {
    const [, seqLen, hiddenSize] = lastHiddenState.dims;
    const data = lastHiddenState.data;
    const maskData = attentionMask.data;

    const pooled = new Float32Array(hiddenSize);
    let maskSum = 0;

    for (let s = 0; s < seqLen; s++) {
      const m = Number(maskData[s]);
      if (m === 0) continue;
      maskSum += m;
      const offset = s * hiddenSize;
      for (let h = 0; h < hiddenSize; h++) {
        pooled[h] += data[offset + h] * m;
      }
    }

    const denom = maskSum > 0 ? maskSum : 1;
    let normSq = 0;
    for (let h = 0; h < hiddenSize; h++) {
      pooled[h] /= denom;
      normSq += pooled[h] * pooled[h];
    }

    const norm = Math.sqrt(normSq) || 1;
    const result = new Array(hiddenSize);
    for (let h = 0; h < hiddenSize; h++) {
      result[h] = Number((pooled[h] / norm).toFixed(6));
    }
    return result;
  }

  /**
   * Vectoriza una consulta de usuario en tiempo real (prefijo obligatorio E5: "query: ").
   * @param {string} queryText
   * @returns {Promise<number[]|null>}
   */
  async embedQuery(queryText) {
    if (!queryText || !queryText.trim()) return null;
    const bundle = await this.getBiEncoder();
    if (!bundle) return null;

    const inputs = await bundle.tokenizer(`query: ${queryText.trim()}`, {
      padding: true,
      truncation: true,
      max_length: 256,
    });
    const outputs = await bundle.model(inputs);
    return this.meanPoolAndNormalize(outputs.last_hidden_state, inputs.attention_mask);
  }

  /**
   * Vectoriza un pasaje legal o política privada de empresa (prefijo obligatorio E5: "passage: ").
   * @param {string} passageText
   * @returns {Promise<number[]|null>}
   */
  async embedPassage(passageText) {
    if (!passageText || !passageText.trim()) return null;
    const bundle = await this.getBiEncoder();
    if (!bundle) return null;

    const inputs = await bundle.tokenizer(`passage: ${passageText.trim()}`, {
      padding: true,
      truncation: true,
      max_length: 384,
    });
    const outputs = await bundle.model(inputs);
    return this.meanPoolAndNormalize(outputs.last_hidden_state, inputs.attention_mask);
  }

  /**
   * Evalúa relevancia par-a-par (consulta vs fragmentos candidatos) usando el Cross-Encoder ONNX.
   * Devuelve probabilidades calibradas [0.0, 1.0] en el mismo orden de `passageTexts`.
   * @param {string} queryText
   * @param {string[]} passageTexts
   * @returns {Promise<number[]|null>}
   */
  async rerankPairs(queryText, passageTexts) {
    if (!queryText || !Array.isArray(passageTexts) || passageTexts.length === 0) {
      return null;
    }
    const bundle = await this.getCrossEncoder();
    if (!bundle) return null;

    const queries = Array(passageTexts.length).fill(queryText.trim().slice(0, 240));
    const truncatedPassages = passageTexts.map((t) => String(t || '').slice(0, 900));

    const inputs = await bundle.tokenizer(queries, {
      text_pair: truncatedPassages,
      padding: true,
      truncation: true,
      max_length: 384,
    });
    const { logits } = await bundle.model(inputs);
    const numLabels = logits.dims?.[1] || 1;
    const rawLogits = [];
    for (let i = 0; i < passageTexts.length; i++) {
      rawLogits.push(Number(logits.data[i * numLabels]));
    }

    const minLogit = Math.min(...rawLogits);
    const maxLogit = Math.max(...rawLogits);
    const spread = maxLogit - minLogit;

    // mMiniLM-mmarco genera logits en [-11, +6]; combinar normalización relativa al lote y sigmoide centrada
    return rawLogits.map((rawLogit) => {
      const rel = spread > 0.05 ? (rawLogit - minLogit) / spread : 0.5;
      const abs = 1 / (1 + Math.exp(-(rawLogit + 4.0) * 0.5));
      const score = rel * 0.75 + abs * 0.25;
      return Number(Math.min(0.99, Math.max(0.01, score)).toFixed(4));
    });
  }

  getStatus() {
    return {
      modelsDir: MODELS_BASE_DIR,
      biEncoderReady: this.hasBiEncoderFiles(),
      crossEncoderReady: this.hasCrossEncoderFiles(),
      biEncoderLoaded: Boolean(this._biBundle),
      crossEncoderLoaded: Boolean(this._ceBundle),
    };
  }
}

export default new NeuralRetrieverService();
