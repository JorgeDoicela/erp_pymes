/**
 * @file LegalAssistantConfigPanel.jsx
 * @description Panel de configuración de proveedores LLM y burbuja de mensajes auditados con citas legales.
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { FiBookOpen } from 'react-icons/fi';

export {
  MODULE_CONTEXT_MAP,
  ADVISOR_PRESETS,
  resolveActiveModuleContext,
} from '../constants/legalAssistantContexts.js';

export function LegalAssistantMessageBubble({ msg, onSelectCitation }) {
  return (
    <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[92%] rounded-[4px] p-3 text-xs leading-relaxed ${
          msg.role === 'user'
            ? 'bg-[#2563eb] text-white font-medium'
            : 'bg-white border border-gray-200 text-gray-800'
        }`}
      >
        <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

        {msg.role === 'assistant' && msg.evaluationAudit && (
          <div className="mt-2.5 pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-gray-500">
            <span>
              Evaluador: Fidelidad{' '}
              <strong className="text-gray-900 tabular-nums">
                {Math.round((msg.evaluationAudit.groundednessScore || 1) * 100)}%
              </strong>
            </span>
            <span>Motor: {msg.inferenceMode || 'RAG_DETERMINISTIC'}</span>
          </div>
        )}

        {msg.legalCitations?.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
            <p className="text-[9px] font-mono uppercase tracking-wider text-gray-500 flex items-center gap-1">
              <FiBookOpen className="w-3 h-3" />
              <span>Artículos Verificados (Clic para leer texto oficial):</span>
            </p>
            <div className="flex flex-wrap gap-1">
              {msg.legalCitations.map((citation, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectCitation(citation)}
                  className="px-1.5 py-0.5 bg-[#f9fafb] hover:bg-gray-100 border border-gray-200 rounded-[4px] font-mono text-[10px] text-gray-800 transition-colors"
                >
                  {citation.articleCode}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LegalAssistantConfigPanel({ providerConfig, setProviderConfig }) {
  return (
    <div className="p-3 bg-[#f9fafb] border-b border-gray-200 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-800 text-[11px]">
          Adaptador de Modelo (DeepSeek / API / Local Fine-Tuned)
        </span>
        <span className="text-[10px] font-mono text-gray-500">Vacío = Usa .env del servidor</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label
            htmlFor="legal-widget-provider"
            className="block text-[10px] font-mono text-gray-600 mb-0.5"
          >
            Proveedor
          </label>
          <select
            id="legal-widget-provider"
            value={providerConfig.provider}
            onChange={(e) => setProviderConfig((p) => ({ ...p, provider: e.target.value }))}
            className="w-full bg-white border border-gray-300 rounded-[4px] px-2 py-1 text-[11px] text-gray-900"
          >
            <option value="">Servidor por defecto (.env)</option>
            <option value="huggingface">Hugging Face Hub (doiceladev / Qwen 2.5)</option>
            <option value="deepseek">DeepSeek API (deepseek-chat)</option>
            <option value="local_ollama">IA Local Fine-Tuned (Ollama GGUF)</option>
            <option value="local_openai">IA Local (vLLM / LM Studio)</option>
            <option value="openai">OpenAI (GPT-4o)</option>
            <option value="gemini">Google Gemini</option>
            <option value="groq">Groq</option>
            <option value="anthropic">Anthropic Claude</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="legal-widget-model"
            className="block text-[10px] font-mono text-gray-600 mb-0.5"
          >
            Modelo (Opcional)
          </label>
          <input
            id="legal-widget-model"
            type="text"
            value={providerConfig.model}
            onChange={(e) => setProviderConfig((p) => ({ ...p, model: e.target.value }))}
            placeholder="ej. deepseek-chat o qwen2.5-ecuador"
            className="w-full bg-white border border-gray-300 rounded-[4px] px-2 py-1 text-[11px] text-gray-900 font-mono"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label
            htmlFor="legal-widget-apikey"
            className="block text-[10px] font-mono text-gray-600 mb-0.5"
          >
            API Key (DeepSeek / Proveedor)
          </label>
          <input
            id="legal-widget-apikey"
            type="password"
            value={providerConfig.apiKey}
            onChange={(e) => setProviderConfig((p) => ({ ...p, apiKey: e.target.value }))}
            placeholder="sk-..."
            className="w-full bg-white border border-gray-300 rounded-[4px] px-2 py-1 text-[11px] text-gray-900 font-mono"
          />
        </div>
        <div>
          <label
            htmlFor="legal-widget-baseurl"
            className="block text-[10px] font-mono text-gray-600 mb-0.5"
          >
            URL Base (Solo IA Local)
          </label>
          <input
            id="legal-widget-baseurl"
            type="text"
            value={providerConfig.baseUrl}
            onChange={(e) => setProviderConfig((p) => ({ ...p, baseUrl: e.target.value }))}
            placeholder="http://127.0.0.1:11434"
            className="w-full bg-white border border-gray-300 rounded-[4px] px-2 py-1 text-[11px] text-gray-900 font-mono"
          />
        </div>
      </div>
    </div>
  );
}
