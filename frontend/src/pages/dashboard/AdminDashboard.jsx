import { useState, useEffect } from 'react';
import {
    FiUsers, FiClock, FiCalendar, FiUserX, FiDollarSign, FiGift,
    FiClipboard, FiBriefcase, FiFileText, FiBarChart2, FiHelpCircle,
    FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiActivity, FiCpu, FiShield,
    FiArrowUp, FiArrowDown
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { adminModules } from '../../constants/modules';
import * as intelligenceService from '../../services/intelligenceService';

function AdminDashboard({ user, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [successMsg, setSuccessMsg] = useState('');
    const [insights, setInsights] = useState([]);
    const [loadingInsights, setLoadingInsights] = useState(true);

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
        <DashboardLayout user={user} onLogout={onLogout} title="Panel de Control">
            {successMsg && (
                <div className="mb-6 animate-fade-in-down">
                    <div className="bg-emerald-500/10 text-emerald-800 px-6 py-4 rounded-xl shadow-sm border border-emerald-500/20 flex items-center gap-3">
                        <FiCheckCircle className="text-xl text-emerald-600" />
                        <p className="font-medium">{successMsg}</p>
                        <button onClick={() => setSuccessMsg('')} className="ml-auto text-emerald-600 hover:text-emerald-800">×</button>
                    </div>
                </div>
            )}

            <div className="space-y-8">
                {/* Welcome & Assistant Section - Combined for better flow */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Welcome Column */}
                    <div className="lg:col-span-1 space-y-6">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800">Bienvenido, {user?.firstName || 'Admin'}</h2>
                            <p className="text-slate-500 mt-2">Aquí tienes un resumen de lo que está pasando hoy.</p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                        <FiActivity className="text-emerald-400" size={24} />
                                    </div>
                                    <h3 className="font-semibold text-lg">Actividad Reciente</h3>
                                </div>
                                <p className="text-blue-100 text-sm mb-6">Monitoriza el rendimiento y las alertas de tu organización en tiempo real.</p>
                                <button
                                    onClick={() => navigate('/intelligence')}
                                    className="w-full py-2.5 bg-white text-blue-900 rounded-xl font-medium hover:bg-blue-50 transition-colors shadow-sm"
                                >
                                    Ir al Panel Inteligente
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Insights Grid - Now takes up more space */}
                    <section className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <FiCpu size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Alertas del Asistente</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {loadingInsights ? (
                                <div className="p-4 text-center text-slate-400 text-sm">Cargando insights...</div>
                            ) : insights.length > 0 ? (
                                insights.map((insight, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => navigate(insight.path)}
                                        className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all cursor-pointer group"
                                    >
                                        <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                            {insight.icon}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-700 group-hover:text-indigo-900 transition-colors">{insight.message}</p>
                                        </div>
                                        <div className="hidden sm:flex text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all">
                                            <span className="text-sm font-medium">Ver</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-slate-500">No hay alertas críticas por el momento.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Modules Grid */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                            Accesos Directos
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {adminModules.map((mod, idx) => (
                            <button
                                key={idx}
                                onClick={() => navigate(mod.path)}
                                className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] border border-slate-100 hover:border-indigo-100 transition-all duration-300 hover:-translate-y-1 text-left"
                            >
                                <div className={`absolute top-0 right-0 w-28 h-28 ${mod.color} opacity-[0.04] rounded-bl-full group-hover:scale-110 transition-transform duration-500`}></div>

                                <div className="flex items-start justify-between mb-5">
                                    <div className={`p-3.5 rounded-xl ${mod.color.replace('bg-', 'bg-').replace('500', '50')} ${mod.color.replace('bg-', 'text-').replace('500', '600')} group-hover:scale-110 transition-transform duration-300`}>
                                        <span className="text-2xl">{mod.icon}</span>
                                    </div>
                                </div>

                                <h4 className="text-lg font-bold text-slate-800 mb-1.5 group-hover:text-indigo-900 transition-colors">{mod.title}</h4>
                                <p className="text-sm text-slate-500 group-hover:text-slate-600 line-clamp-2">Gestionar y supervisar {mod.title.toLowerCase()} del sistema.</p>
                            </button>
                        ))}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}

export default AdminDashboard;
