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
        <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FiMessageSquare className="text-indigo-600" /> Descubrimiento de Clientes
                    </h2>
                    <p className="text-slate-500 text-sm">Validación de mercado basada en feedback real de clientes.</p>
                </div>
                <button 
                    onClick={() => setShowInterviewModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all font-medium text-sm shadow-sm"
                >
                    <FiPlus /> Registrar Entrevista
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Lista de Entrevistas */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2 px-1">
                        Recientes Entrevistas
                    </h3>
                    {interviews.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 italic">
                            Aún no has registrado entrevistas. ¡Sal a hablar con tus clientes!
                        </div>
                    ) : (
                        interviews.map((interview) => (
                            <div key={interview.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
                                <button 
                                    onClick={() => handleDeleteInterview(interview.id)}
                                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
                                >
                                    <FiTrash2 size={16} />
                                </button>
                                <div className="flex justify-between items-start mb-4 pr-8">
                                    <div className="flex items-center gap-4">
                                        <div className="text-3xl">{sentimentIcon(interview.sentiment)}</div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg leading-tight">{interview.customerName}</h4>
                                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1 block">
                                                {new Date(interview.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed italic mb-4">"{interview.feedback}"</p>
                                {interview.insights && (
                                    <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                                        <span className="text-[10px] font-black text-indigo-600 uppercase block mb-1 tracking-wider">Aprendizajes Clave:</span>
                                        <p className="text-xs text-indigo-900 font-medium">{interview.insights}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Market Size Calculator (Simplified UI for now) */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-fit sticky top-24">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                            <FiTarget className="text-2xl" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Oportunidad de Mercado</h3>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-md">
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">TAM (Mercado Total Direccionable)</label>
                            <div className="flex items-baseline gap-2">
                                <span className="text-slate-400 font-mono italic text-sm">$</span>
                                <input 
                                    className="bg-transparent border-none p-0 focus:ring-0 text-2xl font-black text-slate-800 w-full" 
                                    value={market.tam}
                                    onChange={(e) => setMarket({...market, tam: e.target.value})}
                                    placeholder="0.00" 
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 font-medium">El tamaño total de la oportunidad de mercado global.</p>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 border-l-4 border-l-indigo-500 transition-all hover:bg-white hover:shadow-md">
                            <label className="block text-[10px] font-black text-indigo-400 uppercase mb-2 tracking-widest">SAM (Mercado Atendible)</label>
                            <div className="flex items-baseline gap-2">
                                <span className="text-slate-400 font-mono italic text-sm">$</span>
                                <input 
                                    className="bg-transparent border-none p-0 focus:ring-0 text-2xl font-black text-slate-800 w-full" 
                                    value={market.sam}
                                    onChange={(e) => setMarket({...market, sam: e.target.value})}
                                    placeholder="0.00" 
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 font-medium">El segmento del TAM que tu producto puede atender.</p>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 border-l-4 border-l-emerald-500 transition-all hover:bg-white hover:shadow-md">
                            <label className="block text-[10px] font-black text-emerald-400 uppercase mb-2 tracking-widest">SOM (Mercado Obtenible)</label>
                            <div className="flex items-baseline gap-2">
                                <span className="text-slate-400 font-mono italic text-sm">$</span>
                                <input 
                                    className="bg-transparent border-none p-0 focus:ring-0 text-2xl font-black text-slate-800 w-full" 
                                    value={market.som}
                                    onChange={(e) => setMarket({...market, som: e.target.value})}
                                    placeholder="0.00" 
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 font-medium">El porcentaje del SAM que planeas capturar.</p>
                        </div>

                        <button 
                            onClick={handleUpdateMarket}
                            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                        >
                            Actualizar Proyecciones
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal para añadir entrevista */}
            {showInterviewModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-8 animate-slideDown max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">Registro de Discovery</h3>
                        <form onSubmit={handleAddInterview} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Lead / Cliente Entrevistado</label>
                                <input 
                                    required
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                                    value={newInterview.customerName}
                                    onChange={(e) => setNewInterview({...newInterview, customerName: e.target.value})}
                                    placeholder="Ej: Director de Operaciones - Holcim"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Sentimiento del Feedback</label>
                                <div className="flex gap-4">
                                    {[
                                        { val: 'NEGATIVE', icon: <FiFrown /> },
                                        { val: 'NEUTRAL', icon: <FiMeh /> },
                                        { val: 'POSITIVE', icon: <FiSmile /> }
                                    ].map((s) => (
                                        <button 
                                            key={s.val}
                                            type="button"
                                            onClick={() => setNewInterview({...newInterview, sentiment: s.val})}
                                            className={`flex-1 py-4 rounded-2xl border-2 flex items-center justify-center text-3xl transition-all ${
                                                newInterview.sentiment === s.val ? 'border-indigo-500 bg-indigo-50/50 shadow-inner' : 'border-slate-50 bg-slate-50 grayscale opacity-40'
                                            }`}
                                        >
                                            {s.icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Feedback Directo (Datos Raw)</label>
                                <textarea 
                                    required
                                    rows="4"
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none font-medium text-slate-600"
                                    value={newInterview.feedback}
                                    onChange={(e) => setNewInterview({...newInterview, feedback: e.target.value})}
                                    placeholder="¿Qué problemas o beneficios mencionó el cliente?"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Aprendizajes Clave (Insights)</label>
                                <textarea 
                                    rows="2"
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none font-bold text-indigo-900"
                                    value={newInterview.insights}
                                    onChange={(e) => setNewInterview({...newInterview, insights: e.target.value})}
                                    placeholder="¿Qué validamos o invalidamos hoy?"
                                />
                            </div>
                            <div className="flex gap-4 mt-8">
                                <button 
                                    type="button"
                                    onClick={() => setShowInterviewModal(false)}
                                    className="flex-1 py-4 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
                                >
                                    Cerrar
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
                                >
                                    Guardar Entrada
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
