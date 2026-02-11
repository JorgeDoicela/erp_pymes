import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyPendingEvaluations, getMyResultsList } from '../../services/evaluation.service';
import { FiCheckCircle, FiClock, FiArrowRight, FiList, FiBarChart2 } from 'react-icons/fi';

const MyEvaluations = () => {
    const navigate = useNavigate();
    const [evaluations, setEvaluations] = useState([]);
    const [myResults, setMyResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'results'

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
        <div className="space-y-6">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">
                        Centro de Evaluaciones
                    </h1>
                    <p className="text-slate-500">
                        Gestiona tus evaluaciones pendientes y consulta tus resultados históricos.
                    </p>
                </header>

                {/* Tabs */}
                <div className="flex space-x-4 mb-8 border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex items-center pb-3 px-4 transition-all relative font-medium ${activeTab === 'pending' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <FiList className="mr-2" /> Por Realizar
                        {pendingCount > 0 && <span className="ml-2 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount}</span>}
                        {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('results')}
                        className={`flex items-center pb-3 px-4 transition-all relative font-medium ${activeTab === 'results' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <FiBarChart2 className="mr-2" /> Mis Resultados
                        {activeTab === 'results' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-slate-500">Cargando...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activeTab === 'pending' ? (
                            evaluations.length === 0 ? (
                                <div className="bg-white rounded-xl p-8 text-center border border-slate-200 shadow-sm">
                                    <p className="text-slate-500">No tienes evaluaciones pendientes por realizar.</p>
                                </div>
                            ) : (
                                evaluations.map((review) => (
                                    <div
                                        key={review.id}
                                        className={`bg-white rounded-xl p-6 border transition-all hover:shadow-md flex justify-between items-center ${review.status === 'COMPLETED' ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 hover:border-blue-300'}`}
                                    >
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${review.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                                    {review.status === 'COMPLETED' ? 'COMPLETADO' : 'PENDIENTE'}
                                                </span>
                                                <h3 className="text-lg font-bold text-slate-800">
                                                    {review.evaluation.template.title}
                                                </h3>
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                <p><span className="font-semibold text-slate-700">Periodo:</span> {review.evaluation.template.period}</p>
                                                <p><span className="font-semibold text-slate-700">Evaluado:</span> {review.reviewerId === review.evaluation.employeeId ? 'Autoevaluación' : `${review.evaluation.employee.firstName} ${review.evaluation.employee.lastName}`}</p>
                                            </div>
                                        </div>

                                        {review.status !== 'COMPLETED' && (
                                            <button
                                                onClick={() => navigate(`/performance/take/${review.id}`)}
                                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center shadow-lg hover:shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"
                                            >
                                                Realizar <FiArrowRight className="ml-2" />
                                            </button>
                                        )}
                                        {review.status === 'COMPLETED' && (
                                            <div className="flex items-center text-emerald-600 font-medium">
                                                <FiCheckCircle className="mr-2" /> Enviado
                                            </div>
                                        )}
                                    </div>
                                ))
                            )
                        ) : (
                            myResults.length === 0 ? (
                                <div className="bg-white rounded-xl p-8 text-center border border-slate-200 shadow-sm">
                                    <p className="text-slate-500">Aún no tienes resultados de evaluaciones disponibles.</p>
                                </div>
                            ) : (
                                myResults.map((result) => (
                                    <div
                                        key={result.id}
                                        className="bg-white rounded-xl p-6 border border-slate-200 hover:border-blue-400 transition-all hover:shadow-md flex justify-between items-center"
                                    >
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${result.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                    {result.status === 'COMPLETED' ? 'FINALIZADA' : 'ACTIVA'}
                                                </span>
                                                <h3 className="text-lg font-bold text-slate-800">
                                                    {result.template.title}
                                                </h3>
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                <p>Periodo: {result.template.period}</p>
                                                <p>Fecha Fin: {new Date(result.endDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => navigate(`/performance/results/${result.id}`)}
                                            className="px-6 py-2 bg-slate-50 border border-slate-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 rounded-lg font-medium flex items-center transition-all"
                                        >
                                            Ver Informe <FiBarChart2 className="ml-2" />
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
