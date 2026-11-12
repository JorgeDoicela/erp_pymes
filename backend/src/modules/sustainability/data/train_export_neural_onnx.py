#!/usr/bin/env python3
"""
Entrenamiento Contrastivo y Exportación ONNX Cuantizada (INT8) — Norma ERP (Ecuador)

Ejecutar en Google Colab GPU (T4 / L4 / A100):
  1. Fine-tuning del Bi-Encoder (`intfloat/multilingual-e5-base`, 768 dims) sobre los
     ~1,880+ fragmentos legales del Ecuador (Constitución, Código del Trabajo, IESS, OIT ODS 8).
  2. Fine-tuning del Cross-Encoder Evaluador (`unicamp-dl/mMiniLM-L6-v2-mmarco-v2`)
     con pares positivos + negativos cercanos intra-corpus.
  3. Exportación y cuantización dinámica INT8 ONNX compatible con `@huggingface/transformers`
     en Node.js (`onnx/model_quantized.onnx` + tokenizer/config files).
  4. Cálculo de vectores completos de 768 dimensiones para `pgvector` HNSW (sin truncar a 128).
  5. Carga automática de artefactos hacia Hugging Face Hub (`doiceladev/norma-erp-ecuador-retriever-e5`).
"""

import os
import sys

# Desactivar Weights & Biases en ejecución headless Colab CLI
os.environ["WANDB_DISABLED"] = "true"
os.environ["WANDB_MODE"] = "disabled"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

import gc
import json
import math
import re
import time
import shutil
import subprocess
from pathlib import Path

REQUIRED_PKGS = [
    "transformers==4.47.1",
    "sentence-transformers==3.3.1",
    "accelerate==1.2.1",
    "onnx>=1.16.0",
    "onnxruntime>=1.19.0",
    "onnxscript>=0.1.0",
    "huggingface_hub>=0.26.2",
]


def ensure_dependencies():
    needs_install = False
    try:
        import transformers
        import sentence_transformers
        import onnxruntime  # noqa: F401
        import onnx  # noqa: F401
        import huggingface_hub  # noqa: F401

        if transformers.__version__ != "4.47.1" or sentence_transformers.__version__ != "3.3.1":
            needs_install = True
    except Exception:
        needs_install = True

    if needs_install:
        print("[SETUP] Limpiando residuos e instalando transformers==4.47.1 + sentence-transformers==3.3.1...")
        subprocess.check_call([sys.executable, "-m", "pip", "uninstall", "-y", "-q", "sentence-transformers", "transformers"])
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", *REQUIRED_PKGS])
        for mod_name in list(sys.modules.keys()):
            if mod_name.startswith(("transformers", "sentence_transformers", "accelerate", "huggingface_hub")):
                del sys.modules[mod_name]


ensure_dependencies()

import numpy as np
import torch
from torch.utils.data import DataLoader
from sentence_transformers import SentenceTransformer, InputExample, losses
from sentence_transformers.cross_encoder import CrossEncoder
from transformers import AutoTokenizer, AutoModel, AutoModelForSequenceClassification
from onnxruntime.quantization import quantize_dynamic, QuantType
import onnxruntime as ort
from huggingface_hub import HfApi, hf_hub_download

HF_TOKEN = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_HUB_TOKEN") or ""
HF_REPO_ID = os.environ.get("HF_RETRIEVER_REPO_ID", "doiceladev/norma-erp-ecuador-retriever-e5")
DATASET_FILENAME = "retriever_evaluator_training_colab.jsonl"
INDEX_FILENAME = "trained_retriever_index.json"

BI_ENCODER_BASE = os.environ.get("BI_ENCODER_MODEL_NAME", "intfloat/multilingual-e5-base")
CROSS_ENCODER_BASE = os.environ.get(
    "CROSS_ENCODER_MODEL_NAME", "unicamp-dl/mMiniLM-L6-v2-mmarco-v2"
)

