/**
 * @file FineTuningExportModal.jsx
 * @description Modal de configuración y exportación de datasets de Fine-Tuning para modelos LLM grandes
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState } from 'react';
import { FiX, FiDownload, FiCpu } from 'react-icons/fi';
import * as sustainabilityService from '../services/sustainability.service.js';

export default function FineTuningExportModal({ isOpen, onClose }) {
  const [targetModel, setTargetModel] = useState('llama3');
  const [includeTenantData, setIncludeTenantData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadReady, setDownloadReady] = useState(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setLoading(true);
    setDownloadReady(null);
    try {
      const res = await sustainabilityService.exportFineTuningDataset({
        targetModel,
        includeTenantData,
      });

      if (res?.success && res?.data) {
        // Generar archivo JSONL descargable en el navegador
        const jsonlString = res.data.samples
          .map((sample) => JSON.stringify(sample))
          .join('\n');

        const blob = new Blob([jsonlString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fine_tuning_ecuador_ods8_${targetModel}.jsonl`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setDownloadReady({
          totalSamples: res.data.totalSamples,
          model: targetModel,
        });
      }
    } catch (err) {
      console.error('Error al exportar dataset de fine-tuning:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-[6px] max-w-lg w-full shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiCpu className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">
              Exportador de Dataset para Fine-Tuning
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-gray-600">
          <p className="leading-relaxed">
            Genera un conjunto de datos estructurado en formato <strong>JSONL</strong> para
            entrenamiento o ajuste fino (LoRA / QLoRA) de modelos de lenguaje grandes, integrando
            el Código del Trabajo de Ecuador y las directrices del ODS 8.
          </p>

          <div>
            <label className="block font-medium text-gray-800 mb-1.5">
              Arquitectura del Modelo Destino:
            </label>
            <select
              value={targetModel}
              onChange={(e) => setTargetModel(e.target.value)}
              className="w-full border border-gray-300 rounded-[4px] px-3 py-1.5 bg-white text-xs text-gray-900 focus:outline-hidden focus:border-blue-600 font-mono"
            >
              <option value="llama3">Meta LLaMA 3 / 3.1 / 3.3 (Formato Alpaca / Unsloth)</option>
              <option value="qwen2.5">Qwen 2.5 / 2.5-Coder (Formato ChatML / LLaMA-Factory)</option>
              <option value="mistral">Mistral Large / NeMo (Formato Instruct)</option>
              <option value="openai">OpenAI GPT-4o / GPT-4o-mini (Formato Chat Completion JSONL)</option>
            </select>
          </div>

          <div className="p-3 bg-gray-50 border border-gray-200 rounded-[4px] space-y-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTenantData}
                onChange={(e) => setIncludeTenantData(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-0"
              />
              <span className="text-[11px] text-gray-700">
                <strong>Incluir políticas privadas del tenant</strong> (desactivado por defecto
                para garantizar aislamiento estricto y privacidad de datos).
              </span>
            </label>
          </div>

          {downloadReady && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[4px] text-[11px] font-mono">
              Dataset generado exitosamente: {downloadReady.totalSamples} pares de instrucción y
              respuesta para {downloadReady.model}.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-[4px] flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <FiDownload className="w-3.5 h-3.5" />
            {loading ? 'Generando JSONL...' : 'Exportar Dataset (.jsonl)'}
          </button>
        </div>
      </div>
    </div>
  );
}
