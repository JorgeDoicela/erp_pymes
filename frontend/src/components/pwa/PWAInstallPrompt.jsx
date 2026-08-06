import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiX, FiSmartphone, FiCheckCircle } from 'react-icons/fi';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada o en modo standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Mostrar el prompt solo si el usuario no lo ha descartado recientemente
      const dismissedTime = localStorage.getItem('pwa_prompt_dismissed');
      if (!dismissedTime || Date.now() - parseInt(dismissedTime, 10) > 24 * 60 * 60 * 1000) {
        setShowPrompt(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Mostrar instrucción iOS si no está descartada
    if (iosDevice && !isStandalone) {
      const dismissedTime = localStorage.getItem('pwa_ios_prompt_dismissed');
      if (!dismissedTime || Date.now() - parseInt(dismissedTime, 10) > 48 * 60 * 60 * 1000) {
        setShowPrompt(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isIOS) {
      localStorage.setItem('pwa_ios_prompt_dismissed', Date.now().toString());
    } else {
      localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    }
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-5 right-5 left-5 md:left-auto md:max-w-md z-50 pointer-events-auto"
      >
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/95 backdrop-blur-md border border-blue-500/30 p-5 shadow-2xl shadow-blue-950/50 text-white">
          {/* Accent glow background */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/30 flex-shrink-0 flex items-center justify-center">
                <img src="/pwa-192x192.png" alt="Emplifi Logo" className="w-full h-full object-cover rounded-[10px]" />
              </div>
              <div>
                <h4 className="font-bold text-base text-white tracking-wide flex items-center gap-1.5">
                  Instalar Emplifi App
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full font-medium">
                    PWA
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Instala la app en tu dispositivo para acceso rápido y sin conexión.
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              title="Cerrar"
            >
              <FiX size={18} />
            </button>
          </div>

          {showIOSInstructions ? (
            <div className="mt-4 p-3 bg-slate-800/80 rounded-xl text-xs text-slate-300 border border-slate-700 space-y-2">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <FiSmartphone className="text-blue-400" /> Para instalar en iOS / iPhone:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300">
                <li>Toca el botón <span className="font-bold text-white">Compartir</span> (icono con flecha hacia arriba) en Safari.</li>
                <li>Desplázate hacia abajo y selecciona <span className="font-bold text-blue-400">"Agregar al inicio"</span>.</li>
              </ol>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-end gap-2.5">
              <button
                onClick={handleDismiss}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Ahora no
              </button>
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all transform active:scale-95"
              >
                <FiDownload size={15} />
                Instalar App
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
