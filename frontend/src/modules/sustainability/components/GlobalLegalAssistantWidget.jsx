/**
 * @file GlobalLegalAssistantWidget.jsx
 * @description Asistente Contextual Multi-Módulo con Buscador Semántico (1,899 artículos),
 * Evaluador Anti-Alucinación y Adaptador Universal (DeepSeek API / LLM Local Fine-Tuneado).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiMessageSquare, FiX, FiSend, FiTrash2, FiSliders } from 'react-icons/fi';
import { useSustainabilityAdvisor } from '../hooks/useSustainabilityAdvisor.js';
import LegalCitationDrawer from './LegalCitationDrawer.jsx';
import LegalAssistantConfigPanel, {
  LegalAssistantMessageBubble,
  resolveActiveModuleContext,
} from './LegalAssistantConfigPanel.jsx';

export default function GlobalLegalAssistantWidget() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('norma:legal-assistant-mounted', { detail: { isMounted: true } })
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent('norma:legal-assistant-mounted', { detail: { isMounted: false } })
      );
      window.dispatchEvent(
        new CustomEvent('norma:legal-assistant-toggled', { detail: { isOpen: false } })
      );
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('norma:legal-assistant-toggled', { detail: { isOpen } }));
  }, [isOpen]);

  const [showConfig, setShowConfig] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [providerConfig, setProviderConfig] = useState({
    provider: '',
    model: '',
    baseUrl: '',
    apiKey: '',
  });

  const activeModule = useMemo(
    () => resolveActiveModuleContext(location.pathname),
    [location.pathname]
  );

  const { messages, loading, lastMetadata, askAdvisor, clearChat } = useSustainabilityAdvisor(
    activeModule.code
  );

  const buildOverrides = () => {
    const o = {};
    if (providerConfig.provider.trim()) o.provider = providerConfig.provider.trim();
    if (providerConfig.model.trim()) o.model = providerConfig.model.trim();
    if (providerConfig.baseUrl.trim()) o.baseUrl = providerConfig.baseUrl.trim();
    if (providerConfig.apiKey.trim()) o.apiKey = providerConfig.apiKey.trim();
    return Object.keys(o).length > 0 ? o : undefined;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;
    askAdvisor(inputText, {
      moduleContext: activeModule.code,
      providerOverrides: buildOverrides(),
    });
    setInputText('');
  };

  const handleQuickPrompt = (promptText) => {
    if (loading) return;
    askAdvisor(promptText, {
      moduleContext: activeModule.code,
      providerOverrides: buildOverrides(),
    });
  };

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir Asistente Legal IA"
          className="fixed bottom-5 right-5 z-40 bg-[#111827] hover:bg-[#1f2937] text-white border border-gray-800 rounded-[4px] px-3.5 py-2.5 shadow-xs flex items-center gap-2.5 transition-colors"
          title="Abrir Asistente Legal y Contable IA"
        >
          <FiMessageSquare className="w-4 h-4 text-white shrink-0" />
          <div className="text-left">
            <div className="text-[11px] font-semibold leading-none">Asistente Legal IA</div>
            <div className="text-[9px] font-mono text-gray-300 mt-0.5 uppercase tracking-wider tabular-nums">
              {activeModule.code} · {lastMetadata.totalIndexedArticles} Arts.
            </div>
          </div>
        </button>
      )}

      {isOpen && (
        <aside
          aria-label="Asistente Jurídico y Contable IA"
          className="fixed bottom-4 right-4 z-50 w-[95vw] sm:w-[460px] h-[640px] max-h-[88vh] bg-white border border-gray-300 rounded-[4px] shadow-xl flex flex-col overflow-hidden"
        >
          <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="uppercase tracking-wider text-gray-500">
                  Módulo: {activeModule.code.toUpperCase()}
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-gray-600 tabular-nums">
                  {lastMetadata.totalIndexedArticles} Artículos Indexados
                </span>
              </div>
              <h2 className="text-xs font-semibold text-gray-900 mt-0.5">{activeModule.label}</h2>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowConfig((prev) => !prev)}
                aria-label="Configurar Motor IA"
                title="Configurar Motor IA (DeepSeek / Local GGUF / OpenAI)"
                className={`p-1.5 rounded-[4px] border text-xs transition-colors ${
                  showConfig
                    ? 'bg-gray-100 border-gray-300 text-gray-900'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FiSliders className="w-3.5 h-3.5" />
              </button>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearChat}
                  aria-label="Limpiar historial"
                  title="Limpiar historial"
                  className="p-1.5 rounded-[4px] bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar asistente"
                title="Cerrar asistente"
                className="p-1.5 rounded-[4px] bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {showConfig && (
            <LegalAssistantConfigPanel
              providerConfig={providerConfig}
              setProviderConfig={setProviderConfig}
            />
          )}

          <div className="flex-1 overflow-y-auto p-3.5 bg-[#f9fafb] space-y-3">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <div className="bg-white border border-gray-200 rounded-[4px] p-3">
                  <p className="text-[11px] font-semibold text-gray-900">
                    Buscador Legal + Evaluador Anti-Alucinación Activos
                  </p>
                  <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                    Consulte cualquier artículo de la Constitución (481), Código del Trabajo (714),
                    Ley de Seguridad Social IESS (383) y Metodología OIT ODS 8 (302), o solicite
                    cálculos exactos con <span className="font-mono">Decimal.js</span>.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
                    Consultas sugeridas en {activeModule.label}:
                  </p>
                  {activeModule.prompts.map((promptText, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickPrompt(promptText)}
                      disabled={loading}
                      className="w-full text-left p-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-[4px] text-[11px] text-gray-800 leading-snug transition-colors disabled:opacity-50"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <LegalAssistantMessageBubble
                  key={msg.id}
                  msg={msg}
                  onSelectCitation={setSelectedCitation}
                />
              ))
            )}
            {loading && (
              <div className="bg-white border border-gray-200 rounded-[4px] px-3 py-2 text-[11px] font-mono text-gray-600">
                Buscando en {lastMetadata.totalIndexedArticles} artículos de los 4 PDFs y
                verificando con el Modelo Evaluador...
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white border-t border-gray-200 flex items-center gap-2"
          >
            <label htmlFor="global-legal-widget-input" className="sr-only">
              Consulta legal o solicitud de cálculo
            </label>
            <input
              id="global-legal-widget-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Pregunte por un artículo legal o solicite un cálculo..."
              disabled={loading}
              className="flex-1 bg-white border border-gray-300 rounded-[4px] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-hidden focus:border-blue-600"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-medium rounded-[4px] flex items-center gap-1 disabled:opacity-40 transition-colors"
            >
              <FiSend className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </form>
        </aside>
      )}

      <LegalCitationDrawer
        citation={selectedCitation}
        isOpen={Boolean(selectedCitation)}
        onClose={() => setSelectedCitation(null)}
      />
    </>
  );
}
