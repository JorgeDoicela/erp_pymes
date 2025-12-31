import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvaluationTemplate } from '../../services/evaluation.service';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft } from 'react-icons/fi';

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
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/performance')}
                    className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
                >
                    <FiArrowLeft className="mr-2" /> Volver al Tablero
                </button>

                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Nueva Evaluación de Desempeño
                </h1>
                <p className="text-gray-400 mb-8">Configura los parámetros, criterios y escalas para la nueva evaluación.</p>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* General Info */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-blue-300">Información General</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre de la Evaluación</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ej: Evaluación Anual 2024"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Periodo</label>
                                <input
                                    type="text"
                                    name="period"
                                    value={formData.period}
                                    onChange={handleInputChange}
                                    className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ej: 2024-Q1"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-400 mb-1">Descripción</label>
                                <input
                                    type="text"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Breve descripción del propósito de esta evaluación"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-400 mb-1">Instrucciones</label>
                                <textarea
                                    name="instructions"
                                    value={formData.instructions}
                                    onChange={handleInputChange}
                                    className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none h-24"
                                    placeholder="Instrucciones para los evaluadores..."
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Configuration */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-purple-300">Configuración de Escala</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Tipo de Escala</label>
                            <select
                                onChange={handleScaleChange}
                                className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="1-5">Escala Numérica (1-5)</option>
                                <option value="1-10">Escala Numérica (1-10)</option>
                                <option value="percentage">Porcentaje (0-100%)</option>
                            </select>
                        </div>
                    </div>

                    {/* Criteria Builder */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-green-300">Criterios de Evaluación</h2>
                        </div>

                        {/* Add New Criteria */}
                        <div className="bg-gray-700/50 rounded-lg p-4 mb-6 border border-gray-600/50">
                            <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Agregar Nuevo Criterio</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div className="md:col-span-2">
                                    <input
                                        type="text"
                                        placeholder="Nombre del criterio (Ej: Trabajo en equipo)"
                                        value={newCriteria.name}
                                        onChange={(e) => setNewCriteria(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full bg-gray-700 border-gray-600 rounded-lg p-2 text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <select
                                        value={newCriteria.type}
                                        onChange={(e) => setNewCriteria(prev => ({ ...prev, type: e.target.value }))}
                                        className="w-full bg-gray-700 border-gray-600 rounded-lg p-2 text-white text-sm"
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
                                        className="w-full bg-gray-700 border-gray-600 rounded-lg p-2 text-white text-sm"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={addCriteria}
                                className="flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium w-full md:w-auto"
                            >
                                <FiPlus className="mr-1" /> Agregar Criterio
                            </button>
                        </div>

                        {/* List */}
                        <div className="space-y-3">
                            {formData.criteria.length === 0 ? (
                                <p className="text-center text-gray-500 py-4 italic">No se han agregado criterios aún.</p>
                            ) : (
                                formData.criteria.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg border-l-4 border-green-500">
                                        <div>
                                            <p className="font-semibold text-white">{item.name}</p>
                                            <p className="text-xs text-gray-400">{item.type} {item.weight && `• Peso: ${item.weight}%`}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeCriteria(item.id)}
                                            className="text-gray-400 hover:text-red-400 p-2"
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
                            className={`flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
