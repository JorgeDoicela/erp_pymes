import React, { useState, useEffect } from 'react';
import { getAccounts, createAccount, updateAccount, deleteAccount, getGeneralLedger } from '../../services/accounting.service';
import { FiPlus, FiFolder, FiFileText, FiRefreshCw, FiHash, FiEdit2, FiTrash2, FiX, FiEye, FiBookOpen } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ChartOfAccounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    // Estado para "Ver Detalle" (Mayor Auxiliar)
    const [viewingLedger, setViewingLedger] = useState(null);
    const [ledgerMovements, setLedgerMovements] = useState([]);
    const [loadingLedger, setLoadingLedger] = useState(false);

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        type: 'ASSET',
        level: 1,
        isTransactional: false,
        parentId: ''
    });

    const accountTypes = [
        { id: 'ASSET', label: 'ACTIVO', color: 'text-blue-600 bg-blue-100' },
        { id: 'LIABILITY', label: 'PASIVO', color: 'text-rose-600 bg-rose-100' },
        { id: 'EQUITY', label: 'PATRIMONIO', color: 'text-purple-600 bg-purple-100' },
        { id: 'REVENUE', label: 'INGRESO', color: 'text-emerald-600 bg-emerald-100' },
        { id: 'EXPENSE', label: 'GASTO', color: 'text-orange-600 bg-orange-100' }
    ];

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const data = await getAccounts();
            setAccounts(data);
        } catch (error) {
            toast.error('Error al cargar el catálogo de cuentas');
        } finally {
            setLoading(false);
        }
    };

    const handleViewLedger = async (acc) => {
        setViewingLedger(acc);
        setLoadingLedger(true);
        try {
            const data = await getGeneralLedger(acc.id);
            setLedgerMovements(data);
        } catch (error) {
            toast.error('Error al cargar movimientos');
        } finally {
            setLoadingLedger(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (selectedId) {
                await updateAccount(selectedId, {
                    name: formData.name,
                    description: formData.description,
                    isTransactional: formData.isTransactional
                });
                toast.success('Cuenta actualizada');
            } else {
                await createAccount({
                    ...formData,
                    level: parseInt(formData.level),
                    parentId: formData.parentId || null
                });
                toast.success('Cuenta creada exitosamente');
            }
            setShowModal(false);
            resetForm();
            fetchAccounts();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al procesar solicitud');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar esta cuenta? No se puede si tiene subcuentas o movimientos contables.')) return;
        try {
            await deleteAccount(id);
            toast.success('Cuenta eliminada');
            fetchAccounts();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al eliminar');
        }
    };

    const handleEdit = (acc) => {
        setSelectedId(acc.id);
        setFormData({
            code: acc.code,
            name: acc.name,
            description: acc.description || '',
            type: acc.type,
            level: acc.level,
            isTransactional: acc.isTransactional,
            parentId: acc.parentId || ''
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setSelectedId(null);
        setFormData({ code: '', name: '', description: '', type: 'ASSET', level: 1, isTransactional: false, parentId: '' });
    };

    const renderTree = (items, parentId = null) => {
        const children = items.filter(a => a.parentId === parentId);
        if (children.length === 0) return null;

        return (
            <div className={`space-y-2 ${parentId ? 'ml-6 border-l-2 border-slate-100 pl-4 mt-2' : ''}`}>
                {children.map(acc => {
                    const typeStyle = accountTypes.find(t => t.id === acc.type) || accountTypes[0];
                    return (
                        <div key={acc.id} className="animate-fade-in text-wrap">
                            <div className="flex items-center p-3 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow group">
                                <div className="flex items-center gap-3 flex-1 overflow-hidden" onClick={() => acc.isTransactional && handleViewLedger(acc)}>
                                    <span className={`p-2 rounded-lg flex-shrink-0 ${acc.isTransactional ? 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors cursor-pointer' : 'bg-slate-100 text-slate-600'}`}>
                                        {acc.isTransactional ? <FiFileText /> : <FiFolder className="fill-current opacity-20" />}
                                    </span>
                                    <div className={`overflow-hidden ${acc.isTransactional ? 'cursor-pointer group-hover:text-indigo-600' : ''}`}>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">{acc.code}</span>
                                            <span className="font-medium text-slate-900 truncate">{acc.name}</span>
                                        </div>
                                        {acc.description && (
                                            <p className="text-[10px] text-slate-500 mt-0.5 truncate">{acc.description}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 px-2">
                                    <span className={`hidden sm:inline-block text-[8px] uppercase font-bold px-1.5 py-0.5 rounded-full ${typeStyle.color}`}>
                                        {typeStyle.label}
                                    </span>

                                    <div className="flex items-center gap-1">
                                        {acc.isTransactional && (
                                            <button
                                                onClick={() => handleViewLedger(acc)}
                                                className="text-slate-400 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded-md transition-colors"
                                                title="Ver Auditoría"
                                            >
                                                <FiEye size={14} />
                                            </button>
                                        )}
                                        {!acc.isTransactional && (
                                            <button
                                                onClick={() => {
                                                    resetForm();
                                                    setFormData({ ...formData, parentId: acc.id, level: acc.level + 1, type: acc.type });
                                                    setShowModal(true);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-800 p-1.5 hover:bg-indigo-50 rounded-md transition-colors"
                                                title="Agregar Subcuenta"
                                            >
                                                <FiPlus size={14} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleEdit(acc)}
                                            className="text-slate-400 hover:text-amber-600 p-1.5 hover:bg-amber-50 rounded-md transition-colors"
                                            title="Editar"
                                        >
                                            <FiEdit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(acc.id)}
                                            className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-md transition-colors"
                                            title="Eliminar"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {renderTree(items, acc.id)}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Catálogo de Cuentas</h1>
                    <p className="text-slate-500 text-sm mt-1">Estructura jerárquica financiera y auditoría de saldos</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchAccounts}
                        className="flex items-center justify-center p-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all"
                        disabled={loading}
                    >
                        <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-indigo-200 hover:shadow-lg active:scale-95"
                    >
                        <FiPlus /> Nueva Cuenta Madre
                    </button>
                </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 min-h-[500px]">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiHash className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Catalogo Vacío</h3>
                        <p className="text-slate-500 mt-1 max-w-sm mx-auto">Comienza creando tu estructura de cuentas Nivel 1 (Activo, Pasivo, Patrimonio).</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {renderTree(accounts)}
                    </div>
                )}
            </div>

            {/* Modal de Mayor Auxiliar */}
            {viewingLedger && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-scale-in">
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2"><FiBookOpen /> Mayor de Cuenta</h3>
                                <p className="text-indigo-100 text-xs opacity-80 uppercase tracking-widest">{viewingLedger.code} | {viewingLedger.name}</p>
                            </div>
                            <button onClick={() => setViewingLedger(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><FiX size={24} /></button>
                        </div>

                        <div className="p-8 max-h-[65vh] overflow-y-auto">
                            {loadingLedger ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <FiRefreshCw className="animate-spin text-indigo-500 w-10 h-10" />
                                    <p className="text-slate-500 font-medium">Cargando movimientos...</p>
                                </div>
                            ) : ledgerMovements.length === 0 ? (
                                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300 italic text-slate-400">
                                    Esta cuenta no tiene registros históricos aún.
                                </div>
                            ) : (
                                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-tight">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Fecha</th>
                                                <th className="px-4 py-3 text-left">Asiento</th>
                                                <th className="px-4 py-3 text-left">Glosa / Concepto</th>
                                                <th className="px-4 py-3 text-right">Debe ($)</th>
                                                <th className="px-4 py-3 text-right">Haber ($)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {ledgerMovements.map((mov, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 text-slate-500">{new Date(mov.journalEntry?.date).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3 font-mono font-bold text-indigo-600">{mov.journalEntry?.entryNumber}</td>
                                                    <td className="px-4 py-3 text-slate-700 font-medium">{mov.description || mov.journalEntry?.description}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-blue-600">{mov.debit > 0 ? mov.debit.toLocaleString() : '-'}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-rose-600">{mov.credit > 0 ? mov.credit.toLocaleString() : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setViewingLedger(null)} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all">Cerrar Auditoría</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Creación / Edición */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">
                                {selectedId ? 'Editar Cuenta' : (formData.parentId ? 'Nueva Subcuenta' : 'Nueva Cuenta Madre')}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><FiX /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {!formData.parentId && !selectedId && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Naturaleza / Tipo</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    >
                                        {accountTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
                                    <input
                                        type="text" required placeholder="Ej: 1.1.1"
                                        disabled={!!selectedId}
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono disabled:opacity-60"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nivel</label>
                                    <input
                                        type="number" required min="1" disabled
                                        value={formData.level}
                                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de Cuenta</label>
                                <input
                                    type="text" required placeholder="Ej: Caja General"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (Opcional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20"
                                />
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                                <div className="relative flex items-start">
                                    <div className="flex h-6 items-center">
                                        <input
                                            type="checkbox"
                                            id="isTransactional"
                                            disabled={!!selectedId && accounts.some(a => a.parentId === selectedId)}
                                            checked={formData.isTransactional}
                                            onChange={e => setFormData({ ...formData, isTransactional: e.target.checked })}
                                            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm leading-6">
                                        <label htmlFor="isTransactional" className="font-medium text-slate-900 cursor-pointer">
                                            Es Cuenta Transaccional
                                        </label>
                                        <p className="text-slate-500 text-[10px]">Solo las transaccionales reciben asientos. Una cuenta con hijos no puede ser transaccional.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 font-medium transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium disabled:opacity-50 transition-colors shadow-sm">
                                    {isSubmitting ? 'Guardando...' : (selectedId ? 'Actualizar' : 'Guardar Cuenta')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChartOfAccounts;
