import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvaluationTemplates } from '../../services/evaluation.service';
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
        <div className="space-y-5">
            {/* Header ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Rendimiento · Plantillas</p>
                    <h1 className="text-xl font-semibold text-gray-900">Evaluaciones de Desempeño</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Gestiona las plantillas de evaluación y ciclos de desempeño del personal.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => navigate('/performance/assign')}
                        className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                    >
                        Asignar Evaluación
                    </button>
                    <button
                        onClick={() => navigate('/performance/create')}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
                    >
                        + Nueva Plantilla
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center text-gray-400 text-xs">Cargando evaluaciones...</div>
            ) : templates.length === 0 ? (
                <div className="p-12 text-center bg-white border border-gray-200 rounded">
                    <p className="text-sm font-medium text-gray-700">Sin plantillas de evaluación</p>
                    <p className="text-xs text-gray-400 mt-1">Crea una nueva plantilla para iniciar la evaluación de desempeño.</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Título de la Evaluación</th>
                                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Periodo</th>
                                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Criterios</th>
                                <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {templates.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50/60 transition-colors cursor-pointer" onClick={() => handleViewDetail(t)}>
                                    <td className="py-2.5 px-4 font-medium text-gray-900">{t.title}</td>
                                    <td className="py-2.5 px-4">
                                        <span className="px-2 py-0.5 rounded text-[11px] font-mono border bg-gray-50 text-gray-700 border-gray-200">
                                            {t.period}
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-4 text-gray-500 truncate max-w-xs">{t.description || '—'}</td>
                                    <td className="py-2.5 px-4 text-center font-mono text-gray-700">
                                        {Array.isArray(t.criteria) ? t.criteria.length : 0}
                                    </td>
                                    <td className="py-2.5 px-4 text-right">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewDetail(t);
                                            }}
                                            className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                                        >
                                            Ver detalle →
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <EvaluationDetailModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                template={selectedTemplate}
            />
        </div>
    );
};

export default EvaluationDashboard;
