/**
 * @file PWAContext.jsx
 * @description Norma ERP - Contexto Global de PWA e Instalación Multiplataforma
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { FiDownload, FiX, FiShare, FiPlusSquare, FiMonitor } from 'react-icons/fi';
import { NormaIcon } from '@core/ui/NormaLogo';

const PWAContext = createContext({
  isInstalled: false,
  canInstall: false,
  isIOS: false,
  promptInstall: () => {},
  showInstallGuide: false,
  closeInstallGuide: () => {},
});

export const PWAProvider = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    // 1. Detectar si corre en modo standalone / PWA instalada
    const checkStandalone = () => {
      if (typeof window === 'undefined') return false;
      const isStandaloneMedia =
        typeof window.matchMedia === 'function'
          ? window.matchMedia('(display-mode: standalone)').matches
          : false;
      const isNavigatorStandalone = window.navigator?.standalone === true;
      return isStandaloneMedia || isNavigatorStandalone;
    };

    if (checkStandalone()) {
      setIsInstalled(true);
      return;
    }

    // 2. Detectar iOS / iPadOS
    const ua = (window.navigator.userAgent || '').toLowerCase();
    const isAppleDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    setIsIOS(isAppleDevice);

    // 3. Capturar evento de instalación nativa Chromium / Edge / Android
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // 4. Capturar evento de confirmación de instalación
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallGuide(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (isInstalled) return;

    if (isIOS) {
      setShowInstallGuide(true);
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
      } catch (err) {
        console.warn('Error al invocar prompt nativo PWA:', err);
        setShowInstallGuide(true);
      } finally {
        setDeferredPrompt(null);
      }
      return;
    }

    // Si no hay prompt nativo disponible pero el usuario hace clic en instalar
    setShowInstallGuide(true);
  }, [deferredPrompt, isIOS, isInstalled]);

  const closeInstallGuide = useCallback(() => {
    setShowInstallGuide(false);
  }, []);

  // Determinar si se puede instalar: no está instalada y (hay prompt disponible o es iOS o es un navegador moderno)
  const canInstall = !isInstalled;

  return (
    <PWAContext.Provider
      value={{
        isInstalled,
        canInstall,
        isIOS,
        promptInstall,
        showInstallGuide,
        closeInstallGuide,
      }}
    >
      {children}
      {showInstallGuide && <PWAInstallModal isIOS={isIOS} onClose={closeInstallGuide} />}
    </PWAContext.Provider>
  );
};

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA debe ser utilizado dentro de un PWAProvider');
  }
  return context;
};

/**
 * Modal sobrio con instrucciones según plataforma (iOS Safari vs Navegadores Desktop/Android)
 */
const PWAInstallModal = ({ isIOS, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white rounded border border-gray-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
      >
        {/* Cabecera sobria */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NormaIcon size={28} />
            <div>
              <h3
                id="pwa-install-title"
                className="text-sm font-semibold text-gray-900 leading-tight"
              >
                Instalar Norma ERP
              </h3>
              <p className="text-[11px] text-gray-500 font-mono">Aplicación Web Progresiva (PWA)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
            title="Cerrar"
            aria-label="Cerrar modal de instalación"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Contenido con instrucciones */}
        <div className="p-5 space-y-4 text-xs text-gray-700">
          {isIOS ? (
            <div className="space-y-3">
              <p className="text-gray-600 leading-relaxed">
                Para instalar Norma ERP en su iPhone o iPad mediante Safari:
              </p>
              <ol className="space-y-2.5 bg-gray-50 p-3.5 rounded border border-gray-200">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                    1
                  </span>
                  <span>
                    Presione el botón <strong className="text-gray-900">Compartir</strong>{' '}
                    <FiShare className="inline-block text-blue-600 ml-0.5" /> en la barra inferior
                    de Safari.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                    2
                  </span>
                  <span>
                    Desplace hacia abajo y seleccione{' '}
                    <strong className="text-gray-900">"Agregar a inicio"</strong>{' '}
                    <FiPlusSquare className="inline-block text-gray-700 ml-0.5" />.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                    3
                  </span>
                  <span>
                    Presione <strong className="text-gray-900">Agregar</strong> en la esquina
                    superior derecha.
                  </span>
                </li>
              </ol>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-600 leading-relaxed">
                Para instalar Norma ERP como aplicación de escritorio o en su dispositivo Android:
              </p>
              <ol className="space-y-2.5 bg-gray-50 p-3.5 rounded border border-gray-200">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                    1
                  </span>
                  <span>
                    Haga clic en el icono de instalación{' '}
                    <FiDownload className="inline-block text-blue-600 mx-0.5" /> en la barra de
                    direcciones superior de su navegador (Chrome o Edge).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                    2
                  </span>
                  <span>
                    O abra el menú del navegador (tres puntos verticales) y elija{' '}
                    <strong className="text-gray-900">"Instalar Norma ERP"</strong>.
                  </span>
                </li>
              </ol>
            </div>
          )}

          <div className="flex items-center gap-2 p-2.5 bg-blue-50/70 border border-blue-100 rounded text-[11px] text-blue-900">
            <FiMonitor className="text-blue-600 shrink-0" size={16} />
            <span>
              La aplicación funcionará en ventana independiente con acceso directo en su
              dispositivo.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAContext;
