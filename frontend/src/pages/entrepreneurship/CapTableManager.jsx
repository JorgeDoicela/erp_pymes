import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import entrepreneurshipService from '../../services/entrepreneurship.service';
import { FiPieChart, FiUsers, FiPlus, FiBriefcase, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const CapTableManager = () => {
    const { id } = useParams();
    const [equities, setEquities] = useState([]);
    const [fundingRounds, setFundingRounds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEquityModal, setShowEquityModal] = useState(false);
    const [showFundingModal, setShowFundingModal] = useState(false);
    const [detailEquity, setDetailEquity] = useState(null);
    const [detailFunding, setDetailFunding] = useState(null);
    const [newEquity, setNewEquity] = useState({ holderName: '', percentage: '', role: 'Founder', vestingTerms: '' });
    const [newFunding, setNewFunding] = useState({ roundName: '', amountRaised: '', valuation: '', date: '', investors: '' });

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [eqRes, fundRes] = await Promise.all([
                entrepreneurshipService.getCapTable(id),
                entrepreneurshipService.getFunding(id)
            ]);
            setEquities(eqRes.data);
            setFundingRounds(fundRes.data);
        } catch (error) {
            console.error("Error loading captable data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddEquity = async (e) => {
        e.preventDefault();
        try {
            await entrepreneurshipService.addEquity({ ...newEquity, projectId: id });
            toast.success("Socio añadido al CapTable");
            setShowEquityModal(false);
            setNewEquity({ holderName: '', percentage: '', role: 'Founder' });
            fetchData();
        } catch (error) {
            toast.error("Error al añadir socio");
        }
    };

    const handleDeleteEquity = async (equityId) => {
        if (!window.confirm("¿Estás seguro de eliminar este socio del CapTable?")) return;
        try {
            await entrepreneurshipService.deleteEquity(equityId);
            toast.success("Socio eliminado");
            fetchData();
        } catch (error) {
            toast.error("Error al eliminar socio");
        }
    };

    const handleDeleteFunding = async (roundId) => {
        if (!window.confirm("¿Estás seguro de eliminar esta ronda de inversión?")) return;
        try {
            await entrepreneurshipService.deleteFunding(roundId);
            toast.success("Ronda eliminada");
            fetchData();
        } catch (error) {
            toast.error("Error al eliminar ronda");
        }
    };

    const handleAddFunding = async (e) => {
        e.preventDefault();
        try {
            await entrepreneurshipService.addFunding({ ...newFunding, projectId: id });
            toast.success("Ronda de inversión registrada");
            setShowFundingModal(false);
            setNewFunding({ roundName: '', amountRaised: '', valuation: '', date: '', investors: '' });
            fetchData();
        } catch (error) {
            toast.error("Error al registrar ronda");
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando CapTable...</div>;

    const totalPercentage = equities.reduce((acc, curr) => acc + curr.percentage, 0);

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FiPieChart className="text-indigo-600" /> CapTable & Capital
                    </h2>
                    <p className="text-slate-500 text-sm">Distribución de propiedad y rondas de inversión.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowFundingModal(true)} className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl hover:bg-amber-600 transition-all font-medium text-sm shadow-sm">
                        <FiPlus /> Ronda
                    </button>
                    <button onClick={() => setShowEquityModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all font-medium text-sm shadow-sm">
                        <FiPlus /> Socio
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Composición de Equidad */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Distribución de Acciones</h3>
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${totalPercentage > 100 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {totalPercentage}% TOTAL
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">Tenedor</th>
                                    <th className="px-6 py-3 font-semibold">Rol</th>
                                    <th className="px-6 py-3 font-semibold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {equities.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-8 text-center text-slate-500 italic">No hay registros en el CapTable</td>
                                    </tr>
                                ) : (
                                    equities.map((eq) => (
                                        <tr key={eq.id} onClick={() => setDetailEquity(eq)} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs uppercase">
                                                        {eq.holderName.charAt(0)}
                                                    </div>
                                                    <span className="font-semibold text-slate-700">{eq.holderName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg font-medium">
                                                    {eq.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-3">
                                                    <span className="font-mono font-bold text-slate-900">
                                                        {eq.percentage}%
                                                    </span>
                                                    <button 
                                                        onClick={() => handleDeleteEquity(eq.id)}
                                                        className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                        title="Eliminar del CapTable"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Resumen Inversión */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <FiBriefcase className="text-amber-500" /> Rondas de Inversión
                        </h3>
                        <div className="space-y-4">
                            {fundingRounds.length === 0 ? (
                                <p className="text-xs text-slate-500 italic">No se han registrado rondas.</p>
                            ) : (
                                fundingRounds.map((round) => (
                                    <div key={round.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 relative group">
                                        <button 
                                            onClick={() => handleDeleteFunding(round.id)}
                                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition-all bg-white rounded-lg shadow-sm border border-slate-100"
                                        >
                                            <FiTrash2 size={12} />
                                        </button>
                                        <div className="flex justify-between items-start mb-1 pr-6">
                                            <span className="text-xs font-bold text-slate-700">{round.roundName}</span>
                                            <span className="text-[10px] text-slate-400">{new Date(round.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="text-lg font-bold text-indigo-600">${round.amountRaised.toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter font-bold">Valuation: ${round.valuation.toLocaleString()}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal para añadir socio */}
            {showEquityModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-slideDown">
                        <h3 className="text-xl font-bold text-slate-800 mb-6">Añadir Participación</h3>
                        <form onSubmit={handleAddEquity} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre del Socio</label>
                                <input 
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold text-slate-700"
                                    value={newEquity.holderName}
                                    onChange={(e) => setNewEquity({...newEquity, holderName: e.target.value})}
                                    placeholder="Ej: Elon Musk"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Porcentaje (%)</label>
                                    <input 
                                        required
                                        type="number"
                                        step="0.01"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-mono font-bold text-slate-700"
                                        value={newEquity.percentage}
                                        onChange={(e) => setNewEquity({...newEquity, percentage: e.target.value})}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Rol</label>
                                    <select 
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold text-slate-700"
                                        value={newEquity.role}
                                        onChange={(e) => setNewEquity({...newEquity, role: e.target.value})}
                                    >
                                        <option value="Founder">Founder</option>
                                        <option value="Investor">Investor</option>
                                        <option value="Advisor">Advisor</option>
                                        <option value="Employee">Employee</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Términos de Vesting</label>
                                <input className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-700" value={newEquity.vestingTerms} onChange={(e) => setNewEquity({...newEquity, vestingTerms: e.target.value})} placeholder="Ej: 4 años, cliff 1 año" />
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button type="button" onClick={() => setShowEquityModal(false)} className="flex-1 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all text-sm">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md text-sm">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Detalle Equity */}
            {detailEquity && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDetailEquity(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-slideDown" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-2xl">{detailEquity.holderName.charAt(0)}</div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800">{detailEquity.holderName}</h3>
                                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg font-bold">{detailEquity.role}</span>
                                </div>
                            </div>
                            <button onClick={() => setDetailEquity(null)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all">✕</button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-slate-50 p-5 rounded-2xl text-center">
                                <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Participación</p>
                                <p className="text-3xl font-black text-indigo-600">{detailEquity.percentage}%</p>
                            </div>
                            <div className="bg-slate-50 p-5 rounded-2xl text-center">
                                <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Tipo</p>
                                <p className="text-lg font-black text-slate-700">{detailEquity.role}</p>
                            </div>
                        </div>
                        {detailEquity.vestingTerms && (
                            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 mb-6">
                                <p className="text-[10px] uppercase font-black text-indigo-500 mb-1">Términos de Vesting</p>
                                <p className="text-sm font-bold text-indigo-900">{detailEquity.vestingTerms}</p>
                            </div>
                        )}
                        <button onClick={() => { handleDeleteEquity(detailEquity.id); setDetailEquity(null); }} className="w-full py-3 border border-red-100 text-red-500 rounded-2xl font-bold text-sm hover:bg-red-50 transition-all">
                            Eliminar del CapTable
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Detalle Ronda */}
            {detailFunding && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDetailFunding(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-slideDown" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800">{detailFunding.roundName}</h3>
                                <p className="text-slate-400 text-sm">{new Date(detailFunding.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                            <button onClick={() => setDetailFunding(null)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all">✕</button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-emerald-50 p-5 rounded-2xl text-center">
                                <p className="text-[10px] uppercase font-black text-emerald-500 mb-1">Levantado</p>
                                <p className="text-2xl font-black text-emerald-700">${detailFunding.amountRaised?.toLocaleString()}</p>
                            </div>
                            <div className="bg-indigo-50 p-5 rounded-2xl text-center">
                                <p className="text-[10px] uppercase font-black text-indigo-500 mb-1">Valuación</p>
                                <p className="text-2xl font-black text-indigo-700">${detailFunding.valuation?.toLocaleString()}</p>
                            </div>
                        </div>
                        {detailFunding.investors && (
                            <div className="bg-slate-50 p-4 rounded-2xl mb-6">
                                <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Inversores</p>
                                <p className="text-sm font-bold text-slate-700">{detailFunding.investors}</p>
                            </div>
                        )}
                        <button onClick={() => { handleDeleteFunding(detailFunding.id); setDetailFunding(null); }} className="w-full py-3 border border-red-100 text-red-500 rounded-2xl font-bold text-sm hover:bg-red-50 transition-all">
                            Eliminar Ronda
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Nueva Ronda de Inversión */}
            {showFundingModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-slideDown">
                        <h3 className="text-xl font-bold text-slate-800 mb-6">Registrar Ronda de Inversión</h3>
                        <form onSubmit={handleAddFunding} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre de la Ronda *</label>
                                <input required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold text-slate-700" value={newFunding.roundName} onChange={(e) => setNewFunding({...newFunding, roundName: e.target.value})} placeholder="Ej: Seed A, Series A" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Monto ($) *</label>
                                    <input required type="number" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-mono font-bold text-slate-700" value={newFunding.amountRaised} onChange={(e) => setNewFunding({...newFunding, amountRaised: e.target.value})} placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Valuación ($) *</label>
                                    <input required type="number" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-mono font-bold text-slate-700" value={newFunding.valuation} onChange={(e) => setNewFunding({...newFunding, valuation: e.target.value})} placeholder="0" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fecha *</label>
                                    <input required type="date" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-bold text-slate-700" value={newFunding.date} onChange={(e) => setNewFunding({...newFunding, date: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Inversores</label>
                                    <input className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-sm text-slate-700" value={newFunding.investors} onChange={(e) => setNewFunding({...newFunding, investors: e.target.value})} placeholder="Ej: Angel, VC Fund" />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-4">
                                <button type="button" onClick={() => setShowFundingModal(false)} className="flex-1 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all text-sm">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all shadow-md text-sm">Registrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CapTableManager;

