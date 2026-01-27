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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

                {/* Header */}
                <div className="p-6 border-b border-slate-700 flex justify-between items-start bg-slate-800/50">
                    <div className="flex-1 pr-4">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h2 className="text-2xl font-bold text-white">{template.title}</h2>
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full border border-blue-500/30">
                                {template.period}
                            </span>
                        </div>
                        {template.description && (
                            <p className="text-slate-400 text-sm">{template.description}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors flex-shrink-0"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Instructions */}
                    {template.instructions && (
                        <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <FiInfo className="text-white" /> Instrucciones
                            </h3>
                            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {template.instructions}
                            </p>
                        </div>
                    )}

                    {/* Scale Configuration */}
                    <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <FiLayers className="text-white" /> Escala de Evaluación
                        </h3>
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-700">
                                <span className="text-slate-500 text-xs block mb-1">Tipo</span>
                                <span className="text-white font-semibold">
                                    {scale.type === 'numeric' ? 'Numérica' :
                                        scale.type === 'percentage' ? 'Porcentaje' :
                                            scale.label || 'No especificado'}
                                </span>
                            </div>
                            {scale.min !== undefined && scale.max !== undefined && (
                                <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-700">
                                    <span className="text-slate-500 text-xs block mb-1">Rango</span>
                                    <span className="text-white font-semibold">
                                        {scale.min} - {scale.max}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Criteria List */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <FiList className="text-emerald-500" /> Criterios de Evaluación ({criteria.length})
                        </h3>

                        <div className="space-y-3">
                            {criteria.length > 0 ? (
                                criteria.map((item, index) => (
                                    <div key={item.id || index} className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-white text-lg mb-1">{item.name}</h4>
                                                {item.description && (
                                                    <p className="text-slate-400 text-sm mb-3">{item.description}</p>
                                                )}
                                                <div className="flex gap-2 flex-wrap">
                                                    <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300 border border-slate-600">
                                                        {item.type || 'Competencia'}
                                                    </span>
                                                    {item.weight && (
                                                        <span className="px-2 py-1 bg-emerald-900/30 text-emerald-400 rounded text-xs border border-emerald-900/50">
                                                            Peso: {item.weight}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-xs font-mono text-slate-400 flex-shrink-0">
                                                {index + 1}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 bg-slate-800/30 rounded-xl border border-slate-700 border-dashed">
                                    <p className="text-slate-500 italic">No hay criterios definidos para esta evaluación.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EvaluationDetailModal;

