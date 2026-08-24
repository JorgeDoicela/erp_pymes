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
        <div className="space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <FiCpu className="text-blue-600" /> Evaluación de Narrativa y Propuesta de Valor
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Optimización de mensaje para levantamiento de capital y clientes.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Editor Section */}
                <div className="bg-white rounded border border-gray-200 p-4 flex flex-col space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <h3 className="font-semibold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                            <FiEdit3 className="text-blue-600" /> Discurso Principal (Elevator Pitch)
                        </h3>
                        {saving && <span className="text-[10px] font-mono text-blue-600">Guardando...</span>}
                    </div>
                    
                    <textarea 
                        className="w-full flex-1 p-3 rounded bg-white border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-blue-500 leading-relaxed min-h-[260px] resize-none"
                        placeholder="Describa el problema, solución de producto, modelo de ingresos y tracción actual..."
                        value={narrative}
                        onChange={(e) => setNarrative(e.target.value)}
                        onBlur={handleSave}
                    />

                    <button 
                        onClick={handleAnalyze}
                        disabled={loading || !narrative}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                        {loading ? 'Analizando...' : <><FiZap size={14} /> Evaluar Narrativa</>}
                    </button>
                </div>

                {/* Analysis Section */}
                <div className="space-y-4">
                    {analysis ? (
                        <>
                            <div className="bg-white rounded border border-gray-200 p-4 space-y-3">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">Puntaje de Solidez</span>
                                    <div className="text-2xl font-mono font-bold text-gray-900 tabular-nums">{analysis.score}<span className="text-xs text-gray-400 font-normal">/100</span></div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded border border-gray-200 text-xs text-gray-800 leading-relaxed">
                                    {analysis.analysis}
                                </div>
                            </div>

                            <div className="bg-white rounded border border-gray-200 p-4 space-y-3">
                                <h3 className="font-semibold text-gray-900 uppercase tracking-wider text-xs pb-2 border-b border-gray-100">
                                    Observaciones y Sugerencias
                                </h3>
                                <div className="space-y-2 text-xs">
                                    {analysis.suggestions.map((s, idx) => (
                                        <div key={idx} className="flex items-start gap-2 p-2.5 rounded bg-gray-50 border border-gray-200">
                                            <div className="mt-0.5 shrink-0">
                                                {analysis.score > 70 ? <FiArrowRight className="text-green-600" size={13} /> : <FiAlertTriangle className="text-amber-600" size={13} />}
                                            </div>
                                            <p className="text-gray-700 leading-normal">{s}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full min-h-[280px] bg-gray-50 border border-dashed border-gray-200 rounded flex flex-col items-center justify-center p-8 text-center text-xs text-gray-400">
                            <FiCpu className="w-8 h-8 mb-2 text-gray-300" />
                            <h4 className="font-semibold text-gray-600 uppercase tracking-wider mb-1">Sin evaluación generada</h4>
                            <p className="max-w-xs text-[11px]">Redacte la propuesta en el editor y presione evaluar para recibir feedback técnico.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PitchOptimizer;