WORK_DIR = Path("./norma_erp_onnx_build")
BI_PT_DIR = WORK_DIR / "bi-encoder-pt"
BI_ONNX_RAW_DIR = WORK_DIR / "bi-encoder-onnx-raw"
BI_ONNX_DIST_DIR = WORK_DIR / "bi-encoder"

CE_PT_DIR = WORK_DIR / "cross-encoder-pt"
CE_ONNX_RAW_DIR = WORK_DIR / "cross-encoder-onnx-raw"
CE_ONNX_DIST_DIR = WORK_DIR / "cross-encoder"


def load_dataset_rows() -> list[dict]:
    local_candidates = [
        Path(DATASET_FILENAME),
        Path("docs/09-sostenibilidad-ods") / DATASET_FILENAME,
    ]
    dataset_path = next((p for p in local_candidates if p.exists()), None)
    if dataset_path is None:
        print(f"[DATASET] Descargando {DATASET_FILENAME} desde Hugging Face ({HF_REPO_ID})...")
        downloaded = hf_hub_download(
            repo_id=HF_REPO_ID,
            filename=DATASET_FILENAME,
            token=HF_TOKEN or None,
        )
        dataset_path = Path(downloaded)

    with open(dataset_path, "r", encoding="utf-8") as f:
        rows = [json.loads(line) for line in f if line.strip()]

    print(f"[DATASET] Cargadas {len(rows)} tripletas contrastivas desde {dataset_path}")
    return rows


