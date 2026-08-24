import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiZap, FiTarget, FiFileText, FiArrowRight, FiArrowLeft, FiSave, FiDollarSign, FiActivity } from 'react-icons/fi';
import entrepreneurshipService from '../../services/entrepreneurship.service';
import { toast } from 'react-hot-toast';

const ProjectForm = () => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.email === 'admin@emplifi.com';

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        industry: '',
        stage: 'IDEATION',
        ownerId: currentUser?.id,
        budget: '',
        innovationScore: 70,
        pitchNarrative: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSuperAdmin) {
            toast.error('Modo Supervisión: El SuperAdministrador no puede crear o modificar proyectos.');
            return;
        }
        setLoading(true);
        try {
            await entrepreneurshipService.createProject(formData);
            toast.success('¡Proyecto lanzado con éxito!');
            navigate('/entrepreneurship');
        } catch (error) {
            toast.error('Error al lanzar el proyecto');
        } finally {
            setLoading(false);
        }
    };

    const stages = [
        { id: 'IDEATION', label: 'Ideación', desc: 'Tengo una idea y estoy explorando el mercado.' },
        { id: 'VALIDATION', label: 'Validación', desc: 'Tengo un plan y estoy validando con clientes.' },
        { id: 'MVP', label: 'MVP / Prototipo', desc: 'Tengo un producto mínimo viable construido.' },
        { id: 'SCALING', label: 'Escalamiento', desc: 'Tengo ventas y quiero crecer exponencialmente.' }
    ];

    return (
        <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-white rounded border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 p-5">
                    <h2 className="text-base font-semibold text-gray-900">
                        Registro de Proyecto de Emprendimiento
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Definición de propuesta de valor, mercado y parámetros de incubación.</p>
                </div>

                <div className="p-5 space-y-6">
                    {/* Stepper */}
                    <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                        {[
                            { s: 1, label: '1. Concepto y Mercado' },
                            { s: 2, label: '2. Parámetros Operativos' }
                        ].map(stepInfo => (
                            <div key={stepInfo.s} className="flex items-center gap-2">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${step === stepInfo.s ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-400'}`}>
                                    {stepInfo.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                        {step === 1 ? (
                            <div className="space-y-3.5">
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">
                                        Nombre del Proyecto *
                                    </label>
                                    <input 
                                        type="text" 
                                        name="title"
                                        required
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="Ej: AgroScan, Soluciones Logísticas, etc."
                                        className="w-full px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500 font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">
                                        Industria / Sector *
                                    </label>
                                    <input 
                                        type="text" 
                                        name="industry"
                                        required
                                        value={formData.industry}
                                        onChange={handleChange}
                                        placeholder="Ej: Fintech, Agritech, Logística, Retail..."
                                        className="w-full px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Descripción y Propuesta de Valor *</label>
                                    <textarea 
                                        name="description"
                                        required
                                        rows="4"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Describa el problema que resuelve y la solución diferencial..."
                                        className="w-full px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                                    />
                                </div>

                                <div className="pt-3 border-t border-gray-200 flex justify-end">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(2)}
                                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                                    >
                                        Continuar a Parámetros <FiArrowRight size={13} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="block font-medium text-gray-700 mb-1">
                                            Presupuesto Inicial ($ USD)
                                        </label>
                                        <input 
                                            type="number" 
                                            name="budget"
                                            value={formData.budget}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            className="w-full px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-medium text-gray-700 mb-1">
                                            Nivel de Innovación (0-100)
                                        </label>
                                        <div className="flex items-center gap-3 bg-gray-50 px-3 py-1 rounded border border-gray-200">
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="100" 
                                                name="innovationScore"
                                                value={formData.innovationScore}
                                                onChange={handleChange}
                                                className="flex-1 accent-blue-600"
                                            />
                                            <span className="font-mono font-semibold text-gray-800 text-xs w-6">{formData.innovationScore}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">
                                        Discurso Resumido (Elevator Pitch)
                                    </label>
                                    <textarea 
                                        name="pitchNarrative"
                                        rows="3"
                                        value={formData.pitchNarrative}
                                        onChange={handleChange}
                                        placeholder="Resumen ejecutivo del problema, solución y modelo de monetización..."
                                        className="w-full px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block font-medium text-gray-700 mb-2">Etapa de Madurez del Proyecto</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                        {stages.map(s => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, stage: s.id })}
                                                className={`p-3 rounded border text-left transition-colors cursor-pointer ${formData.stage === s.id ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-semibold' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}`}
                                            >
                                                <span className="block text-xs font-semibold mb-0.5">
                                                    {s.label}
                                                </span>
                                                <span className="text-[11px] text-gray-500 font-normal">{s.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-between gap-2 pt-3 border-t border-gray-200">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(1)}
                                        className="px-3.5 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 font-medium transition-colors"
                                    >
                                        <FiArrowLeft size={13} className="inline mr-1" /> Volver
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={loading}
                                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors shadow-xs"
                                    >
                                        {loading ? 'Guardando...' : <><FiSave size={13} className="inline mr-1" /> Registrar Emprendimiento</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProjectForm;
