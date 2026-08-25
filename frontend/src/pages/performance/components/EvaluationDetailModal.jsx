import Modal from '../../../components/common/Modal';

const EvaluationDetailModal = ({ isOpen, onClose, template }) => {
    if (!template) return null;

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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={template.title}
            subtitle={template.description || `Periodo: ${template.period}`}
            size="lg"
            footer={
                <button
                    onClick={onClose}
                    className="px-3.5 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                >
                    Cerrar
                </button>
            }
        >
            <div className="space-y-4 max-h-[65vh] overflow-y-auto">
                {/* Instructions */}
                {template.instructions && (
                    <div className="bg-gray-50 rounded p-3.5 border border-gray-200">
                        <h4 className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                            Instrucciones para Evaluadores
                        </h4>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {template.instructions}
                        </p>
                    </div>
                )}

                {/* Scale Configuration */}
                <div className="bg-gray-50 rounded p-3.5 border border-gray-200 flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider block mb-0.5">
                            Escala de Puntuación
                        </span>
                        <span className="text-gray-600">
                            {scale.type === 'numeric' ? 'Numérica' :
                                scale.type === 'percentage' ? 'Porcentaje' :
                                    scale.label || 'Estándar'}
                        </span>
                    </div>
                    {scale.min !== undefined && scale.max !== undefined && (
                        <span className="font-mono font-semibold text-gray-900 text-xs bg-white px-2.5 py-1 rounded border border-gray-200">
                            Rango: {scale.min} a {scale.max} pts
                        </span>
                    )}
                </div>

                {/* Criteria List */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider">
                            Criterios y Competencias Evaluadas ({criteria.length})
                        </h4>
                    </div>

                    <div className="divide-y divide-gray-100 border border-gray-200 rounded overflow-hidden">
                        {criteria.length > 0 ? (
                            criteria.map((item, index) => (
                                <div key={item.id || index} className="p-3 bg-white hover:bg-gray-50/50 transition-colors flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-gray-400 text-[11px]">{index + 1}.</span>
                                            <h5 className="font-medium text-gray-900">{item.name}</h5>
                                            {item.type && (
                                                <span className="px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded text-[10px] border border-gray-200">
                                                    {item.type}
                                                </span>
                                            )}
                                        </div>
                                        {item.description && (
                                            <p className="text-gray-500 text-[11px] mt-1 pl-4">{item.description}</p>
                                        )}
                                    </div>
                                    {item.weight && (
                                        <span className="font-mono text-[11px] font-medium text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 shrink-0">
                                            Peso: {item.weight}%
                                        </span>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-gray-400">
                                No hay criterios configurados en esta plantilla.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default EvaluationDetailModal;
