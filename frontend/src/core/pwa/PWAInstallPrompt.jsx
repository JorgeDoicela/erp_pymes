/**
 * @file PWAInstallPrompt.jsx
 * @description Norma ERP - Notificación y Botón Flotante de Instalación PWA
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiX } from 'react-icons/fi';
import { NormaIcon } from '@core/ui/NormaLogo';
import { usePWA } from './PWAContext';

export default function PWAInstallPrompt() {
  const { isInstalled, promptInstall } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      const dismissed = localStorage.getItem('pwa_prompt_dismissed');
      // Recordar descarte por 7 días
      if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });

  if (isInstalled) return null;

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    try {
      localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    } catch {
      // Ignorar restricciones de almacenamiento
    }
  };

  return (
    <div className="fixed bottom-[76px] right-5 z-40 flex flex-col items-end gap-2 pointer-events-auto">
      <AnimatePresence>
        {showPrompt && !isDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-sm"
          >
            <div className="relative overflow-hidden rounded bg-white border border-gray-200 p-4 shadow-xl text-gray-800">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-gray-100 p-0.5 border border-gray-200 shrink-0 flex items-center justify-center overflow-hidden">
                    <NormaIcon size={32} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-gray-900 flex items-center gap-1.5">
                      Instalar Norma ERP
                      <span className="text-[10px] bg-gray-100 text-gray-700 border border-gray-200 px-1 py-0.2 rounded font-mono">
                        PWA
                      </span>
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">
                      Acceso rápido y soporte sin conexión en su dispositivo.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDismiss}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                  title="Cerrar"
                >
                  <FiX size={16} />
                </button>
              </div>

              <div className="mt-3.5 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                <button
                  onClick={handleDismiss}
                  className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                >
                  Ahora no
                </button>
                <button
                  onClick={() => {
                    setShowPrompt(false);
                    promptInstall();
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FiDownload size={13} />
                  Instalar App
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => {
          if (showPrompt) {
            setShowPrompt(false);
          } else {
            promptInstall();
          }
        }}
        className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-medium px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer select-none"
        title="Instalar Norma ERP (PWA)"
      >
        <FiDownload size={13} className="text-blue-600" />
        <span>Instalar App</span>
      </button>
    </div>
  );
}
