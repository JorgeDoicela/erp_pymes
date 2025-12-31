import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyPendingEvaluations } from '../../services/evaluation.service';
import { FiCheckCircle, FiClock, FiArrowRight } from 'react-icons/fi';

const MyEvaluations = () => {
    const navigate = useNavigate();
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvaluations = async () => {
            try {
                const data = await getMyPendingEvaluations();
                setEvaluations(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvaluations();
    }, []);

    const pending = evaluations.filter(e => e.status === 'PENDING').length;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">
                        Mis Evaluaciones
                    </h1>
                    <p className="text-gray-400">
                        Tienes <span className="text-yellow-400 font-bold">{pending}</span> evaluaciones pendientes por completar.
                    </p>
                </header>

                {loading ? (
                    <div className="text-center py-12">Cargando...</div>
                ) : (
                    <div className="space-y-4">
                        {evaluations.length === 0 ? (
                            <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
                                <p className="text-gray-400">No tienes evaluaciones asignadas.</p>
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
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyEvaluations;
