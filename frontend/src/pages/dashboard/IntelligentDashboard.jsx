import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    FiUsers, FiTrendingUp, FiClock, FiDollarSign, FiBriefcase,
    FiAlertTriangle, FiArrowLeft, FiRefreshCw
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

/**
 * Dashboard Inteligente de Gestión
 * Muestra insights, análisis y recomendaciones basadas en heurísticas
 */
export default function IntelligentDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboard, setDashboard] = useState(null);
    const [departmentComparison, setDepartmentComparison] = useState(null);
    const [alerts, setAlerts] = useState(null);
    const [organizationalHealth, setOrganizationalHealth] = useState(null);
    const [employeeScoring, setEmployeeScoring] = useState(null);
    const [predictiveInsights, setPredictiveInsights] = useState(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const [
                dashboardResponse,
                deptResponse,
                alertsResponse,
                healthResponse,
                scoringResponse,
                predictionsResponse
            ] = await Promise.all([
                intelligenceService.getDashboard(),
                intelligenceService.getDepartmentComparison(),
                intelligenceService.getProactiveAlerts(),
                intelligenceService.getOrganizationalHealth(),
                intelligenceService.getEmployeeScoring(),
                intelligenceService.getPredictiveAnalytics(),
            ]);

            if (dashboardResponse.success) {
                setDashboard(dashboardResponse.data);
            } else {
                toast.error('Error al cargar el dashboard de inteligencia');
            }

            if (deptResponse.success) {
                setDepartmentComparison(deptResponse.data);
            }

            if (alertsResponse.success) {
                setAlerts(alertsResponse.data);
            }

            if (healthResponse.success) {
                setOrganizationalHealth(healthResponse.data);
            }

            if (scoringResponse.success) {
                setEmployeeScoring(scoringResponse.data);
            }

            if (predictionsResponse.success) {
                setPredictiveInsights(predictionsResponse.data);
            }
        } catch (error) {
            console.error('Error loading intelligence dashboard:', error);
            toast.error('Error al cargar el dashboard de inteligencia');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadDashboard();
        setRefreshing(false);
        toast.success('Dashboard actualizado');
    };

    const handleRecommendationAction = (recommendation) => {
        // Navegar según la categoría de la recomendación
        if (recommendation.category === 'Retención') {
            navigate('/admin/employees');
        } else if (recommendation.category === 'Desempeño') {
            navigate('/performance');
        } else if (recommendation.category === 'Asistencia') {
            navigate('/admin/reports');
        } else if (recommendation.category === 'Nómina') {
            navigate('/admin/payroll/generator');
        }
    };

    if (loading) {
        return <Loading />;
    }

    if (!dashboard) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="text-center py-12">
                    <FiAlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                    <p className="text-lg text-gray-600">No se pudo cargar el dashboard</p>
                    <button
                        onClick={loadDashboard}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    const { retention, performance, attendance, payroll, recommendations } = dashboard;

    // Preparar datos para gráficos
    const retentionChartData = [
        { name: 'Bajo Riesgo', value: retention.stats.lowRisk, color: '#16a34a' },
        { name: 'Riesgo Medio', value: retention.stats.mediumRisk, color: '#d97706' },
        { name: 'Alto Riesgo', value: retention.stats.highRisk, color: '#dc2626' },
    ];

    const departmentImpactData = attendance.departmentImpact?.map(dept => ({
        department: dept.department,
        absences: dept.totalAbsences,
        lateDays: dept.totalLateDays,
    })) || [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/admin')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <FiArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Agente Inteligente de Gestión
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Insights y recomendaciones basadas en análisis heurístico
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Actualizar
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Alertas Críticas */}
                {recommendations && recommendations.filter(r => r.priority === 'ALTA').length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 bg-red-50 border-l-4 border-red-500 rounded-lg p-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <FiAlertTriangle className="w-6 h-6 text-red-600" />
                            <h2 className="text-xl font-bold text-red-900">
                                Alertas Críticas ({recommendations.filter(r => r.priority === 'ALTA').length})
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recommendations.filter(r => r.priority === 'ALTA').map((rec, idx) => (
                                <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
                                    <h3 className="font-semibold text-gray-900 mb-2">{rec.title}</h3>
                                    <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                                    <button
                                        onClick={() => handleRecommendationAction(rec)}
                                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                                    >
                                        {rec.action} →
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Insights Clave */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Insights Clave</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Retención */}
                        <IntelligentInsightCard
                            icon={FiUsers}
                            title="Riesgo de Rotación"
                            value={retention.stats.highRisk}
                            description={`${retention.stats.highRisk} empleados en alto riesgo de rotación`}
                            color="red"
                            priority={retention.stats.highRisk > 5 ? 'high' : 'medium'}
                            onAction={() => navigate('/admin/employees')}
                        />

                        {/* Desempeño */}
                        <IntelligentInsightCard
                            icon={FiTrendingUp}
                            title="Desempeño Descendente"
                            value={performance.declining.length}
                            description={`${performance.declining.length} empleados con tendencia negativa`}
                            color="yellow"
                            priority={performance.declining.length > 3 ? 'high' : 'medium'}
                            onAction={() => navigate('/performance')}
                        />

                        {/* Alto Desempeño */}
                        <IntelligentInsightCard
                            icon={FiTrendingUp}
                            title="Alto Desempeño"
                            value={performance.highPerformers.length}
                            description="Empleados con desempeño consistentemente alto"
                            color="green"
                            priority="low"
                            onAction={() => navigate('/performance')}
                        />

                        {/* Asistencia */}
                        <IntelligentInsightCard
                            icon={FiClock}
                            title="Patrones Sospechosos"
                            value={attendance.suspiciousAbsences.length}
                            description="Patrones irregulares de ausencias detectados"
                            color="orange"
                            priority={attendance.suspiciousAbsences.length > 3 ? 'high' : 'medium'}
                            onAction={() => navigate('/admin/reports')}
                        />

                        {/* Tardanzas */}
                        <IntelligentInsightCard
                            icon={FiClock}
                            title="Tardanzas Recurrentes"
                            value={attendance.frequentLateArrivals.length}
                            description="Empleados con tardanzas frecuentes"
                            color="yellow"
                            priority="medium"
                            onAction={() => navigate('/admin/reports')}
                        />

                        {/* Nómina */}
                        <IntelligentInsightCard
                            icon={FiDollarSign}
                            title="Anomalías en Nómina"
                            value={payroll.overtimeAnomalies.length}
                            description="Horas extras fuera del rango normal"
                            color="purple"
                            priority={payroll.overtimeAnomalies.length > 5 ? 'high' : 'medium'}
                            onAction={() => navigate('/admin/payroll/generator')}
                        />
                    </div>
                </div>

                {/* Visualizaciones */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Gráfico de Riesgo de Rotación */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl shadow-lg p-6"
                    >
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            Distribución de Riesgo de Rotación
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={retentionChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {retentionChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                                                    <p className="font-semibold text-gray-900">{payload[0].name}</p>
                                                    <p className="text-sm text-gray-600">
                                                        Empleados: <span className="font-bold">{payload[0].value}</span>
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {((payload[0].value / retention.stats.total) * 100).toFixed(1)}% del total
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Gráfico de Impacto por Departamento */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-xl shadow-lg p-6"
                    >
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            Impacto de Asistencia por Departamento
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={departmentImpactData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="department" />
                                <YAxis />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                                                    <p className="font-semibold text-gray-900 mb-2">{label}</p>
                                                    {payload.map((entry, index) => (
                                                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                                                            {entry.name}: <span className="font-bold">{entry.value}</span>
                                                        </p>
                                                    ))}
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Total: {payload.reduce((sum, p) => sum + p.value, 0)} incidencias
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="absences" fill="#ef4444" name="Ausencias" />
                                <Bar dataKey="lateDays" fill="#f59e0b" name="Tardanzas" />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>
                </div>

                {/* Top Empleados en Riesgo */}
                {retention.analysis.filter(e => e.level === 'Alto Riesgo').length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl shadow-lg p-6 mb-8"
                    >
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            Empleados en Alto Riesgo de Rotación
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {retention.analysis
                                .filter(e => e.level === 'Alto Riesgo')
                                .slice(0, 6)
                                .map((emp, idx) => (
                                    <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{emp.employeeName}</h4>
                                                <p className="text-sm text-gray-600">{emp.position}</p>
                                                <p className="text-xs text-gray-500">{emp.department}</p>
                                            </div>
                                            <RiskScoreIndicator score={emp.score} level={emp.level} size="sm" />
                                        </div>
                                        <div className="space-y-1">
                                            {emp.factors.slice(0, 3).map((factor, i) => (
                                                <div key={i} className="text-xs text-gray-600 flex items-center gap-1">
                                                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                                    {factor.factor}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </motion.div>
                )}

                {/* Comparativa de Departamentos */}
                {departmentComparison && departmentComparison.departments && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mb-8"
                    >
                        <DepartmentComparison
                            departments={departmentComparison.departments}
                            summary={departmentComparison.summary}
                        />
                    </motion.div>
                )}

                {/* Predicciones y Tendencias */}
                {predictiveInsights && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mb-8"
                    >
                        <PredictiveTrendChart data={predictiveInsights} />
                    </motion.div>
                )}

                {/* Alertas Proactivas */}
                {alerts && alerts.alerts && alerts.alerts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.16 }}
                        className="mb-8"
                    >
                        <AlertsPanel
                            alerts={alerts.alerts.slice(0, 5)}
                            summary={alerts.summary}
                        />
                    </motion.div>
                )}

                {/* Salud Organizacional */}
                {organizationalHealth && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.17 }}
                        className="mb-8"
                    >
                        <HealthMeter health={organizationalHealth} />
                    </motion.div>
                )}

                {/* Top Performers - Scoring de Empleados */}
                {employeeScoring && employeeScoring.employees && employeeScoring.employees.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18 }}
                        className="mb-8"
                    >
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900">Top Performers</h3>
                                <div className="flex gap-2 text-xs">
                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                                        {employeeScoring.summary.topPerformers} Top
                                    </span>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
                                        {employeeScoring.summary.goodPerformers} Good
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {employeeScoring.employees
                                    .filter(emp => emp.category === 'Top Performer' || emp.category === 'Good Performer')
                                    .slice(0, 6)
                                    .map((employee, idx) => (
                                        <EmployeeScoreCard key={idx} employee={employee} />
                                    ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Recomendaciones */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl shadow-lg p-6"
                >
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                        Recomendaciones Priorizadas
                    </h3>
                    <RecommendationsList
                        recommendations={recommendations}
                        onActionClick={handleRecommendationAction}
                    />
                </motion.div>
            </div>
        </div>
    );
}
