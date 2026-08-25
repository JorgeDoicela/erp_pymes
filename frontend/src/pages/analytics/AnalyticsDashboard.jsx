import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboardData } from '../../services/analytics.service';
import {
    FiDollarSign, FiLayers,
    FiBarChart2, FiUserMinus, FiActivity, FiDatabase, FiFileText,
    FiCpu, FiGitPullRequest, FiShare2, FiTarget, FiArrowUpRight, FiZap,
    FiBookOpen
} from 'react-icons/fi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell
} from 'recharts';
import AnalyticsMethodologyModal from '../../components/analytics/AnalyticsMethodologyModal';

const OPERATIONAL_REPORTS = [
    {
        id: 'reports',
        title: 'Reportes de Asistencia',
        path: '/admin/reports',
        category: 'Control de Jornada',
        tag: 'Operativo',
        desc: 'Marcaciones biométricas, horas efectivas, atrasos justificados y horas extras.'
    },
    {
        id: 'turnover',
        title: 'Rotación de Personal',
        path: '/analytics/turnover',
        category: 'Retención de Talento',
        tag: 'Gestión',
        desc: 'Tasas de salida voluntaria/involuntaria, antigüedad promedio y motivos de desvinculación.'
    },
    {
        id: 'performance',
        title: 'Rendimiento y Desempeño',
        path: '/analytics/performance',
        category: 'Evaluación y Metas',
        tag: 'Estratégico',
        desc: 'Resultados de evaluaciones individuales, distribución de calificaciones por rango y comparativa de rendimiento por departamento.'
    },
    {
        id: 'payroll_costs',
        title: 'Costos Salariales & Masa Salarial',
        path: '/analytics/payroll-costs',
        category: 'Finanzas RRHH',
        tag: 'Financiero',
        desc: 'Evolución de costos de nómina, desglose por componente salarial (salario base, horas extra, aportes) y distribución por departamento.'
    },
    {
        id: 'satisfaction',
        title: 'Clima Laboral & Satisfacción',
        path: '/analytics/satisfaction',
        category: 'Cultura y Clima',
        tag: 'Encuestas',
        desc: 'Índice de satisfacción interna (0-100), puntuación eNPS, análisis radar por dimensiones y comentarios cualitativos de la plantilla.'
    }
];

const AI_MODELS = [
    {
        id: 'rsi',
        title: 'Calibración RSI (Robust Stability Index)',
        path: '/analytics/rsi-optimization',
        category: 'Estabilidad Organizacional',
        tag: 'MCMC / Bayesiano',
        desc: 'Calibración estocástica de índices de salud organizacional con intervalos de credibilidad del 95%.'
    },
    {
        id: 'causal',
        title: 'Inferencia Causal (Do-Calculus)',
        path: '/analytics/causal-inference',
        category: 'Simulación de Políticas',
        tag: 'Causal AI',
        desc: 'Estimación contrafactual del impacto real de incrementos salariales y teletrabajo en la retención.'
    },
    {
        id: 'federated',
        title: 'Benchmarking & Aprendizaje Federado',
        path: '/analytics/federated-learning',
        category: 'Comparativa de Mercado',
        tag: 'Differential Privacy',
        desc: 'Comparación sectorial con empresas pares preservando el 100% de la privacidad de datos salariales.'
    },
    {
        id: 'morl',
        title: 'Optimización Multiobjetivo (MORL)',
        path: '/analytics/morl-pareto',
        category: 'Optimización Presupuestaria',
        tag: 'Pareto Front',
        desc: 'Cálculo de compensación óptima en la frontera de Pareto entre costo empresarial y riesgo de fuga.'
    },
    {
        id: 'temporal',
        title: 'Temporal Attention (12 Meses)',
        path: '/analytics/temporal-attention',
        category: 'Deep Learning Secuencial',
        tag: 'Attention Mechanism',
        desc: 'Ponderación no lineal de secuencias de 12 meses (asistencia, desempeño, nómina) mediante Scaled Dot-Product Attention para modelado de riesgo de rotación.'
    },
    {
        id: 'ft_transformer',
        title: 'FT-Transformer Tabular',
        path: '/analytics/ft-transformer',
        category: 'Transformer Tabular',
        tag: 'Feature Tokenizer',
        desc: 'Tokenización de covariables socio-laborales en embeddings densos con atención multi-cabeza para predicción de riesgo de rotación (Gorishniy et al., NeurIPS 2021).'
    }
];

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

const AnalyticsDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Pestaña activa del directorio: 'operational' | 'ai'
    const [activeTab, setActiveTab] = useState('operational');
    const [selectedDept, setSelectedDept] = useState('ALL');
    const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
    const [modalDefaultSection, setModalDefaultSection] = useState(null);

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

                    <button
                        type="button"
                        onClick={() => {
                            setModalDefaultSection(null);
                            setIsMethodologyOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                        <FiBookOpen className="w-3.5 h-3.5" />
                        <span>Ficha Técnica & Congreso</span>
                    </button>

                    <Link
                        to="/analytics/custom"
                        className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 text-xs font-medium rounded transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                        <FiDatabase className="w-3.5 h-3.5 text-gray-500" />
                        <span>Exportar Datos</span>
                    </Link>
                </div>
            </div>

            {/* Modal de Ficha Metodológica de Analíticas */}
            <AnalyticsMethodologyModal
                isOpen={isMethodologyOpen}
                onClose={() => setIsMethodologyOpen(false)}
                defaultSection={modalDefaultSection}
            />

            {/* Grid de Gráficos Analíticos de Gestión Empresarial (Diseño Espacioso) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Masa Salarial Mensual por Departamento */}
                <div className="bg-white p-5 rounded border border-gray-200 space-y-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                                Masa Salarial por Área
                            </h3>
                            <p className="text-[11px] text-gray-400 mt-0.5">Distribución de nómina mensual ($)</p>
                        </div>
                        <span className="text-sm font-mono font-semibold text-emerald-700 tabular-nums">
                            ${data?.kpis?.payrollTotal ? data.kpis.payrollTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
                        </span>
                    </div>

                    <div className="h-64 w-full">
                        {filteredPayrollData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                                Sin registros de nómina activa en el filtro.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart 
                                    data={filteredPayrollData} 
                                    layout="vertical"
                                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                                    <XAxis 
                                        type="number" 
                                        stroke="#9ca3af" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} 
                                    />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        stroke="#374151" 
                                        fontSize={11} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        width={95} 
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', color: '#111827', fontSize: '11px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                                        formatter={(value) => [`$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Nómina']}
                                    />
                                    <Bar dataKey="salary" fill="#10b981" radius={[0, 3, 3, 0]} barSize={16} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* 2. Distribución de Dotación de Personal */}
                <div className="bg-white p-5 rounded border border-gray-200 space-y-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                                Dotación por Departamento
                            </h3>
                            <p className="text-[11px] text-gray-400 mt-0.5">Distribución de colaboradores</p>
                        </div>
                        <span className="text-sm font-mono font-semibold text-blue-700 tabular-nums">
                            {data?.kpis?.totalEmployees || 0} Total
                        </span>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={filteredDeptData} 
                                layout="vertical" 
                                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                                <XAxis 
                                    type="number" 
                                    stroke="#9ca3af" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    allowDecimals={false}
                                />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    stroke="#374151" 
                                    fontSize={11} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    width={95} 
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', color: '#111827', fontSize: '11px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                                    formatter={(value) => [`${value} colaboradores`, 'Personal']}
                                />
                                <Bar dataKey="value" fill="#2563eb" radius={[0, 3, 3, 0]} barSize={16}>
                                    {filteredDeptData.map((_, index) => (
                                        <Cell key={`dept-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Vacantes Abiertas y Procesos de Selección */}
                <div className="bg-white p-5 rounded border border-gray-200 space-y-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                                Vacantes en Proceso
                            </h3>
                            <p className="text-[11px] text-gray-400 mt-0.5">Demanda de talento activo</p>
                        </div>
                        <span className="text-sm font-mono font-semibold text-amber-700 tabular-nums">
                            {data?.kpis?.openVacancies || 0} Abiertas
                        </span>
                    </div>

                    <div className="h-64 w-full">
                        {filteredVacancyData.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs">
                                <span className="font-mono">Sin vacantes activas</span>
                                <span className="text-[11px] text-gray-400 mt-1">Todos los puestos cubiertos</span>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart 
                                    data={filteredVacancyData} 
                                    layout="vertical"
                                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                                    <XAxis 
                                        type="number" 
                                        stroke="#9ca3af" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        allowDecimals={false} 
                                    />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category"
                                        stroke="#374151" 
                                        fontSize={11} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        width={95}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px', color: '#111827', fontSize: '11px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                                        formatter={(value) => [`${value} vacantes`, 'Demanda']}
                                    />
                                    <Bar dataKey="value" fill="#d97706" radius={[0, 3, 3, 0]} barSize={16} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* Directorio de Herramientas y Motores Analíticos (Pestañas Segmentadas) */}
            <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-gray-200 pb-px">
                    {/* Tabs de Selección */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setActiveTab('operational')}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                                activeTab === 'operational'
                                    ? 'border-gray-900 text-gray-900 font-semibold'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <span>Reportes de Gestión Operativa</span>
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 tabular-nums">
                                {OPERATIONAL_REPORTS.length}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('ai')}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                                activeTab === 'ai'
                                    ? 'border-gray-900 text-gray-900 font-semibold'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <span>Motores de IA & Analítica Predictiva</span>
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 tabular-nums">
                                {AI_MODELS.length}
                            </span>
                        </button>
                    </div>

                    <span className="text-xs text-gray-400 hidden sm:inline-block font-mono">
                        {activeTab === 'operational' ? 'Informes consolidados de gestión' : 'Modelos de simulación y calibración'}
                    </span>
                </div>

                {/* Tarjetas de Reportes Operativos */}
                {activeTab === 'operational' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {OPERATIONAL_REPORTS.map((rep) => (
                            <Link
                                key={rep.id}
                                to={rep.path}
                                className="bg-white p-5 rounded border border-gray-200 hover:border-gray-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group text-left min-h-[170px]"
                            >
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 font-mono">
                                            {rep.category}
                                        </span>
                                        <span className="text-[11px] font-mono text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded border border-gray-150">
                                            {rep.tag}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {rep.title}
                                        </h4>
                                        <p className="text-xs text-gray-500 leading-relaxed mt-1.5">
                                            {rep.desc}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-blue-600 font-medium group-hover:text-blue-700">
                                    <span>Acceder al reporte</span>
                                    <FiArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Tarjetas de Motores de IA */}
                {activeTab === 'ai' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {AI_MODELS.map((ai) => (
                            <Link
                                key={ai.id}
                                to={ai.path}
                                className="bg-white p-5 rounded border border-gray-200 hover:border-gray-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group text-left min-h-[170px]"
                            >
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 font-mono">
                                            {ai.category}
                                        </span>
                                        <span className="text-[11px] font-mono text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded border border-gray-150">
                                            {ai.tag}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {ai.title}
                                        </h4>
                                        <p className="text-xs text-gray-500 leading-relaxed mt-1.5">
                                            {ai.desc}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-blue-600 font-medium group-hover:text-blue-700">
                                    <span>Ejecutar motor analítico</span>
                                    <FiArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
