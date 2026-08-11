import { useState, useEffect } from 'react';
import { FiMenu, FiGlobe, FiBriefcase } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../common/NotificationBell';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';

const Header = ({ user, onMenuClick, title = "Panel de Control" }) => {
    const navigate = useNavigate();
    const isSuperAdmin = user?.role === 'superadmin' || user?.email === 'admin@emplifi.com';
    
    const [tenants, setTenants] = useState([]);
    const [selectedTenantId, setSelectedTenantId] = useState(
        () => localStorage.getItem('superadmin_selected_tenant_id') || ''
    );

    useEffect(() => {
        if (isSuperAdmin) {
            api.get('/superadmin/tenants-list')
                .then(res => {
                    if (res.data.success) {
                        setTenants(res.data.data);
                    }
                })
                .catch(err => console.error('Error fetching tenants list for header:', err));
        }
    }, [isSuperAdmin]);

    const handleTenantChange = (e) => {
        const value = e.target.value;
        setSelectedTenantId(value);
        if (value) {
            localStorage.setItem('superadmin_selected_tenant_id', value);
            const found = tenants.find(t => t.id === value);
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
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 transition-all duration-300">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all md:hidden"
                >
                    <FiMenu size={24} />
                </button>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
                {isSuperAdmin && (
                    <div className="flex items-center gap-2 bg-slate-100/80 px-2.5 py-1 rounded-xl border border-slate-200/80 text-xs text-slate-700">
                        {selectedTenantId ? (
                            <FiBriefcase className="text-indigo-600 shrink-0 text-sm" />
                        ) : (
                            <FiGlobe className="text-emerald-600 shrink-0 text-sm" />
                        )}
                        <select
                            value={selectedTenantId}
                            onChange={handleTenantChange}
                            className="bg-transparent font-medium focus:outline-none cursor-pointer max-w-[160px] sm:max-w-[220px] truncate py-1 text-slate-800"
                            title="Selector de Empresa (SuperAdmin)"
                        >
                            <option value="">Modo Global (Todas las Empresas)</option>
                            {tenants.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <NotificationBell />
                <button
                    onClick={() => navigate('/profile')}
                    className="hidden sm:flex items-center gap-3 text-right pl-4 border-l border-slate-200 hover:opacity-90 transition-all cursor-pointer group focus:outline-none"
                    title="Ver mi perfil"
                >
                    <div className="text-right">
                        <p className="text-sm font-semibold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                            {user?.firstName || 'Admin'}
                        </p>
                        <p className="text-[11px] font-medium text-indigo-600 leading-tight">
                            {isSuperAdmin ? 'SuperAdmin SaaS' : (user?.role || 'Usuario')}
                        </p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-sm ring-2 ring-white group-hover:ring-indigo-300 transition-all">
                        {user?.firstName?.[0] || 'A'}
                    </div>
                </button>
            </div>
        </header>
    );
};

export default Header;
