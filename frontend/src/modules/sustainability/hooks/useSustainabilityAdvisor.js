/**
 * @file useSustainabilityAdvisor.js
 * @description Hook de interacción conversacional con el Asistente RAG de Legislación Laboral Ecuador y ODS 8
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { useState } from 'react';
import * as sustainabilityService from '../services/sustainability.service.js';

export function useSustainabilityAdvisor() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCitations, setActiveCitations] = useState([]);

  const askAdvisor = async (queryText, odsTargetFilter = null) => {
    if (!queryText.trim()) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: queryText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sustainabilityService.queryAdvisor({
        query: queryText,
        conversationHistory: history,
        odsTargetFilter,
      });

      if (res?.success && res?.data) {
        const assistantMsg = {
          id: Date.now() + 1,
          role: 'assistant',
          content: res.data.answer,
          legalCitations: res.data.legalCitations || [],
          complianceLevel: res.data.complianceLevel,
          tenantScore: res.data.tenantScore,
          timestamp: res.data.generatedAt || new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        if (res.data.legalCitations?.length > 0) {
          setActiveCitations(res.data.legalCitations);
        }
      } else {
        throw new Error(res?.message || 'Error al procesar la respuesta del asistente');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Error de comunicación');
      const errorMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'No se pudo obtener el dictamen legal en este momento. Verifique la conexión o intente nuevamente.',
        isError: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setActiveCitations([]);
    setError(null);
  };

  return {
    messages,
    loading,
    error,
    activeCitations,
    askAdvisor,
    clearChat,
  };
}
