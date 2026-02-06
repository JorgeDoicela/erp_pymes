import { useNavigate, useLocation } from 'react-router-dom';
import { adminModules } from '../../constants/modules';
import logoEmplifi from '../../assets/images/logo_emplifi.png';

const Sidebar = ({ user, onLogout, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <aside className="h-full w-full bg-white border-r border-slate-200 flex flex-col text-slate-600 shadow-sm transition-all duration-300">
            <div className="p-6 flex items-center justify-between">
                <img src={logoEmplifi} alt="EMPLIFI" className="h-10 w-auto object-contain" />
                {onClose && (
                    <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600 transition-colors">
                        ✕
                    </button>
                )}
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                <div className="px-3 mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Menu Principal
                </div>
                {adminModules.map((mod, idx) => {
                    const isActive = location.pathname.startsWith(mod.path);
                    return (
                        <button
                            key={idx}
                            onClick={() => {
                                navigate(mod.path);
                                if (onClose) onClose();
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                                ${isActive
                                    ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <span className={`text-lg transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                {mod.icon}
                            </span>
                            <span>{mod.title}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold border border-indigo-200 shadow-sm">
                        {user?.firstName?.[0] || 'A'}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-900">{user?.firstName || 'Admin'}</p>
                        <p className="text-xs text-slate-500">Administrador</p>
                    </div>
                </div>
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
