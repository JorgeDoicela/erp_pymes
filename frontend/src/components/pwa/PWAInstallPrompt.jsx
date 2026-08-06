import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiX, FiSmartphone, FiMonitor } from 'react-icons/fi';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada o en modo standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detectar iOS / iPadOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iosDevice);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Mostrar el prompt si no ha sido descartado recientemente
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

    // Mostrar instrucción iOS si aplica
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

    if (!deferredPrompt) {
      setShowManualInstructions(true);
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
    } catch (err) {
      console.warn('Error al activar el prompt de instalación PWA:', err);
      setShowManualInstructions(true);
    } finally {
      setDeferredPrompt(null);
      if (!showManualInstructions) {
        setShowPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
    setShowManualInstructions(false);
    if (isIOS) {
      localStorage.setItem('pwa_ios_prompt_dismissed', Date.now().toString());
    } else {
      localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    }
  };

  if (isInstalled) return null;

  return (
    <div className="fixed bottom-20 right-5 md:right-6 z-50 flex flex-col items-end gap-3 pointer-events-auto">
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full max-w-sm md:max-w-md"
          >
            <div className="relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 p-5 shadow-2xl shadow-slate-400/20 text-slate-800">
              {/* Línea decorativa superior */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400" />
              
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 p-0.5 border border-slate-200/60 shadow-sm flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img src="/favicon.webp" alt="Emplifi Logo" className="w-full h-full object-cover rounded-lg" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
                      Instalar Emplifi App
                      <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200/80 px-2 py-0.5 rounded-full font-semibold">
                        PWA
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Instala la app en tu dispositivo para un acceso rápido y directo.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDismiss}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Cerrar"
                >
                  <FiX size={18} />
                </button>
              </div>

              {showIOSInstructions ? (
                <div className="mt-4 p-3.5 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-200/80 space-y-2">
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <FiSmartphone className="text-blue-600" /> Para instalar en iOS / iPhone / iPad:
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                    <li>Toca el botón <span className="font-bold text-slate-900">Compartir</span> (icono con flecha hacia arriba) en Safari.</li>
                    <li>Desplázate hacia abajo y selecciona <span className="font-bold text-blue-600">"Agregar al inicio"</span>.</li>
                  </ol>
                </div>
              ) : showManualInstructions ? (
                <div className="mt-4 p-3.5 bg-blue-50/70 rounded-xl text-xs text-slate-700 border border-blue-200/80 space-y-2">
                  <p className="font-semibold text-blue-900 flex items-center gap-1.5">
                    <FiMonitor className="text-blue-600" /> Instalación desde el Navegador:
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                    <li>Haz clic en el icono de instalación en la barra de direcciones superior de tu navegador.</li>
                    <li>O abre el menú del navegador y selecciona <span className="font-bold text-blue-600">"Instalar Emplifi App"</span>.</li>
                  </ol>
                </div>
              ) : (
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    onClick={handleDismiss}
                    className="px-3.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Ahora no
                  </button>
                  <button
                    onClick={handleInstallClick}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all transform active:scale-95"
                  >
                    <FiDownload size={15} />
                    Instalar App
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowPrompt((prev) => !prev)}
        className="group flex items-center justify-center w-11 h-11 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl hover:shadow-2xl shadow-slate-300/50 rounded-full transition-all duration-300"
        title="Instalar Emplifi App"
      >
        <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
          <FiDownload size={14} />
        </div>
      </motion.button>
    </div>
  );
}
