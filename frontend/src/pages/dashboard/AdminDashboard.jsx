import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getSectionsByRole } from '../../constants/modules';
import * as intelligenceService from '../../services/intelligenceService';
import api from '../../api/axios';

function AdminDashboard({ user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [successMsg, setSuccessMsg] = useState('');
    const [insights, setInsights] = useState([]);
    const [loadingInsights, setLoadingInsights] = useState(true);
    const [pendingEvals, setPendingEvals] = useState(0);

    const [dashboardMetrics, setDashboardMetrics] = useState({
        totalEmployees: 0,
        newHires: 0,
        openVacancies: 0,
        estimatedPayroll: 0,
        pendingAbsences: 0
    });
    const [loadingMetrics, setLoadingMetrics] = useState(true);

    const sections = getSectionsByRole(user);

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

                let totalEmployees = 0, newHires = 0, openVacancies = 0, estimatedPayroll = 0, pendingAbsences = 0;

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
                    const mappedInsights = response.data.alerts.slice(0, 4).map(alert => ({
                        type: alert.priority === 'high' ? 'warning' : 'info',
                        message: alert.message || alert.title,
                        priority: alert.priority
                    }));
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
        <div className="space-y-5">
            {successMsg && (
                <div className="p-3 bg-green-50 border border-green-200 rounded text-xs text-green-800 flex justify-between items-center">
                    <span className="font-medium">{successMsg}</span>
                    <button onClick={() => setSuccessMsg('')} className="text-green-700 hover:text-green-900 ml-4">×</button>
                </div>
            )}

            {/* Header ERP Limpio */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Panel Principal · Administración</p>
                    <h1 className="text-xl font-semibold text-gray-900">Consola de Administración</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Bienvenido, {user?.firstName || 'Administrador'}. Gestión integral de colaboradores, nómina y talento.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {pendingEvals > 0 && (
                        <Link
                            to="/performance/my-evaluations"
                            className="px-3.5 py-2 border border-amber-200 bg-amber-50 text-amber-800 text-xs font-medium rounded transition-colors inline-flex items-center gap-1.5 hover:bg-amber-100"
                        >
                            <span className="w-4 h-4 bg-amber-600 text-white text-[9px] flex items-center justify-center rounded-full font-mono">{pendingEvals}</span>
                            Evaluaciones Pendientes
                        </Link>
                    )}
                    <Link
                        to="/admin/register-employee"
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors inline-flex items-center gap-1.5"
                    >
                        + Nuevo Empleado
                    </Link>
                </div>
            </div>

            {/* Panel Contable de Métricas Operativas */}
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Resumen Operativo</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100 text-xs">
                    <div className="p-4">
                        <p className="text-gray-500 mb-1">Plantilla Activa</p>
                        <p className="text-base font-semibold text-gray-900 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                            {loadingMetrics ? '—' : dashboardMetrics.totalEmployees}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5 font-mono">+{dashboardMetrics.newHires} este mes</p>
                    </div>
                    <div className="p-4">
                        <p className="text-gray-500 mb-1">Nómina Estimada</p>
                        <p className="text-base font-semibold text-gray-900 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                            ${loadingMetrics ? '—' : dashboardMetrics.estimatedPayroll.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Proyección contractual</p>
                    </div>
                    <div className="p-4">
                        <p className="text-gray-500 mb-1">Permisos por Aprobar</p>
                        <p className="text-base font-semibold font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums', color: dashboardMetrics.pendingAbsences > 0 ? '#92400e' : '#111827' }}>
                            {loadingMetrics ? '—' : dashboardMetrics.pendingAbsences}
                        </p>
                        <Link to="/admin/absences" className="text-[11px] text-blue-600 hover:underline mt-0.5 block">Revisar solicitudes →</Link>
                    </div>
                    <div className="p-4">
                        <p className="text-gray-500 mb-1">Vacantes Abiertas</p>
                        <p className="text-base font-semibold text-gray-900 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                            {loadingMetrics ? '—' : dashboardMetrics.openVacancies}
                        </p>
                        <Link to="/recruitment" className="text-[11px] text-blue-600 hover:underline mt-0.5 block">Ver reclutamiento →</Link>
                    </div>
                </div>
            </div>

            {/* Alertas Operativas — Panel ERP */}
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Alertas e Inteligencia Operativa</h3>
                    <Link to="/intelligence" className="text-[11px] text-blue-600 hover:underline">Ver panel completo →</Link>
                </div>
                <div className="p-4">
                    {loadingInsights ? (
                        <div className="py-6 text-center text-gray-400 text-xs">Cargando alertas del sistema...</div>
                    ) : insights.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {insights.map((insight, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => navigate('/intelligence')}
                                    className="py-3 flex items-start gap-3 cursor-pointer hover:bg-gray-50/60 transition-colors px-1 rounded"
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${insight.priority === 'high' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                    <div>
                                        <p className="text-xs text-gray-800 line-clamp-2">{insight.message}</p>
                                        <span className="text-[11px] text-blue-600 font-medium mt-0.5 block">Ver detalle →</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-xs">
                            <p className="font-medium text-gray-700">Sin alertas pendientes</p>
                            <p className="text-gray-400 mt-0.5">Toda la operación se encuentra al día.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Módulos — Grilla ERP */}
            <div className="space-y-6">
                {sections.map((section, sIdx) => {
                    const filteredModules = section.modules.filter(m => m.path !== '/admin' && m.path !== '/empleado' && m.path !== '/superadmin/dashboard');
                    if (filteredModules.length === 0) return null;
                    return (
                        <div key={sIdx}>
                            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{section.title}</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                                {filteredModules.map((mod, idx) => (
                                    <Link
                                        key={idx}
                                        to={mod.path}
                                        className="flex flex-col items-center justify-center p-4 bg-white rounded border border-gray-200 hover:border-gray-300 transition-colors group h-28 text-center cursor-pointer"
                                    >
                                        <div className="text-gray-400 group-hover:text-gray-600 transition-colors mb-2 text-lg">
                                            {mod.icon}
                                        </div>
                                        <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900 leading-tight">{mod.title}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default AdminDashboard;
