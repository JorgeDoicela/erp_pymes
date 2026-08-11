import { useState, useEffect } from 'react';
import { FiRefreshCw } from 'react-icons/fi';

/**
 * Componente LiveSyncBadge
 * Muestra el estado de sincronización en tiempo real en reemplazo de botones toscos de refresco.
 */
export default function LiveSyncBadge({ lastSynced, isSyncing, onManualSync, className = '' }) {
    const [relativeText, setRelativeText] = useState('hace unos segundos');

    useEffect(() => {
        const updateRelativeTime = () => {
            if (!lastSynced) {
                setRelativeText('En vivo');
                return;
            }
            const diffMs = Date.now() - new Date(lastSynced).getTime();
            const diffSec = Math.floor(diffMs / 1000);

            if (diffSec < 10) setRelativeText('En vivo');
            else if (diffSec < 60) setRelativeText(`hace ${diffSec}s`);
            else {
                const diffMin = Math.floor(diffSec / 60);
                if (diffMin === 1) setRelativeText('hace 1 min');
                else if (diffMin < 60) setRelativeText(`hace ${diffMin} min`);
                else setRelativeText(`hace ${Math.floor(diffMin / 60)}h`);
            }
        };

        updateRelativeTime();
        const timer = setInterval(updateRelativeTime, 5000);
        return () => clearInterval(timer);
    }, [lastSynced]);

    return (
        <div
            onClick={onManualSync}
            title={onManualSync ? "Sincronizado automáticamente. Haz clic para forzar actualización." : "Sincronizado en tiempo real"}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/80 border border-emerald-200/80 text-emerald-700 text-xs font-semibold shadow-2xs ${onManualSync ? 'cursor-pointer hover:bg-emerald-100/80 transition-colors' : 'cursor-default'} ${className}`}
        >
            <span className="relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${isSyncing ? 'animate-ping' : ''}`}></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>

            <span className="whitespace-nowrap flex items-center gap-1.5">
                <span>{isSyncing ? 'Actualizando...' : 'En vivo'}</span>
                <span className="text-[11px] font-normal text-emerald-600/90 hidden sm:inline">
                    • {relativeText}
                </span>
            </span>

            {isSyncing && (
                <FiRefreshCw className="w-3 h-3 text-emerald-600 animate-spin ml-0.5" />
            )}
        </div>
    );
}
