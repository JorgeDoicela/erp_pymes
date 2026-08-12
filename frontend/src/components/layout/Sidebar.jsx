import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getSectionsByRole, getModulesByRole } from '../../constants/modules';
import logoEmplifi from '../../assets/images/logo_emplifi.png';
import { isSuperAdmin as checkIsSuperAdmin, getRoleLabel as getRoleTitle, ROLES } from '../../constants/roles.js';

const Sidebar = ({ user, onLogout, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const isSuperAdminUser = checkIsSuperAdmin(user);

    const getRoleLabel = () => getRoleTitle(user);

    const sections = getSectionsByRole(user);
    const allModules = getModulesByRole(user);

    // Encontrar el módulo que mejor coincide (el prefijo más largo que coincida con la ruta actual)
    const activeModule = [...allModules]
        .filter(mod => location.pathname === mod.path || location.pathname.startsWith(mod.path + '/'))
        .reduce((best, current) => {
            if (!best) return current;
            return current.path.length > best.path.length ? current : best;
        }, null);

    const getHomePath = () => {
        if (isSuperAdminUser) return '/superadmin/dashboard';
        const role = (user?.role || '').toLowerCase();
        if (role === ROLES.EMPLOYEE) return '/empleado';
        if (role === ROLES.ACCOUNTING) return '/admin/accounting';
        return '/admin';
    };

    return (
        <aside className="h-full w-full bg-white border-r border-gray-200 flex flex-col text-gray-600 transition-all duration-300">
            <div className="p-5 flex items-center justify-between border-b border-gray-100">
                <Link
                    to={getHomePath()}
                    onClick={() => { if (onClose) onClose(); }}
                    className="cursor-pointer block"
                >
                    <img src={logoEmplifi} alt="EMPLIFI" className="h-9 w-auto object-contain hover:opacity-80 transition-opacity" />
                </Link>
                {onClose && (
                    <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600 transition-colors p-1">
                        ✕
                    </button>
                )}
            </div>

            <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto custom-scrollbar">
                {sections.map((section, sIdx) => (
                    <div key={sIdx} className="space-y-1">
                        <div className="px-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            {section.title}
                        </div>
                        {section.modules.map((mod, idx) => {
                            const isActive = activeModule && activeModule.path === mod.path;
                            return (
                                <button
                                    key={idx}
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
                ))}
            </nav>

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
