import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvaluationTemplate } from '../../services/evaluation.service';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft, FiFileText } from 'react-icons/fi';

const CreateEvaluation = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        period: '',
        instructions: '',
        description: '',
        scale: { type: '1-5', min: 1, max: 5 },
        criteria: []
    });

    const [newCriteria, setNewCriteria] = useState({
        name: '',
        type: 'Competencia', // Competencia, Objetivo
        weight: '',
        description: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleScaleChange = (e) => {
        const value = e.target.value;
        let newScale = { type: value };
        if (value === '1-5') {
            newScale = { type: 'numeric', min: 1, max: 5, label: 'Escala 1 al 5' };
        } else if (value === '1-10') {
            newScale = { type: 'numeric', min: 1, max: 10, label: 'Escala 1 al 10' };
        } else if (value === 'percentage') {
            newScale = { type: 'percentage', min: 0, max: 100, label: 'Porcentaje (0-100%)' };
        }
        setFormData(prev => ({ ...prev, scale: newScale }));
    };

    const addCriteria = () => {
        if (!newCriteria.name) return;
        setFormData(prev => ({
            ...prev,
            criteria: [...prev.criteria, { ...newCriteria, id: Date.now() }]
        }));
        setNewCriteria({ name: '', type: 'Competencia', weight: '', description: '' });
    };

    const removeCriteria = (id) => {
        setFormData(prev => ({
            ...prev,
            criteria: prev.criteria.filter(c => c.id !== id)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createEvaluationTemplate(formData);
            // Success feedback could involve a toast, here we just separate concerns
            alert('Plantilla de evaluación creada con éxito');
            navigate('/performance');
        } catch (error) {
            console.error(error);
            alert('Error al crear la plantilla');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/performance')}
                    className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors font-medium"
                >
                    <FiArrowLeft className="mr-2" /> Volver al Tablero
                </button>

                <h1 className="text-3xl font-bold mb-2 text-slate-800 tracking-tight">
                    Nueva Plantilla de Evaluación
                </h1>
                <p className="text-slate-500 mb-8">Define los criterios y estructura para las evaluaciones.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-semibold mb-6 text-slate-800 flex items-center">
                            <FiFileText className="mr-2 text-blue-600" /> Información General
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Título de la Evaluación</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Evaluación Anual 2024"
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24"
                                    placeholder="Describe el propósito de esta evaluación..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Periodo</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.period}
                                    onChange={e => setFormData({ ...formData, period: e.target.value })}
                                >
                                    <option value="Q1 2024">Q1 2024</option>
                                    <option value="Q2 2024">Q2 2024</option>
                                    <option value="Q3 2024">Q3 2024</option>
                                    <option value="Q4 2024">Q4 2024</option>
                                    <option value="Anual 2024">Anual 2024</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Instrucciones</label>
                                <textarea
                                    name="instructions"
                                    value={formData.instructions}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24"
                                    placeholder="Instrucciones para los evaluadores..."
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Configuration */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-semibold mb-4 text-slate-800">Configuración de Escala</h2>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Escala</label>
                            <select
                                onChange={handleScaleChange}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            >
                                <option value="1-5">Escala Numérica (1-5)</option>
                                <option value="1-10">Escala Numérica (1-10)</option>
                                <option value="percentage">Porcentaje (0-100%)</option>
                            </select>
                        </div>
                    </div>

                    {/* Criteria Builder */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-slate-800">Criterios de Evaluación</h2>
                        </div>

                        {/* Add New Criteria */}
                        <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
                            <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider">Agregar Nuevo Criterio</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div className="md:col-span-2">
                                    <input
                                        type="text"
                                        placeholder="Nombre del criterio (Ej: Trabajo en equipo)"
                                        value={newCriteria.name}
                                        onChange={(e) => setNewCriteria(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-sm mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <textarea
                                        placeholder="Descripción detallada del criterio (Opcional)"
                                        value={newCriteria.description}
                                        onChange={(e) => setNewCriteria(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-sm h-16 focus:ring-2 focus:ring-blue-500 outline-none"
                                    ></textarea>
                                </div>
                                <div>
                                    <select
                                        value={newCriteria.type}
                                        onChange={(e) => setNewCriteria(prev => ({ ...prev, type: e.target.value }))}
                                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="Competencia">Competencia</option>
                                        <option value="Objetivo">Objetivo</option>
                                    </select>
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Peso % (opcional)"
                                        value={newCriteria.weight}
                                        onChange={(e) => setNewCriteria(prev => ({ ...prev, weight: e.target.value }))}
                                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={addCriteria}
                                className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium w-full md:w-auto shadow-sm"
                            >
                                <FiPlus className="mr-1" /> Agregar Criterio
                            </button>
                        </div>

                        {/* List */}
                        <div className="space-y-3">
                            {formData.criteria.length === 0 ? (
                                <p className="text-center text-slate-500 py-4 italic">No se han agregado criterios aún.</p>
                            ) : (
                                formData.criteria.map((item) => (
                                    <div key={item.id} className="flex justify-between items-start bg-white p-3 rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
                                        <div>
                                            <p className="font-semibold text-slate-800">{item.name}</p>
                                            <p className="text-xs text-slate-500 mb-1">{item.description}</p>
                                            <p className="text-xs text-slate-400 italic">{item.type} {item.weight && `• Peso: ${item.weight}%`}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeCriteria(item.id)}
                                            className="text-slate-400 hover:text-red-500 p-2 transition-colors"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg hover:shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <FiSave className="mr-2" />
                            {loading ? 'Guardando...' : 'Crear Evaluación'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEvaluation;
