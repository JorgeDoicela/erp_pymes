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
                        <FiPieChart className="text-blue-600" /> Distribución de Capital Social (CapTable)
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Composición accionaria, rondas de inversión y acuerdos de vesting.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowFundingModal(true)} className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer">
                        <FiPlus size={14} /> Ronda de Inversión
                    </button>
                    <button onClick={() => setShowEquityModal(true)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs">
                        <FiPlus size={14} /> Registrar Socio
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Composición de Equidad */}
                <div className="lg:col-span-2 bg-white rounded border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Participación Accionaria</h3>
                        <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded border ${totalPercentage > 100 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                            {totalPercentage}% TOTAL ASIGNADO
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-gray-700">
                            <thead className="bg-gray-50 text-[11px] uppercase font-semibold text-gray-500 border-b border-gray-200">
                                <tr>
                                    <th className="p-3.5">Tenedor de Acciones</th>
                                    <th className="p-3.5">Rol Institucional</th>
                                    <th className="p-3.5 text-right">Porcentaje</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {equities.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="p-8 text-center text-gray-400 italic">No hay socios registrados en el CapTable.</td>
                                    </tr>
                                ) : (
                                    equities.map((eq) => (
                                        <tr key={eq.id} onClick={() => setDetailEquity(eq)} className="hover:bg-gray-50/60 transition-colors group cursor-pointer">
                                            <td className="p-3.5 font-medium text-gray-900">
                                                {eq.holderName}
                                            </td>
                                            <td className="p-3.5">
                                                <span className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">
                                                    {eq.role}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-right font-mono font-semibold text-gray-900 tabular-nums">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span>{eq.percentage}%</span>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteEquity(eq.id); }}
                                                        className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Eliminar"
                                                    >
                                                        <FiTrash2 size={13} />
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
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded border border-gray-200 space-y-3">
                        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-100">
                            <FiBriefcase className="text-blue-600" /> Rondas de Inversión
                        </h3>
                        <div className="space-y-2.5 text-xs">
                            {fundingRounds.length === 0 ? (
                                <p className="text-xs text-gray-400 italic py-2">Sin rondas registradas.</p>
                            ) : (
                                fundingRounds.map((round) => (
                                    <div key={round.id} className="p-3 rounded bg-gray-50 border border-gray-200 relative group space-y-1">
                                        <button 
                                            onClick={() => handleDeleteFunding(round.id)}
                                            className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity bg-white rounded border border-gray-200"
                                        >
                                            <FiTrash2 size={12} />
                                        </button>
                                        <div className="flex justify-between items-start pr-6 font-mono text-[11px]">
                                            <span className="font-semibold text-gray-900">{round.roundName}</span>
                                            <span className="text-gray-400">{new Date(round.date).toLocaleDateString('es-EC')}</span>
                                        </div>
                                        <div className="text-sm font-mono font-semibold text-gray-900 tabular-nums">${round.amountRaised.toLocaleString()} USD</div>
                                        <div className="text-[11px] text-gray-500 font-mono">Valuación: ${round.valuation.toLocaleString()} USD</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal para añadir socio */}
            {showEquityModal && (
                <div className="app-modal-overlay">
                    <div className="bg-white rounded border border-gray-200 shadow-xl w-full max-w-md p-5 animate-scale-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Añadir Participación Accionaria</h3>
                            <button onClick={() => setShowEquityModal(false)} className="text-gray-400 hover:text-gray-600 p-1"><FiX size={16} /></button>
                        </div>
                        <form onSubmit={handleAddEquity} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Nombre del Socio / Entidad</label>
                                <input 
                                    required
                                    className="w-full px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500"
                                    value={newEquity.holderName}
                                    onChange={(e) => setNewEquity({...newEquity, holderName: e.target.value})}
                                    placeholder="Ej: Inversiones ABC S.A."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Porcentaje (%)</label>
                                    <input 
                                        required
                                        type="number"
                                        step="0.01"
                                        className="w-full px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500 font-mono"
                                        value={newEquity.percentage}
                                        onChange={(e) => setNewEquity({...newEquity, percentage: e.target.value})}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Rol</label>
                                    <select 
                                        className="w-full px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500"
                                        value={newEquity.role}
                                        onChange={(e) => setNewEquity({...newEquity, role: e.target.value})}
                                    >
                                        <option value="Founder">Fundador</option>
                                        <option value="Investor">Inversor</option>
                                        <option value="Advisor">Asesor</option>
                                        <option value="Employee">Empleado</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Términos de Vesting</label>
                                <input className="w-full px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500" value={newEquity.vestingTerms} onChange={(e) => setNewEquity({...newEquity, vestingTerms: e.target.value})} placeholder="Ej: 4 años, cliff 1 año" />
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button type="button" onClick={() => setShowEquityModal(false)} className="px-3.5 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 font-medium transition-colors">Cancelar</button>
                                <button type="submit" className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors shadow-xs">Guardar Socio</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Detalle Equity */}
            {detailEquity && (
                <div className="app-modal-overlay" onClick={() => setDetailEquity(null)}>
                    <div className="bg-white rounded border border-gray-200 shadow-xl w-full max-w-md p-5 animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">{detailEquity.holderName}</h3>
                                <span className="text-[11px] font-mono text-blue-700 mt-0.5 block">
                                    {detailEquity.role}
                                </span>
                            </div>
                            <button onClick={() => setDetailEquity(null)} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-4 text-xs font-mono">
                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                <p className="text-[10px] text-gray-400 font-sans uppercase mb-0.5">Participación</p>
                                <p className="text-xl font-bold text-gray-900 tabular-nums">{detailEquity.percentage}%</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                <p className="text-[10px] text-gray-400 font-sans uppercase mb-0.5">Tipo</p>
                                <p className="text-sm font-sans font-medium text-gray-800">{detailEquity.role}</p>
                            </div>
                        </div>
                        {detailEquity.vestingTerms && (
                            <div className="bg-blue-50/50 p-3 rounded border border-blue-200 mb-4 text-xs">
                                <p className="text-[10px] text-blue-700 uppercase font-medium mb-0.5">Términos de Vesting</p>
                                <p className="text-gray-800">{detailEquity.vestingTerms}</p>
                            </div>
                        )}
                        <button onClick={() => { handleDeleteEquity(detailEquity.id); setDetailEquity(null); }} className="w-full py-1.5 bg-white border border-red-200 text-red-600 rounded text-xs font-medium hover:bg-red-50 transition-colors">
                            Eliminar del CapTable
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Nueva Ronda de Inversión */}
            {showFundingModal && (
                <div className="app-modal-overlay">
                    <div className="bg-white rounded border border-gray-200 shadow-xl w-full max-w-md p-5 animate-scale-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Registrar Ronda de Inversión</h3>
                            <button onClick={() => setShowFundingModal(false)} className="text-gray-400 hover:text-gray-600 p-1"><FiX size={16} /></button>
                        </div>
                        <form onSubmit={handleAddFunding} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Nombre de la Ronda *</label>
                                <input required className="w-full px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500" value={newFunding.roundName} onChange={(e) => setNewFunding({...newFunding, roundName: e.target.value})} placeholder="Ej: Semilla, Serie A" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Monto Inyectado ($) *</label>
                                    <input required type="number" className="w-full px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500 font-mono" value={newFunding.amountRaised} onChange={(e) => setNewFunding({...newFunding, amountRaised: e.target.value})} placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Valuación Post-Money ($) *</label>
                                    <input required type="number" className="w-full px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500 font-mono" value={newFunding.valuation} onChange={(e) => setNewFunding({...newFunding, valuation: e.target.value})} placeholder="0.00" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Fecha de Cierre *</label>
                                    <input required type="date" className="w-full px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500 font-mono" value={newFunding.date} onChange={(e) => setNewFunding({...newFunding, date: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Inversores Principales</label>
                                    <input className="w-full px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500" value={newFunding.investors} onChange={(e) => setNewFunding({...newFunding, investors: e.target.value})} placeholder="Ej: Ángel, Fondo VC" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button type="button" onClick={() => setShowFundingModal(false)} className="px-3.5 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 font-medium transition-colors">Cancelar</button>
                                <button type="submit" className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors shadow-xs">Registrar Ronda</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CapTableManager;

