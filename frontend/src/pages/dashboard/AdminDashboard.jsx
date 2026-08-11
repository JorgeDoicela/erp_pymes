import { useState, useEffect } from 'react';
import {
    FiUsers, FiClock, FiCalendar, FiUserX, FiDollarSign, FiGift,
    FiClipboard, FiBriefcase, FiFileText, FiBarChart2, FiHelpCircle,
    FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiActivity, FiCpu, FiShield,
    FiArrowUp, FiArrowDown, FiPlusCircle, FiUserPlus, FiVolume2, FiPlus
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSectionsByRole } from '../../constants/modules';
import * as intelligenceService from '../../services/intelligenceService';
import api from '../../api/axios';

function AdminDashboard({ user, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [successMsg, setSuccessMsg] = useState('');
    const [insights, setInsights] = useState([]);
    const [loadingInsights, setLoadingInsights] = useState(true);
    const [pendingEvals, setPendingEvals] = useState(0);

    // Métricas del Dashboard Operativo Admin
    const [dashboardMetrics, setDashboardMetrics] = useState({
        totalEmployees: 0,
        newHires: 0,
        openVacancies: 0,
        estimatedPayroll: 0,
        pendingAbsences: 0
    });
    const [loadingMetrics, setLoadingMetrics] = useState(true);

    const getTimeBasedGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    };

    const sections = getSectionsByRole(user);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0 }
    };

    useEffect(() => {
        if (location.state?.successMessage) {
            setSuccessMsg(location.state.successMessage);
            window.history.replaceState({}, document.title);
            const timer = setTimeout(() => setSuccessMsg(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [location]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoadingMetrics(true);
            try {
                const [analyticsRes, absencesRes] = await Promise.allSettled([
                    api.get('/analytics/dashboard'),
                    api.get('/absences', { params: { status: 'PENDING' } })
                ]);

                let totalEmployees = 0;
                let newHires = 0;
                let openVacancies = 0;
                let estimatedPayroll = 0;
                let pendingAbsences = 0;

                if (analyticsRes.status === 'fulfilled' && analyticsRes.value.data) {
                    const data = analyticsRes.value.data.kpis || analyticsRes.value.data;
                    totalEmployees = data.totalEmployees || 0;
                    newHires = data.newHires || 0;
                    openVacancies = data.openVacancies || 0;
                    estimatedPayroll = data.payrollTotal || data.estimatedPayroll || 0;
                }

                if (absencesRes.status === 'fulfilled' && absencesRes.value.data) {
                    const absData = absencesRes.value.data.data || absencesRes.value.data;
                    pendingAbsences = Array.isArray(absData) ? absData.length : 0;
                }

                setDashboardMetrics({
                    totalEmployees,
                    newHires,
                    openVacancies,
                    estimatedPayroll: typeof estimatedPayroll === 'number' ? estimatedPayroll : parseFloat(estimatedPayroll) || 0,
                    pendingAbsences
                });
            } catch (error) {
                console.error('Error fetching admin dashboard metrics:', error);
            } finally {
                setLoadingMetrics(false);
            }
        };

        const fetchInsights = async () => {
            try {
                const response = await intelligenceService.getProactiveAlerts();
                if (response.success && response.data && response.data.alerts) {
                    const mappedInsights = response.data.alerts.slice(0, 3).map(alert => {
                        let icon = <FiActivity className="text-blue-500" />;
                        let path = '/intelligence';

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
                            icon,
                            path
                        };
                    });
                    setInsights(mappedInsights);
                }
            } catch (error) {
                console.error('Error fetching dashboard insights:', error);
            } finally {
                setLoadingInsights(false);
            }
        };

        const fetchPending = async () => {
            try {
                const { getMyPendingEvaluations } = await import('../../services/evaluation.service');
                const evaluations = await getMyPendingEvaluations();
                setPendingEvals(evaluations.filter(e => e.status !== 'COMPLETED').length);
            } catch (e) {
                console.error('Error fetching pending evaluations:', e);
            }
        };

        fetchDashboardData();
        fetchInsights();
        fetchPending();
    }, []);

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            {successMsg && (
                <div className="animate-fade-in-down">
                    <div className="bg-emerald-50 text-emerald-800 px-6 py-4 rounded-xl shadow-xs border border-emerald-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FiCheckCircle className="text-xl text-emerald-600" />
                            <p className="font-semibold text-sm">{successMsg}</p>
                        </div>
                        <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800 font-bold">×</button>
                    </div>
                </div>
            )}

            <motion.div
                className="space-y-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header Bienvenida */}
                <motion.div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs" variants={itemVariants}>
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
                            <FiBriefcase className="w-4 h-4" /> Consola de Administración de Empresa
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                            {getTimeBasedGreeting()}, {user?.firstName || 'Administrador'}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Gestión integral de colaboradores, nómina, tiempos y talento.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {pendingEvals > 0 && (
                            <button
                                onClick={() => navigate('/performance/my-evaluations')}
                                className="px-4 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors flex items-center gap-2 relative cursor-pointer"
                            >
                                <FiClipboard /> Evaluaciones Pendientes
                                <span className="w-5 h-5 bg-amber-600 text-white text-[10px] flex items-center justify-center rounded-full">
                                    {pendingEvals}
                                </span>
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/admin/register-employee')}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
                        >
                            <FiUserPlus className="w-4 h-4" /> Nuevo Empleado
                        </button>
                    </div>
                </motion.div>

                {/* Tarjetas de Métricas Operativas */}
                <motion.div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" variants={itemVariants}>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Plantilla Activa</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                {loadingMetrics ? '...' : dashboardMetrics.totalEmployees}
                            </p>
                            <p className="text-xs text-indigo-600 font-medium mt-1">
                                +{dashboardMetrics.newHires} nuevos este mes
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl">
                            <FiUsers />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nómina Mensual Estimada</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                ${loadingMetrics ? '...' : dashboardMetrics.estimatedPayroll.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Proyección según contratos</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl">
                            <FiDollarSign />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Permisos por Aprobar</p>
                            <p className="text-2xl font-bold text-amber-600 mt-1">
                                {loadingMetrics ? '...' : dashboardMetrics.pendingAbsences}
                            </p>
                            <button
                                onClick={() => navigate('/admin/absences')}
                                className="text-xs text-indigo-600 font-semibold hover:underline mt-1 block"
                            >
                                Revisar solicitudes →
                            </button>
                        </div>
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl">
                            <FiUserX />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vacantes Abiertas</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                {loadingMetrics ? '...' : dashboardMetrics.openVacancies}
                            </p>
                            <button
                                onClick={() => navigate('/recruitment')}
                                className="text-xs text-indigo-600 font-semibold hover:underline mt-1 block"
                            >
                                Gestionar reclutamiento →
                            </button>
                        </div>
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-xl">
                            <FiBriefcase />
                        </div>
                    </div>
                </motion.div>

                {/* Sección Alertas Inteligentes */}
                <motion.section className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row overflow-hidden" variants={itemVariants}>
                    <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                                <FiActivity size={22} />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">Centro de Alertas & IA</h3>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">Novedades operativas y sugerencias del sistema.</p>
                        <button onClick={() => navigate('/intelligence')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors cursor-pointer">
                            Ver Panel de Inteligencia →
                        </button>
                    </div>

                    <div className="p-6 md:w-2/3">
                        {loadingInsights ? (
                            <div className="flex flex-col items-center justify-center py-6 gap-2">
                                <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                <div className="text-slate-400 text-xs font-medium">Cargando alertas del sistema...</div>
                            </div>
                        ) : insights.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {insights.slice(0, 4).map((insight, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => navigate(insight.path)}
                                        className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 transition-all cursor-pointer group"
                                    >
                                        <div className="mt-0.5 text-slate-400 group-hover:text-indigo-600 transition-colors">
                                            {insight.icon}
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-800 group-hover:text-slate-900 line-clamp-2">{insight.message}</p>
                                            <span className="text-[11px] font-semibold text-indigo-600 mt-1 block">Ver detalle</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-2 py-6 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                <FiCheckCircle size={28} className="text-emerald-500" />
                                <div className="text-center">
                                    <p className="text-xs font-bold text-slate-700">Sin Alertas Pendientes</p>
                                    <p className="text-[11px] text-slate-500">Toda la operación se encuentra al día.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.section>

                {/* Secciones de Módulos Clasificados */}
                <div className="space-y-8">
                    {sections.map((section, sIdx) => {
                        const filteredModules = section.modules.filter(m => m.path !== '/admin' && m.path !== '/empleado' && m.path !== '/superadmin/dashboard');
                        if (filteredModules.length === 0) return null;
                        return (
                            <motion.section key={sIdx} variants={itemVariants}>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <FiBriefcase className="text-slate-400" />
                                    {section.title}
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {filteredModules.map((mod, idx) => (
                                        <motion.button
                                            key={idx}
                                            variants={itemVariants}
                                            whileHover={{ y: -4, shadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)" }}
                                            onClick={() => navigate(mod.path)}
                                            className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 transition-all duration-200 group h-36 text-center relative overflow-hidden cursor-pointer shadow-xs"
                                        >
                                            <div className="p-3 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors mb-2 text-xl">
                                                {mod.icon}
                                            </div>
                                            <span className="text-xs font-bold text-slate-800 group-hover:text-slate-900 leading-tight">{mod.title}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.section>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}

export default AdminDashboard;
