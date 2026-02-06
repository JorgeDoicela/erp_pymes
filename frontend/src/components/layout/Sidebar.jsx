import { useNavigate, useLocation } from 'react-router-dom';
import { adminModules } from '../../constants/modules';
import logoEmplifi from '../../assets/images/logo_emplifi.png';

const Sidebar = ({ user, onLogout, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <aside className="h-full w-full bg-blue-950 flex flex-col text-white">
            <div className="p-6 flex items-center justify-between">
                <img src={logoEmplifi} alt="EMPLIFI" className="h-14 w-auto object-contain" />
                {onClose && (
                    <button onClick={onClose} className="md:hidden text-white/70 hover:text-white">
                        ✕
                    </button>
                )}
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <div className="px-3 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
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
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                                ${isActive
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <span className="text-lg">{mod.icon}</span>
                            <span>{mod.title}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10 bg-slate-900/30">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold border-2 border-emerald-500/30">
                        {user?.firstName?.[0] || 'A'}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">{user?.firstName || 'Admin'}</p>
                        <p className="text-xs text-white/50">Administrador</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="w-full py-2 px-4 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium border border-red-500/10"
                >
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
