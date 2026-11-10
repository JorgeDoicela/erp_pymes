/**
 * @file useSustainabilityMetrics.js
 * @description Hook de gestión de estado para métricas e indicadores del ODS 8
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { useState, useEffect, useCallback } from 'react';
import * as sustainabilityService from '../services/sustainability.service.js';

export function useSustainabilityMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sustainabilityService.getOds8Metrics();
      if (res?.success && res?.data) {
        setMetrics(res.data);
      } else {
        throw new Error(res?.message || 'No se pudieron cargar los datos de sostenibilidad');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  };
}
