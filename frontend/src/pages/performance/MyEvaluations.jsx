import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyPendingEvaluations, getMyResultsList } from '../../services/evaluation.service';
import { FiCheckCircle, FiArrowRight, FiList, FiBarChart2, FiCalendar } from 'react-icons/fi';

const MyEvaluations = () => {
    const navigate = useNavigate();
    const [evaluations, setEvaluations] = useState([]);
    const [myResults, setMyResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchEvaluations = async () => {
            try {
                const [pendingData, resultsData] = await Promise.all([
                    getMyPendingEvaluations(),
                    getMyResultsList()
                ]);
                setEvaluations(pendingData || []);
                setMyResults(resultsData || []);
            } catch (error) {
                console.error("Error fetching evaluations:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvaluations();
    }, []);

    const pendingCount = evaluations.filter(e => e.status === 'PENDING').length;
    const completedEvaluationsCount = evaluations.filter(e => e.status === 'COMPLETED').length;

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            {/* Header Limpio ERP */}
            <div className="bg-white p-5 rounded border border-gray-200">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 font-mono mb-1">
                    Mi Portal · Gestión del Desempeño
                </div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                    Mis Evaluaciones de Desempeño
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                    Responde autoevaluaciones y evaluaciones de equipo pendientes, y consulta tus informes finales de rendimiento.
                </p>
            </div>

            {/* Pestañas ERP (Tabs horizontales con borde inferior activo 2px #111827) */}
            <div className="flex border-b border-gray-200 gap-6 text-xs bg-white px-5 pt-3 rounded-t border-t border-x overflow-x-auto">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-2.5 font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        activeTab === 'pending'
                            ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                            : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <FiList className="w-3.5 h-3.5" />
                    <span>Evaluaciones por Responder</span>
                    <span className={`ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                        pendingCount > 0 
                            ? 'bg-amber-50 text-amber-800 border-amber-200 font-semibold' 
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                        {pendingCount}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('results')}
                    className={`pb-2.5 font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        activeTab === 'results'
                            ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                            : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <FiBarChart2 className="w-3.5 h-3.5" />
                    <span>Mis Informes y Resultados</span>
                    <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded border bg-gray-100 text-gray-600 border-gray-200">
                        {myResults.length}
                    </span>
                </button>
            </div>

            <div className="bg-white p-5 rounded-b border-x border-b border-gray-200 min-h-[350px]">
                {loading ? (
                    <div className="text-center py-12 text-xs text-gray-400 font-mono">
                        Cargando evaluaciones...
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activeTab === 'pending' ? (
                            evaluations.length === 0 ? (
                                <div className="p-12 text-center text-gray-400 text-xs">
                                    <p className="text-sm font-semibold text-gray-800">No tienes evaluaciones pendientes</p>
                                    <p className="text-xs text-gray-400 mt-1">Todas tus autoevaluaciones y revisiones asignadas se encuentran al día.</p>
                                </div>
                            ) : (
                                evaluations.map((review) => (
                                    <div
                                        key={review.id}
                                        className="bg-white rounded border border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-gray-50/60 transition-colors"
                                    >
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                                                    review.status === 'COMPLETED' 
                                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                                                }`}>
                                                    {review.status === 'COMPLETED' ? 'COMPLETADO' : 'PENDIENTE'}
                                                </span>
                                                <h3 className="font-semibold text-xs text-gray-900">
                                                    {review.evaluation?.template?.title || 'Evaluación de Desempeño'}
                                                </h3>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Período: <span className="font-mono font-medium text-gray-700">{review.evaluation?.template?.period || 'Actual'}</span> · Modalidad: <span className="font-medium text-gray-800">{review.reviewerId === review.evaluation?.employeeId ? 'Autoevaluación' : `Evaluando a ${review.evaluation?.employee?.firstName} ${review.evaluation?.employee?.lastName}`}</span>
                                            </p>
                                        </div>

                                        {review.status !== 'COMPLETED' ? (
                                            <button
                                                onClick={() => navigate(`/performance/take/${review.id}`)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
                                            >
                                                <span>Responder Evaluación</span> <FiArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                        ) : (
                                            <div className="flex items-center text-emerald-800 bg-emerald-50 border border-emerald-200 text-[11px] font-medium px-2.5 py-1 rounded gap-1 shrink-0 font-mono">
                                                <FiCheckCircle className="w-3.5 h-3.5" /> <span>Completada</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )
                        ) : (
                            myResults.length === 0 ? (
                                <div className="p-12 text-center text-gray-400 text-xs">
                                    <p className="text-sm font-semibold text-gray-800">No hay informes de resultados disponibles</p>
                                    <p className="text-xs text-gray-400 mt-1">Los informes de rendimiento consolidados se publicarán en esta sección una vez finalizado el ciclo.</p>
                                </div>
                            ) : (
                                myResults.map((result) => (
                                    <div
                                        key={result.id}
                                        className="bg-white rounded border border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-gray-50/60 transition-colors"
                                    >
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                                                    result.status === 'COMPLETED'
                                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                        : 'bg-blue-50 text-blue-800 border-blue-200'
                                                }`}>
                                                    {result.status === 'COMPLETED' ? 'FINALIZADA' : 'EN CURSO'}
                                                </span>
                                                <h3 className="font-semibold text-xs text-gray-900">
                                                    {result.template?.title || 'Evaluación de Desempeño'}
                                                </h3>
                                            </div>
                                            <p className="text-xs text-gray-500 font-mono tabular-nums">
                                                Período: {result.template?.period || 'N/A'} · Cierre: {result.endDate ? new Date(result.endDate).toLocaleDateString('es-EC') : '—'}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => navigate(`/performance/results/${result.id}`)}
                                            className="border border-gray-300 hover:border-gray-400 bg-white text-gray-700 text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                                        >
                                            <FiBarChart2 className="w-3.5 h-3.5 text-gray-500" />
                                            <span>Ver Informe Detallado</span>
                                        </button>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyEvaluations;

