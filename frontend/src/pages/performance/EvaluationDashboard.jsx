import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvaluationTemplates } from '../../services/evaluation.service';
import { FiPlus, FiFileText, FiEye } from 'react-icons/fi';
import EvaluationDetailModal from './components/EvaluationDetailModal';

const EvaluationDashboard = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
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

    const handleViewDetail = (template) => {
        setSelectedTemplate(template);
        setIsDetailOpen(true);
    };

    return (
        <div className="bg-slate-900 text-white rounded-2xl shadow-xl min-h-[calc(100vh-8rem)] p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                            Evaluaciones de Desempeño
                        </h1>
                        <p className="text-slate-400 text-lg">Gestiona las plantillas y ciclos de evaluación.</p>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300"
                        >
                            Volver
                        </button>
                        <button
                            onClick={() => navigate('/performance/assign')}
                            className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-lg font-medium"
                        >
                            <FiPlus className="mr-2" /> Asignar Evaluación
                        </button>
                        <button
                            onClick={() => navigate('/performance/create')}
                            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg font-medium"
                        >
                            <FiPlus className="mr-2" /> Nueva Evaluación
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-slate-400">Cargando evaluaciones...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.length === 0 ? (
                            <div className="col-span-full text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700 border-dashed">
                                <FiFileText className="mx-auto h-16 w-16 text-slate-600 mb-4" />
                                <h3 className="text-xl font-semibold text-slate-300 mb-2">Sin Evaluaciones</h3>
                                <p className="text-slate-500">Comienza creando una nueva plantilla de evaluación.</p>
                            </div>
                        ) : (
                            templates.map((t) => (
                                <div
                                    key={t.id}
                                    className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800 transition-all shadow-lg hover:shadow-blue-500/10 group cursor-pointer"
                                    onClick={() => handleViewDetail(t)}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{t.title}</h3>
                                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20 whitespace-nowrap">
                                            {t.period}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm mb-6 line-clamp-3 h-10">
                                        {t.description || 'Sin descripción disponible para esta evaluación.'}
                                    </p>

                                    <div className="pt-4 border-t border-white/5 flex justify-between items-center text-sm text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-slate-700 px-2 py-0.5 rounded text-xs text-slate-300">
                                                {Array.isArray(t.criteria) ? t.criteria.length : 0} Criterios
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewDetail(t);
                                            }}
                                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
                                        >
                                            <FiEye /> Ver Detalles
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            <EvaluationDetailModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                template={selectedTemplate}
            />
        </div>
    );
};

export default EvaluationDashboard;
