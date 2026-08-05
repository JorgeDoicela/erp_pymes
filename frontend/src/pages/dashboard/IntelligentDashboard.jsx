import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    FiUsers, FiTrendingUp, FiClock, FiDollarSign, FiBriefcase,
    FiAlertTriangle, FiArrowLeft, FiRefreshCw, FiSliders, FiCpu, FiPrinter, FiActivity
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import * as intelligenceService from '../../services/intelligenceService.js';
import IntelligentInsightCard from '../../components/IntelligentInsightCard.jsx';
import RecommendationsList from '../../components/RecommendationsList.jsx';
import RiskScoreIndicator from '../../components/RiskScoreIndicator.jsx';
import DepartmentComparison from '../../components/DepartmentComparison.jsx';
import AlertsPanel from '../../components/AlertsPanel.jsx';
import HealthMeter from '../../components/HealthMeter.jsx';
import EmployeeScoreCard from '../../components/EmployeeScoreCard.jsx';
import PredictiveTrendChart from '../../components/PredictiveTrendChart.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import ExecutiveKPIBanner from '../../components/ExecutiveKPIBanner.jsx';
import WhatIfScenarioSimulator from '../../components/WhatIfScenarioSimulator.jsx';
import StrategicAIAdvisor from '../../components/StrategicAIAdvisor.jsx';
import ExecutiveReportModal from '../../components/ExecutiveReportModal.jsx';
import AdvancedBusinessAnalytics from '../../components/AdvancedBusinessAnalytics.jsx';


/**
 * Dashboard Inteligente de Gestión
 * Muestra insights, análisis y recomendaciones inteligentes para directivos
 */
