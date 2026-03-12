import React, { useState, useEffect } from 'react';
import { getCostCenters, createCostCenter, updateCostCenter, deleteCostCenter, getGeneralLedger } from '../../services/accounting.service';
import { FiBriefcase, FiPlus, FiEdit2, FiTrash2, FiPieChart, FiX, FiActivity, FiRefreshCw, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CostCenterManagement = () => {
    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({ code: '', name: '', description: '' });

    // Estado para "Ver Detalle" de movimientos
    const [viewingDetails, setViewingDetails] = useState(null);
    const [movements, setMovements] = useState([]);
    const [loadingMovements, setLoadingMovements] = useState(false);

    useEffect(() => {
        fetchCenters();
    }, []);

    const fetchCenters = async () => {
        setLoading(true);
        try {
            const data = await getCostCenters();
            setCenters(data);
        } catch (error) {
            toast.error('Error al cargar centros de costo');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (center) => {
        setViewingDetails(center);
        setLoadingMovements(true);
        try {
            // Buscamos todos los movimientos de este centro de costo (sin filtrar por periodo para ver histórico)
            const data = await getGeneralLedger(null, null, center.id);
            setMovements(data);
        } catch (error) {
            toast.error('Error al cargar movimientos');
        } finally {
            setLoadingMovements(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (selectedId) {
                await updateCostCenter(selectedId, formData);
                toast.success('Centro de costo actualizado');
            } else {
                await createCostCenter(formData);
                toast.success('Centro de costo creado exitosamente');
            }
            setShowModal(false);
            resetForm();
            fetchCenters();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al procesar solicitud');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar este centro de costo?')) return;
        try {
            await deleteCostCenter(id);
            toast.success('Eliminado');
            fetchCenters();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al eliminar');
        }
    };

    const handleEdit = (center, e) => {
        e.stopPropagation();
        setSelectedId(center.id);
        setFormData({ code: center.code, name: center.name, description: center.description || '' });
        setShowModal(true);
    };

    const resetForm = () => {
        setSelectedId(null);
        setFormData({ code: '', name: '', description: '' });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FiBriefcase className="text-indigo-600" /> Centros de Costo
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión administrativa y análisis de gastos por área</p>
                </div>
                <button
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all"
                    onClick={() => { resetForm(); setShowModal(true); }}
                >
                    <FiPlus /> Nuevo Centro
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {centers.map(center => (
                    <div
                        key={center.id}
                        onClick={() => handleViewDetails(center)}
                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group cursor-pointer relative overflow-hidden"
                    >
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex justify-center items-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                <FiPieChart className="w-6 h-6" />
                            </div>
                            <div className="flex gap-1">
                                <button onClick={(e) => handleEdit(center, e)} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><FiEdit2 size={16} /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(center.id); }} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><FiTrash2 size={16} /></button>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-lg font-bold text-slate-800">{center.name}</h3>
                            <p className="text-xs font-mono text-indigo-600 mb-2">{center.code}</p>
                            <p className="text-slate-500 text-sm line-clamp-2 mb-4 h-10">{center.description || 'Sin descripción adicional.'}</p>

                            <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-400">
                                <span className="uppercase tracking-wider">Ver Actividad</span>
                                <FiActivity className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                            </div>
                        </div>

                        {/* Indicador de Hover */}
                        <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-indigo-500 text-white text-[8px] px-2 py-0.5 rounded-bl-lg font-bold uppercase tracking-tighter">Click para detalles</div>
                        </div>
                    </div>
                ))}
            </div>

            {centers.length === 0 && !loading && (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                    <FiBriefcase className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No hay centros de costo configurados.</p>
                </div>
            )}

            {/* Modal de Detalle de Movimientos del Centro */}
            {viewingDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-scale-in">
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <FiActivity className="text-indigo-600" /> Actividad: {viewingDetails.name}
                                </h3>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">{viewingDetails.code} | Histórico General</p>
                            </div>
                            <button onClick={() => setViewingDetails(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><FiX size={20} /></button>
                        </div>

                        <div className="p-8 max-h-[60vh] overflow-y-auto">
                            {loadingMovements ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-3">
                                    <FiRefreshCw className="animate-spin text-indigo-500 w-8 h-8" />
                                    <p className="text-sm text-slate-500">Analizando transacciones...</p>
                                </div>
                            ) : movements.length === 0 ? (
                                <div className="text-center py-16 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    Este centro de costo no tiene movimientos registrados aún.
                                </div>
                            ) : (
                                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Fecha</th>
                                                <th className="px-4 py-3 text-left">Cuenta</th>
                                                <th className="px-4 py-3 text-left">Asiento</th>
                                                <th className="px-4 py-3 text-right">Monto ($)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {movements.map((mov, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 text-slate-500">{new Date(mov.journalEntry?.date).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3 font-medium text-slate-800">{mov.account?.name}</td>
                                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-bold">{mov.journalEntry?.entryNumber}</td>
                                                    <td className={`px-4 py-3 text-right font-mono font-bold ${mov.debit > 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                                                        ${(mov.debit || mov.credit).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setViewingDetails(null)} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Creación / Edición */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">{selectedId ? 'Editar' : 'Nuevo'} Centro de Costo</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><FiX /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Código / Identificador</label>
                                <input
                                    type="text" required placeholder="Ej: CC-ADM"
                                    disabled={!!selectedId}
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono disabled:opacity-60"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Departamento</label>
                                <input
                                    type="text" required placeholder="Ej:Administración"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                                    placeholder="Detalles sobre este centro de costo..."
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 font-medium transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium disabled:opacity-50 transition-colors shadow-sm">
                                    {isSubmitting ? 'Guardando...' : (selectedId ? 'Actualizar' : 'Crear')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CostCenterManagement;
