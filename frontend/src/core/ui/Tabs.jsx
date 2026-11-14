/**
 * @file Tabs.jsx
 * @description Navegación por pestañas con contadores tabulares integrados y Select reutilizable en móvil (estilos-erp-pymes)
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import React from 'react';
import Select from './Select';

export const Tabs = ({ tabs = [], activeTab, onChange, className = '' }) => {
  const selectOptions = tabs.map((tab) => ({
    value: tab.id,
    label: `${tab.label}${tab.count !== undefined ? ` (${tab.count})` : ''}`,
  }));

  return (
    <div className={className}>
      {/* Selector desplegable reutilizable en modo móvil */}
      <div className="md:hidden">
        <Select
          aria-label="Seleccionar sección"
          value={activeTab}
          onChange={(e) => onChange(e.target.value)}
          options={selectOptions}
          className="font-medium py-2"
        />
      </div>

      {/* Barra de pestañas horizontal en escritorio */}
      <div className="hidden md:block border-b border-gray-200 select-none">
        <nav className="flex space-x-6 -mb-px overflow-x-auto" aria-label="Pestañas de navegación">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(tab.id)}
                className={`py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'border-gray-900 text-gray-900 font-semibold'
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
    </div>
  );
};

export default Tabs;
