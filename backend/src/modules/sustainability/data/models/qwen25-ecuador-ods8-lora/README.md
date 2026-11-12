---
language:
  - es
license: apache-2.0
base_model: Qwen/Qwen2.5-7B-Instruct
tags:
  - norma-erp
  - ecuador
  - derecho-laboral
  - ods-8
  - lora
  - peft
  - qwen2.5
---

# Norma ERP — Qwen2.5-7B-Instruct LoRA (Derecho Laboral Ecuatoriano & ODS 8)

Adaptador PEFT LoRA (`r=16`, `lora_alpha=32`) entrenado en `bfloat16` sobre `Qwen/Qwen2.5-7B-Instruct` para asesoría jurídica laboral ecuatoriana (Código del Trabajo, Ley Orgánica de Discapacidades, Ley Violeta y Convenios OIT) y cumplimiento de metas del **ODS 8 (Trabajo Decente y Crecimiento Económico)** dentro de **Norma ERP**.

## Métricas de Entrenamiento

- **Modelo Base:** `Qwen/Qwen2.5-7B-Instruct`
- **Precisión:** `bfloat16 + LoRA (r=16, alpha=32)`
- **Parámetros entrenables (LoRA r=16):** `40,370,176`
- **Train Loss final:** `0.7676`
- **Eval Loss final:** `0.5329`
- **Tiempo de entrenamiento:** `808.17s`
- **Hardware utilizado:** `NVIDIA L4 (22.03 GB VRAM)`

## Archivos Incluidos

- `adapter_model.safetensors` y `adapter_config.json`: Pesos LoRA listos para cargar con `peft` o `vLLM`.
- `Modelfile`: Configuración lista para importar el adaptador en **Ollama** (`ollama create norma-ecuador-ods8 -f Modelfile`).
- `training_report_a100.json`: Reporte completo de telemetría del entrenamiento.
- `fine_tuning_ecuador_ods8_qwen.jsonl`: Corpus ChatML estratificado de entrenamiento (`275` casos de alta densidad).
