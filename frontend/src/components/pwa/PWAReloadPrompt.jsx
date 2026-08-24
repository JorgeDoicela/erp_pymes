import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiX } from 'react-icons/fi';

// Test change for GitHub Actions path detection pipeline
export default function PWAReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('Service Worker PWA registrado exitosamente:', r);
    },
    onRegisterError(error) {
      console.error('Error al registrar Service Worker PWA:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  // Solo mostramos el aviso si hay una nueva versión del sistema para actualizar
  if (!needRefresh) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-5 left-5 z-50 pointer-events-auto max-w-sm"
      >
        <div className="bg-white border border-gray-200 rounded p-3.5 shadow-lg text-gray-800 flex items-start justify-between gap-3 text-xs">
          <div className="space-y-1">
            <h5 className="font-semibold text-[11px] text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <FiRefreshCw className="animate-spin text-blue-600" size={12} />
              {offlineReady ? 'Soporte sin conexión listo' : 'Actualización disponible'}
            </h5>
            <p className="text-gray-500 leading-normal text-[11px]">
              {offlineReady
                ? 'La aplicación se ha guardado para uso sin conexión.'
                : 'Hay una nueva versión disponible. Actualice para aplicar cambios.'}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <button
              onClick={close}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
              title="Cerrar"
            >
              <FiX size={14} />
            </button>
            {needRefresh && (
              <button
                onClick={() => updateServiceWorker(true)}
                className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors cursor-pointer shadow-xs"
              >
                Actualizar
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
