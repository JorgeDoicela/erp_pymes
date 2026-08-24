import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiX, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { getSectionsByRole, getModulesByRole } from '../../constants/modules';
import logoEmplifi from '../../assets/images/logo_emplifi.png';
import { isSuperAdmin as checkIsSuperAdmin, getRoleLabel as getRoleTitle, ROLES } from '../../constants/roles.js';

const STORAGE_KEY = 'erp_sidebar_collapsed_sections';

const Sidebar = ({ user, onLogout, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const isSuperAdminUser = checkIsSuperAdmin(user);
    const getRoleLabel = () => getRoleTitle(user);

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
        .filter(mod => location.pathname === mod.path || location.pathname.startsWith(mod.path + '/'))
        .reduce((best, current) => {
            if (!best) return current;
            return current.path.length > best.path.length ? current : best;
        }, null);

    const toggleSection = (title) => {
        setCollapsedSections(prev => {
            const isCurrentlyCollapsed = !!prev[title];
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
        return '/admin';
    };

    return (
        <aside className="h-full w-full bg-white border-r border-gray-200 flex flex-col text-gray-600 transition-all duration-300">
            {/* Header del Logo */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-gray-100">
                <Link
                    to={getHomePath()}
                    onClick={() => { if (onClose) onClose(); }}
                    className="cursor-pointer block"
                >
                    <img src={logoEmplifi} alt="EMPLIFI" className="h-8 w-auto object-contain hover:opacity-80 transition-opacity" />
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
                    const hasActiveChild = activeModule && section.modules.some(m => m.path === activeModule.path);

                    return (
                        <div key={sIdx} className="space-y-1">
                            {/* Cabecera de la Sección con control de colapso */}
                            <button
                                type="button"
                                onClick={() => toggleSection(section.title)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer text-left select-none group ${
                                    hasActiveChild ? 'text-gray-900 font-bold' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50/80'
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
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                    navigate(mod.path);
                                                    if (onClose) onClose();
                                                }}
                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-all duration-150 group text-left cursor-pointer ${
                                                    isActive
                                                        ? 'bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600 pl-2.5'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                            >
                                                <span className={`text-base shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                                    {mod.icon}
                                                </span>
                                                <span className="text-left flex-1 leading-tight">{mod.title}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Footer de Perfil y Cierre de Sesión */}
            <div className="p-3.5 border-t border-gray-200 bg-white">
                <button
                    onClick={() => {
                        navigate('/profile');
                        if (onClose) onClose();
                    }}
                    className="flex items-center gap-2.5 mb-3 w-full text-left p-1.5 rounded border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all group cursor-pointer"
                    title="Ver mi perfil"
                >
                    <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center font-mono font-semibold text-xs shrink-0 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors">
                        {user?.firstName?.[0] || 'A'}
                    </div>
                    <div className="overflow-hidden flex-1">
                        <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{user?.firstName || 'Admin'}</p>
                        <p className="text-[11px] text-gray-400 truncate leading-tight">{getRoleLabel()}</p>
                    </div>
                </button>
                <button
                    onClick={onLogout}
                    className="w-full py-1.5 px-3 rounded border border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors text-xs font-medium bg-white cursor-pointer"
                >
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
