import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyPendingEvaluations, getMyResultsList } from '../../services/evaluation.service';
import { FiCheckCircle, FiArrowRight, FiList, FiBarChart2 } from 'react-icons/fi';

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
                setEvaluations(pendingData);
                setMyResults(resultsData);
            } catch (error) {
                console.error("Error fetching evaluations:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvaluations();
    }, []);

    const pendingCount = evaluations.filter(e => e.status === 'PENDING').length;

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="bg-white p-5 rounded border border-gray-200">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Evaluación y Desempeño
                </div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                    Mis Evaluaciones de Desempeño
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                    Responde autoevaluaciones pendientes y consulta tus informes de rendimiento.
                </p>
            </div>

            {/* Pestañas ERP (Tabs horizontales con borde inferior activo 2px #111827) */}
            <div className="flex border-b border-gray-200 gap-6 text-xs bg-white px-5 pt-3 rounded-t border-t border-x">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-2.5 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                        activeTab === 'pending'
                            ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                            : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <FiList /> Por Realizar
                    {pendingCount > 0 && (
                        <span className="ml-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-mono px-1.5 py-0.2 rounded">
                            {pendingCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('results')}
                    className={`pb-2.5 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                        activeTab === 'results'
                            ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                            : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <FiBarChart2 /> Mis Resultados
                </button>
            </div>

            <div className="bg-white p-5 rounded-b border-x border-b border-gray-200 min-h-[300px]">
                {loading ? (
                    <div className="text-center py-12 text-xs text-gray-400 font-mono">
                        Cargando evaluaciones...
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activeTab === 'pending' ? (
                            evaluations.length === 0 ? (
                                <div className="p-12 text-center text-gray-400 text-sm">
                                    <p className="text-sm font-medium text-gray-700">No tienes evaluaciones pendientes</p>
                                    <p className="text-xs text-gray-400 mt-1">Todas tus autoevaluaciones y revisiones están al día.</p>
                                </div>
                            ) : (
                                evaluations.map((review) => (
                                    <div
                                        key={review.id}
                                        className="bg-white rounded border border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-gray-50/60 transition-colors"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${
                                                    review.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                    {review.status === 'COMPLETED' ? 'COMPLETADO' : 'PENDIENTE'}
                                                </span>
                                                <h3 className="font-semibold text-xs text-gray-900">
                                                    {review.evaluation.template.title}
                                                </h3>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Período: <span className="font-medium text-gray-700">{review.evaluation.template.period}</span> · Evaluado: <span className="font-medium text-gray-700">{review.reviewerId === review.evaluation.employeeId ? 'Autoevaluación' : `${review.evaluation.employee.firstName} ${review.evaluation.employee.lastName}`}</span>
                                            </p>
                                        </div>

                                        {review.status !== 'COMPLETED' ? (
                                            <button
                                                onClick={() => navigate(`/performance/take/${review.id}`)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5"
                                            >
                                                <span>Responder</span> <FiArrowRight className="w-3 h-3" />
                                            </button>
                                        ) : (
                                            <div className="flex items-center text-green-700 text-xs font-medium gap-1">
                                                <FiCheckCircle className="w-3.5 h-3.5" /> Registrado
                                            </div>
                                        )}
                                    </div>
                                ))
                            )
                        ) : (
                            myResults.length === 0 ? (
                                <div className="p-12 text-center text-gray-400 text-sm">
                                    <p className="text-sm font-medium text-gray-700">No hay resultados disponibles</p>
                                    <p className="text-xs text-gray-400 mt-1">Los informes de rendimiento finalizados se publicarán en esta pestaña.</p>
                                </div>
                            ) : (
                                myResults.map((result) => (
                                    <div
                                        key={result.id}
                                        className="bg-white rounded border border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-gray-50/60 transition-colors"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] px-2 py-0.5 rounded border font-medium bg-gray-50 text-gray-700 border-gray-200">
                                                    {result.status === 'COMPLETED' ? 'FINALIZADA' : 'ACTIVA'}
                                                </span>
                                                <h3 className="font-semibold text-xs text-gray-900">
                                                    {result.template.title}
                                                </h3>
                                            </div>
                                            <p className="text-xs text-gray-500 font-mono tabular-nums">
                                                Período: {result.template.period} · Fecha Fin: {new Date(result.endDate).toLocaleDateString('es-EC')}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => navigate(`/performance/results/${result.id}`)}
                                            className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5"
                                        >
                                            <span>Ver Informe</span> <FiBarChart2 className="w-3.5 h-3.5" />
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

