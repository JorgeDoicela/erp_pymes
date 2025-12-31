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
        const fetchEvaluations = async () => {
            try {
                const [pendingData, resultsData] = await Promise.all([
                    getMyPendingEvaluations(),
                    getMyResultsList()
                ]);
                setEvaluations(pendingData);
                setMyResults(resultsData);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvaluations();
    }, []);

    const pendingCount = evaluations.filter(e => e.status === 'PENDING').length;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">
                        Centro de Evaluaciones
                    </h1>
                    <p className="text-gray-400">
                        Gestiona tus evaluaciones pendientes y consulta tus resultados históricos.
                    </p>
                </header>

                {/* Tabs */}
                <div className="flex space-x-4 mb-8 border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex items-center pb-4 px-4 transition-colors relative ${activeTab === 'pending' ? 'text-purple-400 font-bold' : 'text-gray-400 hover:text-white'}`}
                    >
                        <FiList className="mr-2" /> Por Realizar
                        {pendingCount > 0 && <span className="ml-2 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount}</span>}
                        {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500 rounded-t-full"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('results')}
                        className={`flex items-center pb-4 px-4 transition-colors relative ${activeTab === 'results' ? 'text-blue-400 font-bold' : 'text-gray-400 hover:text-white'}`}
                    >
                        <FiBarChart2 className="mr-2" /> Mis Resultados
                        {activeTab === 'results' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-t-full"></div>}
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12">Cargando...</div>
                ) : (
                    <div className="space-y-4">
                        {activeTab === 'pending' ? (
                            evaluations.length === 0 ? (
                                <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
                                    <p className="text-gray-400">No tienes evaluaciones pendientes por realizar.</p>
                                </div>
                            ) : (
                                evaluations.map((review) => (
                                    <div
                                        key={review.id}
                                        className={`bg-gray-800 rounded-xl p-6 border transition-all hover:shadow-lg flex justify-between items-center ${review.status === 'COMPLETED' ? 'border-green-600/30 opacity-75' : 'border-gray-600 hover:border-purple-500'}`}
                                    >
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${review.status === 'COMPLETED' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                                                    {review.status === 'COMPLETED' ? 'COMPLETADO' : 'PENDIENTE'}
                                                </span>
                                                <h3 className="text-lg font-bold text-white">
                                                    {review.evaluation.template.title}
                                                </h3>
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                <p><span className="font-semibold text-gray-300">Periodo:</span> {review.evaluation.template.period}</p>
                                                <p><span className="font-semibold text-gray-300">Evaluado:</span> {review.reviewerId === review.evaluation.employeeId ? 'Autoevaluación' : `${review.evaluation.employee.firstName} ${review.evaluation.employee.lastName}`}</p>
                                            </div>
                                        </div>

                                        {review.status !== 'COMPLETED' && (
                                            <button
                                                onClick={() => navigate(`/performance/take/${review.id}`)}
                                                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg text-white font-medium flex items-center shadow-lg transition-transform hover:scale-105"
                                            >
                                                Realizar <FiArrowRight className="ml-2" />
                                            </button>
                                        )}
                                        {review.status === 'COMPLETED' && (
                                            <div className="flex items-center text-green-400">
                                                <FiCheckCircle className="mr-2" /> Enviado
                                            </div>
                                        )}
                                    </div>
                                ))
                            )
                        ) : (
                            myResults.length === 0 ? (
                                <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
                                    <p className="text-gray-400">Aún no tienes resultados de evaluaciones disponibles.</p>
                                </div>
                            ) : (
                                myResults.map((result) => (
                                    <div
                                        key={result.id}
                                        className="bg-gray-800 rounded-xl p-6 border border-gray-600 hover:border-blue-500 transition-all hover:shadow-lg flex justify-between items-center"
                                    >
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${result.status === 'COMPLETED' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'}`}>
                                                    {result.status === 'COMPLETED' ? 'FINALIZADA' : 'EN PROCESO'}
                                                </span>
                                                <h3 className="text-lg font-bold text-white">
                                                    {result.template.title}
                                                </h3>
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                <p>Periodo: {result.template.period}</p>
                                                <p>Fecha Fin: {new Date(result.endDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => navigate(`/performance/results/${result.id}`)}
                                            className="px-6 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg font-medium flex items-center transition-colors"
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