export default function IntelligentDashboard({ user, onLogout }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false); // Fix #11: refresh no-destructivo
    const [error, setError] = useState(null);
    const [dashboard, setDashboard] = useState(null);
    const [departmentComparison, setDepartmentComparison] = useState(null);
    const [alerts, setAlerts] = useState(null);
    const [organizationalHealth, setOrganizationalHealth] = useState(null);
    const [employeeScoring, setEmployeeScoring] = useState(null);
    const [predictiveInsights, setPredictiveInsights] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null); // Fix #21: timestamp
    const [isReportOpen, setIsReportOpen] = useState(false);
    // Estado para las pestañas
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Resumen Estratégico & ROI', icon: FiTrendingUp },
        { id: 'analytics', label: 'Proyección & Algoritmos', icon: FiActivity },
        { id: 'simulator', label: 'Simulador de Escenarios', icon: FiSliders },
        { id: 'ai_advisor', label: 'Asistente IA Consultor', icon: FiCpu },
        { id: 'talent', label: 'Talento y Desempeño', icon: FiUsers },
        { id: 'alerts', label: 'Alertas y Acciones', icon: FiAlertTriangle },
        { id: 'organization', label: 'Organización', icon: FiBriefcase },
    ];

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async (forceRefresh = false) => {
        try {
            // Fix #11: solo usar setLoading en la carga inicial, no en refresh
            if (!forceRefresh) setLoading(true);
            setError(null);
            const dashboardResponse = await intelligenceService.getDashboard(forceRefresh);

            if (dashboardResponse?.success && dashboardResponse?.data) {
                const data = dashboardResponse.data;
                setDashboard(data);
                if (data.departmentComparison) setDepartmentComparison(data.departmentComparison);
                if (data.proactiveAlerts) setAlerts(data.proactiveAlerts);
                if (data.organizationalHealth) setOrganizationalHealth(data.organizationalHealth);
                if (data.employeeScoring) setEmployeeScoring(data.employeeScoring);
                if (data.predictiveAnalytics) setPredictiveInsights(data.predictiveAnalytics);
                setLastUpdated(new Date()); // Fix #21
            } else {
                const errMsg = dashboardResponse?.message || 'Error al obtener los datos del servidor';
                setError(errMsg);
                toast.error(errMsg);
            }
        } catch (err) {
            console.error('Error loading intelligence dashboard:', err);
            const message = err?.response?.data?.message || err?.message || 'No se pudo conectar con el servidor de inteligencia.';
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            // Fix #11: forceRefresh=true, loading queda false para no desmontar el contenido
            await loadDashboard(true);
            toast.success('Dashboard actualizado con éxito');
        } catch (err) {
            toast.error('Error al actualizar el dashboard');
        } finally {
            setRefreshing(false);
        }
    };

    // Fix #21: calcula texto relativo del timestamp
    const getRelativeTime = (date) => {
        if (!date) return null;
        const diffMs = Date.now() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'hace unos segundos';
        if (diffMin === 1) return 'hace 1 minuto';
        if (diffMin < 60) return `hace ${diffMin} min`;
        return `hace ${Math.floor(diffMin / 60)}h`;
    };

    if (loading) {
        return <Loading />;
    }

    if (error || (!dashboard && !loading)) {
        return (
            <div className="p-6">
                <ErrorState
                    title="Error de Inteligencia Predictiva"
                    message={error || "No se pudieron cargar los algoritmos de análisis."}
                    onRetry={() => loadDashboard(true)}
                />
            </div>
        );
    }

    const retention = dashboard?.retention || { stats: { lowRisk: 0, mediumRisk: 0, highRisk: 0 }, analysis: [] };
    const performance = dashboard?.performance || { declining: [] };
    const attendance = dashboard?.attendance || { suspiciousAbsences: [], departmentImpact: [] };
    const payroll = dashboard?.payroll || {};
    const recommendations = dashboard?.recommendations || [];

    // Preparar datos para gráficos
    const retentionChartData = [
        { name: 'Bajo Riesgo', value: retention.stats.lowRisk, color: '#10B981' }, // emerald-500
        { name: 'Riesgo Medio', value: retention.stats.mediumRisk, color: '#F59E0B' }, // amber-500
        { name: 'Alto Riesgo', value: retention.stats.highRisk, color: '#EF4444' }, // red-500
    ];

    const departmentImpactData = attendance.departmentImpact?.map(dept => ({
        department: dept.department,
        absences: dept.totalAbsences,
        lateDays: dept.totalLateDays,
    })) || [];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <>
            <motion.div
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Page Controls & Tabs */}
                <motion.div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4" variants={itemVariants}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/admin')}
                                className="p-2 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-lg transition-all text-slate-500 hover:text-slate-700"
                            >
                                <FiArrowLeft className="w-5 h-5" />
                            </motion.button>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800 tracking-tight">Centro Predictivo</h1>
                                <p className="text-sm text-slate-500">Análisis predictivo y recomendaciones</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsReportOpen(true)}
                                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-sm font-semibold flex items-center gap-2 shadow-sm"
                            >
                                <FiPrinter className="w-4 h-4" />
                                Informe Ejecutivo (PDF)
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className={`px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all text-sm font-medium flex items-center gap-2 shadow-sm ${refreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                {refreshing ? 'Actualizando...' : 'Actualizar Datos'}
                            </motion.button>
                        </div>
                    </div>

                    {/* Fix #21: Timestamp de última actualización */}
                    {lastUpdated && (
                        <p className="text-xs text-slate-400 mt-2 text-right">
                            Actualizado {getRelativeTime(lastUpdated)}
                        </p>
                    )}

                    {/* Navegación por Pestañas */}
                    <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide border-b border-slate-100">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <motion.button
                                    key={tab.id}
                                    whileHover={{ y: -1 }}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap
                                        ${isActive
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                                    `}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                    {tab.label}
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Contenido de Pestañas */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    variants={itemVariants}
                >
                    {/* TAB 1: RESUMEN ESTRATÉGICO & ROI */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Banner Ejecutivo de Impacto Financiero y ROI */}
                            <ExecutiveKPIBanner financialImpact={dashboard?.financialImpact} />

                            {/* Predicción (Full Width) */}
                            {predictiveInsights && (
                                <PredictiveTrendChart data={predictiveInsights} />
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Salud Organizacional */}
                                {organizationalHealth && (
                                    <HealthMeter health={organizationalHealth} />
                                )}

                                {/* Insights Rápidos */}
                                <div className="space-y-4">
                                    <IntelligentInsightCard
                                        icon={FiUsers}
                                        title="Riesgo de Rotación"
                                        value={retention.stats.highRisk}
                                        description={`${retention.stats.highRisk} empleados en riesgo alto`}
                                        color="red"
                                        priority={retention.stats.highRisk > 5 ? 'high' : 'medium'}
                                        onAction={() => setActiveTab('talent')}
                                    />
                                    <IntelligentInsightCard
                                        icon={FiTrendingUp}
                                        title="Desempeño Crítico"
                                        value={performance.declining.length}
                                        description={`${performance.declining.length} tendencias negativas`}
                                        color="yellow"
                                        priority={performance.declining.length > 3 ? 'high' : 'medium'}
                                        onAction={() => setActiveTab('talent')}
                                    />
                                    <IntelligentInsightCard
                                        icon={FiClock}
                                        title="Ausencias Atípicas"
                                        value={attendance.suspiciousAbsences.length}
                                        description="Patrones irregulares detectados"
                                        color="orange"
                                        priority={attendance.suspiciousAbsences.length > 3 ? 'high' : 'medium'}
                                        onAction={() => setActiveTab('organization')}
                                    />
                                    {/* Fix #15: Anomalías de nómina */}
                                    {payroll.overtimeAnomalies && payroll.overtimeAnomalies.length > 0 && (
                                        <IntelligentInsightCard
                                            icon={FiDollarSign}
                                            title="Anomalías de Nómina"
                                            value={payroll.overtimeAnomalies.length}
                                            description="Empleados con horas extras atípicas"
                                            color="purple"
                                            priority="medium"
                                            onAction={() => setActiveTab('alerts')}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: PROYECCIÓN & ALGORITMOS DE NEGOCIO */}
                    {activeTab === 'analytics' && (
                        <AdvancedBusinessAnalytics data={dashboard} />
                    )}

                    {/* TAB: SIMULADOR DE ESCENARIOS (WHAT-IF) */}
                    {activeTab === 'simulator' && (
                        <WhatIfScenarioSimulator initialData={dashboard} />
                    )}

                    {/* TAB: ASISTENTE IA CONSULTOR ESTRATÉGICO */}
                    {activeTab === 'ai_advisor' && (
                        <StrategicAIAdvisor dashboardData={dashboard} />
                    )}

                    {/* TAB 2: TALENTO Y DESEMPEÑO */}
                    {activeTab === 'talent' && (
                        <div className="space-y-8">
                            {/* Top Performers */}
                            {employeeScoring && employeeScoring.employees && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold text-slate-800">Talento Top &amp; Desempeño</h3>
                                        <span className="text-sm text-slate-500">Scoring Multidimensional</span>
                                    </div>
                                    {/* Fix #14: estado vacío si no hay top performers */}
                                    {employeeScoring.employees.filter(e => e.category === 'Top Performer' || e.category === 'Good Performer').length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {employeeScoring.employees
                                                .filter(emp => emp.category === 'Top Performer' || emp.category === 'Good Performer')
                                                .slice(0, 6)
                                                .map((employee, idx) => (
                                                    <EmployeeScoreCard key={idx} employee={employee} />
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-xl text-slate-400">
                                            <FiUsers className="w-10 h-10 mb-3" />
                                            <p className="text-sm font-medium">Sin empleados en categoría Top o Good Performer</p>
                                            <p className="text-xs mt-1">Todos los empleados están en categoría &apos;Needs Improvement&apos; o &apos;At Risk&apos;</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Análisis de Riesgo detallado */}
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 mb-4">Análisis de Riesgo de Rotación</h3>
                                {/* Fix #20: estado vacío si no hay empleados en riesgo */}
                                {retention.analysis.filter(e => e.level === 'Alto Riesgo' || e.level === 'Riesgo Medio').length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {retention.analysis
                                            .filter(e => e.level === 'Alto Riesgo' || e.level === 'Riesgo Medio')
                                            .map((emp, idx) => (
                                                <div key={idx} className={`bg-white border-l-4 ${emp.level === 'Alto Riesgo' ? 'border-red-500' : 'border-yellow-400'} rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h4 className="font-bold text-slate-900">{emp.employeeName}</h4>
                                                            <p className="text-sm text-slate-600">{emp.position}</p>
                                                        </div>
                                                        <RiskScoreIndicator score={emp.score} level={emp.level} size="sm" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        {emp.factors.slice(0, 3).map((factor, i) => (
                                                            <div key={i} className="text-xs text-red-600 flex items-center gap-2">
                                                                <FiAlertTriangle className="w-3 h-3 shrink-0" />
                                                                {factor.factor}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 bg-green-50 rounded-xl text-green-600">
                                        <FiTrendingUp className="w-10 h-10 mb-3" />
                                        <p className="text-sm font-medium">¡Excelente! Ningún empleado en riesgo alto o medio de rotación.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: ALERTAS Y ACCIONES */}
                    {activeTab === 'alerts' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Panel de Alertas (2 columnas) */}
                            <div className="lg:col-span-2">
                                {alerts && alerts.alerts && (
                                    <AlertsPanel
                                        alerts={alerts.alerts}
                                        summary={alerts.summary}
                                        onAlertAction={(alert) => {
                                            // Fix #16: navegar según el tipo de alerta
                                            const routes = {
                                                RETENTION: '/admin/employees',
                                                PERFORMANCE: '/admin/performance',
                                                ATTENDANCE: '/admin/attendance',
                                                DEPARTMENT: '/intelligence',
                                            };
                                            const route = routes[alert.type];
                                            if (route) navigate(route);
                                        }}
                                    />
                                )}
                            </div>

                            {/* Recomendaciones (1 columna) */}
                            <div>
                                <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24 border border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4">Recomendaciones Priorizadas</h3>
                                    <RecommendationsList
                                        recommendations={recommendations}
                                        onActionClick={(rec) => {
                                            if (rec.route) {
                                                navigate(rec.route);
                                            } else if (rec.category === 'Nómina') {
                                                navigate('/admin/payroll/generator');
                                            } else if (rec.category === 'Retención') {
                                                navigate('/admin/employees');
                                            } else if (rec.category === 'Desempeño' || rec.category === 'Objetivos') {
                                                navigate('/admin/performance');
                                            } else if (rec.category === 'Asistencia') {
                                                navigate('/admin/attendance');
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: ORGANIZACIÓN */}
                    {activeTab === 'organization' && (
                        <div className="space-y-6">
                            {/* Comparativa de Departamentos */}
                            {departmentComparison && (
                                <DepartmentComparison
                                    departments={departmentComparison.departments}
                                    summary={departmentComparison.summary}
                                />
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Gráfico de Impacto Asistencia */}
                                <div className="bg-white p-6 rounded-xl shadow-lg">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Impacto de Ausentismo</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={departmentImpactData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="department" />
                                                <YAxis />
                                                <Tooltip />
                                                <Bar dataKey="absences" name="Ausencias" fill="#f97316" />
                                                <Bar dataKey="lateDays" name="Retrasos" fill="#eab308" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Gráfico de Riesgo Global */}
                                <div className="bg-white p-6 rounded-xl shadow-lg">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Distribución de Riesgo Global</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={retentionChartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {retentionChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>

            {/* Modal de Informe Ejecutivo Imprimible */}
            <ExecutiveReportModal
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                data={dashboard}
            />
        </>
    );
}
