import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvaluationTemplates } from '../../services/evaluation.service';
import { FiPlus, FiFileText } from 'react-icons/fi';

const EvaluationDashboard = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const data = await getEvaluationTemplates();
            setTemplates(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Evaluaciones de Desempeño</h1>
                    <p className="text-gray-400">Gestiona las plantillas y ciclos de evaluación.</p>
                </div>
                <div className="flex space-x-4">
                    <button
                        onClick={() => navigate('/performance/assign')}
                        className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                        <FiPlus className="mr-2" /> Asignar Evaluación
                    </button>
                    <button
                        onClick={() => navigate('/performance/create')}
                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        <FiPlus className="mr-2" /> Nueva Evaluación
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-white text-center">Cargando...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.length === 0 ? (
                        <div className="col-span-full text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700 border-dashed">
                            <FiFileText className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                            <p className="text-gray-400 text-lg">No hay evaluaciones creadas.</p>
                        </div>
                    ) : (
                        templates.map((t) => (
                            <div key={t.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-colors shadow-lg">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-white">{t.title}</h3>
                                    <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded-full border border-green-700">{t.period}</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{t.description || 'Sin descripción'}</p>

                                <div className="pt-4 border-t border-gray-700 flex justify-between items-center text-sm text-gray-500">
                                    <span>{Array.isArray(t.criteria) ? t.criteria.length : 0} Criterios</span>
                                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default EvaluationDashboard;
