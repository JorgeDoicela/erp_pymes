import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMyPendingEvaluations, submitAssessment } from '../../services/evaluation.service';
import { FiSave, FiAlertCircle } from 'react-icons/fi';

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

        if (scale.type === 'numeric' || scale.type === '1-5' || scale.type === '1-10') {
            const max = scale.max || (scale.type === '1-5' ? 5 : 10);
            const min = scale.min || 1;

            // Create array of numbers
            const options = [];
            for (let i = min; i <= max; i++) options.push(i);

            return (
                <div className="flex gap-4 mt-2">
                    {options.map(num => (
                        <label key={num} className={`flex flex-col items-center cursor-pointer p-3 rounded-lg border ${currentVal == num ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'}`}>
                            <input
                                type="radio"
                                name={criteria.name}
                                value={num}
                                checked={currentVal == num}
                                onChange={() => handleValueChange(criteria.name, num)}
                                className="hidden"
                            />
                            <span className="font-bold text-lg">{num}</span>
                        </label>
                    ))}
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
                    <div className="text-right text-blue-400 font-bold mt-1">{currentVal || 0}%</div>
                </div>
            );
        }
        return <p className="text-red-500">Tipo de escala no soportado visualmente.</p>;
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 pb-24">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">{template.title}</h1>
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-blue-200 text-sm">
                        <h3 className="font-bold mb-1 flex items-center"><FiAlertCircle className="mr-2" /> Instrucciones</h3>
                        <p>{template.instructions || 'Completa esta evaluación con objetividad.'}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {template.criteria.map((c, idx) => (
                        <div key={idx} className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                            <div className="mb-3">
                                <h3 className="text-lg font-bold text-white mb-1">{c.name}</h3>
                                {c.description && <p className="text-sm text-gray-300 mb-2 italic">{c.description}</p>}
                                <p className="text-xs text-gray-400 uppercase tracking-widest">{c.type} {c.weight ? `(Peso: ${c.weight}%)` : ''}</p>
                            </div>
                            {renderInput(c)}
                        </div>
                    ))}

                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-3">Comentarios Generales <span className="text-red-500">*</span></h3>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            className="w-full bg-gray-900 border-gray-600 rounded-lg p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none h-32"
                            placeholder="Escribe tus observaciones finales aquí (Obligatorio)..."
                        ></textarea>
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/90 backdrop-blur-md border-t border-gray-700 flex justify-center">
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`w-full max-w-md bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform hover:scale-105 flex justify-center items-center ${submitting ? 'opacity-50' : ''}`}
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
