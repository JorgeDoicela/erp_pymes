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
          className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-semibold shadow-xl border backdrop-blur-md transition-colors ${
            isOnline
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-950/30'
              : 'bg-amber-950/95 text-amber-200 border-amber-500/40 shadow-amber-950/40 animate-pulse'
          }`}
        >
          {isOnline ? (
            <>
              <FiWifi className="text-emerald-400 text-sm" />
              <span>Conexión restablecida. Modo en línea activo.</span>
            </>
          ) : (
            <>
              <FiWifiOff className="text-amber-400 text-sm" />
              <span>Sin conexión a internet. Trabajando en modo Offline.</span>
            </>
          )}

          <button
            onClick={() => setShowNotification(false)}
            className="ml-2 p-0.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <FiX size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
