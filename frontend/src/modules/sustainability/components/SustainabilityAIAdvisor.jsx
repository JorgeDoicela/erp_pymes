/**
 * @file SustainabilityAIAdvisor.jsx
 * @description Asistente RAG interactivo de Sostenibilidad ODS 8 y Legislación Laboral de Ecuador
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState } from 'react';
import { FiSend, FiBookOpen, FiTrash2, FiFileText, FiDownload, FiCheckCircle } from 'react-icons/fi';
import { useSustainabilityAdvisor } from '../hooks/useSustainabilityAdvisor.js';
import LegalCitationDrawer from './LegalCitationDrawer.jsx';
import FineTuningExportModal from './FineTuningExportModal.jsx';

export default function SustainabilityAIAdvisor({ overallScore = 100, complianceLevel = 'ALTO' }) {
  const [inputText, setInputText] = useState('');
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { messages, loading, askAdvisor, clearChat } = useSustainabilityAdvisor();

  const presets = [
    {
      id: 'finiquito-art188',
      label: 'Cálculo de Finiquito (Art. 185 y 188)',
      prompt: '¿Cómo se debe calcular la liquidación por despido intempestivo de un colaborador con 3 años de antigüedad según el Código del Trabajo?',
      ods: '8.8',
    },
    {
      id: 'horas-extras',
      label: 'Recargo Horas Extras (Art. 55)',
      prompt: '¿Cuál es el recargo legal para horas suplementarias y extraordinarias en días de descanso obligatorio en Ecuador?',
      ods: '8.8',
    },
    {
      id: 'iess-obligaciones',
      label: 'Aportes al IESS y Fondos de Reserva',
      prompt: '¿Cuáles son los porcentajes exactos de retención personal y patronal al IESS y cuándo aplican fondos de reserva?',
      ods: '8.5',
    },
    {
      id: 'sbu-dignidad',
      label: 'Auditoría de SBU y Equidad Salarial',
      prompt: '¿Cuál es el Salario Básico Unificado vigente en Ecuador y qué consecuencias tiene en los indicadores del ODS 8 contratar por debajo?',
      ods: '8.5',
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;
    askAdvisor(inputText);
    setInputText('');
  };

  const handleSelectPreset = (preset) => {
    askAdvisor(preset.prompt, preset.ods);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-[4px] p-5 space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <FiBookOpen className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Asistente Jurídico Laboral y Auditor ODS 8 (Ecuador)
            </h3>
            <p className="text-xs text-gray-500">
              Consultas en tiempo real con fundamentación en el Código del Trabajo y base vectorial RAG.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-[4px] flex items-center gap-1.5 transition-colors"
            title="Exportar dataset para fine-tuning del modelo grande"
          >
            <FiDownload className="w-3.5 h-3.5 text-blue-600" />
            <span>Dataset Fine-Tuning</span>
          </button>

          <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-mono font-medium rounded-[3px]">
            RAG pgvector
          </span>
        </div>
      </div>

      {/* Presets de consulta rápida */}
      <div>
        <p className="text-[11px] font-medium text-gray-400 mb-2 uppercase tracking-wider">
          Consultas Frecuentes de Cumplimiento:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              disabled={loading}
              className="text-left p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-[4px] transition-colors group disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-semibold text-gray-500 group-hover:text-blue-600">
                  Meta {preset.ods}
                </span>
              </div>
              <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug">
                {preset.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Historial de Mensajes / Área de Respuestas */}
      <div className="border border-gray-200 rounded-[4px] bg-[#f9fafb] p-4 min-h-[220px] max-h-[460px] overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
            <FiFileText className="w-8 h-8 stroke-1" />
            <p className="text-xs">
              Seleccione una consulta predefinida o formule una pregunta sobre liquidaciones, aportes IESS o metas ODS 8.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-[4px] p-3 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white font-medium shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-800 shadow-xs'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                {/* Citas Legales Asociadas */}
                {msg.legalCitations && msg.legalCitations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-1.5">
                    <p className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider">
                      Fundamentos Jurídicos Citados:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.legalCitations.map((citation, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedCitation(citation)}
                          className="px-2 py-0.5 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700 font-mono text-[10px] rounded-[3px] transition-colors flex items-center gap-1"
                        >
                          <FiCheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>{citation.articleCode}</span>
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
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-[4px] p-3 w-fit">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="font-mono">Consultando base vectorial y normativa de Ecuador...</span>
          </div>
        )}
      </div>

      {/* Caja de Entrada de Texto */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escriba su consulta legal o auditoría de ODS 8 (ej. ¿Cuál es el cálculo exacto de horas nocturnas?)..."
          disabled={loading}
          className="flex-1 bg-white border border-gray-300 rounded-[4px] px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-blue-600 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-[4px] flex items-center gap-1.5 shadow-xs disabled:opacity-40 transition-colors"
        >
          <FiSend className="w-3.5 h-3.5" />
          <span>Consultar</span>
        </button>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            className="p-2 border border-gray-200 text-gray-400 hover:text-gray-700 rounded-[4px] hover:bg-gray-50 transition-colors"
            title="Limpiar conversación"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Drawer de Cita Legal */}
      <LegalCitationDrawer
        citation={selectedCitation}
        isOpen={Boolean(selectedCitation)}
        onClose={() => setSelectedCitation(null)}
      />

      {/* Modal de Exportación para Fine-Tuning */}
      <FineTuningExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
