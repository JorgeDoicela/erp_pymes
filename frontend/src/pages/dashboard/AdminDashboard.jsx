import { useState, useEffect } from 'react';
import { FiUsers, FiClock, FiCalendar, FiUserX, FiDollarSign, FiGift, FiClipboard, FiBriefcase, FiFileText, FiBarChart2, FiHelpCircle, FiMenu, FiX } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from '../../components/common/NotificationBell';
import { FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiActivity, FiCpu, FiShield } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

function AdminDashboard({ user, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [successMsg, setSuccessMsg] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        if (location.state?.successMessage) {
            setSuccessMsg(location.state.successMessage);
            // Clear state so it doesn't persist on refresh/back
            window.history.replaceState({}, document.title);

            // Auto-hide after 3 seconds
            const timer = setTimeout(() => setSuccessMsg(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [location]);
    const modules = [
        { title: 'Empleados', icon: <FiUsers />, color: 'bg-blue-500', path: '/admin/employees' },
        { title: 'Asistencia', icon: <FiClock />, color: 'bg-indigo-500', path: '/attendance' },
        { title: 'Turnos', icon: <FiCalendar />, color: 'bg-purple-500', path: '/admin/shifts' },
        { title: 'Ausencias', icon: <FiUserX />, color: 'bg-rose-500', path: '/admin/absences' },
        { title: 'Nómina', icon: <FiDollarSign />, color: 'bg-green-500', path: '/admin/payroll/generator' },
        { title: 'Beneficios', icon: <FiGift />, color: 'bg-yellow-500', path: '/admin/payroll/benefits' },
        { title: 'Evaluaciones', icon: <FiTrendingUp />, color: 'bg-orange-500', path: '/performance' },
        { title: 'Mis Evaluaciones', icon: <FiClipboard />, color: 'bg-orange-600', path: '/performance/my-evaluations' },
        { title: 'Reclutamiento', icon: <FiBriefcase />, color: 'bg-pink-500', path: '/recruitment' },
        { title: 'Reportes', icon: <FiFileText />, color: 'bg-cyan-500', path: '/admin/reports' },
        { title: 'Analíticas', icon: <FiBarChart2 />, color: 'bg-indigo-600', path: '/analytics' },
        { title: 'Auditoría', icon: <FiShield />, color: 'bg-slate-700', path: '/admin/audit' },
        { title: 'Ayuda', icon: <FiHelpCircle />, color: 'bg-amber-600', path: '/help' },
    ]

    const insights = [
        { type: 'warning', message: '3 contratos vencen esta semana', icon: <FiAlertTriangle className="text-white" />, path: '/admin/contracts/expiring' },
        { type: 'info', message: 'Ausentismo aumentó un 5% este mes', icon: <FiTrendingUp className="text-white" />, path: '/admin/absences' },
        { type: 'success', message: 'Nómina procesada correctamente', icon: <FiCheckCircle className="text-white" />, path: '/admin/payroll/generator' },
    ]

    return (
        <div className="min-h-screen bg-slate-900 text-white flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-white/10 hidden md:flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        EMPLIFI
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                        Menu Principal
                    </div>
                    {modules.map((mod, idx) => (
                        <button
                            key={idx}
                            onClick={() => navigate(mod.path)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors text-left"
                        >
                            <span className="text-xl">{mod.icon}</span>
                            <span>{mod.title}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold">
                            {user?.firstName?.[0] || 'A'}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">{user?.firstName || 'Admin'}</p>
                            <p className="text-xs text-slate-400">Administrador</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full py-2 px-4 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 md:px-8 sticky top-0 z-50">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="p-2 -ml-2 text-slate-400 hover:text-white md:hidden"
                        >
                            <FiMenu size={24} />
                        </button>
                        <h2 className="text-xl font-semibold">Panel de Control</h2>
                    </div>
                    {successMsg && (
                        <div className="fixed top-20 right-4 md:right-8 z-50 animate-fade-in-down">
                            <div className="bg-emerald-500/90 backdrop-blur text-white px-4 md:px-6 py-3 rounded-lg shadow-lg border border-emerald-400/50 flex items-center gap-3">
                                <span className="text-2xl"></span>
                                <p className="font-medium text-sm md:base">{successMsg}</p>
                                <button onClick={() => setSuccessMsg('')} className="ml-2 text-white/80 hover:text-white">×</button>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <div className="hidden sm:flex items-center gap-3 text-right">
                            <div className="text-right">
                                <p className="text-sm font-medium text-white">{user?.firstName || 'Admin'}</p>
                                <p className="text-[10px] text-slate-400">Admin</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Mobile Sidebar Overlay */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsMenuOpen(false)}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
                            />
                            <motion.aside
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed inset-y-0 left-0 w-72 bg-slate-900 border-r border-white/10 z-[70] md:hidden flex flex-col"
                            >
                                <div className="p-6 flex items-center justify-between">
                                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                        EMPLIFI
                                    </h1>
                                    <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 hover:text-white">
                                        <FiX size={24} />
                                    </button>
                                </div>

                                <nav className="flex-1 px-4 py-2 overflow-y-auto space-y-1">
                                    {modules.map((mod, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                navigate(mod.path);
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors text-left"
                                        >
                                            <span className="text-xl">{mod.icon}</span>
                                            <span className="font-medium">{mod.title}</span>
                                        </button>
                                    ))}
                                </nav>

                                <div className="p-4 border-t border-white/10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold">
                                            {user?.firstName?.[0] || 'A'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{user?.firstName || 'Admin'}</p>
                                            <p className="text-xs text-slate-400">Administrador</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onLogout}
                                        className="w-full py-2 px-4 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
                                    >
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                <div className="p-8 max-w-7xl mx-auto space-y-8">
                    {/* Intelligent Assistant Section */}
                    <section className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-2xl p-6 border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px]"></div>

                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <span className="text-white"><FiCpu /></span> Asistente Inteligente
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {insights.map((insight, idx) => (
                                    <div key={idx} className="bg-slate-900/60 backdrop-blur-sm p-4 rounded-xl border border-white/5 flex items-start gap-3">
                                        <span className="text-2xl">{insight.icon}</span>
                                        <div>
                                            <p className="text-sm font-medium text-slate-200">{insight.message}</p>
                                            <button
                                                onClick={() => navigate(insight.path)}
                                                className="text-xs text-blue-400 mt-2 hover:text-blue-300 flex items-center gap-1"
                                            >
                                                Ver detalles →
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Modules Grid */}
                    <section>
                        <h3 className="text-lg font-semibold mb-4 text-slate-300">Accesos Directos</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {modules.map((mod, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => navigate(mod.path)}
                                    className="group relative overflow-hidden rounded-2xl bg-slate-800/50 border border-white/5 p-6 hover:bg-slate-800 transition-all hover:-translate-y-1 text-left"
                                >
                                    <div className={`absolute top-0 right-0 w-24 h-24 ${mod.color} opacity-10 rounded-bl-full group-hover:scale-110 transition-transform`}></div>
                                    <div className="text-4xl mb-4">{mod.icon}</div>
                                    <h4 className="text-xl font-bold mb-1">{mod.title}</h4>
                                    <p className="text-sm text-slate-400">Gestionar {mod.title.toLowerCase()}</p>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}

export default AdminDashboard
