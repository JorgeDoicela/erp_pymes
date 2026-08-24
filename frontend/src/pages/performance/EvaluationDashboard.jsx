import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getEvaluationTemplates,
    getEmployeeEvaluations,
    getPerformanceStats
} from '../../services/evaluation.service';
import EvaluationDetailModal from './components/EvaluationDetailModal';

const STATUS_MAP = {
    PENDING: { label: 'PENDIENTE', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    IN_PROGRESS: { label: 'EN PROCESO', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
    COMPLETED: { label: 'COMPLETADA', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    EXPIRED: { label: 'EXPIRADA', cls: 'bg-red-50 text-red-800 border-red-200' }
};

const EvaluationDashboard = () => {
    const navigate = useNavigate();

    // Estados y datos
    const [evaluations, setEvaluations] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [stats, setStats] = useState({
        totalTemplates: 0,
        totalEvaluations: 0,
        pendingEvaluations: 0,
        completedEvaluations: 0,
        averageCompanyScore: 0
    });
    const [loading, setLoading] = useState(true);

    // Navegación de pestañas: 'EVALUATIONS_ALL', 'EVALUATIONS_PENDING', 'EVALUATIONS_COMPLETED', 'TEMPLATES'
    const [activeTab, setActiveTab] = useState('EVALUATIONS_ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

    // Modales
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        loadStats();
        loadTemplates();
    }, []);

    useEffect(() => {
        if (activeTab === 'TEMPLATES') {
            loadTemplates();
        } else {
            loadEvaluations();
        }
    }, [activeTab, pagination.page]);

    const loadStats = async () => {
        try {
            const res = await getPerformanceStats();
            if (res.success && res.data) {
                setStats(res.data);
            }
        } catch (error) {
            console.error('Error cargando estadísticas de desempeño:', error);
        }
    };

    const loadTemplates = async () => {
        try {
            const data = await getEvaluationTemplates();
            if (Array.isArray(data)) {
                setTemplates(data);
            }
        } catch (error) {
            console.error('Error cargando plantillas:', error);
        }
    };

    const loadEvaluations = async () => {
        setLoading(true);
        try {
            let statusParam;
            if (activeTab === 'EVALUATIONS_PENDING') statusParam = 'IN_PROGRESS';
            else if (activeTab === 'EVALUATIONS_COMPLETED') statusParam = 'COMPLETED';

            const res = await getEmployeeEvaluations({
                page: pagination.page,
                limit: pagination.limit,
                status: statusParam,
                search: searchTerm.trim() || undefined
            });

            if (res.success) {
                setEvaluations(res.data || []);
                if (res.pagination) {
                    setPagination(prev => ({
                        ...prev,
                        total: res.pagination.total || 0,
                        totalPages: res.pagination.totalPages || 1
                    }));
                }
            }
        } catch (error) {
            console.error('Error cargando evaluaciones de personal:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        if (activeTab === 'TEMPLATES') {
            // Filtrado local para plantillas
        } else {
            loadEvaluations();
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleViewTemplateDetail = (template) => {
        setSelectedTemplate(template);
        setIsDetailOpen(true);
    };

    const filteredTemplates = templates.filter(t => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return t.title?.toLowerCase().includes(q) || t.period?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
    });

    const inputClass = "w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors";

    return (
        <div className="space-y-4">
            {/* Header ERP con Balance de Desempeño */}
            <div className="pb-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Gestión de Talento · Desempeño</p>
                    <h1 className="text-xl font-semibold text-gray-900">Evaluaciones de Desempeño</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Control de ciclos de evaluación, rúbricas de competencias y cumplimiento de objetivos.</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-4 bg-white px-3.5 py-2 rounded border border-gray-200 font-mono text-xs">
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Promedio Corporativo</span>
                            <span className="font-semibold text-gray-900 tabular-nums">
                                {stats.averageCompanyScore > 0 ? `${stats.averageCompanyScore} / 5.00` : 'Sin registros'}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/performance/assign')}
                        className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                    >
                        Asignar Evaluación
                    </button>

                    <button
                        onClick={() => navigate('/performance/create')}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
                    >
                        + Nueva Plantilla
                    </button>
                </div>
            </div>

            {/* Pestañas con Contadores Integrados (Holded/Linear Style) */}
            <div className="flex items-center justify-between border-b border-gray-200 gap-4 overflow-x-auto">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => handleTabChange('EVALUATIONS_ALL')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'EVALUATIONS_ALL'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Evaluaciones del Personal <span className="ml-1.5 font-mono text-[11px] text-gray-400">({stats.totalEvaluations})</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('EVALUATIONS_PENDING')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'EVALUATIONS_PENDING'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        En Proceso / Pendientes <span className="ml-1.5 font-mono text-[11px] text-amber-700">({stats.pendingEvaluations})</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('EVALUATIONS_COMPLETED')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'EVALUATIONS_COMPLETED'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Completadas <span className="ml-1.5 font-mono text-[11px] text-emerald-600">({stats.completedEvaluations})</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('TEMPLATES')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'TEMPLATES'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Plantillas y Rúbricas <span className="ml-1.5 font-mono text-[11px] text-gray-400">({stats.totalTemplates})</span>
                    </button>
                </div>
            </div>

            {/* Barra de Búsqueda */}
            <div className="bg-white p-3 rounded border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto flex-grow max-w-md">
                    <input
                        type="text"
                        placeholder={activeTab === 'TEMPLATES' ? 'Buscar plantilla o periodo...' : 'Buscar por colaborador, cédula o ciclo...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={inputClass}
                    />
                    <button
                        type="submit"
                        className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors shrink-0 cursor-pointer"
                    >
                        Buscar
                    </button>
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm('');
                                setPagination(prev => ({ ...prev, page: 1 }));
                                if (activeTab !== 'TEMPLATES') setTimeout(loadEvaluations, 0);
                            }}
                            className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer shrink-0"
                        >
                            Limpiar
                        </button>
                    )}
                </form>
            </div>

            {/* TABLA PRINCIPAL */}
            {activeTab !== 'TEMPLATES' ? (
                /* TABLA DE EVALUACIONES DEL PERSONAL EN CURSO */
                <div className="bg-white rounded border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="py-2.5 px-4">Colaborador Evaluado</th>
                                    <th className="py-2.5 px-4">Plantilla / Rúbrica</th>
                                    <th className="py-2.5 px-4">Periodo</th>
                                    <th className="py-2.5 px-4 text-center">Progreso Evaluadores</th>
                                    <th className="py-2.5 px-4 text-right">Nota Final</th>
                                    <th className="py-2.5 px-4 text-center">Fecha Límite</th>
                                    <th className="py-2.5 px-4 text-center">Estado</th>
                                    <th className="py-2.5 px-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-gray-400 text-xs">
                                            Cargando evaluaciones del personal...
                                        </td>
                                    </tr>
                                ) : evaluations.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="p-12 text-center">
                                            <p className="text-sm font-medium text-gray-700">Sin evaluaciones asignadas</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                No se encontraron evaluaciones con los filtros actuales.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    evaluations.map(ev => {
                                        const statusConfig = STATUS_MAP[ev.status] || STATUS_MAP.PENDING;

                                        return (
                                            <tr key={ev.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="py-2.5 px-4">
                                                    <p className="font-medium text-gray-900">
                                                        {ev.employee?.firstName} {ev.employee?.lastName}
                                                    </p>
                                                    <p className="text-gray-400 text-[11px]">
                                                        {ev.employee?.identityCard || 'C.I. S/N'} · {ev.employee?.department || 'General'}
                                                    </p>
                                                </td>
                                                <td className="py-2.5 px-4 font-medium text-gray-800">
                                                    {ev.template?.title}
                                                </td>
                                                <td className="py-2.5 px-4">
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-mono border bg-gray-50 text-gray-700 border-gray-200">
                                                        {ev.template?.period}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-4 text-center">
                                                    <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-gray-700">
                                                        <span>{ev.completedReviewers}/{ev.totalReviewers}</span>
                                                        <span className="text-gray-400">({ev.progressPercentage}%)</span>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-4 text-right font-mono font-semibold text-gray-900 tabular-nums">
                                                    {ev.finalScore !== null ? `${Number(ev.finalScore).toFixed(2)} pts` : '—'}
                                                </td>
                                                <td className="py-2.5 px-4 text-center font-mono text-[11px] text-gray-500 tabular-nums">
                                                    {new Date(ev.endDate).toLocaleDateString('es-EC')}
                                                </td>
                                                <td className="py-2.5 px-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${statusConfig.cls}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-4 text-right">
                                                    <button
                                                        onClick={() => navigate(`/performance/results/${ev.id}`)}
                                                        className="border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                    >
                                                        Ver Resultados →
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    {!loading && pagination.totalPages > 1 && (
                        <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                            <span>Mostrando página {pagination.page} de {pagination.totalPages} ({pagination.total} registros)</span>
                            <div className="flex items-center gap-1">
                                <button
                                    disabled={pagination.page <= 1}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    className="px-2.5 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                                >
                                    Anterior
                                </button>
                                <button
                                    disabled={pagination.page >= pagination.totalPages}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    className="px-2.5 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* TABLA DE PLANTILLAS Y RÚBRICAS */
                <div className="bg-white rounded border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="py-2.5 px-4">Título de la Plantilla</th>
                                    <th className="py-2.5 px-4">Periodo Objetivo</th>
                                    <th className="py-2.5 px-4">Descripción / Alcance</th>
                                    <th className="py-2.5 px-4 text-center">N° Criterios</th>
                                    <th className="py-2.5 px-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredTemplates.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-12 text-center">
                                            <p className="text-sm font-medium text-gray-700">Sin plantillas registradas</p>
                                            <p className="text-xs text-gray-400 mt-1">Crea una plantilla para estructurar las rúbricas de evaluación.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTemplates.map((t) => (
                                        <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="py-2.5 px-4 font-medium text-gray-900">{t.title}</td>
                                            <td className="py-2.5 px-4">
                                                <span className="px-2 py-0.5 rounded text-[11px] font-mono border bg-gray-50 text-gray-700 border-gray-200">
                                                    {t.period}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 text-gray-500 truncate max-w-sm">{t.description || '—'}</td>
                                            <td className="py-2.5 px-4 text-center font-mono text-gray-700">
                                                {Array.isArray(t.criteria) ? t.criteria.length : 0} criterios
                                            </td>
                                            <td className="py-2.5 px-4 text-right">
                                                <button
                                                    onClick={() => handleViewTemplateDetail(t)}
                                                    className="border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                >
                                                    Ver Rúbrica →
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal de Detalle de Plantilla */}
            <EvaluationDetailModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                template={selectedTemplate}
            />
        </div>
    );
};

export default EvaluationDashboard;
