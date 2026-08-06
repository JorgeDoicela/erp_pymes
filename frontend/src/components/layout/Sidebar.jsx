import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getSectionsByRole, getModulesByRole } from '../../constants/modules';
import logoEmplifi from '../../assets/images/logo_emplifi.png';

const Sidebar = ({ user, onLogout, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const isSuperAdmin = user?.role === 'superadmin' || user?.email === 'admin@emplifi.com';

    const getRoleLabel = () => {
        if (isSuperAdmin) return 'SuperAdmin SaaS';
        switch (user?.role) {
            case 'admin': return 'Administrador';
            case 'accounting': return 'Contabilidad';
            case 'entrepreneur': return 'Emprendedor';
            default: return 'Personal (V2)';
        }
    };

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
        if (user?.role === 'employee') return '/empleado';
        return '/admin';
    };

    return (
        <aside className="h-full w-full bg-white border-r border-slate-200 flex flex-col text-slate-600 shadow-sm transition-all duration-300">
            <div className="p-6 flex items-center justify-between">
                <Link
                    to={getHomePath()}
                    onClick={() => { if (onClose) onClose(); }}
                    className="cursor-pointer block"
                >
                    <img src={logoEmplifi} alt="EMPLIFI" className="h-10 w-auto object-contain hover:opacity-80 transition-opacity" />
                </Link>
                {onClose && (
                    <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600 transition-colors">
                        ✕
                    </button>
                )}
            </div>

            <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto custom-scrollbar">
                {sections.map((section, sIdx) => (
                    <div key={sIdx} className="space-y-1">
                        <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
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
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group text-left
                                        ${isActive
                                            ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100 font-semibold'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    <span className={`text-lg shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                        {mod.icon}
                                    </span>
                                    <span className="text-left flex-1 leading-tight">{mod.title}</span>
                                </button>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <button
                    onClick={() => {
                        navigate('/profile');
                        if (onClose) onClose();
                    }}
                    className="flex items-center gap-3 mb-4 w-full text-left p-1.5 rounded-lg hover:bg-slate-100/80 transition-all group cursor-pointer border border-transparent hover:border-slate-200"
                    title="Ver mi perfil"
                >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold border border-indigo-200 shadow-sm shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {user?.firstName?.[0] || 'A'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{user?.firstName || 'Admin'}</p>
                        <p className="text-xs text-slate-500 truncate">{getRoleLabel()}</p>
                    </div>
                </button>
                <button
                    onClick={onLogout}
                    className="w-full py-2 px-4 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all text-sm font-medium shadow-sm"
                >
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
