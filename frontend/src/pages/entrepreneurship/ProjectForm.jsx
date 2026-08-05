import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiZap, FiTarget, FiFileText, FiArrowRight, FiArrowLeft, FiSave, FiDollarSign, FiActivity } from 'react-icons/fi';
import entrepreneurshipService from '../../services/entrepreneurship.service';
import { toast } from 'react-hot-toast';

const ProjectForm = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        industry: '',
        stage: 'IDEATION',
        ownerId: JSON.parse(localStorage.getItem('user'))?.id,
        budget: '',
        innovationScore: 70,
        pitchNarrative: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
        <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fadeIn">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
                <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <FiZap size={100} className="text-amber-400" />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black flex items-center gap-3 tracking-tight">
                             Lanzar Emprendimiento Profesional
                        </h2>
                        <p className="opacity-60 text-sm mt-2 font-medium">Inicia tu proceso de incubación con estándares de nivel internacional.</p>
                    </div>
                </div>

                <div className="p-10">
                    {/* Stepper */}
                    <div className="flex items-center gap-6 mb-12">
                        {[
                            { s: 1, label: 'Concepto' },
                            { s: 2, label: 'Estrategia & BI' }
                        ].map(stepInfo => (
                            <React.Fragment key={stepInfo.s}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all shadow-sm ${step === stepInfo.s ? 'bg-indigo-600 text-white ring-4 ring-indigo-50' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                                        {stepInfo.s}
                                    </div>
                                    <span className={`text-sm font-bold uppercase tracking-widest ${step === stepInfo.s ? 'text-indigo-600' : 'text-slate-400'}`}>
                                        {stepInfo.label}
                                    </span>
                                </div>
                                {stepInfo.s === 1 && <div className="w-16 h-0.5 bg-slate-50 flex-shrink-0" />}
                            </React.Fragment>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {step === 1 ? (
                            <div className="space-y-8 animate-slideDown">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1 flex items-center gap-2">
                                        <FiFileText className="text-indigo-500" /> Nombre del Emprendimiento
                                    </label>
                                    <input 
                                        type="text" 
                                        name="title"
                                        required
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="Ej: AgroScan AI, Neobank Quitus, etc."
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 font-bold text-slate-800 text-lg"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1 flex items-center gap-2">
                                        <FiTarget className="text-indigo-500" /> Mercado / Vertical
                                    </label>
                                    <input 
                                        type="text" 
                                        name="industry"
                                        required
                                        value={formData.industry}
                                        onChange={handleChange}
                                        placeholder="Ej: Fintech, Agritech, SaaS..."
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 font-bold text-slate-800"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1 font-bold mb-2">Descripción y Propuesta de Valor</label>
                                    <textarea 
                                        name="description"
                                        required
                                        rows="5"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Describe el problema de mercado que has identificado y cómo tu solución lo resuelve de una forma única..."
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 resize-none font-medium text-slate-600 leading-relaxed"
                                    />
                                </div>

                                <button 
                                    type="button" 
                                    onClick={() => setStep(2)}
                                    className="w-full flex items-center justify-center gap-3 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95 group"
                                >
                                    Configurar Estrategia <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-slideDown">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1 flex items-center gap-2">
                                            <FiDollarSign className="text-emerald-500" /> Presupuesto Inicial (USD)
                                        </label>
                                        <input 
                                            type="number" 
                                            name="budget"
                                            value={formData.budget}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-mono font-bold text-slate-800"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1 flex items-center gap-2">
                                            <FiActivity className="text-amber-500" /> Puntaje de Innovación (0-100)
                                        </label>
                                        <div className="flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                                            <input 
                                                type="range" 
                                                min="0"
                                                max="100"
                                                name="innovationScore"
                                                value={formData.innovationScore}
                                                onChange={handleChange}
                                                className="flex-1 accent-indigo-600"
                                            />
                                            <span className="font-black text-indigo-600 text-lg w-8">{formData.innovationScore}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1 flex items-center gap-2">
                                        <FiFileText className="text-indigo-500" /> Elevator Pitch (Narrativa)
                                    </label>
                                    <textarea 
                                        name="pitchNarrative"
                                        rows="4"
                                        value={formData.pitchNarrative}
                                        onChange={handleChange}
                                        placeholder="Escribe tu pitch aquí para que nuestro motor predictivo lo optimice..."
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 font-medium text-slate-700 leading-relaxed"
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium px-2 italic">* Este texto será analizado mediante análisis predictivo de datos para proyectar el éxito.</p>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Etapa de Madurez Crítica</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {stages.map(s => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, stage: s.id })}
                                                className={`flex flex-col p-5 rounded-2xl border-2 text-left transition-all ${formData.stage === s.id ? 'border-indigo-600 bg-indigo-50 shadow-lg translate-y-[-2px]' : 'border-slate-50 bg-slate-50/50 hover:bg-white hover:border-slate-100'}`}
                                            >
                                                <span className={`font-black text-sm uppercase tracking-wider mb-1 ${formData.stage === s.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                                                    {s.label}
                                                </span>
                                                <span className="text-[11px] text-slate-500 leading-tight font-medium">{s.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-4 pt-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(1)}
                                        className="flex-1 flex items-center justify-center gap-2 py-5 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                                    >
                                        <FiArrowLeft /> Volver
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={loading}
                                        className="flex-[2] flex items-center justify-center gap-2 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 active:scale-95 group"
                                    >
                                        {loading ? 'Generando Ecosistema...' : <><FiSave /> Lanzar Mi Emprendimiento</>}
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