def evaluate_bi_encoder(model: SentenceTransformer, unique_rows: list[dict], label: str):
    """Mide Recall@5 y MRR@10 sobre 8 consultas conversacionales reales sin número de artículo."""
    probe_queries = [
        ("me despidieron sin motivo y llevo 3 años trabajando", "Art. 188"),
        ("protección a mujer embarazada y licencia de maternidad", "Art. 152"),
        ("fondos de reserva iess porcentaje 8.33 desde el segundo año", "Art. 196"),
        ("derecho al trabajo y seguridad social en la constitución", "Art. 33"),
        ("prohibición del trabajo forzoso o servidumbre", "Art. 66"),
        ("horas suplementarias 50% y extraordinarias 100%", "Art. 55"),
        ("jubilación patronal 25 años de servicio", "Art. 216"),
        ("indicadores trabajo decente seguridad social oit ods 8", "Meta"),
    ]
    passages = [f"passage: {r['article_code']} - {r['positive']}" for r in unique_rows]
    doc_vecs = model.encode(passages, batch_size=64, normalize_embeddings=True, show_progress_bar=False)
    q_vecs = model.encode(
        [f"query: {q}" for q, _ in probe_queries],
        batch_size=16,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    sims = np.matmul(q_vecs, doc_vecs.T)

    hits_at_5 = 0
    rr_sum = 0.0
    for qi, (_, expected_substr) in enumerate(probe_queries):
        top_idx = np.argsort(-sims[qi])[:10]
        rank = None
        for r_pos, idx in enumerate(top_idx, start=1):
            code = unique_rows[idx]["article_code"]
            if expected_substr.lower() in code.lower():
                rank = r_pos
                break
        if rank is not None:
            if rank <= 5:
                hits_at_5 += 1
            rr_sum += 1.0 / rank

    recall5 = hits_at_5 / len(probe_queries)
    mrr10 = rr_sum / len(probe_queries)
    print(f"[EVAL {label}] Recall@5={recall5:.3f} | MRR@10={mrr10:.3f}")
    return {"recallAt5": round(recall5, 4), "mrrAt10": round(mrr10, 4)}


def export_quantized_onnx(model_dir: Path, raw_onnx_dir: Path, dist_dir: Path, task_type: str):
    """Exporta a ONNX nativo PyTorch y genera model_quantized.onnx (INT8) compatible con Transformers.js."""
    if raw_onnx_dir.exists():
        shutil.rmtree(raw_onnx_dir)
    if dist_dir.exists():
        shutil.rmtree(dist_dir)
    raw_onnx_dir.mkdir(parents=True, exist_ok=True)
    dist_onnx_dir = dist_dir / "onnx"
    dist_onnx_dir.mkdir(parents=True, exist_ok=True)

    print(f"[ONNX] Exportando {model_dir.name} ({task_type}) con torch.onnx.export...")
    tokenizer = AutoTokenizer.from_pretrained(str(model_dir))
    tokenizer.save_pretrained(str(dist_dir))

    # Copiar config y sentencepiece directamente desde el checkpoint fine-tuned
    for fname in [
        "config.json",
        "special_tokens_map.json",
        "tokenizer.json",
        "tokenizer_config.json",
        "sentencepiece.bpe.model",
        "vocab.txt",
    ]:
        src = model_dir / fname
        if src.exists():
            shutil.copy2(src, dist_dir / fname)

    if task_type == "feature-extraction":
        pt_model = AutoModel.from_pretrained(str(model_dir)).cpu().eval()
        sample = tokenizer(
            ["query: ejemplo laboral ecuador", "passage: art 188 despido intempestivo"],
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=128,
        )
        output_names = ["last_hidden_state"]
        dynamic_axes = {
            "input_ids": {0: "batch_size", 1: "sequence_length"},
            "attention_mask": {0: "batch_size", 1: "sequence_length"},
            "last_hidden_state": {0: "batch_size", 1: "sequence_length"},
        }
    elif task_type == "sequence-classification":
        pt_model = AutoModelForSequenceClassification.from_pretrained(str(model_dir)).cpu().eval()
        sample = tokenizer(
            ["despido intempestivo", "horas suplementarias"],
            ["Art. 188 indemnización laboral", "Art. 55 recargo 50%"],
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=128,
        )
        output_names = ["logits"]
        dynamic_axes = {
            "input_ids": {0: "batch_size", 1: "sequence_length"},
            "attention_mask": {0: "batch_size", 1: "sequence_length"},
            "logits": {0: "batch_size"},
        }
    else:
        raise ValueError(f"Tipo ONNX no soportado: {task_type}")

    has_token_type_ids = "token_type_ids" in sample

    class OnnxWrapper(torch.nn.Module):
        def __init__(self, inner, is_seq_cls, with_tti):
            super().__init__()
            self.inner = inner
            self.is_seq_cls = is_seq_cls
            self.with_tti = with_tti

        def forward(self, input_ids, attention_mask, token_type_ids=None):
            kwargs = {"input_ids": input_ids, "attention_mask": attention_mask}
            if self.with_tti and token_type_ids is not None:
                kwargs["token_type_ids"] = token_type_ids
            out = self.inner(**kwargs)
            return out.logits if self.is_seq_cls else out.last_hidden_state

    wrapped = OnnxWrapper(pt_model, task_type == "sequence-classification", has_token_type_ids).eval()
    fp32_path = raw_onnx_dir / "model.onnx"
    q8_path = dist_onnx_dir / "model_quantized.onnx"

    if has_token_type_ids:
        args_tuple = (sample["input_ids"], sample["attention_mask"], sample["token_type_ids"])
        input_names = ["input_ids", "attention_mask", "token_type_ids"]
        dynamic_axes["token_type_ids"] = {0: "batch_size", 1: "sequence_length"}
    else:
        args_tuple = (sample["input_ids"], sample["attention_mask"])
        input_names = ["input_ids", "attention_mask"]

    export_kwargs = dict(
        args=args_tuple,
        f=str(fp32_path),
        input_names=input_names,
        output_names=output_names,
        dynamic_axes=dynamic_axes,
        opset_version=14,
        do_constant_folding=True,
    )
    try:
        torch.onnx.export(wrapped, dynamo=False, **export_kwargs)
    except TypeError:
        torch.onnx.export(wrapped, **export_kwargs)

    fp32_mb = fp32_path.stat().st_size / (1024 * 1024)
    print(f"[ONNX] Cuantizando a UINT8 (MatMul+Gemm+Gather): {fp32_path.name} ({fp32_mb:.1f} MB) -> {q8_path}...")
    quantize_dynamic(
        model_input=str(fp32_path),
        model_output=str(q8_path),
        op_types_to_quantize=["MatMul", "Gemm", "Gather"],
        weight_type=QuantType.QUInt8,
    )
    q8_mb = q8_path.stat().st_size / (1024 * 1024)
    print(
        f"[ONNX OK] {dist_dir.name}/onnx/model_quantized.onnx = {q8_mb:.1f} MB "
        f"(compresión {fp32_mb / max(q8_mb, 0.1):.2f}x)"
    )
    return q8_path


def verify_onnx_models(bi_q8_path: Path, ce_q8_path: Path, bi_dir: Path, ce_dir: Path):
    """Valida que ambos modelos ONNX INT8 ejecuten inferencia sin errores en CPU."""
    bi_tok = AutoTokenizer.from_pretrained(str(bi_dir))
    bi_sess = ort.InferenceSession(str(bi_q8_path), providers=["CPUExecutionProvider"])
    q_in = bi_tok("query: despido intempestivo sin causa justa", return_tensors="np", truncation=True, max_length=256)
    p_in = bi_tok("passage: Art. 188 Indemnización por despido intempestivo", return_tensors="np", truncation=True, max_length=256)

    def encode_onnx(inputs):
        feed = {k: v.astype(np.int64) for k, v in inputs.items() if k in {i.name for i in bi_sess.get_inputs()}}
        outputs = bi_sess.run(None, feed)[0]  # [1, seq, 768]
        mask = inputs["attention_mask"][..., None].astype(np.float32)
        pooled = (outputs * mask).sum(axis=1) / np.clip(mask.sum(axis=1), 1e-9, None)
        norm = np.linalg.norm(pooled, axis=1, keepdims=True)
        return pooled / np.clip(norm, 1e-9, None)

    qv = encode_onnx(q_in)
    pv = encode_onnx(p_in)
    sim = float((qv * pv).sum())

    ce_tok = AutoTokenizer.from_pretrained(str(ce_dir))
    ce_sess = ort.InferenceSession(str(ce_q8_path), providers=["CPUExecutionProvider"])
    ce_in = ce_tok(
        "despido intempestivo",
        "Art. 188.- El empleador que despidiere intempestivamente al trabajador será condenado a indemnizarlo.",
        return_tensors="np",
        truncation=True,
        max_length=512,
    )
    ce_feed = {k: v.astype(np.int64) for k, v in ce_in.items() if k in {i.name for i in ce_sess.get_inputs()}}
    logit = float(ce_sess.run(None, ce_feed)[0][0][0])
    prob = 1.0 / (1.0 + math.exp(-logit))
    print(f"[VERIFY ONNX INT8] Bi-Encoder cosSim={sim:.4f} (dim={qv.shape[1]}) | Cross-Encoder score={prob:.4f}")


def main():
    t0 = time.time()
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"=== Norma ERP Neural RAG Builder (Device: {device.upper()}) ===")

    rows = load_dataset_rows()

    # Deduplicar por chunk_key para la evaluación y el índice final (manteniendo los 1,880+ fragmentos)
    unique_by_key = {}
    for r in rows:
        key = r.get("chunk_key") or f"{r.get('category','LABOR_CODE')}::{r.get('article_code','')}"
        if key not in unique_by_key:
            unique_by_key[key] = r
    unique_rows = list(unique_by_key.values())
    print(f"[CORPUS] Fragmentos únicos indexables: {len(unique_rows)}")

    # --------------------------------------------------------------------------
    # 1. BI-ENCODER (intfloat/multilingual-e5-base, 768 dims)
    # --------------------------------------------------------------------------
    def strip_meta(text):
        return re.sub(r"\[[^\]]+\]\s*", "", text or "")

    def clean_legal_passage(row):
        return f"passage: {row['article_code']} - {strip_meta(row['positive'])[:950]}"

    bi_model = SentenceTransformer(BI_ENCODER_BASE, device=device)
    baseline_metrics = evaluate_bi_encoder(bi_model, unique_rows, "BASELINE")

    bi_examples = [
        InputExample(
            texts=[
                f"query: {r['query'][:240]}",
                clean_legal_passage(r),
                f"passage: {strip_meta(r['hard_negative'])[:950]}",
            ]
        )
        for r in rows
    ]
    bi_loader = DataLoader(bi_examples, shuffle=True, batch_size=8)
    bi_loss = losses.MultipleNegativesRankingLoss(model=bi_model)

    print(f"[TRAIN BI-ENCODER] Ajuste fino suave ({BI_ENCODER_BASE}, 1 epoch, lr=8e-6, bs=8)...")
    bi_model.fit(
        train_objectives=[(bi_loader, bi_loss)],
        epochs=1,
        warmup_steps=max(10, int(len(bi_loader) * 0.15)),
        optimizer_params={"lr": 8e-6},
        output_path=str(BI_PT_DIR),
        show_progress_bar=True,
    )
    tuned_metrics = evaluate_bi_encoder(bi_model, unique_rows, "FINE-TUNED")

    # Selección empírica estricta: si el fine-tuning no supera al baseline en consultas naturales, conservar base E5
    if (
        tuned_metrics["recallAt5"] < baseline_metrics["recallAt5"]
        or (
            tuned_metrics["recallAt5"] == baseline_metrics["recallAt5"]
            and tuned_metrics["mrrAt10"] < baseline_metrics["mrrAt10"]
        )
    ):
        print(
            f"[SELECT] Baseline ({baseline_metrics}) superó a Fine-Tuned ({tuned_metrics}) en consultas naturales; "
            "se exporta Bi-Encoder Base + Cross-Encoder Fine-Tuned."
        )
        del bi_model
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        bi_model = SentenceTransformer(BI_ENCODER_BASE, device=device)
        bi_model.save(str(BI_PT_DIR))
        selected_bi_metrics = baseline_metrics
    else:
        print(f"[SELECT] Fine-Tuned Bi-Encoder seleccionado ({tuned_metrics}).")
        selected_bi_metrics = tuned_metrics

    # Generar vectores completos de 768 dimensiones antes de liberar el Bi-Encoder de la VRAM
    print("[INDEX] Generando vectores completos de 768 dimensiones para PostgreSQL pgvector...")
    passages = [f"passage: {r['article_code']} - {r['positive']}" for r in unique_rows]
    full_vecs = bi_model.encode(
        passages,
        batch_size=32,
        show_progress_bar=True,
        normalize_embeddings=True,
    )
    embed_dim = int(full_vecs.shape[1])

    del bi_model
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

    # --------------------------------------------------------------------------
    # 2. CROSS-ENCODER EVALUADOR (unicamp-dl/mMiniLM-L6-v2-mmarco-v2)
    # --------------------------------------------------------------------------
    print(f"[TRAIN CROSS-ENCODER] Entrenando {CROSS_ENCODER_BASE}...")
    ce_model = CrossEncoder(CROSS_ENCODER_BASE, num_labels=1, max_length=512, device=device)
    ce_samples = []
    for r in rows:
        ce_samples.append(InputExample(texts=[r["query"][:220], r["positive"][:900]], label=1.0))
        ce_samples.append(InputExample(texts=[r["query"][:220], r["hard_negative"][:900]], label=0.0))

    ce_loader = DataLoader(ce_samples, shuffle=True, batch_size=16)
    ce_model.fit(
        train_dataloader=ce_loader,
        epochs=2,
        warmup_steps=max(10, int(len(ce_loader) * 0.1)),
        optimizer_params={"lr": 2e-5},
        show_progress_bar=True,
    )
    ce_model.save(str(CE_PT_DIR))

    # Calibrar score baseline del Cross-Encoder sobre positivos
    pos_pairs = [[r["query"][:220], r["positive"][:900]] for r in unique_rows]
    ce_logits = ce_model.predict(pos_pairs, batch_size=32, show_progress_bar=True)
    ce_probs = 1.0 / (1.0 + np.exp(-np.array(ce_logits)))

    del ce_model
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

    # --------------------------------------------------------------------------
    # 3. EXPORTACIÓN Y CUANTIZACIÓN INT8 ONNX
    # --------------------------------------------------------------------------
    bi_q8 = export_quantized_onnx(BI_PT_DIR, BI_ONNX_RAW_DIR, BI_ONNX_DIST_DIR, "feature-extraction")
    ce_q8 = export_quantized_onnx(CE_PT_DIR, CE_ONNX_RAW_DIR, CE_ONNX_DIST_DIR, "sequence-classification")
    verify_onnx_models(bi_q8, ce_q8, BI_ONNX_DIST_DIR, CE_ONNX_DIST_DIR)

    # --------------------------------------------------------------------------
    # 4. ÍNDICE COMPLETO DE 768 DIMENSIONES PARA PGVECTOR HNSW
    # --------------------------------------------------------------------------

    exported_articles = []
    for idx, row in enumerate(unique_rows):
        exported_articles.append(
            {
                "id": idx,
                "chunkKey": row.get("chunk_key") or f"{row.get('category','LABOR_CODE')}::{row['article_code']}",
                "contentHash": row.get("content_hash", ""),
                "articleCode": row["article_code"],
                "title": row.get("title", ""),
                "category": row.get("category", "LABOR_CODE"),
                "odsTarget": row.get("ods_target", "8.8"),
                "domain": row.get("domain", row.get("category", "LABOR_CODE")),
                "crossEncoderScore": round(float(ce_probs[idx]), 4),
                "embedding": [round(float(x), 5) for x in full_vecs[idx]],
            }
        )

    index_payload = {
        "model": f"{BI_ENCODER_BASE} + {CROSS_ENCODER_BASE}",
        "onnxQuantized": True,
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "totalArticles": len(exported_articles),
        "embeddingDim": embed_dim,
        "metrics": {"baseline": baseline_metrics, "fineTuned": tuned_metrics, "selected": selected_bi_metrics},
        "articles": exported_articles,
    }
    index_out = WORK_DIR / INDEX_FILENAME
    with open(index_out, "w", encoding="utf-8") as f:
        json.dump(index_payload, f, ensure_ascii=False)
    print(f"[INDEX OK] {index_out} ({len(exported_articles)} artículos, dim={embed_dim}, {index_out.stat().st_size/(1024*1024):.2f} MB)")

    # --------------------------------------------------------------------------
    # 5. PUBLICAR EN HUGGING FACE HUB
    # --------------------------------------------------------------------------
    if HF_TOKEN:
        api = HfApi(token=HF_TOKEN)
        print(f"[HF HUB] Subiendo bi-encoder/, cross-encoder/ y {INDEX_FILENAME} a {HF_REPO_ID}...")
        api.upload_folder(
            folder_path=str(BI_ONNX_DIST_DIR),
            path_in_repo="bi-encoder",
            repo_id=HF_REPO_ID,
            repo_type="model",
            commit_message="Upload quantized INT8 ONNX fine-tuned Bi-Encoder (Ecuador Legal 768d)",
        )
        api.upload_folder(
            folder_path=str(CE_ONNX_DIST_DIR),
            path_in_repo="cross-encoder",
            repo_id=HF_REPO_ID,
            repo_type="model",
            commit_message="Upload quantized INT8 ONNX fine-tuned Cross-Encoder Evaluator",
        )
        api.upload_file(
            path_or_fileobj=str(index_out),
            path_in_repo=INDEX_FILENAME,
            repo_id=HF_REPO_ID,
            repo_type="model",
            commit_message=f"Update {INDEX_FILENAME} with full {embed_dim}d vectors for pgvector",
        )
        print("[HF HUB OK] Todos los artefactos ONNX e índice 768d publicados en Hugging Face.")
    else:
        print("[WARN] HF_TOKEN no configurado; artefactos generados solo en disco local.")

    print(f"=== Pipeline finalizado en {time.time() - t0:.1f}s ===")


if __name__ == "__main__":
    main()
