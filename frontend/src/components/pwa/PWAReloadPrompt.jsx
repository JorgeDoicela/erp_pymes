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
        <div className="bg-white/95 border border-slate-200/90 rounded-2xl p-4 shadow-xl shadow-slate-300/40 backdrop-blur-md text-slate-800 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h5 className="font-semibold text-xs text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
              <FiRefreshCw className="animate-spin text-blue-600" />
              {offlineReady ? 'PWA lista sin conexión' : 'Nueva versión disponible'}
            </h5>
            <p className="text-xs text-slate-500 leading-relaxed">
              {offlineReady
                ? 'La aplicación ha sido descargada para funcionar sin conexión.'
                : 'Hay contenido nuevo disponible. Haz clic en actualizar para recargar.'}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <button
              onClick={close}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              title="Cerrar"
            >
              <FiX size={16} />
            </button>
            {needRefresh && (
              <button
                onClick={() => updateServiceWorker(true)}
                className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all active:scale-95"
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
