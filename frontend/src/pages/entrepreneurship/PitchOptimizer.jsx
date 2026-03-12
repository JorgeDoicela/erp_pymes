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
            toast.error("Error en el análisis de IA");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <FiCpu className="text-indigo-600" /> Optimizador de Pitch IA
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
                        className="w-full mt-6 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {loading ? 'Analizando...' : <><FiZap /> Ejecutar Análisis IA</>}
                    </button>
                </div>

                {/* Analysis Section */}
                <div className="space-y-6">
                    {analysis ? (
                        <>
                            <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-center mb-8">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Scorecard de IA</span>
                                        <div className="text-5xl font-black">{analysis.score}<span className="text-lg opacity-30">/100</span></div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                                            <FiZap className="text-amber-400 shrink-0" />
                                            <p className="text-sm font-medium">{analysis.analysis}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                                <h3 className="font-black text-slate-700 uppercase tracking-tight mb-6 flex items-center gap-2 text-sm">
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
                            <h4 className="font-black text-slate-400 uppercase tracking-widest text-sm">IA Inactiva</h4>
                            <p className="text-xs text-slate-400 mt-2 font-medium">Escribe tu pitch y presiona analizar para obtener feedback instantáneo de nuestro motor de inteligencia corporativa.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PitchOptimizer;
