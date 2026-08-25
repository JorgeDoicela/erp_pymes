import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    FiUsers, FiTrendingUp, FiClock, FiDollarSign, FiBriefcase,
    FiAlertTriangle, FiArrowLeft, FiSliders, FiActivity
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import * as intelligenceService from '../../services/intelligenceService.js';
import useAutoSync from '../../hooks/useAutoSync.js';
import IntelligentInsightCard from '../../components/IntelligentInsightCard.jsx';
import RiskScoreIndicator from '../../components/RiskScoreIndicator.jsx';
import DepartmentComparison from '../../components/DepartmentComparison.jsx';
import HealthMeter from '../../components/HealthMeter.jsx';
import EmployeeScoreCard from '../../components/EmployeeScoreCard.jsx';
import PredictiveTrendChart from '../../components/PredictiveTrendChart.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import ExecutiveKPIBanner from '../../components/ExecutiveKPIBanner.jsx';
import WhatIfScenarioSimulator from '../../components/WhatIfScenarioSimulator.jsx';
import DataQualityPanel from './components/DataQualityPanel.jsx';
import ExecutiveReportModal from '../../components/ExecutiveReportModal.jsx';
import AdvancedBusinessAnalytics from '../../components/AdvancedBusinessAnalytics.jsx';
import MethodologyModal from '../../components/MethodologyModal.jsx';



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
    const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    
    // Pestañas disponibles (5 Pestañas Cuantitativas y Rigor Estadístico)
    const tabs = [
        { id: 'overview', label: 'Resumen Ejecutivo de Negocio', icon: FiTrendingUp },
        { id: 'analytics', label: 'Tendencias y Proyecciones', icon: FiActivity },
        { id: 'simulator', label: 'Simulador de Escenarios', icon: FiSliders },
        { id: 'talent', label: 'Talento y Desempeño', icon: FiUsers },
        { id: 'organization', label: 'Organización', icon: FiBriefcase },
    ];

    // Estado de pestañas sincronizado con la URL
    const [searchParams, setSearchParams] = useSearchParams();
    const currentTabParam = searchParams.get('tab') || 'overview';
    const activeTab = tabs.some(t => t.id === currentTabParam) ? currentTabParam : 'overview';

    const handleTabChange = (tabId) => {
        setSearchParams({ tab: tabId });
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async (forceRefresh = false) => {
        try {
            if (!dashboard) setLoading(true);
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
                setLastUpdated(new Date());
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

    const handleExportDataset = async (format = 'csv') => {
        try {
            setIsExporting(true);
            toast.loading(`Generando dataset académico anonimizado (${format.toUpperCase()})...`, { id: 'export-toast' });
            await intelligenceService.exportAcademicDataset(format);
            toast.success(`Dataset académico (${format.toUpperCase()}) descargado con éxito`, { id: 'export-toast' });
        } catch (err) {
            console.error('Error al exportar dataset:', err);
            toast.error('No se pudo descargar el dataset académico', { id: 'export-toast' });
        } finally {
            setIsExporting(false);
        }
    };

    // Auto-sincronización en segundo plano cada 30 segundos y al cambiar de pestaña
    const { lastSynced, isSyncing, triggerSync } = useAutoSync(
        () => loadDashboard(true),
        { intervalMs: 30000 }
    );

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
                {/* Barra de Control Compacta (sin duplicar título del header global) */}
                <motion.div
                    className="flex flex-col gap-3"
                    variants={itemVariants}
                >
                    {/* Fila superior: botón volver + acciones */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/admin')}
                                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
                                title="Volver al panel"
                            >
                                <FiArrowLeft className="w-4 h-4" />
                            </button>
                            <div>
                                <p className="text-xs text-slate-500">Análisis predictivo y recomendaciones</p>
                                {lastUpdated && (
                                    <p className="text-[11px] text-slate-400">
                                        Actualizado {getRelativeTime(lastUpdated)}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={() => setIsMethodologyOpen(true)}
                                className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 rounded text-xs font-medium cursor-pointer transition-colors"
                                title="Ver Ficha Metodológica de Modelos Estadísticos"
                            >
                                <span className="hidden sm:inline">Ficha Metodológica</span>
                            </button>

                            <div className="relative group">
                                <button
                                    disabled={isExporting}
                                    className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 rounded text-xs font-medium cursor-pointer transition-colors disabled:opacity-50"
                                >
                                    <span>Exportar Dataset</span>
                                </button>
                                <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-white border border-gray-200 rounded shadow-xl py-1 z-50 min-w-[160px]">
                                    <button
                                        onClick={() => handleExportDataset('csv')}
                                        className="px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 font-medium cursor-pointer"
                                    >
                                        Descargar CSV
                                    </button>
                                    <button
                                        onClick={() => handleExportDataset('json')}
                                        className="px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 font-medium cursor-pointer"
                                    >
                                        Descargar JSON
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsReportOpen(true)}
                                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded cursor-pointer transition-colors"
                            >
                                Informes PDF
                            </button>
                        </div>
                    </div>

                    {/* Navegación por pestañas ERP (Tab bar horizontal con borde inferior activo 2px #111827) */}
                    <div className="flex border-b border-gray-200 overflow-x-auto gap-6 text-xs mt-2">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <Link
                                    key={tab.id}
                                    to={`/intelligence?tab=${tab.id}`}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`pb-2.5 font-medium transition-colors whitespace-nowrap cursor-pointer no-underline ${
                                        isActive
                                            ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                                            : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    {tab.label}
                                </Link>
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
                        <div className="space-y-6 w-full min-w-0">
                            {/* Panel de Calidad de Datos — muestra completitud real para IA */}
                            <DataQualityPanel />

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
                                        onAction={() => handleTabChange('talent')}
                                    />
                                    <IntelligentInsightCard
                                        icon={FiTrendingUp}
                                        title="Desempeño Crítico"
                                        value={performance.declining.length}
                                        description={`${performance.declining.length} tendencias negativas`}
                                        color="yellow"
                                        priority={performance.declining.length > 3 ? 'high' : 'medium'}
                                        onAction={() => handleTabChange('talent')}
                                    />
                                    <IntelligentInsightCard
                                        icon={FiClock}
                                        title="Ausencias Atípicas"
                                        value={attendance.suspiciousAbsences.length}
                                        description="Patrones irregulares detectados"
                                        color="orange"
                                        priority={attendance.suspiciousAbsences.length > 3 ? 'high' : 'medium'}
                                        onAction={() => handleTabChange('organization')}
                                    />
                                    {/* Anomalías de nómina */}
                                    {payroll.overtimeAnomalies && payroll.overtimeAnomalies.length > 0 && (
                                         <IntelligentInsightCard
                                             icon={FiDollarSign}
                                             title="Anomalías de Nómina"
                                             value={payroll.overtimeAnomalies.length}
                                             description="Empleados con horas extras atípicas"
                                             color="purple"
                                             priority="medium"
                                             onAction={() => handleTabChange('analytics')}
                                         />
                                     )}
                                 </div>
                             </div>
                         </div>
                     )}

                     {/* TAB 2: PROYECCIÓN & ALGORITMOS DE NEGOCIO */}
                     {activeTab === 'analytics' && (
                         <AdvancedBusinessAnalytics data={dashboard} />
                     )}

                     {/* TAB 3: SIMULADOR DE ESCENARIOS (WHAT-IF) */}
                     {activeTab === 'simulator' && (
                         <WhatIfScenarioSimulator initialData={dashboard} />
                     )}

                     {/* TAB 4: TALENTO Y DESEMPEÑO */}
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

                     {/* TAB 5: ORGANIZACIÓN */}
                     {activeTab === 'organization' && (
                        <div className="space-y-6">
                            {/* Comparativa de Departamentos */}
                            {departmentComparison && (
                                <DepartmentComparison
                                    departments={departmentComparison.departments}
                                    summary={departmentComparison.summary}
                                    anova={departmentComparison.anova}
                                    pairwiseTTest={departmentComparison.pairwiseTTest}
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

            {/* Modal de Ficha Metodológica de Modelos Estadísticos */}
            <MethodologyModal
                isOpen={isMethodologyOpen}
                onClose={() => setIsMethodologyOpen(false)}
            />
        </>
    );
}
