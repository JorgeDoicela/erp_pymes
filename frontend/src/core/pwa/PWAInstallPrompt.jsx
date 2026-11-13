/**
 * @file PWAInstallPrompt.jsx
 * @description Norma ERP - Botón Flotante Global de Instalación PWA (Visible en todas las páginas)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiDownload } from 'react-icons/fi';
import { usePWA } from './PWAContext';

const PUBLIC_ROUTES = ['/', '/login', '/reset-password', '/privacy', '/terms', '/register-company'];

export default function PWAInstallPrompt() {
  const { isInstalled, promptInstall } = usePWA();
  const location = useLocation();

  // Determinar si en la ruta actual el Asistente Legal IA está montado
  const [isAssistantMounted, setIsAssistantMounted] = useState(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    const isPublic =
      PUBLIC_ROUTES.includes(path) ||
      path.startsWith('/careers') ||
      path.startsWith('/signatures/verify');
    return !isPublic;
  });

  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  useEffect(() => {
    const handleMounted = (e) => {
      setIsAssistantMounted(Boolean(e.detail?.isMounted));
    };
    const handleToggled = (e) => {
      setIsAssistantOpen(Boolean(e.detail?.isOpen));
    };

    window.addEventListener('norma:legal-assistant-mounted', handleMounted);
    window.addEventListener('norma:legal-assistant-toggled', handleToggled);

    return () => {
      window.removeEventListener('norma:legal-assistant-mounted', handleMounted);
      window.removeEventListener('norma:legal-assistant-toggled', handleToggled);
    };
  }, []);

  // Sincronizar reactivamente según la ruta actual
  useEffect(() => {
    const isPublic =
      PUBLIC_ROUTES.includes(location.pathname) ||
      location.pathname.startsWith('/careers') ||
      location.pathname.startsWith('/signatures/verify');

    if (isPublic) {
      setIsAssistantMounted(false);
      setIsAssistantOpen(false);
    }
  }, [location.pathname]);

  // Si la aplicación ya está instalada como PWA en el sistema, no mostrar botón flotante
  if (isInstalled) return null;

  return (
    <div
      className={`fixed ${
        isAssistantMounted ? 'bottom-[72px]' : 'bottom-5'
      } right-4 sm:right-5 z-40 transition-all duration-200 pointer-events-auto ${
        isAssistantOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <button
        type="button"
        onClick={promptInstall}
        aria-label="Instalar Norma ERP en su dispositivo"
        className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 hover:border-gray-400 rounded-[4px] px-3.5 py-2.5 shadow-sm hover:shadow transition-all duration-150 flex items-center gap-2.5 cursor-pointer select-none group"
        title="Instalar Norma ERP (PWA)"
      >
        <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <FiDownload size={13} />
        </div>
        <div className="text-left">
          <div className="text-[11px] font-semibold leading-none text-gray-900 flex items-center gap-1.5">
            Instalar App
            <span className="text-[9px] bg-gray-100 text-gray-600 border border-gray-200 px-1 py-0.2 rounded font-mono font-medium">
              PWA
            </span>
          </div>
          <div className="text-[9px] font-mono text-gray-400 mt-0.5 tracking-wider uppercase">
            Acceso Directo
          </div>
        </div>
      </button>
    </div>
  );
}
