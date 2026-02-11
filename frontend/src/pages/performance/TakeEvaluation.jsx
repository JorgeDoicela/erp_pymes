import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMyPendingEvaluations, submitAssessment } from '../../services/evaluation.service';
import { FiSave, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';

const TakeEvaluation = () => {
    const { id } = useParams(); // This is the review ID (EvaluationReviewer ID)
    const navigate = useNavigate();

    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [responses, setResponses] = useState({}); // { criteriaName: value } - Ideally criteria ID if we had IDs, but JSON stores array of objects.
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchReview = async () => {
            try {
                // In a real app, we might have a specific endpoint to get ONE review by ID.
                // Reusing getMyPendingEvaluations for simplicity and finding locally.
                const data = await getMyPendingEvaluations();
                const found = data.find(r => r.id === id);
                if (found) {
                    setReview(found);
                    // Initialize responses if draft exists (parsed from JSON in backend controller potentially, but currently string in DB, handled by controller map)
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

        // Validation: Check if all criteria have a value?
        // Depends on strictness. Let's enforce it.
        const criteriaList = review.evaluation.template.criteria;
        const missing = criteriaList.some(c => !responses[c.name]);

        if (missing) {
            if (!window.confirm("Algunos criterios no han sido evaluados. ¿Deseas enviarla incompleta (se podría rechazar)?")) {
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

    if (loading) return <div className="p-8 text-white">Cargando evaluación...</div>;
    if (!review) return null;

    const { template } = review.evaluation;
    // Scale config
    const scale = template.scale;
    // Example scale: { type: "numeric", min: 1, max: 5 }

    const renderInput = (criteria) => {
        const currentVal = responses[criteria.name] || '';

        if (scale.type === 'numeric' || scale.type === '1-5' || scale.type === '1-10' || (!scale.type && scale.min && scale.max)) {
            const max = scale.max || (scale.type === '1-5' ? 5 : 10);
            const min = scale.min || 1;

            // Create array of numbers
            const options = [];
            for (let i = min; i <= max; i++) options.push(i);

            return (
                <div className="grid grid-cols-5 md:flex md:flex-wrap gap-2 md:gap-4 mt-2">
                    {options.map(num => {
                        const isSelected = currentVal == num;
                        // Color scale from Red (low) to Green (high) logic could go here, simplified to blue for now but clearer UI
                        return (
                            <label key={num} className={`
                                relative flex flex-col items-center justify-center cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 group
                                ${isSelected
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg transform scale-105'
                                    : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-600'}
                            `}>
                                <input
                                    type="radio"
                                    name={criteria.name}
                                    value={num}
                                    checked={isSelected}
                                    onChange={() => handleValueChange(criteria.name, num)}
                                    className="hidden"
                                />
                                <span className={`text-2xl font-bold mb-1 ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-slate-500'}`}>{num}</span>
                                <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                                    {num === min ? 'Bajo' : (num === max ? 'Exc.' : '-')}
                                </span>
                            </label>
                        );
                    })}
                </div>
            );
        } else if (scale.type === 'percentage') {
            return (
                <div className="mt-2">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={currentVal || 0}
                        onChange={(e) => handleValueChange(criteria.name, e.target.value)}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-right text-blue-600 font-bold mt-1">{currentVal || 0}%</div>
                </div>
            );
        }
        return <p className="text-red-500">Tipo de escala no soportado visualmente.</p>;
    };

    return (
        <div className="min-h-screen bg-white text-slate-800 p-6 pb-24">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/performance/my-evaluations')}
                    className="mb-6 flex items-center text-slate-500 hover:text-slate-800 transition-colors font-medium"
                >
                    <FiArrowLeft className="mr-2" /> Volver a Mis Evaluaciones
                </button>
                <div className="mb-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 border-b border-slate-100 pb-4">
                        <div>
                            <h2 className="text-sm text-blue-600 uppercase tracking-wider font-bold mb-1">Evaluación de Desempeño</h2>
                            <h1 className="text-3xl font-bold text-slate-800">{template.title}</h1>
                        </div>
                        <div className="text-right">
                            <span className="block text-xs text-slate-500 uppercase">Estás evaluando a:</span>
                            <span className="text-xl font-bold text-slate-800">
                                {review.evaluation.employee.firstName} {review.evaluation.employee.lastName}
                            </span>
                            <span className="block text-sm text-slate-500">{review.evaluation.employee.position}</span>
                        </div>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4 text-blue-800 flex items-start gap-3 border border-blue-100">
                        <FiAlertCircle className="mt-1 flex-shrink-0 text-blue-600" size={20} />
                        <div>
                            <p className="font-medium mb-1">Instrucciones:</p>
                            <p className="text-sm opacity-90">{template.instructions || 'Por favor evalúa cada competencia objetivamente basándote en el desempeño observado durante el periodo.'}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {template.criteria.map((c, idx) => (
                        <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                            <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 text-sm font-bold text-slate-600 shadow-sm">{idx + 1}</span>
                                        <h3 className="text-xl font-bold text-slate-800">{c.name}</h3>
                                    </div>
                                    {c.description && <p className="text-slate-500 text-sm pl-11">{c.description}</p>}
                                </div>
                                <div className="text-right min-w-[120px]">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Peso</span>
                                    <span className="bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded text-xs font-bold shadow-sm">{c.weight ? `${c.weight}%` : 'N/A'}</span>
                                </div>
                            </div>

                            <div className="p-6 bg-white">
                                <p className="text-sm text-slate-500 mb-3 uppercase tracking-wider font-bold">Selecciona una calificación:</p>
                                {renderInput(c)}
                            </div>
                        </div>
                    ))}

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-3">Comentarios Generales <span className="text-red-500">*</span></h3>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-4 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none h-32 placeholder:text-slate-400"
                            placeholder="Escribe tus observaciones finales aquí (Obligatorio)..."
                        ></textarea>
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 flex justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`w-full max-w-md bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform hover:scale-105 flex justify-center items-center ${submitting ? 'opacity-50' : ''}`}
                        >
                            <FiSave className="mr-2 text-xl" />
                            {submitting ? 'Enviando...' : 'Finalizar y Enviar Evaluación'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TakeEvaluation;
