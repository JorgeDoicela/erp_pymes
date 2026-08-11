import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook de Auto-Sincronización Inteligente (SWR Pattern)
 * Maneja revalidación en segundo plano, cambio de pestaña y reconexión de red.
 *
 * @param {Function} fetchFn - Función asíncrona a ejecutar para cargar/sincronizar datos
 * @param {Object} options - Configuración del hook
 * @param {number} [options.intervalMs=30000] - Frecuencia de refresco silencioso en ms (30s por defecto)
 * @param {boolean} [options.enabled=true] - Si la sincronización está activa
 * @param {boolean} [options.revalidateOnFocus=true] - Revalidar al volver a la pestaña/ventana
 * @param {boolean} [options.revalidateOnReconnect=true] - Revalidar al recuperar conexión a internet
 * @returns {Object} { lastSynced, isSyncing, triggerSync }
 */
export function useAutoSync(fetchFn, options = {}) {
    const {
        intervalMs = 30000,
        enabled = true,
        revalidateOnFocus = true,
        revalidateOnReconnect = true
    } = options;

    const [lastSynced, setLastSynced] = useState(() => new Date());
    const [isSyncing, setIsSyncing] = useState(false);

    // Guardar referencia a fetchFn para evitar recrear timers innecesariamente
    const fetchRef = useRef(fetchFn);
    useEffect(() => {
        fetchRef.current = fetchFn;
    }, [fetchFn]);

    const triggerSync = useCallback(async (isSilent = true) => {
        if (!fetchRef.current) return;
        try {
            if (isSilent) setIsSyncing(true);
            await fetchRef.current(isSilent);
            setLastSynced(new Date());
        } catch (err) {
            console.error('[useAutoSync] Error durante la sincronización silenciosa:', err);
        } finally {
            if (isSilent) setIsSyncing(false);
        }
    }, []);

    // 1. Polling periódico silencioso en segundo plano
    useEffect(() => {
        if (!enabled || !intervalMs || intervalMs <= 0) return;

        const intervalId = setInterval(() => {
            // Solo sincronizar si el documento está visible para no saturar CPU/Red en pestañas ocultas
            if (!document.hidden) {
                triggerSync(true);
            }
        }, intervalMs);

        return () => clearInterval(intervalId);
    }, [enabled, intervalMs, triggerSync]);

    // 2. Revalidación al enfocar pestaña o recuperar visibilidad
    useEffect(() => {
        if (!enabled || !revalidateOnFocus) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                triggerSync(true);
            }
        };

        const handleFocus = () => {
            triggerSync(true);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [enabled, revalidateOnFocus, triggerSync]);

    // 3. Revalidación al reconectar a internet
    useEffect(() => {
        if (!enabled || !revalidateOnReconnect) return;

        const handleOnline = () => {
            triggerSync(true);
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [enabled, revalidateOnReconnect, triggerSync]);

    return {
        lastSynced,
        isSyncing,
        triggerSync
    };
}

export default useAutoSync;
