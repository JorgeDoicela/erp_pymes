/**
 * @file GlobalLegalAssistantWidget.jsx
 * @description Asistente Contextual Multi-Módulo con Buscador Semántico (1,895 artículos),
 * Evaluador Anti-Alucinación y Adaptador Universal (DeepSeek API / LLM Local Fine-Tuneado).
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { FiMessageSquare, FiX, FiSend, FiTrash2, FiSliders, FiBookOpen } from 'react-icons/fi';
import { useSustainabilityAdvisor } from '../hooks/useSustainabilityAdvisor.js';
import LegalCitationDrawer from './LegalCitationDrawer.jsx';

const MODULE_CONTEXT_MAP = [
  {
    match: ['/payroll', '/my-payments'],
    code: 'payroll',
    label: 'Nómina, IESS y Beneficios Sociales',
    prompts: [
      'Calcula el rol de pagos, aporte personal IESS (9.45%) y patronal (11.15%) para un sueldo de $950 USD.',
      '¿Cómo se calculan 8 horas suplementarias (50%) y 4 extraordinarias (100%) con sueldo de $800 USD?',
      '¿Qué ingresos forman parte de la materia gravada del IESS según el Art. 11 y 14 de la Ley de Seguridad Social?',
    ],
  },
  {
    match: ['/contracts'],
    code: 'contracts',
    label: 'Contratación Laboral y Modalidades',
    prompts: [
      '¿Cuáles son las reglas legales del período de prueba de 90 días según el Art. 15 del Código del Trabajo?',
      '¿Qué recargo lleva el contrato eventual y cuál es su duración máxima según el Art. 17?',
      '¿En qué plazo debe registrarse un contrato escrito en el SUT del Ministerio del Trabajo?',
    ],
  },
  {
    match: ['/offboarding', '/finiquitos'],
    code: 'offboarding',
    label: 'Desvinculación, Desahucio y Finiquitos',
    prompts: [
      'Calcula paso a paso la liquidación por despido intempestivo (Art. 188) y desahucio (Art. 185) para $850 USD y 4 años y 2 meses.',
      '¿Cuáles son las causales de Visto Bueno por parte del empleador según el Art. 172 del Código del Trabajo?',
      '¿Qué indemnización especial aplica por despido ineficaz (Art. 195.3) o discapacidad?',
    ],
  },
  {
    match: ['/attendance', '/shifts', '/absences', '/asistencia', '/ausencias'],
    code: 'attendance',
    label: 'Jornada, Asistencia, Vacaciones y Licencias',
    prompts: [
      '¿Cómo se calculan los 15 días de vacaciones anuales y los días adicionales por antigüedad según el Art. 69?',
      '¿Cuál es el límite diario y semanal de horas suplementarias según el Art. 55 del Código del Trabajo?',
      '¿Cuántos días corresponden por licencia de maternidad, paternidad y lactancia (Art. 152)?',
    ],
  },
  {
    match: ['/accounting'],
    code: 'accounting',
    label: 'Contabilidad NIIF y Tributación SRI',
    prompts: [
      'Genera el asiento contable NIIF por partida doble para un rol de pagos mensual con sueldo de $1,200 USD.',
      '¿Cómo se contabilizan mensualmente las provisiones de décimo tercero, décimo cuarto y fondos de reserva?',
      '¿Cómo se distribuye el 15% de utilidades líquidas (Art. 97) y cómo aplica la rebaja de gastos personales en el SRI?',
    ],
  },
  {
    match: ['/employees', '/register-employee', '/profile'],
    code: 'employees',
    label: 'Talento Humano, LOPDP y Seguridad Social',
    prompts: [
      '¿Desde qué día es obligatoria la afiliación al IESS y cuándo se genera derecho a Fondos de Reserva (8.33%)?',
      '¿Cómo protege el sistema los datos salariales y biométricos bajo la LOPDP del Ecuador?',
      '¿Qué garantías establece el Art. 326 de la Constitución sobre irrenunciabilidad e igualdad salarial?',
    ],
  },
  {
    match: ['/performance', '/evaluations', '/recruitment'],
    code: 'performance',
    label: 'Desempeño 360° y Reclutamiento sin Sesgos',
    prompts: [
      '¿Qué disposiciones del Código del Trabajo y Constitución garantizan igual remuneración por trabajo de igual valor?',
      '¿Cómo se vinculan las evaluaciones 360° con las metas del ODS 8.5 de empleo pleno y productivo?',
    ],
  },
  {
    match: ['/sustainability'],
    code: 'sustainability',
    label: 'Sostenibilidad ODS 8 y Auditoría Legal',
    prompts: [
      '¿Cuál es el estado actual de cumplimiento ODS 8 (metas 8.3, 8.5 y 8.8) en la empresa y qué artículos aplican?',
      'Explícame los indicadores de Trabajo Decente de la OIT implementados en el sistema.',
    ],
  },
];

export default function GlobalLegalAssistantWidget() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedCitation, setSelectedCitation] = useState(null);

  // Configuración opcional de proveedor en tiempo real (DeepSeek, Local GGUF, OpenAI, etc.)
  const [providerConfig, setProviderConfig] = useState({
    provider: '',
    model: '',
    baseUrl: '',
    apiKey: '',
  });

  const activeModule = useMemo(() => {
    const path = location.pathname.toLowerCase();
    const found = MODULE_CONTEXT_MAP.find((item) =>
      item.match.some((prefix) => path.includes(prefix))
    );
    return (
      found || {
        code: 'general',
        label: 'Consulta Jurídica, Laboral y Contable',
        prompts: [
          'Calcula la liquidación por despido intempestivo y desahucio para $900 USD y 3 años y 4 meses.',
          'Calcula el rol de pagos, aportes al IESS y asiento contable NIIF para un sueldo de $1,000 USD.',
          '¿Cuáles son los porcentajes de recargo de horas suplementarias, extraordinarias y jornada nocturna?',
        ],
      }
    );
  }, [location.pathname]);

  const { messages, loading, lastMetadata, askAdvisor, clearChat } = useSustainabilityAdvisor(
    activeModule.code
  );

  const buildOverrides = () => {
    const overrides = {};
    if (providerConfig.provider.trim()) overrides.provider = providerConfig.provider.trim();
    if (providerConfig.model.trim()) overrides.model = providerConfig.model.trim();
    if (providerConfig.baseUrl.trim()) overrides.baseUrl = providerConfig.baseUrl.trim();
    if (providerConfig.apiKey.trim()) overrides.apiKey = providerConfig.apiKey.trim();
    return Object.keys(overrides).length > 0 ? overrides : undefined;
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
      {/* Botón disparador sobrio en esquina inferior derecha */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 bg-[#111827] hover:bg-[#1f2937] text-white border border-gray-800 rounded-[4px] px-3.5 py-2.5 shadow-xs flex items-center gap-2.5 transition-colors"
          title="Abrir Asistente Legal y Contable IA"
        >
          <FiMessageSquare className="w-4 h-4 text-white shrink-0" />
          <div className="text-left">
            <div className="text-[11px] font-semibold leading-none">Asistente Legal IA</div>
            <div className="text-[9px] font-mono text-gray-300 mt-0.5 uppercase tracking-wider">
              {activeModule.code} · 1,880 Arts.
            </div>
          </div>
        </button>
      )}

      {/* Panel lateral / ventana flotante estilo Holded / Linear */}
      {isOpen && (
        <aside
          aria-label="Asistente Jurídico y Contable IA"
          className="fixed bottom-4 right-4 z-50 w-[95vw] sm:w-[460px] h-[640px] max-h-[88vh] bg-white border border-gray-300 rounded-[4px] shadow-xl flex flex-col overflow-hidden"
        >
          {/* Cabecera */}
          <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
                  Módulo: {activeModule.code.toUpperCase()}
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-[10px] font-mono text-gray-600 tabular-nums">
                  {lastMetadata.totalIndexedArticles} Artículos Indexados
                </span>
              </div>
              <h2 className="text-xs font-semibold text-gray-900 mt-0.5">{activeModule.label}</h2>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowConfig((prev) => !prev)}
                className={`p-1.5 rounded-[4px] border text-xs transition-colors ${
                  showConfig
                    ? 'bg-gray-100 border-gray-300 text-gray-900'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                title="Configurar Motor IA (DeepSeek / Local GGUF / OpenAI)"
              >
                <FiSliders className="w-3.5 h-3.5" />
              </button>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearChat}
                  className="p-1.5 rounded-[4px] bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  title="Limpiar historial"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-[4px] bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                title="Cerrar asistente"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Panel plegable de configuración de Modelo Grande / Local */}
          {showConfig && (
            <div className="p-3 bg-[#f9fafb] border-b border-gray-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800 text-[11px]">
                  Adaptador de Modelo (DeepSeek / API / Local Fine-Tuned)
                </span>
                <span className="text-[10px] font-mono text-gray-500">
                  Vacío = Usa .env del servidor
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-gray-600 mb-0.5">
                    Proveedor
                  </label>
                  <select
                    value={providerConfig.provider}
                    onChange={(e) => setProviderConfig((p) => ({ ...p, provider: e.target.value }))}
                    className="w-full bg-white border border-gray-300 rounded-[4px] px-2 py-1 text-[11px] text-gray-900"
                  >
                    <option value="">Servidor por defecto (.env)</option>
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
                  <label className="block text-[10px] font-mono text-gray-600 mb-0.5">
                    Modelo (Opcional)
                  </label>
                  <input
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
                  <label className="block text-[10px] font-mono text-gray-600 mb-0.5">
                    API Key (DeepSeek / Proveedor)
                  </label>
                  <input
                    type="password"
                    value={providerConfig.apiKey}
                    onChange={(e) => setProviderConfig((p) => ({ ...p, apiKey: e.target.value }))}
                    placeholder="sk-..."
                    className="w-full bg-white border border-gray-300 rounded-[4px] px-2 py-1 text-[11px] text-gray-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-600 mb-0.5">
                    URL Base (Solo IA Local)
                  </label>
                  <input
                    type="text"
                    value={providerConfig.baseUrl}
                    onChange={(e) => setProviderConfig((p) => ({ ...p, baseUrl: e.target.value }))}
                    placeholder="http://127.0.0.1:11434"
                    className="w-full bg-white border border-gray-300 rounded-[4px] px-2 py-1 text-[11px] text-gray-900 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Cuerpo de conversación */}
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
                      className="w-full text-left p-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-[4px] text-[11px] text-gray-800 leading-snug transition-colors"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[92%] rounded-[4px] p-3 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#2563eb] text-white font-medium'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                    {/* Auditoría del Modelo Evaluador */}
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

                    {/* Citas Legales clicables */}
                    {msg.legalCitations && msg.legalCitations.length > 0 && (
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
                              onClick={() => setSelectedCitation(citation)}
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
              ))
            )}

            {loading && (
              <div className="bg-white border border-gray-200 rounded-[4px] px-3 py-2 text-[11px] font-mono text-gray-600">
                Buscando en 1,880 artículos de los 4 PDFs y verificando con el Modelo Evaluador...
              </div>
            )}
          </div>

          {/* Entrada de texto */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white border-t border-gray-200 flex items-center gap-2"
          >
            <input
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

      {/* Drawer de lectura íntegra del artículo legal */}
      <LegalCitationDrawer
        citation={selectedCitation}
        isOpen={Boolean(selectedCitation)}
        onClose={() => setSelectedCitation(null)}
      />
    </>
  );
}
