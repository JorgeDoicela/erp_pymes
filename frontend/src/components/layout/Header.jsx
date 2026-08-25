import { useState, useEffect } from 'react';
import { FiMenu, FiGlobe, FiBriefcase } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../common/NotificationBell';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';

import { isSuperAdmin as checkIsSuperAdmin } from '../../constants/roles.js';

const Header = ({ user, onMenuClick, isSidebarOpen = true, title = "Panel de Control" }) => {
    const navigate = useNavigate();
    const isSuperAdmin = checkIsSuperAdmin(user);
    
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
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 md:px-8 sticky top-0 z-30 transition-all duration-300">
            <div className="flex items-center gap-3 sm:gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer flex items-center justify-center"
                    title={isSidebarOpen ? "Ocultar menú lateral" : "Mostrar menú lateral"}
                    aria-label="Alternar menú lateral"
                >
                    <FiMenu size={20} />
                </button>
                <h2 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{title}</h2>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
                {isSuperAdmin && (
                    <div className="flex items-center gap-2 bg-gray-50 px-2.5 py-1 rounded border border-gray-200 text-xs text-gray-700 hover:border-gray-300 transition-colors">
                        <FiBriefcase className="text-gray-400 shrink-0 text-xs" />
                        <select
                            value={selectedTenantId}
                            onChange={handleTenantChange}
                            className="bg-transparent font-medium focus:outline-none cursor-pointer max-w-[160px] sm:max-w-[220px] truncate py-0.5 text-gray-800"
                            title="Selector de Empresa (SuperAdmin)"
                        >
                            <option value="">Modo Global (Todas las empresas)</option>
                            {tenants.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <NotificationBell />

                <Link
                    to="/profile"
                    className="hidden sm:flex items-center gap-2.5 text-right pl-4 border-l border-gray-200 hover:opacity-90 transition-opacity cursor-pointer group focus:outline-none no-underline"
                    title="Ver mi perfil"
                >
                    <div className="text-right">
                        <p className="text-xs font-semibold text-gray-900 leading-tight">
                            {user?.firstName || 'Admin'}
                        </p>
                        <p className="text-[11px] font-medium text-gray-400 leading-tight">
                            {isSuperAdmin ? 'SuperAdmin' : (user?.role || 'Usuario')}
                        </p>
                    </div>
                    <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center font-mono font-semibold text-xs shrink-0 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors">
                        {user?.firstName?.[0] || 'A'}
                    </div>
                </Link>
            </div>
        </header>
    );
};

export default Header;
