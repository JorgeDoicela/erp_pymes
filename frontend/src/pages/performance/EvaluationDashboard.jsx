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
        <div className="space-y-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">
                            Evaluaciones de Desempeño
                        </h1>
                        <p className="text-slate-500 text-lg">Gestiona las plantillas y ciclos de evaluación.</p>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors font-medium"
                        >
                            Volver
                        </button>
                        <button
                            onClick={() => navigate('/performance/assign')}
                            className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md font-medium"
                        >
                            <FiPlus className="mr-2" /> Asignar Evaluación
                        </button>
                        <button
                            onClick={() => navigate('/performance/create')}
                            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md font-medium"
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
                            <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
                                <FiFileText className="mx-auto h-16 w-16 text-slate-300 mb-4" />
                                <h3 className="text-xl font-semibold text-slate-700 mb-2">Sin Evaluaciones</h3>
                                <p className="text-slate-500">Comienza creando una nueva plantilla de evaluación.</p>
                            </div>
                        ) : (
                            templates.map((t) => (
                                <div
                                    key={t.id}
                                    className="bg-white rounded-xl p-6 border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all group cursor-pointer"
                                    onClick={() => handleViewDetail(t)}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{t.title}</h3>
                                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100 whitespace-nowrap">
                                            {t.period}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 text-sm mb-6 line-clamp-3 h-10">
                                        {t.description || 'Sin descripción disponible para esta evaluación.'}
                                    </p>

                                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-600 font-medium">
                                                {Array.isArray(t.criteria) ? t.criteria.length : 0} Criterios
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewDetail(t);
                                            }}
                                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium transition-colors"
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
