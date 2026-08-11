import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { motion, AnimatePresence } from 'framer-motion';
import DeveloperCard from '../common/DeveloperCard';
import { useLocation } from 'react-router-dom';
import { FiShield, FiEye } from 'react-icons/fi';

const DashboardLayout = ({ children, user, onLogout, title }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const isSuperAdmin = user?.role === 'superadmin' || user?.email === 'admin@emplifi.com';
    const isOperationalOrTenantModule = 
        location.pathname.startsWith('/empleado') ||
        location.pathname.startsWith('/my-') ||
        location.pathname.includes('/performance/my-evaluations') ||
        location.pathname.includes('/performance/goals');

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
                            <div className="mb-5 bg-indigo-900 text-white p-3.5 px-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-800 rounded-xl shrink-0 text-indigo-200">
                                        <FiEye className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">Modo Inspección de Empresa Activo</p>
                                        <p className="text-indigo-200 text-[11px] mt-0.5">
                                            Estás auditando los datos aislados de una empresa específica. Las acciones globales afectan a este contexto.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClearTenantInspection}
                                    className="px-3 py-1.5 bg-white text-indigo-900 hover:bg-indigo-50 font-bold rounded-lg transition-colors shrink-0 shadow-xs cursor-pointer"
                                >
                                    Volver a Modo Global SaaS
                                </button>
                            </div>
                        )}
                        {isSuperAdminSupervising && !selectedTenantId && (
                            <div className="mb-5 bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs flex items-start gap-3.5 text-slate-700">
                                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-500 border border-slate-100 shrink-0">
                                    <FiEye className="w-4 h-4 text-slate-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-semibold text-xs text-slate-900 tracking-tight">
                                            Modo Supervisión SuperAdmin
                                        </h4>
                                        <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded-md border border-slate-200/60">
                                            Solo Lectura
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        Estás navegando este módulo en modo supervisión global.
                                    </p>
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
