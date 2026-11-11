/**
 * @file Header.jsx
 * @description Norma ERP - Plataforma de Gestión Empresarial y Talento Humano
 * @author Jorge Doicela
 * @copyright 2026 Jorge Doicela. Todos los derechos reservados.
 * @license Proprietary - Prohibida su copia, distribución o uso no autorizado.
 */

import { useState, useEffect, useRef } from 'react';
import { FiMenu, FiBriefcase, FiChevronDown, FiUser, FiLogOut } from 'react-icons/fi';
import { useNavigate, Link } from 'react-router-dom';
import { NotificationBell } from '@modules/notifications';
import api from '@core/api/httpClient';
import toast from 'react-hot-toast';

import { isSuperAdmin as checkIsSuperAdmin, getRoleLabel } from '@core/constants/roles';

const Header = ({
  user,
  onMenuClick,
  onLogout,
  isSidebarOpen = true,
  title = 'Panel de Control',
}) => {
  const navigate = useNavigate();
  const isSuperAdmin = checkIsSuperAdmin(user);

  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState(
    () => localStorage.getItem('superadmin_selected_tenant_id') || ''
  );
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      api
        .get('/superadmin/tenants-list')
        .then((res) => {
          if (res.data.success) {
            setTenants(res.data.data);
          }
        })
        .catch((err) => console.error('Error fetching tenants list for header:', err));
    }
  }, [isSuperAdmin]);

  const handleTenantChange = (e) => {
    const value = e.target.value;
    setSelectedTenantId(value);
    if (value) {
      localStorage.setItem('superadmin_selected_tenant_id', value);
      const found = tenants.find((t) => t.id === value);
      toast.success(`Modo Supervisión: Empresa ${found?.name || ''}`);
    } else {
      localStorage.removeItem('superadmin_selected_tenant_id');
      toast.success('Modo Global SaaS Activado (Todas las empresas)');
    }
    // Disparar evento personalizado para actualizar datos si es necesario
    window.dispatchEvent(new Event('superadmin_tenant_change'));
    window.location.reload();
  };

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30 transition-all duration-300">
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        <button
          onClick={onMenuClick}
          className="p-1.5 -ml-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer flex items-center justify-center"
          title={isSidebarOpen ? 'Ocultar menú lateral' : 'Mostrar menú lateral'}
          aria-label="Alternar menú lateral"
        >
          <FiMenu size={18} />
        </button>
        <h2 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{title}</h2>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {isSuperAdmin && (
          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 text-xs text-gray-700 hover:border-gray-300 transition-colors">
            <FiBriefcase className="text-gray-400 shrink-0 text-xs" />
            <select
              value={selectedTenantId}
              onChange={handleTenantChange}
              className="bg-transparent font-medium focus:outline-none cursor-pointer max-w-[150px] sm:max-w-[210px] truncate py-0.5 text-gray-800 text-xs"
              title="Selector de Empresa (SuperAdmin)"
            >
              <option value="">Modo Global (Todas las empresas)</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <NotificationBell />

        {/* Menú de Usuario y Cierre de Sesión */}
        <div className="relative border-l border-gray-200 pl-2.5 sm:pl-3.5" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 text-right hover:opacity-90 transition-opacity cursor-pointer group focus:outline-none"
            aria-expanded={isUserMenuOpen}
            aria-label="Menú de usuario"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-gray-900 leading-tight">
                {user?.firstName || 'Admin'}
              </p>
              <p className="text-[10px] font-medium text-gray-400 leading-tight">
                {getRoleLabel(user)}
              </p>
            </div>
            <div className="w-7 h-7 rounded bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center font-mono font-semibold text-xs shrink-0 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors">
              {user?.firstName?.[0] || 'A'}
            </div>
            <FiChevronDown
              size={11}
              className={`text-gray-400 group-hover:text-gray-600 transition-transform duration-150 ${
                isUserMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Menú Desplegable */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-56 bg-white rounded border border-gray-200 shadow-xl py-1 z-50">
              <div className="px-3.5 py-2.5 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Usuario'}
                </p>
                <p className="text-[11px] text-gray-500 truncate mt-0.5 font-mono">
                  {user?.email || getRoleLabel(user)}
                </p>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer no-underline"
                >
                  <FiUser className="text-gray-400 text-sm" />
                  <span>Mi Perfil</span>
                </Link>
              </div>

              <div className="border-t border-gray-100 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                >
                  <FiLogOut className="text-red-500 text-sm" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
