import { useState, useEffect } from 'react';
import {
    FiUsers, FiClock, FiCalendar, FiUserX, FiDollarSign, FiGift,
    FiClipboard, FiBriefcase, FiFileText, FiBarChart2, FiHelpCircle,
    FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiActivity, FiCpu, FiShield,
    FiArrowUp, FiArrowDown, FiCode, FiX
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminModules } from '../../constants/modules';
import * as intelligenceService from '../../services/intelligenceService';

function AdminDashboard({ user, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [successMsg, setSuccessMsg] = useState('');
    const [insights, setInsights] = useState([]);
    const [loadingInsights, setLoadingInsights] = useState(true);
    const [showDevModal, setShowDevModal] = useState(false);

    const getTimeBasedGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

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

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                // Fetch real intelligent alerts
                const response = await intelligenceService.getProactiveAlerts();
                if (response.success && response.data && response.data.alerts) {
                    // Map API alerts to UI format
                    const mappedInsights = response.data.alerts.slice(0, 3).map(alert => {
                        let icon = <FiActivity className="text-blue-500" />;
                        let path = '/intelligence'; // Default to intelligence dashboard

                        // Customize based on alert type/category
                        if (alert.priority === 'high' || alert.type === 'risk') {
                            icon = <FiAlertTriangle className="text-amber-500" />;
                        } else if (alert.type === 'performance') {
                            icon = <FiTrendingUp className="text-blue-500" />;
                        } else if (alert.type === 'success' || alert.category === 'Nomina') {
                            icon = <FiCheckCircle className="text-emerald-500" />;
                        }

                        return {
                            type: alert.priority === 'high' ? 'warning' : 'info',
                            message: alert.message || alert.title,
                            icon: icon,
                            path: path
                        };
                    });
                    setInsights(mappedInsights);
                }
            } catch (error) {
                console.error('Error fetching dashboard insights:', error);
                // Fail silently and show empty/default state
            } finally {
                setLoadingInsights(false);
            }
        };

        fetchInsights();
    }, []);

    return (
        <>
            {successMsg && (
                <div className="mb-6 animate-fade-in-down">
                    <div className="bg-emerald-500/10 text-emerald-800 px-6 py-4 rounded-xl shadow-sm border border-emerald-500/20 flex items-center gap-3">
                        <FiCheckCircle className="text-xl text-emerald-600" />
                        <p className="font-medium">{successMsg}</p>
                        <button onClick={() => setSuccessMsg('')} className="ml-auto text-emerald-600 hover:text-emerald-800">×</button>
                    </div>
                </div>
            )}

            <motion.div
                className="space-y-8 max-w-[1600px] mx-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header Section with Date */}
                <motion.div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4" variants={itemVariants}>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                            {getTimeBasedGreeting()}, {user?.firstName || 'Admin'}
                        </h2>
                        <p className="text-slate-500">Resumen de actividad del {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    </div>
                    <div className="flex gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/intelligence')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 flex items-center gap-2"
                        >
                            <FiActivity /> Panel Inteligente
                        </motion.button>
                    </div>
                </motion.div>



                <div className="grid grid-cols-1 gap-8">
                    {/* Insights Section - Full Width */}
                    <section className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row overflow-hidden">
                        <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50 flex flex-col justify-center">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <FiActivity size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Centro de Alertas</h3>
                            </div>
                            <p className="text-sm text-slate-500 mb-4">Novedades importantes que requieren tu atención.</p>
                            <button onClick={() => navigate('/intelligence')} className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
                                Ver Panel Inteligente <span className="text-lg">→</span>
                            </button>
                        </div>

                        <div className="p-6 md:w-2/3">
                            {loadingInsights ? (
                                <div className="flex flex-col items-center justify-center py-8 gap-3">
                                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    <div className="text-slate-400 text-sm">Cargando alertas inteligentes...</div>
                                </div>
                            ) : insights.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {insights.slice(0, 4).map((insight, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => navigate(insight.path)}
                                            className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-slate-50 hover:shadow-sm transition-all cursor-pointer group"
                                        >
                                            <div className="mt-1 text-slate-400 group-hover:text-blue-600 transition-colors">
                                                {insight.icon}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 line-clamp-2">{insight.message}</p>
                                                <span className="text-xs font-medium text-slate-400 group-hover:text-blue-500 mt-1 block">Ver detalle</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-3 py-8 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                    <FiCheckCircle size={32} className="text-emerald-400" />
                                    <div className="text-center px-4">
                                        <p className="text-sm font-bold text-slate-600">Todo al día</p>
                                        <p className="text-xs">No hay nuevas alertas que requieran tu atención.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <motion.section variants={itemVariants}>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-5 flex items-center gap-2">
                            <FiBriefcase className="text-slate-400" />
                            Aplicaciones y Módulos
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                            {adminModules.map((mod, idx) => (
                                <motion.button
                                    key={idx}
                                    variants={itemVariants}
                                    whileHover={{ y: -5, shadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
                                    onClick={() => navigate(mod.path)}
                                    className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-slate-200 hover:border-blue-400 transition-all duration-200 group h-40 text-center relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className={`p-3 rounded-xl bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors mb-3 relative z-10 duration-200`}>
                                        <span className="text-2xl">{mod.icon}</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 relative z-10">{mod.title}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.section>
                </div>
            </motion.div>

            {/* Floating Developer Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <motion.button
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowDevModal(true)}
                    className="w-14 h-14 bg-slate-900/90 hover:bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-white/20 backdrop-blur-md transition-all group"
                    title="Conocer al desarrollador"
                >
                    <FiCode size={24} className="group-hover:text-blue-400 transition-colors" />
                </motion.button>
            </div>

            {/* Developer Modal */}
            <AnimatePresence>
                {showDevModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                        onClick={() => setShowDevModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-[2.5rem] overflow-hidden max-w-xl w-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative mx-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="relative w-full bg-slate-900 overflow-hidden group">
                                <img
                                    src="/jorge_doicela.jpg"
                                    alt="Jorge Doicela"
                                    className="w-full h-auto object-contain max-h-[60vh] mx-auto transition-transform duration-700 group-hover:scale-105"
                                />
                                {/* Subtle overlay to make close button readable */}
                                <div className="absolute top-0 right-0 left-0 h-16 bg-gradient-to-b from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <button
                                    onClick={() => setShowDevModal(false)}
                                    className="absolute top-6 right-6 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/20 transition-all active:scale-90 z-20"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>

                            <div className="p-8 md:p-10 bg-white">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="space-y-2">
                                        <h4 className="text-3xl font-black text-slate-900 tracking-tighter">Jorge Doicela</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" />
                                            <p className="text-sm text-blue-600 font-bold uppercase tracking-[0.2em]">Software Developer | DevSecOps</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-slate-50">
                                    <p className="text-slate-500 text-lg leading-relaxed italic font-medium">
                                        "Desarrollador de software enfocado en la adopción de prácticas DevSecOps. Mi objetivo es crear soluciones digitales que no solo resuelvan problemas, sino que sean seguras y eficientes desde su concepción, aportando valor real en cada despliegue."
                                    </p>
                                </div>

                                <div className="mt-10">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowDevModal(false)}
                                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10"
                                    >
                                        VOLVER AL PANEL
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default AdminDashboard;
