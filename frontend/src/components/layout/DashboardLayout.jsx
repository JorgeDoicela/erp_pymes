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
        location.pathname.includes('/accounting') ||
        location.pathname.includes('/entrepreneurship') ||
        location.pathname.includes('/performance/my-evaluations') ||
        location.pathname.includes('/performance/goals');

    const isSuperAdminSupervising = isSuperAdmin && isOperationalOrTenantModule;

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
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                <Header user={user} onMenuClick={() => setIsMenuOpen(true)} title={title} />
                <main className="flex-1 p-3 sm:p-6 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {isSuperAdminSupervising && (
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
                                        Estás navegando este módulo en modo supervisión. Las funciones de registro, edición y solicitudes están deshabilitadas para este usuario.
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
