# -*- coding: utf-8 -*-
"""
train_qwen_unsloth.py
Pipeline de Fine-Tuning Supervisado (SFT + QLoRA 4-bit) para Qwen 2.5 14B Instruct
Entorno objetivo: Google Colab (GPU NVIDIA A100 40GB VRAM)
Despliegue objetivo: AWS EC2 g5.xlarge (NVIDIA A10G 24GB VRAM) con Ollama (GGUF q4_k_m)

Autor: Jorge Doicela — Norma ERP (2026)
"""

import torch
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments
from unsloth import FastLanguageModel, is_bfloat16_supported

# 1. Configuración de hiperparámetros base
MAX_SEQ_LENGTH = 4096
DTYPE = None  # Autodetección (bfloat16 en A100)
LOAD_IN_4BIT = True  # Cuantización QLoRA NF4
DATASET_FILE = "fine_tuning_ecuador_ods8_qwen.jsonl"
OUTPUT_MODEL_DIR = "qwen2.5-14b-ecuador-erp-lora"
GGUF_EXPORT_DIR = "qwen2.5-14b-ecuador-erp-gguf"

# 2. Cargar modelo base Qwen 2.5 14B Instruct y Tokenizer
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="Qwen/Qwen2.5-14B-Instruct",
    max_seq_length=MAX_SEQ_LENGTH,
    dtype=DTYPE,
    load_in_4bit=LOAD_IN_4BIT,
)

# 3. Inyectar adaptadores LoRA en todas las proyecciones lineales de Atención y MLP
model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    target_modules=[
        "q_proj",
        "k_proj",
        "v_proj",
        "o_proj",
        "gate_proj",
        "up_proj",
        "down_proj",
    ],
    lora_alpha=32,
    lora_dropout=0,
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=3407,
)

# 4. Cargar dataset JSONL multi-dominio exportado por Norma ERP y aplicar Chat Template oficial
raw_dataset = load_dataset("json", data_files=DATASET_FILE, split="train")


def format_qwen_chatml(batch):
    """
    Aplica el Chat Template oficial de Qwen 2.5 sobre la columna 'messages'
    para entrenar el modelo con el contexto completo (system + user + assistant).
    """
    formatted_texts = []
    for messages in batch["messages"]:
        rendered = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=False,
        )
        formatted_texts.append(rendered)
    return {"formatted_chat": formatted_texts}


dataset = raw_dataset.map(format_qwen_chatml, batched=True)
split_dataset = dataset.train_test_split(test_size=0.1, seed=3407)

# 5. Configurar entrenamiento supervisado (SFTTrainer) con evaluación de pérdida
trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=split_dataset["train"],
    eval_dataset=split_dataset["test"],
    dataset_text_field="formatted_chat",
    max_seq_length=MAX_SEQ_LENGTH,
    dataset_num_proc=2,
    packing=False,
    args=TrainingArguments(
        per_device_train_batch_size=4,
        gradient_accumulation_steps=4,
        warmup_ratio=0.08,
        num_train_epochs=4,
        learning_rate=2e-4,
        fp16=not is_bfloat16_supported(),
        bf16=is_bfloat16_supported(),
        logging_steps=5,
        eval_strategy="steps",
        eval_steps=15,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="cosine",
        seed=3407,
        output_dir=OUTPUT_MODEL_DIR,
    ),
)

# 6. Ejecutar entrenamiento
trainer_stats = trainer.train()
print(f"Entrenamiento finalizado. Loss final: {trainer_stats.training_loss:.4f}")

# 7. Exportar modelo cuantizado a GGUF (q4_k_m) para despliegue en AWS EC2 con Ollama
model.save_pretrained_gguf(
    GGUF_EXPORT_DIR,
    tokenizer,
    quantization_method="q4_k_m",
)
print(f"Modelo GGUF exportado exitosamente en: {GGUF_EXPORT_DIR}")
