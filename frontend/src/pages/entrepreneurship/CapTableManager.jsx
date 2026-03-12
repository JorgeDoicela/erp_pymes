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
    const [newEquity, setNewEquity] = useState({ holderName: '', percentage: '', role: 'Founder' });

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
                <button 
                    onClick={() => setShowEquityModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all font-medium text-sm shadow-sm"
                >
                    <FiPlus /> Añadir Socio
                </button>
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
                                        <tr key={eq.id} className="hover:bg-slate-50/50 transition-colors group">
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
                            <div className="flex gap-3 mt-8">
                                <button 
                                    type="button"
                                    onClick={() => setShowEquityModal(false)}
                                    className="flex-1 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all text-sm"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md text-sm"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CapTableManager;
