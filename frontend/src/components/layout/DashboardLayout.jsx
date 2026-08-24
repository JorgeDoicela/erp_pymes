import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import DeveloperCard from '../common/DeveloperCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { isSuperAdmin as checkIsSuperAdmin } from '../../constants/roles.js';

const DashboardLayout = ({ children, user, onLogout, title }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktopOpen, setIsDesktopOpen] = useState(() => {
        const saved = localStorage.getItem('desktop_sidebar_open');
        return saved !== null ? saved === 'true' : true;
    });
    const location = useLocation();

    // Cerrar menú móvil al navegar
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const isSuperAdmin = checkIsSuperAdmin(user);
    const isOperationalOrTenantModule = 
        (location.pathname.startsWith('/admin/') && 
         !location.pathname.startsWith('/admin/audit') && 
         !location.pathname.startsWith('/admin/settings')) ||
        location.pathname.startsWith('/attendance') ||
        location.pathname.startsWith('/performance') ||
        location.pathname.startsWith('/recruitment') ||
        location.pathname.startsWith('/analytics');

    const isSuperAdminSupervising = isSuperAdmin && isOperationalOrTenantModule;
    const selectedTenantId = isSuperAdmin ? localStorage.getItem('superadmin_selected_tenant_id') : null;

    const handleClearTenantInspection = () => {
        localStorage.removeItem('superadmin_selected_tenant_id');
        window.location.reload();
    };

    const handleToggleMenu = () => {
        if (window.innerWidth < 768) {
            setIsMobileMenuOpen(prev => !prev);
        } else {
            setIsDesktopOpen(prev => {
                const nextState = !prev;
                localStorage.setItem('desktop_sidebar_open', String(nextState));
                return nextState;
            });
        }
    };

    return (
        <div className="min-h-screen bg-[#f9fafb] flex overflow-x-hidden">
            {/* Desktop Sidebar con animación de deslizamiento y ocultamiento */}
            <aside
                className={`hidden md:block fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out ${
                    isDesktopOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <Sidebar
                    user={user}
                    onLogout={onLogout}
                />
            </aside>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-72 z-50 md:hidden bg-white shadow-xl"
                        >
                            <Sidebar
                                user={user}
                                onLogout={onLogout}
                                onClose={() => setIsMobileMenuOpen(false)}
                            />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content que se expande a todo el ancho cuando el sidebar está oculto */}
            <div
                className={`flex-1 flex flex-col min-h-screen min-w-0 w-full transition-all duration-300 ease-in-out ${
                    isDesktopOpen ? 'md:ml-64' : 'md:ml-0'
                }`}
            >
                <Header
                    user={user}
                    onMenuClick={handleToggleMenu}
                    isSidebarOpen={isDesktopOpen}
                    title={title}
                />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0 w-full">
                    <div className="max-w-7xl mx-auto w-full min-w-0">
                        {isSuperAdmin && selectedTenantId && (
                            <div className="mb-5 bg-gray-900 text-white px-4 py-3 rounded border border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                                <div>
                                    <p className="font-semibold text-sm">Modo Inspección de Empresa Activo</p>
                                    <p className="text-gray-400 text-[11px] mt-0.5">
                                        Estás auditando los datos aislados de una empresa específica.
                                    </p>
                                </div>
                                <button
                                    onClick={handleClearTenantInspection}
                                    className="px-3 py-1.5 bg-white text-gray-900 hover:bg-gray-100 font-medium rounded text-xs transition-colors shrink-0 cursor-pointer"
                                >
                                    Volver a Modo Global
                                </button>
                            </div>
                        )}
                        {isSuperAdminSupervising && !selectedTenantId && (
                            <div className="mb-5 bg-white border border-gray-200 px-4 py-3 rounded flex items-start gap-3 text-gray-700">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-semibold text-xs text-gray-900">Modo Supervisión SuperAdmin</h4>
                                        <span className="px-2 py-0.5 text-[10px] font-mono font-medium bg-gray-100 text-gray-500 rounded border border-gray-200">Solo Lectura</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Estás navegando este módulo en modo supervisión global.</p>
                                </div>
                            </div>
                        )}
                        {children}
                    </div>
                </main>
            </div>
            <DeveloperCard />
        </div>
    );
};

export default DashboardLayout;
