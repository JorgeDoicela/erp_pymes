/**
 * @file Sidebar.jsx
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiX, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { getSectionsByRole, getModulesByRole } from '@core/constants/modules.jsx';
import { NormaLogo } from '@core/ui';
import { PWAInstallButton } from '@core/pwa';
import { isSuperAdmin as checkIsSuperAdmin, ROLES } from '@core/constants/roles';

const STORAGE_KEY = 'erp_sidebar_collapsed_sections';

const Sidebar = ({ user, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeItemRef = useRef(null);

  const isSuperAdminUser = checkIsSuperAdmin(user);

  const sections = getSectionsByRole(user);
  const allModules = getModulesByRole(user);

  // Estado de secciones colapsadas guardado en localStorage
  const [collapsedSections, setCollapsedSections] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Encontrar el módulo que mejor coincide con la ruta actual
  const activeModule = [...allModules]
    .filter((mod) => location.pathname === mod.path || location.pathname.startsWith(mod.path + '/'))
    .reduce((best, current) => {
      if (!best) return current;
      return current.path.length > best.path.length ? current : best;
    }, null);

  // Auto-expandir la sección activa si estuviera colapsada y auto-scroll
  useEffect(() => {
    if (!activeModule) return;

    const parentSection = sections.find((sec) =>
      sec.modules.some((mod) => mod.path === activeModule.path)
    );

    if (parentSection && collapsedSections[parentSection.title]) {
      setCollapsedSections((prev) => {
        const next = { ...prev, [parentSection.title]: false };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    }

    // Auto-scroll del sidebar hacia el módulo activo
    const timer = setTimeout(() => {
      if (activeItemRef.current) {
        activeItemRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [location.pathname, activeModule]);

  const toggleSection = (title) => {
    setCollapsedSections((prev) => {
      const isCurrentlyCollapsed = !prev[title];
      const next = { ...prev, [title]: !isCurrentlyCollapsed };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const getHomePath = () => {
    if (isSuperAdminUser) return '/superadmin/dashboard';
    const role = (user?.role || '').toLowerCase();
    if (role === ROLES.EMPLOYEE) return '/empleado';
    if (role === ROLES.ACCOUNTING) return '/admin/accounting';
    if (role === ROLES.MANAGER) return '/admin/absences';
    return '/admin';
  };

  return (
    <aside className="h-full w-full bg-white border-r border-gray-200 flex flex-col text-gray-600 transition-all duration-300">
      {/* Header del Logo */}
      <div className="h-12 px-4 sm:px-5 flex items-center justify-between border-b border-gray-100">
        <Link
          to={getHomePath()}
          onClick={() => {
            if (onClose) onClose();
          }}
          className="cursor-pointer block"
        >
          <NormaLogo size="sm" className="hover:opacity-85 transition-opacity" />
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded transition-colors cursor-pointer flex items-center justify-center"
            title="Ocultar menú"
            aria-label="Ocultar menú"
          >
            <FiX size={18} />
          </button>
        )}
      </div>

      {/* Navegación por Secciones Acordeón / Colapsables */}
      <nav className="flex-1 px-3 py-4 space-y-3.5 overflow-y-auto custom-scrollbar">
        {sections.map((section, sIdx) => {
          const isCollapsed = !!collapsedSections[section.title];
          const hasActiveChild =
            activeModule && section.modules.some((m) => m.path === activeModule.path);

          return (
            <div key={sIdx} className="space-y-1">
              {/* Cabecera de la Sección con control de colapso */}
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer text-left select-none group ${
                  hasActiveChild
                    ? 'text-gray-900 font-bold'
                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50/80'
                }`}
                title={isCollapsed ? `Mostrar ${section.title}` : `Ocultar ${section.title}`}
              >
                <span className="truncate">{section.title}</span>
                <span className="text-gray-400 group-hover:text-gray-600 transition-transform duration-200 ml-1.5 shrink-0">
                  {isCollapsed ? <FiChevronRight size={13} /> : <FiChevronDown size={13} />}
                </span>
              </button>

              {/* Lista de Subsecciones / Módulos */}
              {!isCollapsed && (
                <div className="space-y-0.5 pt-0.5 transition-all duration-200">
                  {section.modules.map((mod, idx) => {
                    const isActive = activeModule && activeModule.path === mod.path;
                    return (
                      <Link
                        key={idx}
                        ref={isActive ? activeItemRef : null}
                        to={mod.path}
                        onClick={() => {
                          if (onClose) onClose();
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-all duration-150 group text-left cursor-pointer no-underline ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600 pl-2.5'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <span
                          className={`text-base shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}
                        >
                          {mod.icon}
                        </span>
                        <span className="text-left flex-1 leading-tight">{mod.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Acceso Rápido para Instalación PWA */}
      <div className="p-3 border-t border-gray-100 bg-white">
        <PWAInstallButton variant="sidebar" />
      </div>
    </aside>
  );
};

export default Sidebar;
