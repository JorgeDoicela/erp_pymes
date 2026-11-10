/**
 * @file Tabs.jsx
 * @description Navegación por pestañas con contadores tabulares integrados (estilos-erp-pymes)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';

export const Tabs = ({ tabs = [], activeTab, onChange, className = '' }) => (
  <div className={`border-b border-gray-200 select-none ${className}`}>
    <nav className="flex space-x-6 -mb-px" aria-label="Pestañas de navegación">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              isActive
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`font-mono tabular-nums text-[11px] ${
                  isActive ? 'text-gray-900 font-semibold' : 'text-gray-400'
                }`}
              >
                ({tab.count})
              </span>
            )}
          </button>
        );
      })}
    </nav>
  </div>
);

export default Tabs;
