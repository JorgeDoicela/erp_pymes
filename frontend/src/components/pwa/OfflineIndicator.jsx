import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiWifiOff, FiWifi, FiX } from 'react-icons/fi';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      const timer = setTimeout(() => setShowNotification(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showNotification) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        transition={{ duration: 0.3 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
      >
        <div
          className={`flex items-center gap-3 px-4 py-2 rounded-full text-xs font-medium shadow-lg border backdrop-blur-md transition-all ${
            isOnline
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-emerald-100/50'
              : 'bg-amber-50 text-amber-800 border-amber-200/80 shadow-amber-100/50 animate-pulse'
          }`}
        >
          {isOnline ? (
            <>
              <FiWifi className="text-emerald-600 text-sm" />
              <span>Conexión restablecida. Modo en línea activo.</span>
            </>
          ) : (
            <>
              <FiWifiOff className="text-amber-600 text-sm" />
              <span>Sin conexión a internet. Trabajando en modo Offline.</span>
            </>
          )}

          <button
            onClick={() => setShowNotification(false)}
            className="ml-1 p-0.5 rounded-full hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <FiX size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
