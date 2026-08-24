import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getSectionsByRole } from '../../constants/modules';
import * as intelligenceService from '../../services/intelligenceService';
import api from '../../api/axios';
import SmartModuleHub from '../../components/dashboard/SmartModuleHub';

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

        const fetchPendingAndInsights = async () => {
            try {
                let pendingCount = 0;
                try {
                    const { getMyPendingEvaluations } = await import('../../services/evaluation.service');
                    const evaluations = await getMyPendingEvaluations();
                    pendingCount = evaluations.filter(e => e.status !== 'COMPLETED').length;
                    setPendingEvals(pendingCount);
                } catch (e) {
                    console.error('Error fetching pending evaluations:', e);
                }

                const response = await intelligenceService.getProactiveAlerts();
                const fetchedAlerts = (response.success && response.data && response.data.alerts)
                    ? response.data.alerts.slice(0, 4).map(alert => ({
                        type: alert.priority === 'high' ? 'warning' : 'info',
                        message: alert.message || alert.title,
                        priority: alert.priority,
                        link: '/intelligence'
                    }))
                    : [];

                if (pendingCount > 0) {
                    fetchedAlerts.unshift({
                        type: 'warning',
                        message: `Tienes ${pendingCount} evaluación${pendingCount > 1 ? 'es' : ''} de desempeño pendiente${pendingCount > 1 ? 's' : ''} por completar.`,
                        priority: 'high',
                        link: '/performance/my-evaluations'
                    });
                }

                setInsights(fetchedAlerts);
            } catch (error) {
                console.error('Error fetching dashboard insights:', error);
            } finally {
                setLoadingInsights(false);
            }
        };

        fetchDashboardData();
        fetchPendingAndInsights();
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
                    <Link
                        to="/admin/register-employee"
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors inline-flex items-center gap-1.5 shadow-xs"
                    >
                        + Nuevo Empleado
                    </Link>
                </div>
            </div>

            {/* Layout Principal de la Consola: Módulos a la izquierda, Panel Contable y Alertas a la derecha */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Columna Principal (Consola Inteligente de Módulos Operativos) */}
                <div className="lg:col-span-8 space-y-6">
                    <SmartModuleHub user={user} sections={sections} />
                </div>

                {/* Columna Lateral (Panel Contable Sobrio + Alertas) */}
                <div className="lg:col-span-4 space-y-5">
                    {/* Panel de Estado y Balance Operativo Estilo Contable */}
                    <div className="bg-white border border-gray-200 rounded overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Balance Operativo</h3>
                            <span className="text-[10px] font-mono text-gray-400">EN TIEMPO REAL</span>
                        </div>
                        <div className="divide-y divide-gray-100 font-mono text-xs">
                            <div className="px-4 py-2.5 flex items-center justify-between">
                                <span className="text-gray-600">Plantilla activa</span>
                                <span className="font-semibold text-gray-900 tabular-nums">
                                    {loadingMetrics ? '—' : `${dashboardMetrics.totalEmployees} colaboradores`}
                                </span>
                            </div>
                            <div className="px-4 py-2.5 flex items-center justify-between">
                                <span className="text-gray-600">Altas del mes</span>
                                <span className="text-gray-700 tabular-nums">
                                    {loadingMetrics ? '—' : `+${dashboardMetrics.newHires} ingresados`}
                                </span>
                            </div>
                            <div className="px-4 py-2.5 flex items-center justify-between">
                                <span className="text-gray-600">Nómina proyectada</span>
                                <span className="font-semibold text-gray-900 tabular-nums">
                                    ${loadingMetrics ? '—' : dashboardMetrics.estimatedPayroll.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                                </span>
                            </div>
                            <div className="px-4 py-2.5 flex items-center justify-between">
                                <span className="text-gray-600">Permisos por aprobar</span>
                                {dashboardMetrics.pendingAbsences > 0 ? (
                                    <Link to="/admin/absences" className="font-semibold text-amber-700 hover:underline tabular-nums">
                                        {dashboardMetrics.pendingAbsences} pendientes →
                                    </Link>
                                ) : (
                                    <span className="text-gray-400">0 pendientes</span>
                                )}
                            </div>
                            <div className="px-4 py-2.5 flex items-center justify-between">
                                <span className="text-gray-600">Vacantes activas</span>
                                {dashboardMetrics.openVacancies > 0 ? (
                                    <Link to="/recruitment" className="font-semibold text-blue-600 hover:underline tabular-nums">
                                        {dashboardMetrics.openVacancies} abiertas →
                                    </Link>
                                ) : (
                                    <span className="text-gray-400">0 abiertas</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Alertas del Sistema */}
                    <div className="bg-white border border-gray-200 rounded overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Alertas del Sistema</h3>
                            <Link to="/intelligence" className="text-[11px] text-blue-600 hover:underline font-medium">Ver panel →</Link>
                        </div>
                        <div className="p-4">
                            {loadingInsights ? (
                                <div className="py-4 text-center text-gray-400 text-xs font-mono">Cargando alertas...</div>
                            ) : insights.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {insights.map((insight, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => navigate(insight.link || '/intelligence')}
                                            className="py-2.5 flex items-start gap-2.5 cursor-pointer hover:bg-gray-50/60 transition-colors px-1 rounded"
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${insight.priority === 'high' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-gray-800 line-clamp-2 leading-relaxed">{insight.message}</p>
                                                <span className="text-[11px] text-blue-600 font-medium mt-0.5 block">Atender solicitud →</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-4 text-center text-xs">
                                    <p className="font-medium text-gray-700">Sin alertas pendientes</p>
                                    <p className="text-gray-400 text-[11px] mt-0.5">La operación se encuentra al día.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
