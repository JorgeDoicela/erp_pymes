import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiX } from 'react-icons/fi';

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

  if (!offlineReady && !needRefresh) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-5 left-5 z-50 pointer-events-auto max-w-sm"
      >
        <div className="bg-slate-900/95 border border-indigo-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-white flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h5 className="font-semibold text-xs text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <FiRefreshCw className="animate-spin text-indigo-400" />
              {offlineReady ? 'PWA lista sin conexión' : 'Nueva versión disponible'}
            </h5>
            <p className="text-xs text-slate-300">
              {offlineReady
                ? 'La aplicación ha sido descargada para funcionar sin conexión.'
                : 'Hay contenido nuevo disponible. Haz clic en actualizar para recargar.'}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <button
              onClick={close}
              className="text-slate-400 hover:text-white p-1"
              title="Cerrar"
            >
              <FiX size={16} />
            </button>
            {needRefresh && (
              <button
                onClick={() => updateServiceWorker(true)}
                className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-all active:scale-95"
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
