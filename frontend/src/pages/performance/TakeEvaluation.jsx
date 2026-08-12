import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMyPendingEvaluations, submitAssessment } from '../../services/evaluation.service';
import { FiSave, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';

const TakeEvaluation = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [responses, setResponses] = useState({});
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchReview = async () => {
            try {
                const data = await getMyPendingEvaluations();
                const found = data.find(r => r.id === id);
                if (found) {
                    setReview(found);
                    if (found.responses) {
                        setResponses(JSON.parse(found.responses));
                    }
                    if (found.comments) setComments(found.comments);
                } else {
                    alert('Evaluación no encontrada o no tienes acceso.');
                    navigate('/performance/my-evaluations');
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchReview();
    }, [id, navigate]);

    const handleValueChange = (criteriaName, value) => {
        setResponses(prev => ({
            ...prev,
            [criteriaName]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const criteriaList = review?.evaluation?.template?.criteria || [];
        const missing = Array.isArray(criteriaList) && criteriaList.some(c => !responses[c.name]);

        if (missing) {
            if (!window.confirm("Algunos criterios no han sido evaluados. ¿Deseas enviarla incompleta?")) {
                return;
            }
        }

        if (!comments.trim()) {
            alert("Los comentarios generales son obligatorios para completar la evaluación.");
            return;
        }

        setSubmitting(true);
        try {
            await submitAssessment({
                reviewerId: id,
                responses: responses,
                comments: comments,
                status: 'COMPLETED'
            });
            alert('Evaluación enviada con éxito.');
            navigate('/performance/my-evaluations');
        } catch (error) {
            console.error(error);
            alert('Error al enviar la evaluación.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-xs text-gray-400 font-mono">Cargando evaluación...</div>;
    if (!review) return null;

    const { template } = review.evaluation;
    const scale = template.scale;

    const renderInput = (criteria) => {
        const currentVal = responses[criteria.name] || '';

        if (scale.type === 'numeric' || scale.type === '1-5' || scale.type === '1-10' || (!scale.type && scale.min && scale.max)) {
            const max = scale.max || (scale.type === '1-5' ? 5 : 10);
            const min = scale.min || 1;

            const options = [];
            for (let i = min; i <= max; i++) options.push(i);

            return (
                <div className="flex flex-wrap gap-2 mt-2">
                    {options.map(num => {
                        const isSelected = currentVal == num;
                        return (
                            <label key={num} className={`
                                relative flex items-center justify-center cursor-pointer w-9 h-9 rounded border text-xs font-mono font-semibold transition-colors
                                ${isSelected
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}
                            `}>
                                <input
                                    type="radio"
                                    name={criteria.name}
                                    value={num}
                                    checked={isSelected}
                                    onChange={() => handleValueChange(criteria.name, num)}
                                    className="hidden"
                                />
                                <span>{num}</span>
                            </label>
                        );
                    })}
                </div>
            );
        } else if (scale.type === 'percentage') {
            return (
                <div className="mt-2 space-y-1">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={currentVal || 0}
                        onChange={(e) => handleValueChange(criteria.name, e.target.value)}
                        className="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer"
                    />
                    <div className="text-right text-xs font-mono font-semibold text-gray-900">{currentVal || 0}%</div>
                </div>
            );
        }
        return <p className="text-xs text-red-600 font-medium">Tipo de escala no soportado.</p>;
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-20">
            <button
                onClick={() => navigate('/performance/my-evaluations')}
                className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
                <FiArrowLeft className="w-3.5 h-3.5" /> Volver a Mis Evaluaciones
            </button>

            {/* Header */}
            <div className="bg-white p-5 rounded border border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-gray-100">
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                            Evaluación de Desempeño
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">{template.title}</h1>
                    </div>
                    <div className="text-left md:text-right">
                        <span className="block text-[11px] text-gray-400 uppercase font-semibold tracking-wider">Evaluando a:</span>
                        <span className="text-sm font-bold text-gray-900">
                            {review.evaluation.employee.firstName} {review.evaluation.employee.lastName}
                        </span>
                        <span className="block text-xs text-gray-500">{review.evaluation.employee.position}</span>
                    </div>
                </div>

                <div className="bg-gray-50 rounded p-3 text-xs text-gray-700 border border-gray-200 mt-4 flex items-start gap-2">
                    <FiAlertCircle className="mt-0.5 text-gray-500 shrink-0" />
                    <div>
                        <p className="font-semibold text-gray-900">Instrucciones:</p>
                        <p className="text-gray-600 mt-0.5">{template.instructions || 'Por favor evalúa cada competencia objetivamente basándote en el desempeño observado durante el periodo.'}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {template.criteria.map((c, idx) => (
                    <div key={idx} className="bg-white rounded border border-gray-200 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-semibold text-gray-500">{idx + 1}.</span>
                                    <h3 className="font-semibold text-xs text-gray-900">{c.name}</h3>
                                </div>
                                {c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}
                            </div>
                            {c.weight && (
                                <span className="bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded text-[11px] font-mono">
                                    Peso: {c.weight}%
                                </span>
                            )}
                        </div>

                        <div className="p-4 bg-white">
                            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">Selecciona calificación:</p>
                            {renderInput(c)}
                        </div>
                    </div>
                ))}

                <div className="bg-white p-4 rounded border border-gray-200 space-y-2">
                    <label className="block text-xs font-semibold text-gray-700">
                        Comentarios Generales <span className="text-red-600">*</span>
                    </label>
                    <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded p-3 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 h-28 resize-none"
                        placeholder="Escribe tus observaciones finales aquí (Obligatorio)..."
                    ></textarea>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <FiSave className="w-3.5 h-3.5" />
                        {submitting ? 'Enviando...' : 'Finalizar y Enviar Evaluación'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TakeEvaluation;

