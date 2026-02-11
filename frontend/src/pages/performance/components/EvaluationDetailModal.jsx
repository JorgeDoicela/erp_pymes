import { FiX, FiInfo, FiLayers, FiList } from 'react-icons/fi';

const EvaluationDetailModal = ({ isOpen, onClose, template }) => {
    if (!isOpen || !template) return null;

    // Parse JSON fields safely
    const parseCriteria = () => {
        try {
            if (typeof template.criteria === 'string') {
                return JSON.parse(template.criteria);
            }
            return Array.isArray(template.criteria) ? template.criteria : [];
        } catch (e) {
            console.error('Error parsing criteria:', e);
            return [];
        }
    };

    const parseScale = () => {
        try {
            if (typeof template.scale === 'string') {
                return JSON.parse(template.scale);
            }
            return template.scale || {};
        } catch (e) {
            console.error('Error parsing scale:', e);
            return {};
        }
    };

    const criteria = parseCriteria();
    const scale = parseScale();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div className="flex-1 pr-4">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h2 className="text-2xl font-bold text-slate-800">{template.title}</h2>
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
                                {template.period}
                            </span>
                        </div>
                        {template.description && (
                            <p className="text-slate-500 text-sm">{template.description}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Instructions */}
                    {template.instructions && (
                        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                            <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <FiInfo className="text-blue-600" /> Instrucciones
                            </h3>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {template.instructions}
                            </p>
                        </div>
                    )}

                    {/* Scale Configuration */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <FiLayers className="text-slate-500" /> Escala de Evaluación
                        </h3>
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                                <span className="text-slate-400 text-xs block mb-1">Tipo</span>
                                <span className="text-slate-800 font-semibold">
                                    {scale.type === 'numeric' ? 'Numérica' :
                                        scale.type === 'percentage' ? 'Porcentaje' :
                                            scale.label || 'No especificado'}
                                </span>
                            </div>
                            {scale.min !== undefined && scale.max !== undefined && (
                                <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                                    <span className="text-slate-400 text-xs block mb-1">Rango</span>
                                    <span className="text-slate-800 font-semibold">
                                        {scale.min} - {scale.max}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Criteria List */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <FiList className="text-emerald-600" /> Criterios de Evaluación ({criteria.length})
                        </h3>

                        <div className="space-y-3">
                            {criteria.length > 0 ? (
                                criteria.map((item, index) => (
                                    <div key={item.id || index} className="bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-800 text-lg mb-1">{item.name}</h4>
                                                {item.description && (
                                                    <p className="text-slate-500 text-sm mb-3">{item.description}</p>
                                                )}
                                                <div className="flex gap-2 flex-wrap">
                                                    <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 border border-slate-200 font-medium">
                                                        {item.type || 'Competencia'}
                                                    </span>
                                                    {item.weight && (
                                                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs border border-emerald-100 font-bold">
                                                            Peso: {item.weight}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-xs font-mono text-slate-500 flex-shrink-0 border border-slate-200">
                                                {index + 1}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                                    <p className="text-slate-400 italic">No hay criterios definidos para esta evaluación.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors shadow-sm"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EvaluationDetailModal;

