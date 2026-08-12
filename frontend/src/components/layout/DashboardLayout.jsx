import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { motion, AnimatePresence } from 'framer-motion';
import DeveloperCard from '../common/DeveloperCard';
import { useLocation } from 'react-router-dom';
import { FiShield, FiEye } from 'react-icons/fi';

import { isSuperAdmin as checkIsSuperAdmin } from '../../constants/roles.js';

const DashboardLayout = ({ children, user, onLogout, title }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

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

    return (
        <div className="min-h-screen bg-surface flex">
            {/* Desktop Sidebar */}
            <div className="hidden md:block w-64 fixed inset-y-0 left-0 z-40">
                <Sidebar user={user} onLogout={onLogout} />
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-72 z-50 md:hidden"
                        >
                            <Sidebar user={user} onLogout={onLogout} onClose={() => setIsMenuOpen(false)} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen min-w-0 w-full overflow-x-hidden">
                <Header user={user} onMenuClick={() => setIsMenuOpen(true)} title={title} />
                <main className="flex-1 p-3 sm:p-6 overflow-y-auto min-w-0 w-full">
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
