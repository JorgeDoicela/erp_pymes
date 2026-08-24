import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import entrepreneurshipService from '../../services/entrepreneurship.service';
import { FiMessageSquare, FiTarget, FiPlus, FiSmile, FiFrown, FiMeh, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const DiscoveryLog = () => {
    const { id } = useParams();
    const [interviews, setInterviews] = useState([]);
    const [market, setMarket] = useState({ tam: '0', sam: '0', som: '0' });
    const [loading, setLoading] = useState(true);
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [newInterview, setNewInterview] = useState({ customerName: '', feedback: '', sentiment: 'POSITIVE', insights: '' });
    // ...
    useEffect(() => {
        fetchData();
        fetchMarket();
    }, [id]);

    const fetchMarket = async () => {
        try {
            const response = await entrepreneurshipService.getProjectDetails(id);
            if (response.targetMarket) {
                setMarket({
                    tam: response.targetMarket.tam.toString(),
                    sam: response.targetMarket.sam.toString(),
                    som: response.targetMarket.som.toString()
                });
            }
        } catch (error) {
            console.error("Error loading market", error);
        }
    };

    const handleUpdateMarket = async () => {
        try {
            await entrepreneurshipService.updateMarket({ 
                projectId: id, 
                tam: market.tam, 
                sam: market.sam, 
                som: market.som 
            });
            toast.success("Proyecciones actualizadas");
        } catch (error) {
            toast.error("Error al actualizar mercado");
        }
    };

    const fetchData = async () => {
        try {
            const response = await entrepreneurshipService.getInterviews(id);
            setInterviews(response.data);
        } catch (error) {
            console.error("Error loading interviews", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddInterview = async (e) => {
        e.preventDefault();
        try {
            await entrepreneurshipService.addInterview({ ...newInterview, projectId: id });
            toast.success("Entrevista registrada");
            setShowInterviewModal(false);
            setNewInterview({ customerName: '', feedback: '', sentiment: 'POSITIVE', insights: '' });
            fetchData();
        } catch (error) {
            toast.error("Error al registrar entrevista");
        }
    };

    const handleDeleteInterview = async (interviewId) => {
        if (!window.confirm("¿Eliminar esta entrevista de la bitácora?")) return;
        try {
            await entrepreneurshipService.deleteInterview(interviewId);
            toast.success("Entrevista eliminada");
            fetchData();
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando validaciones...</div>;

    const sentimentIcon = (sentiment) => {
        switch(sentiment) {
            case 'POSITIVE': return <FiSmile className="text-emerald-500" />;
            case 'NEGATIVE': return <FiFrown className="text-red-500" />;
            default: return <FiMeh className="text-amber-500" />;
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <FiMessageSquare className="text-blue-600" /> Descubrimiento y Validación de Clientes
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Entrevistas de validación, hallazgos cualitativos y dimensión de mercado.</p>
                </div>
                <button 
                    onClick={() => setShowInterviewModal(true)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                    <FiPlus size={14} /> Registrar Entrevista
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Lista de Entrevistas */}
                <div className="lg:col-span-2 space-y-3">
                    <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                        Bitácora de Entrevistas
                    </h3>
                    {interviews.length === 0 ? (
                        <div className="bg-white p-8 rounded border border-dashed border-gray-200 text-center text-gray-400 text-xs">
                            No se han registrado entrevistas aún.
                        </div>
                    ) : (
                        interviews.map((interview) => (
                            <div key={interview.id} className="bg-white p-4 rounded border border-gray-200 hover:border-gray-300 transition-colors relative group space-y-2 text-xs">
                                <button 
                                    onClick={() => handleDeleteInterview(interview.id)}
                                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity"
                                >
                                    <FiTrash2 size={13} />
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="text-gray-700">{sentimentIcon(interview.sentiment)}</div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 leading-snug">{interview.customerName}</h4>
                                        <span className="text-[10px] font-mono text-gray-400 block">
                                            {new Date(interview.createdAt).toLocaleDateString('es-EC')}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-gray-600 italic">"{interview.feedback}"</p>
                                {interview.insights && (
                                    <div className="bg-blue-50/50 p-2.5 rounded border border-blue-200 text-[11px]">
                                        <span className="font-semibold text-blue-900 block mb-0.5">Aprendizajes Clave:</span>
                                        <p className="text-blue-800">{interview.insights}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Market Size Calculator */}
                <div className="bg-white p-5 rounded border border-gray-200 h-fit space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                        <FiTarget className="text-blue-600" />
                        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Dimensionamiento de Mercado</h3>
                    </div>
                    
                    <div className="space-y-3 text-xs">
                        <div className="p-3 rounded bg-gray-50 border border-gray-200 space-y-1">
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">TAM (Mercado Total Direccionable)</label>
                            <div className="flex items-baseline gap-1 font-mono">
                                <span className="text-gray-400">$</span>
                                <input 
                                    className="bg-transparent border-none p-0 focus:outline-none text-base font-semibold text-gray-900 w-full" 
                                    value={market.tam}
                                    onChange={(e) => setMarket({...market, tam: e.target.value})}
                                    placeholder="0.00" 
                                />
                            </div>
                        </div>

                        <div className="p-3 rounded bg-gray-50 border border-gray-200 border-l-2 border-l-blue-600 space-y-1">
                            <label className="block text-[10px] font-semibold text-blue-700 uppercase tracking-wider">SAM (Mercado Atendible)</label>
                            <div className="flex items-baseline gap-1 font-mono">
                                <span className="text-gray-400">$</span>
                                <input 
                                    className="bg-transparent border-none p-0 focus:outline-none text-base font-semibold text-gray-900 w-full" 
                                    value={market.sam}
                                    onChange={(e) => setMarket({...market, sam: e.target.value})}
                                    placeholder="0.00" 
                                />
                            </div>
                        </div>

                        <div className="p-3 rounded bg-gray-50 border border-gray-200 border-l-2 border-l-green-600 space-y-1">
                            <label className="block text-[10px] font-semibold text-green-700 uppercase tracking-wider">SOM (Mercado Capturable Objetivo)</label>
                            <div className="flex items-baseline gap-1 font-mono">
                                <span className="text-gray-400">$</span>
                                <input 
                                    className="bg-transparent border-none p-0 focus:outline-none text-base font-semibold text-gray-900 w-full" 
                                    value={market.som}
                                    onChange={(e) => setMarket({...market, som: e.target.value})}
                                    placeholder="0.00" 
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleUpdateMarket}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors cursor-pointer shadow-xs"
                        >
                            Actualizar Proyecciones
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal para añadir entrevista */}
            {showInterviewModal && (
                <div className="app-modal-overlay">
                    <div className="bg-white rounded border border-gray-200 shadow-xl max-w-lg w-full p-5 animate-scale-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Registrar Entrevista de Validación</h3>
                            <button onClick={() => setShowInterviewModal(false)} className="text-gray-400 hover:text-gray-600 p-1"><FiX size={16} /></button>
                        </div>
                        <form onSubmit={handleAddInterview} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Cliente / Contacto Entrevistado</label>
                                <input 
                                    required
                                    className="w-full px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500"
                                    value={newInterview.customerName}
                                    onChange={(e) => setNewInterview({...newInterview, customerName: e.target.value})}
                                    placeholder="Ej: Gerente de Operaciones - Empresa X"
                                />
                            </div>
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Sentimiento del Feedback</label>
                                <div className="flex gap-2">
                                    {[
                                        { val: 'NEGATIVE', icon: <FiFrown />, label: 'Negativo' },
                                        { val: 'NEUTRAL', icon: <FiMeh />, label: 'Neutral' },
                                        { val: 'POSITIVE', icon: <FiSmile />, label: 'Favorable' }
                                    ].map((s) => (
                                        <button 
                                            key={s.val}
                                            type="button"
                                            onClick={() => setNewInterview({...newInterview, sentiment: s.val})}
                                            className={`flex-1 py-2 rounded border flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs font-medium ${
                                                newInterview.sentiment === s.val ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {s.icon} {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Feedback del Cliente</label>
                                <textarea 
                                    required
                                    rows="3"
                                    className="w-full px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500 resize-none"
                                    value={newInterview.feedback}
                                    onChange={(e) => setNewInterview({...newInterview, feedback: e.target.value})}
                                    placeholder="Comentarios o necesidades expresadas..."
                                />
                            </div>
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Aprendizajes Clave (Insights)</label>
                                <textarea 
                                    rows="2"
                                    className="w-full px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500 resize-none"
                                    value={newInterview.insights}
                                    onChange={(e) => setNewInterview({...newInterview, insights: e.target.value})}
                                    placeholder="Hipótesis validadas o descartadas..."
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button 
                                    type="button"
                                    onClick={() => setShowInterviewModal(false)}
                                    className="px-3.5 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors shadow-xs"
                                >
                                    Guardar Registro
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiscoveryLog;
