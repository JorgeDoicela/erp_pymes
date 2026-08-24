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
        <div className="space-y-5">
            {/* Header Limpio ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Contabilidad · Imputación de Gastos</p>
                    <h1 className="text-xl font-semibold text-gray-900">Centros de Costo</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Segmentación y distribución de gastos operativos y nómina.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        onClick={() => { resetForm(); setShowModal(true); }}
                    >
                        <FiPlus size={14} /> Nuevo Centro de Costo
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {centers.map(center => (
                    <div
                        key={center.id}
                        onClick={() => handleViewDetails(center)}
                        className="bg-white p-4 rounded border border-gray-200 hover:border-gray-300 transition-colors group cursor-pointer flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-2.5">
                                <div className="flex items-center gap-2">
                                    <span className="p-2 rounded bg-gray-100 text-gray-700 border border-gray-200">
                                        <FiPieChart size={16} />
                                    </span>
                                    <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                        {center.code}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={(e) => handleEdit(center, e)} className="p-1 text-gray-400 hover:text-amber-600 rounded transition-colors" title="Editar"><FiEdit2 size={14} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(center.id); }} className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors" title="Eliminar"><FiTrash2 size={14} /></button>
                                </div>
                            </div>

                            <h3 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{center.name}</h3>
                            <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 min-h-[32px]">{center.description || 'Sin descripción adicional.'}</p>
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400 font-mono mt-3">
                            <span className="uppercase tracking-wider">Ver Movimientos</span>
                            <FiActivity className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                    </div>
                ))}
            </div>

            {centers.length === 0 && !loading && (
                <div className="text-center py-16 bg-white rounded border border-dashed border-gray-200">
                    <FiBriefcase className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 font-medium">No hay centros de costo configurados.</p>
                </div>
            )}

            {/* Modal de Detalle de Movimientos del Centro */}
            {viewingDetails && (
                <div className="app-modal-overlay">
                    <div className="bg-white rounded border border-gray-200 shadow-xl w-full max-w-4xl overflow-hidden animate-scale-in">
                        <div className="px-5 py-3.5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                    <FiActivity className="text-blue-600" /> Movimientos: {viewingDetails.name}
                                </h3>
                                <p className="text-[11px] font-mono text-gray-500 mt-0.5">{viewingDetails.code} — Registro de Imputaciones</p>
                            </div>
                            <button onClick={() => setViewingDetails(null)} className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"><FiX size={18} /></button>
                        </div>

                        <div className="p-5 max-h-[60vh] overflow-y-auto">
                            {loadingMovements ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-2">
                                    <FiRefreshCw className="animate-spin text-blue-600 w-6 h-6" />
                                    <p className="text-xs text-gray-500 font-mono">Cargando transacciones...</p>
                                </div>
                            ) : movements.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 bg-gray-50 rounded border border-dashed border-gray-200 text-xs italic">
                                    Este centro de costo no tiene movimientos registrados aún.
                                </div>
                            ) : (
                                <div className="border border-gray-200 rounded overflow-hidden">
                                    <table className="w-full text-xs text-left text-gray-700">
                                        <thead className="bg-gray-50 text-[11px] uppercase font-semibold text-gray-500 border-b border-gray-200">
                                            <tr>
                                                <th className="p-3">Fecha</th>
                                                <th className="p-3">Asiento</th>
                                                <th className="p-3">Cuenta Contable</th>
                                                <th className="p-3">Glosa</th>
                                                <th className="p-3 text-right">Debe ($)</th>
                                                <th className="p-3 text-right">Haber ($)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 font-mono">
                                            {movements.map((mov, i) => (
                                                <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                                                    <td className="p-3 text-gray-600">{new Date(mov.journalEntry?.date).toLocaleDateString('es-EC')}</td>
                                                    <td className="p-3 font-semibold text-blue-700">{mov.journalEntry?.entryNumber}</td>
                                                    <td className="p-3 text-gray-900 font-sans">{mov.account?.code} - {mov.account?.name}</td>
                                                    <td className="p-3 text-gray-700 font-sans">{mov.description || mov.journalEntry?.description}</td>
                                                    <td className="p-3 text-right tabular-nums text-gray-900">{mov.debit > 0 ? mov.debit.toFixed(2) : '-'}</td>
                                                    <td className="p-3 text-right tabular-nums text-gray-900">{mov.credit > 0 ? mov.credit.toFixed(2) : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button onClick={() => setViewingDetails(null)} className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded transition-colors">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Crear / Editar Centro de Costo */}
            {showModal && (
                <div className="app-modal-overlay">
                    <div className="bg-white rounded border border-gray-200 shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="px-5 py-3.5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                {selectedId ? 'Editar Centro de Costo' : 'Nuevo Centro de Costo'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1"><FiX size={16} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Código del Centro</label>
                                <input
                                    type="text" required placeholder="Ej: CC-ADM-01"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded text-gray-800 font-mono focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Nombre del Centro de Costo</label>
                                <input
                                    type="text" required placeholder="Ej: Administración y Finanzas"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded text-gray-800 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Descripción (Opcional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded text-gray-800 focus:outline-none focus:border-blue-500 resize-none h-16"
                                    placeholder="Detalles sobre las áreas u operaciones asignadas"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-3.5 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 font-medium text-xs transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-3.5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-xs disabled:opacity-50 transition-colors shadow-xs">
                                    {isSubmitting ? 'Guardando...' : (selectedId ? 'Actualizar Centro' : 'Guardar Centro')}
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
