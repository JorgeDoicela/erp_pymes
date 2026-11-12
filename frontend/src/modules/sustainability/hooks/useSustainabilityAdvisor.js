/**
 * @file useSustainabilityAdvisor.js
 * @description Hook de interacción conversacional con el Asistente RAG Multi-Módulo (Buscador + Evaluador + DeepSeek / LLM Local)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { useState } from 'react';
import * as sustainabilityService from '../services/sustainability.service.js';

export function useSustainabilityAdvisor(defaultModuleContext = 'general') {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCitations, setActiveCitations] = useState([]);
  const [lastMetadata, setLastMetadata] = useState({
    inferenceMode: null,
    totalIndexedArticles: 1899,
    evaluationAudit: null,
    providerInfo: null,
  });

  const askAdvisor = async (queryText, options = {}) => {
    if (!queryText || !queryText.trim()) return;

    const odsTargetFilter =
      typeof options === 'string' ? options : options?.odsTargetFilter || undefined;
    const moduleContext =
      typeof options === 'object' && options?.moduleContext
        ? options.moduleContext
        : defaultModuleContext;
    const providerOverrides =
      typeof options === 'object' && options?.providerOverrides
        ? options.providerOverrides
        : undefined;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: queryText,
      moduleContext,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
      const payload = { query: queryText, conversationHistory: history, moduleContext };
      if (odsTargetFilter) payload.odsTargetFilter = odsTargetFilter;
      if (providerOverrides) payload.providerOverrides = providerOverrides;

      const res = await sustainabilityService.queryAdvisor(payload);

      if (res?.success && res?.data) {
        const indexedTotal =
          res.data.totalIndexedArticles ||
          res.data.evaluationAudit?.totalCorpusIndexedChunks ||
          1899;

        const assistantMsg = {
          id: Date.now() + 1,
          role: 'assistant',
          content: res.data.answer,
          legalCitations: res.data.legalCitations || [],
          complianceLevel: res.data.complianceLevel,
          tenantScore: res.data.tenantScore,
          moduleContext: res.data.moduleContext || moduleContext,
          inferenceMode: res.data.inferenceMode,
          providerInfo: res.data.providerInfo || null,
          evaluationAudit: res.data.evaluationAudit || null,
          totalIndexedArticles: indexedTotal,
          timestamp: res.data.generatedAt || new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setLastMetadata({
          inferenceMode: res.data.inferenceMode,
          totalIndexedArticles: indexedTotal,
          evaluationAudit: res.data.evaluationAudit || null,
          providerInfo: res.data.providerInfo || null,
        });

        if (res.data.legalCitations?.length > 0) {
          setActiveCitations(res.data.legalCitations);
        }
      } else {
        throw new Error(res?.message || 'Error al procesar la respuesta del asistente');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Error de comunicación');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content:
            'No se pudo obtener el dictamen legal en este momento. Verifique la conexión o intente nuevamente.',
          isError: true,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setActiveCitations([]);
    setError(null);
  };

  return { messages, loading, error, activeCitations, lastMetadata, askAdvisor, clearChat };
}
