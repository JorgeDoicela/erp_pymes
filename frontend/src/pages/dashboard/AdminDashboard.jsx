import { useState, useEffect } from 'react';
import {
    FiUsers, FiClock, FiCalendar, FiUserX, FiDollarSign, FiGift,
    FiClipboard, FiBriefcase, FiFileText, FiBarChart2, FiHelpCircle,
    FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiActivity, FiCpu, FiShield,
    FiArrowUp, FiArrowDown
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminModules } from '../../constants/modules';
import * as intelligenceService from '../../services/intelligenceService';

function AdminDashboard({ user, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [successMsg, setSuccessMsg] = useState('');
    const [insights, setInsights] = useState([]);
    const [loadingInsights, setLoadingInsights] = useState(true);

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
                                <div className="text-center text-slate-400 text-sm py-4">Cargando alertas...</div>
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
                                <div className="flex items-center justify-center gap-3 py-4 text-slate-400">
                                    <FiCheckCircle size={24} className="text-emerald-400" />
                                    <span className="text-sm font-medium">Todo al día. No hay nuevas alertas.</span>
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
        </>
    );
}

export default AdminDashboard;
