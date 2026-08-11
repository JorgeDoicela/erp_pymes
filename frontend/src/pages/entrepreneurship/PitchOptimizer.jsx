import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import entrepreneurshipService from '../../services/entrepreneurship.service';
import { FiCpu, FiEdit3, FiZap, FiCheckCircle, FiAlertTriangle, FiArrowRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const PitchOptimizer = () => {
    const { id } = useParams();
    const [narrative, setNarrative] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, [id]);

    const fetchInitialData = async () => {
        try {
            const project = await entrepreneurshipService.getProjectDetails(id);
            setNarrative(project.pitchNarrative || '');
            if (project.pitchNarrative) {
                handleAnalyze();
            }
        } catch (error) {
            console.error("Error loading pitch", error);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await entrepreneurshipService.updateProject(id, { pitchNarrative: narrative });
            toast.success("Pitch guardado correctamente");
        } catch (error) {
            toast.error("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const response = await entrepreneurshipService.getPitchAnalysis(id);
            setAnalysis(response.data);
        } catch (error) {
            toast.error("Error en el análisis predictivo");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <FiCpu className="text-indigo-600" /> Optimizador Predictivo de Pitch
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">Refina tu propuesta de valor con inteligencia predictiva.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Editor Section */}
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-black text-slate-700 uppercase tracking-tight flex items-center gap-2">
                            <FiEdit3 className="text-indigo-500" /> Elevator Pitch
                        </h3>
                        {saving && <span className="text-[10px] font-black text-indigo-400 animate-pulse">GUARDANDO...</span>}
                    </div>
                    
                    <textarea 
                        className="w-full flex-1 p-6 rounded-3xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 leading-relaxed min-h-[300px]"
                        placeholder="Escribe aquí tu narrativa de pitch... Describe tu problema, solución y mercado."
                        value={narrative}
                        onChange={(e) => setNarrative(e.target.value)}
                        onBlur={handleSave}
                    />

                    <button 
                        onClick={handleAnalyze}
                        disabled={loading || !narrative}
                        className="app-button-primary w-full py-3.5 mt-6"
                    >
                        {loading ? 'Analizando...' : <><FiZap /> Ejecutar Análisis Predictivo</>}
                    </button>
                </div>

                {/* Analysis Section */}
                <div className="space-y-6">
                    {analysis ? (
                        <>
                            <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-xs relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 blur-2xl -translate-y-1/2 translate-x-1/2 rounded-full"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Scorecard Predictivo</span>
                                        <div className="text-4xl font-extrabold text-slate-900">{analysis.score}<span className="text-base text-slate-400 font-normal">/100</span></div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 bg-indigo-50/60 p-4 rounded-xl border border-indigo-100/80">
                                            <FiZap className="text-indigo-600 shrink-0 text-lg" />
                                            <p className="text-sm font-medium text-slate-800">{analysis.analysis}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
                                <h3 className="font-bold text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2 text-xs">
                                    Recomendaciones de Mejora
                                </h3>
                                <div className="space-y-3">
                                    {analysis.suggestions.map((s, idx) => (
                                        <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-indigo-100 transition-all">
                                            <div className="mt-1">
                                                {analysis.score > 70 ? <FiArrowRight className="text-emerald-500" /> : <FiAlertTriangle className="text-amber-500" />}
                                            </div>
                                            <p className="text-xs font-bold text-slate-600 leading-relaxed">{s}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full bg-slate-50 border-4 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center p-12 text-center opacity-60">
                            <FiCpu className="text-5xl text-slate-200 mb-6" />
                            <h4 className="font-black text-slate-400 uppercase tracking-widest text-sm">Análisis Predictivo Inactivo</h4>
                            <p className="text-xs text-slate-400 mt-2 font-medium">Escribe tu pitch y presiona analizar para obtener feedback instantáneo de nuestro motor predictivo corporativo.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PitchOptimizer;
