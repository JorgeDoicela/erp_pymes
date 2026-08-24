import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboardData } from '../../services/analytics.service';
import {
    FiDollarSign, FiLayers,
    FiBarChart2, FiUserMinus, FiActivity, FiDatabase, FiFileText,
    FiCpu, FiGitPullRequest, FiShare2, FiTarget, FiArrowUpRight, FiZap
} from 'react-icons/fi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell
} from 'recharts';

const OPERATIONAL_REPORTS = [
    {
        id: 'reports',
        title: 'Reportes de Asistencia',
        path: '/admin/reports',
        category: 'Control de Jornada',
        icon: <FiFileText className="w-5 h-5 text-blue-600" />,
        badge: 'Operativo',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        desc: 'Marcaciones biométricas, horas efectivas, atrasos justificados y horas extras.'
    },
    {
        id: 'turnover',
        title: 'Rotación de Personal',
        path: '/analytics/turnover',
        category: 'Retención de Talento',
        icon: <FiUserMinus className="w-5 h-5 text-rose-600" />,
        badge: 'Gestión',
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        desc: 'Tasas de salida voluntaria/involuntaria, antigüedad promedio y motivos de desvinculación.'
    },
    {
        id: 'performance',
        title: 'Rendimiento y Desempeño',
        path: '/analytics/performance',
        category: 'Evaluación y Metas',
        icon: <FiBarChart2 className="w-5 h-5 text-indigo-600" />,
        badge: 'Estratégico',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        desc: 'Resultados de evaluaciones por competencias, cumplimiento de KPIs y mapa de talento.'
    },
    {
        id: 'payroll_costs',
        title: 'Costos Salariales & Masa Salarial',
        path: '/analytics/payroll-costs',
        category: 'Finanzas RRHH',
        icon: <FiDollarSign className="w-5 h-5 text-emerald-600" />,
        badge: 'Financiero',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        desc: 'Distribución de masa salarial por departamento, beneficios sociales y provisiones de ley.'
    },
    {
        id: 'satisfaction',
        title: 'Clima Laboral & Satisfacción',
        path: '/analytics/satisfaction',
        category: 'Cultura y Clima',
        icon: <FiActivity className="w-5 h-5 text-purple-600" />,
        badge: 'Encuestas',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        desc: 'Índices de satisfacción interna, prevención de burnout y eNPS organizacional.'
    }
];

const AI_MODELS = [
    {
        id: 'rsi',
        title: 'Calibración RSI (Robust Stability Index)',
        path: '/analytics/rsi-optimization',
        category: 'Estabilidad Organizacional',
        icon: <FiCpu className="w-5 h-5 text-emerald-600" />,
        badge: 'MCMC / Bayesiano',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        desc: 'Calibración estocástica de índices de salud organizacional con intervalos de credibilidad del 95%.'
    },
    {
        id: 'causal',
        title: 'Inferencia Causal (Do-Calculus)',
        path: '/analytics/causal-inference',
        category: 'Simulación de Políticas',
        icon: <FiGitPullRequest className="w-5 h-5 text-blue-600" />,
        badge: 'Causal AI',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        desc: 'Estimación contrafactual del impacto real de incrementos salariales y teletrabajo en la retención.'
    },
    {
        id: 'federated',
        title: 'Benchmarking & Aprendizaje Federado',
        path: '/analytics/federated-learning',
        category: 'Comparativa de Mercado',
        icon: <FiShare2 className="w-5 h-5 text-teal-600" />,
        badge: 'Differential Privacy',
        badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
        desc: 'Comparación sectorial con empresas pares preservando el 100% de la privacidad de datos salariales.'
    },
    {
        id: 'morl',
        title: 'Optimización Multiobjetivo (MORL)',
        path: '/analytics/morl-pareto',
        category: 'Optimización Presupuestaria',
        icon: <FiTarget className="w-5 h-5 text-amber-600" />,
        badge: 'Pareto Front',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        desc: 'Cálculo de compensación óptima en la frontera de Pareto entre costo empresarial y riesgo de fuga.'
    },
    {
        id: 'temporal',
        title: 'Temporal Attention (12 Meses)',
        path: '/analytics/temporal-attention',
        category: 'Deep Learning Secuencial',
        icon: <FiZap className="w-5 h-5 text-purple-600" />,
        badge: 'Attention Mechanism',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        desc: 'Redes con mecanismo de atención temporal sobre historial de asistencia, desempeño y feedback continuo.'
    },
    {
        id: 'ft_transformer',
        title: 'FT-Transformer Tabular',
        path: '/analytics/ft-transformer',
        category: 'Transformer Tabular',
        icon: <FiLayers className="w-5 h-5 text-indigo-600" />,
        badge: 'Feature Tokenizer',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        desc: 'Arquitectura transformer de última generación adaptada para la detección temprana de anomalías en nómina.'
    }
];

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

const AnalyticsDashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Pestaña activa del directorio: 'operational' | 'ai'
    const [activeTab, setActiveTab] = useState('operational');
    const [selectedDept, setSelectedDept] = useState('ALL');

    useEffect(() => {
        let isMounted = true;
        getDashboardData()
            .then(result => {
                if (isMounted) setData(result);
            })
            .catch(error => {
                console.error('Error cargando analíticas:', error);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, []);

    // Departamentos disponibles
    const departments = useMemo(() => {
        if (!data?.charts?.deptChartData) return [];
        return data.charts.deptChartData.map(d => d.name).filter(Boolean);
    }, [data]);

    // Filtrar datos de dotación por departamento
    const filteredDeptData = useMemo(() => {
        if (!data?.charts?.deptChartData) return [];
        if (selectedDept === 'ALL') return data.charts.deptChartData;
        return data.charts.deptChartData.filter(d => d.name === selectedDept);
    }, [data, selectedDept]);

    // Filtrar datos de vacantes por departamento
    const filteredVacancyData = useMemo(() => {
        if (!data?.charts?.vacancyChartData) return [];
        if (selectedDept === 'ALL') return data.charts.vacancyChartData;
        return data.charts.vacancyChartData.filter(d => d.name === selectedDept);
    }, [data, selectedDept]);

    // Filtrar datos de masa salarial por departamento
    const filteredPayrollData = useMemo(() => {
        if (!data?.charts?.payrollByDeptChartData) return [];
        if (selectedDept === 'ALL') return data.charts.payrollByDeptChartData;
        return data.charts.payrollByDeptChartData.filter(d => d.name === selectedDept);
    }, [data, selectedDept]);

    if (loading) {
        return (
            <div className="p-12 text-center text-gray-400 text-xs font-mono">
                Cargando indicadores de analítica y gestión...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Limpio ERP con Filtros y Resumen Integrado */}
            <div className="pb-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                        Analítica · Control de Gestión
                    </p>
                    <h1 className="text-xl font-semibold text-gray-900">Panel de Analíticas y Reportes</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Estructura organizativa, distribución de presupuesto salarial y acceso a informes de gestión.
                    </p>
                </div>

                {/* Filtros Globales y Exportación */}
                <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                    <select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                    >
                        <option value="ALL">Todos los Departamentos</option>
                        {departments.map((dept, i) => (
                            <option key={i} value={dept}>{dept}</option>
                        ))}
                    </select>

                    <Link
                        to="/analytics/custom"
                        className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 text-xs font-medium rounded transition-colors flex items-center gap-1.5"
                    >
                        <FiDatabase className="w-3.5 h-3.5 text-gray-500" />
                        <span>Exportar Datos</span>
                    </Link>
                </div>
            </div>

            {/* Grid de Gráficos Analíticos de Gestión Empresarial */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* 1. Masa Salarial Mensual por Departamento */}
                <div className="bg-white p-4.5 rounded border border-gray-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                                Masa Salarial por Área
                            </h3>
                            <p className="text-[11px] text-gray-400">Distribución de nómina mensual ($)</p>
                        </div>
                        <span className="text-xs font-mono font-semibold text-emerald-700">
                            ${data?.kpis?.payrollTotal ? data.kpis.payrollTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
                        </span>
                    </div>

                    <div className="h-60 w-full">
                        {filteredPayrollData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                                Sin registros de nómina activa en el filtro.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={filteredPayrollData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                                    <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" />
                                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', color: '#111827', fontSize: '11px' }}
                                        formatter={(value) => [`$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Nómina']}
                                    />
                                    <Bar dataKey="salary" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* 2. Distribución de Dotación de Personal */}
                <div className="bg-white p-4.5 rounded border border-gray-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                                Dotación por Departamento
                            </h3>
                            <p className="text-[11px] text-gray-400">Distribución de colaboradores</p>
                        </div>
                        <span className="text-xs font-mono font-semibold text-blue-700">
                            {data?.kpis?.totalEmployees || 0} Total
                        </span>
                    </div>

                    <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filteredDeptData} layout="vertical" margin={{ top: 5, right: 15, left: 30, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                                <XAxis type="number" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis dataKey="name" type="category" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} width={90} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', color: '#111827', fontSize: '11px' }}
                                    formatter={(value) => [`${value} colaboradores`, 'Personal']}
                                />
                                <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={14}>
                                    {filteredDeptData.map((_, index) => (
                                        <Cell key={`dept-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Vacantes Abiertas y Procesos de Selección */}
                <div className="bg-white p-4.5 rounded border border-gray-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                                Vacantes en Proceso
                            </h3>
                            <p className="text-[11px] text-gray-400">Demanda de talento activo</p>
                        </div>
                        <span className="text-xs font-mono font-semibold text-amber-700">
                            {data?.kpis?.openVacancies || 0} Abiertas
                        </span>
                    </div>

                    <div className="h-60 w-full">
                        {filteredVacancyData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                                No hay vacantes abiertas en el filtro seleccionado.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={filteredVacancyData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                                    <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" />
                                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', color: '#111827', fontSize: '11px' }}
                                        formatter={(value) => [`${value} vacantes`, 'Demanda']}
                                    />
                                    <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* Directorio de Herramientas y Motores Analíticos (Pestañas Segmentadas) */}
            <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between border-b border-gray-200 pb-px">
                    {/* Tabs de Selección */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('operational')}
                            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                                activeTab === 'operational'
                                    ? 'border-gray-900 text-gray-900'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <span>Reportes de Gestión Operativa</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-100 text-gray-700">
                                {OPERATIONAL_REPORTS.length}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('ai')}
                            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                                activeTab === 'ai'
                                    ? 'border-purple-600 text-purple-900'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <span>Motores de IA & Analítica Predictiva</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                {AI_MODELS.length}
                            </span>
                        </button>
                    </div>

                    <span className="text-[11px] text-gray-400 hidden sm:inline-block font-mono">
                        {activeTab === 'operational' ? 'Informes consolidados de gestión' : 'Modelos de simulación y calibración'}
                    </span>
                </div>

                {/* Tarjetas de Reportes Operativos */}
                {activeTab === 'operational' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {OPERATIONAL_REPORTS.map((rep) => (
                            <div
                                key={rep.id}
                                onClick={() => navigate(rep.path)}
                                className="bg-white p-4 rounded border border-gray-200 hover:border-blue-500/50 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                            >
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div className="p-2 rounded bg-gray-50 border border-gray-100 group-hover:bg-blue-50 transition-colors">
                                            {rep.icon}
                                        </div>
                                        <span className={`text-[10px] font-medium font-mono px-2 py-0.5 rounded border ${rep.badgeColor}`}>
                                            {rep.badge}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 mb-0.5">{rep.category}</p>
                                        <h4 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {rep.title}
                                        </h4>
                                        <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
                                            {rep.desc}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-blue-600 font-medium group-hover:translate-x-0.5 transition-transform">
                                    <span>Acceder al reporte</span>
                                    <FiArrowUpRight size={14} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tarjetas de Motores de IA */}
                {activeTab === 'ai' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {AI_MODELS.map((ai) => (
                            <div
                                key={ai.id}
                                onClick={() => navigate(ai.path)}
                                className="bg-white p-4 rounded border border-gray-200 hover:border-purple-500/50 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                            >
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div className="p-2 rounded bg-purple-50/60 border border-purple-100 group-hover:bg-purple-100/80 transition-colors">
                                            {ai.icon}
                                        </div>
                                        <span className={`text-[10px] font-medium font-mono px-2 py-0.5 rounded border ${ai.badgeColor}`}>
                                            {ai.badge}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-semibold tracking-wider text-purple-500/80 mb-0.5">{ai.category}</p>
                                        <h4 className="text-xs font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                                            {ai.title}
                                        </h4>
                                        <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
                                            {ai.desc}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-purple-700 font-medium group-hover:translate-x-0.5 transition-transform">
                                    <span>Ejecutar motor analítico</span>
                                    <FiArrowUpRight size={14} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
