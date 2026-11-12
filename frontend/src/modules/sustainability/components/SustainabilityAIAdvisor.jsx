/**
 * @file SustainabilityAIAdvisor.jsx
 * @description Consola RAG Multi-Dominio: Legislación Laboral de Ecuador, Contabilidad NIIF,
 * Tributación SRI, Seguridad Social IESS, LOPDP y Gobernanza ODS 8 (Estándar Holded/Linear).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState } from 'react';
import { FiSend, FiTrash2, FiDownload } from 'react-icons/fi';
import { useSustainabilityAdvisor } from '../hooks/useSustainabilityAdvisor.js';
import LegalCitationDrawer from './LegalCitationDrawer.jsx';
import FineTuningExportModal from './FineTuningExportModal.jsx';
import { ADVISOR_PRESETS } from './LegalAssistantConfigPanel.jsx';

export default function SustainabilityAIAdvisor() {
  const [inputText, setInputText] = useState('');
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { messages, loading, lastMetadata, askAdvisor, clearChat } =
    useSustainabilityAdvisor('sustainability');

  const presets = ADVISOR_PRESETS;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;
    askAdvisor(inputText);
    setInputText('');
  };

  const handleSelectPreset = (preset) => {
    askAdvisor(preset.prompt, {
      odsTargetFilter: preset.ods,
      moduleContext: 'sustainability',
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-[4px] p-5 space-y-4">
      {/* Encabezado limpio sin pastillas de color */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-3.5 gap-3">
        <div>
          <span className="text-[10px] font-mono font-medium text-gray-500 uppercase tracking-wider">
            Buscador BM25 + Evaluador Reranker ({lastMetadata.totalIndexedArticles} Arts.) ·
            DeepSeek / LLM Local · Decimal.js
          </span>
          <h3 className="text-sm font-semibold text-gray-900 mt-0.5">
            Asistente Jurídico-Laboral, Contable NIIF y Auditor ODS 8
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-[4px] flex items-center gap-1.5 transition-colors"
          >
            <FiDownload className="w-3.5 h-3.5 text-gray-600" />
            <span>Exportar Dataset (.jsonl)</span>
          </button>
        </div>
      </div>

      {/* Consultas Frecuentes Multi-Dominio */}
      <div>
        <p className="text-[10px] font-medium text-gray-500 mb-2 uppercase tracking-wider">
          Escenarios Multi-Dominio de Consulta Directa:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              disabled={loading}
              className="text-left p-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-[4px] transition-colors disabled:opacity-50"
            >
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">
                {preset.domain}
              </div>
              <p className="text-xs font-medium text-gray-900 line-clamp-1 leading-snug">
                {preset.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Área de Conversación */}
      <div className="border border-gray-200 rounded-[4px] bg-[#f9fafb] p-4 min-h-[260px] max-h-[500px] overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center text-gray-500 px-4">
            <p className="text-xs font-medium text-gray-700 mb-1">
              Consola de Auditoría Legal, Tributaria y Contable Lista
            </p>
            <p className="text-xs text-gray-500 max-w-xl">
              Formule una consulta sobre liquidaciones (Arts. 185/188), cálculo de nómina e IESS,
              asientos contables NIIF por partida doble, Impuesto a la Renta SRI, LOPDP o metas del
              ODS 8.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-[4px] p-3.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#2563eb] text-white font-medium'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                {/* Auditoría del Modelo Evaluador Anti-Alucinación */}
                {msg.role === 'assistant' && msg.evaluationAudit && (
                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-gray-500">
                    <span>
                      Evaluador Anti-Alucinación: Fidelidad{' '}
                      <strong className="text-gray-900 tabular-nums">
                        {Math.round((msg.evaluationAudit.groundednessScore || 1) * 100)}%
                      </strong>
                    </span>
                    <span>
                      Motor: <strong className="text-gray-800">{msg.inferenceMode || 'RAG'}</strong>
                    </span>
                  </div>
                )}

                {/* Citas Legales Asociadas */}
                {msg.legalCitations && msg.legalCitations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-gray-200 space-y-1.5">
                    <p className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider">
                      Fuentes Normativas Recuperadas (Inspeccionar):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.legalCitations.map((citation, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedCitation(citation)}
                          className="px-2 py-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-mono text-[10px] rounded-[4px] transition-colors"
                        >
                          {citation.articleCode}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="text-xs text-gray-600 bg-white border border-gray-200 rounded-[4px] px-3 py-2 w-fit font-mono">
            Ejecutando recuperación semántica RAG y cálculo con Decimal.js...
          </div>
        )}
      </div>

      {/* Formulario de Consulta */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="advisor-query-input" className="sr-only">
          Consulta legal, contable o de sostenibilidad
        </label>
        <input
          id="advisor-query-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escriba su consulta o cálculo (ej. Liquida despido intempestivo con sueldo de $950 y 5 años, o asiento contable de rol)..."
          disabled={loading}
          className="flex-1 bg-white border border-gray-300 rounded-[4px] px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-blue-600 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium text-xs rounded-[4px] flex items-center gap-1.5 shadow-xs disabled:opacity-40 transition-colors"
        >
          <FiSend className="w-3.5 h-3.5" />
          <span>Consultar</span>
        </button>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            aria-label="Limpiar historial"
            className="p-2 border border-gray-200 text-gray-500 hover:text-gray-800 rounded-[4px] hover:bg-gray-50 transition-colors"
            title="Limpiar conversación"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        )}
      </form>

      <LegalCitationDrawer
        citation={selectedCitation}
        isOpen={Boolean(selectedCitation)}
        onClose={() => setSelectedCitation(null)}
      />

      <FineTuningExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
