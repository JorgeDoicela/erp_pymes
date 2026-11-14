/**
 * @file PWAInstallButton.jsx
 * @description Norma ERP - Botón Adaptable para Instalación PWA (Sidebar, Header, Portal, Perfil)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import { FiDownload, FiCheckCircle } from 'react-icons/fi';
import { usePWA } from './PWAContext';

export const PWAInstallButton = ({
  variant = 'button', // 'button' | 'sidebar' | 'header-menu' | 'card' | 'badge'
  className = '',
  label = 'Instalar App',
  showIfInstalled = false,
}) => {
  const { isInstalled, promptInstall } = usePWA();

  // Si ya está instalada y no se solicita mostrar estado instalado, no renderizar nada
  if (isInstalled && !showIfInstalled) {
    return null;
  }

  // Si ya está instalada pero se muestra como indicador de estado
  if (isInstalled && showIfInstalled) {
    if (variant === 'header-menu') {
      return (
        <div
          className={`flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-500 bg-gray-50 cursor-default ${className}`}
        >
          <FiCheckCircle className="text-emerald-600 text-sm" />
          <span>App PWA Instalada</span>
        </div>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}
      >
        <FiCheckCircle size={13} className="text-emerald-600" />
        <span>Instalada en Dispositivo</span>
      </span>
    );
  }

  // 1. Variante Sidebar: pie del menú lateral
  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={promptInstall}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded border border-gray-200 hover:border-blue-200 transition-colors cursor-pointer group text-left ${className}`}
        title="Instalar Norma ERP en su computadora o móvil"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <FiDownload className="text-blue-600 text-sm shrink-0 group-hover:scale-105 transition-transform" />
          <span className="truncate">{label}</span>
        </div>
        <span className="text-[10px] bg-white border border-gray-200 text-gray-600 group-hover:border-blue-200 group-hover:text-blue-700 px-1.5 py-0.2 rounded font-mono font-medium shrink-0">
          PWA
        </span>
      </button>
    );
  }

  // 2. Variante Header Menu (dropdown de usuario)
  if (variant === 'header-menu') {
    return (
      <button
        type="button"
        onClick={promptInstall}
        className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left cursor-pointer group ${className}`}
        title="Instalar Norma ERP como aplicación web"
      >
        <div className="flex items-center gap-2.5">
          <FiDownload className="text-blue-600 text-sm" />
          <span>{label}</span>
        </div>
        <span className="text-[10px] bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700 px-1 py-0.2 rounded font-mono">
          PWA
        </span>
      </button>
    );
  }

  // 3. Variante Card / Banner (para Dashboards)
  if (variant === 'card') {
    return (
      <div
        className={`p-3.5 bg-white border border-gray-200 rounded shadow-xs flex items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <FiDownload size={18} />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-xs text-gray-900 leading-tight flex items-center gap-1.5">
              Instalar Norma ERP
              <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-1 py-0.2 rounded font-mono font-semibold">
                APP
              </span>
            </h4>
            <p className="text-[11px] text-gray-500 mt-0.5 truncate leading-tight">
              Acceso directo rápido y marcación sin conexión.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={promptInstall}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded transition-colors shrink-0 cursor-pointer shadow-xs"
        >
          Instalar
        </button>
      </div>
    );
  }

  // 4. Variante Botón Estándar
  return (
    <button
      type="button"
      onClick={promptInstall}
      className={`border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-medium px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer ${className}`}
      title="Instalar Norma ERP"
    >
      <FiDownload size={13} className="text-blue-600" />
      <span>{label}</span>
    </button>
  );
};

export default PWAInstallButton;
