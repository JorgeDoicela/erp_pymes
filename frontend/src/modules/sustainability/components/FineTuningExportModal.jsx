/**
 * @file FineTuningExportModal.jsx
 * @description Modal de configuración y exportación de datasets de Fine-Tuning para Qwen 2.5 14B, LLaMA 3 y OpenAI
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState } from 'react';
import { FiX, FiDownload } from 'react-icons/fi';
import * as sustainabilityService from '../services/sustainability.service.js';

export default function FineTuningExportModal({ isOpen, onClose }) {
  const [targetModel, setTargetModel] = useState('qwen2.5');
  const [includeTenantData, setIncludeTenantData] = useState(false);
  const [includeFullPdfCorpus, setIncludeFullPdfCorpus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadReady, setDownloadReady] = useState(null);
  const [exportError, setExportError] = useState(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setLoading(true);
    setDownloadReady(null);
    setExportError(null);
    try {
      const res = await sustainabilityService.exportFineTuningDataset({
        targetModel,
        includeTenantData,
        includeFullPdfCorpus,
      });

      if (res?.success && res?.data) {
        const jsonlString =
          res.data.samples.map((sample) => JSON.stringify(sample)).join('\n') + '\n';

        const blob = new Blob([jsonlString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fine_tuning_ecuador_ods8_${targetModel === 'qwen2.5' ? 'qwen' : targetModel}.jsonl`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setDownloadReady({
          totalSamples: res.data.totalSamples,
          model: targetModel,
          domainsCount: res.data.domainsCovered?.length || 9,
        });
      } else {
        setExportError(res?.message || 'No se pudo generar el dataset de entrenamiento.');
      }
    } catch (err) {
      setExportError(
        err?.response?.data?.message || err.message || 'Error al exportar dataset de fine-tuning.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-[6px] max-w-lg w-full shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
              Pipeline QLoRA / SFT
            </span>
            <h3 className="text-sm font-semibold text-gray-900">
              Exportador de Dataset Multi-Dominio (.jsonl)
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="text-gray-400 hover:text-gray-700 p-1 rounded-[4px]"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-gray-600 overflow-y-auto">
          <p className="leading-relaxed">
            Compila el dataset completo de entrenamiento supervisado integrando los{' '}
            <strong>9 dominios de Norma ERP</strong>: Código del Trabajo, Seguridad Social IESS,
            Tributación SRI, Contabilidad NIIF por partida doble, Liquidaciones con{' '}
            <code className="font-mono">Decimal.js</code>, LOPDP y Metas ODS 8.
          </p>

          <div>
            <label htmlFor="target-model-select" className="block font-medium text-gray-800 mb-1.5">
              Arquitectura del Modelo Destino:
            </label>
            <select
              id="target-model-select"
              value={targetModel}
              onChange={(e) => setTargetModel(e.target.value)}
              className="w-full border border-gray-300 rounded-[4px] px-3 py-2 bg-white text-xs text-gray-900 focus:outline-hidden focus:border-blue-600 font-mono"
            >
              <option value="qwen2.5">
                Qwen 2.5 14B Instruct (ChatML + Alpaca Unsloth — Recomendado Colab A100)
              </option>
              <option value="llama3">Meta LLaMA 3.1 / 3.3 (Formato Alpaca / Unsloth)</option>
              <option value="mistral">Mistral Large / NeMo (Formato Instruct)</option>
              <option value="openai">OpenAI Chat Completion (Formato messages JSONL)</option>
            </select>
          </div>

          <div className="p-3 bg-[#f9fafb] border border-gray-200 rounded-[4px] space-y-2.5">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeFullPdfCorpus}
                onChange={(e) => setIncludeFullPdfCorpus(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-0"
              />
              <span className="text-[11px] text-gray-700 leading-relaxed">
                <strong>Incluir los 1,880 artículos íntegros de los 4 PDFs oficiales</strong>{' '}
                (genera ~3,835 pares de entrenamiento exhaustivos; desactivado genera ~275 pares
                doctrinales, aritméticos y estratificados de alta densidad).
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer border-t border-gray-200 pt-2.5">
              <input
                type="checkbox"
                checked={includeTenantData}
                onChange={(e) => setIncludeTenantData(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-0"
              />
              <span className="text-[11px] text-gray-700 leading-relaxed">
                <strong>Incluir reglamentos internos del tenant</strong> (desactivado por defecto
                para preservar aislamiento multi-tenant bajo LOPDP).
              </span>
            </label>
          </div>

          {exportError && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-[4px] text-[11px]"
            >
              {exportError}
            </div>
          )}

          {downloadReady && (
            <div className="p-3 bg-[#f9fafb] border border-gray-200 text-gray-900 rounded-[4px] text-[11px] font-mono tabular-nums">
              Dataset exportado: {downloadReady.totalSamples} pares de instrucción/respuesta en{' '}
              {downloadReady.domainsCount} dominios para {downloadReady.model}.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 bg-[#f9fafb] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-[4px] flex items-center gap-1.5 shadow-xs disabled:opacity-50 transition-colors"
          >
            <FiDownload className="w-3.5 h-3.5" />
            <span>{loading ? 'Compilando JSONL...' : 'Exportar Dataset (.jsonl)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
