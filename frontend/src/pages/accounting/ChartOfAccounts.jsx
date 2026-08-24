import React, { useState, useEffect } from 'react';
import { getAccounts, createAccount, updateAccount, deleteAccount, getGeneralLedger } from '../../services/accounting.service';
import { FiPlus, FiFolder, FiFileText, FiRefreshCw, FiHash, FiEdit2, FiTrash2, FiX, FiEye, FiBookOpen } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useAutoSync from '../../hooks/useAutoSync.js';

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

    const fetchAccounts = async (isSilent = false) => {
        if (!isSilent && !accounts.length) setLoading(true);
        try {
            const data = await getAccounts();
            setAccounts(data);
        } catch (error) {
            if (!isSilent) toast.error('Error al cargar el catálogo de cuentas');
        } finally {
            setLoading(false);
        }
    };

    const { lastSynced, isSyncing, triggerSync } = useAutoSync(
        () => fetchAccounts(true),
        { intervalMs: 30000 }
    );

    useEffect(() => {
        fetchAccounts();
    }, []);

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
        <div className="space-y-5">
            {/* Header Limpio ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Contabilidad · Estructura Financiera</p>
                    <h1 className="text-xl font-semibold text-gray-900">Plan de Cuentas Contable</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Estructura jerárquica de cuentas bajo NIIF y auditoría de saldos.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                        <FiPlus size={14} /> Nueva Cuenta Madre
                    </button>
                </div>
            </div>

            <div className="bg-white rounded p-4 border border-gray-200 min-h-[450px]">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded border border-dashed border-gray-200">
                        <FiHash className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <h3 className="text-xs font-semibold text-gray-700">Catálogo Vacío</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">Crea la estructura de cuentas de Nivel 1 (Activo, Pasivo, Patrimonio).</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {renderTree(accounts)}
                    </div>
                )}
            </div>

            {/* Modal de Mayor Auxiliar */}
            {viewingLedger && (
                <div className="app-modal-overlay">
                    <div className="bg-white rounded border border-gray-200 shadow-xl w-full max-w-4xl overflow-hidden animate-scale-in">
                        <div className="px-5 py-3.5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2"><FiBookOpen className="text-blue-600" /> Mayor de Cuenta Auxiliar</h3>
                                <p className="text-[11px] font-mono text-gray-500 mt-0.5">{viewingLedger.code} — {viewingLedger.name}</p>
                            </div>
                            <button onClick={() => setViewingLedger(null)} className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"><FiX size={18} /></button>
                        </div>

                        <div className="p-5 max-h-[60vh] overflow-y-auto">
                            {loadingLedger ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-2">
                                    <FiRefreshCw className="animate-spin text-blue-600 w-6 h-6" />
                                    <p className="text-gray-500 text-xs font-mono">Cargando movimientos contables...</p>
                                </div>
                            ) : ledgerMovements.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded border border-dashed border-gray-200 text-xs text-gray-400 italic">
                                    Esta cuenta no registra movimientos históricos en el ejercicio.
                                </div>
                            ) : (
                                <div className="border border-gray-200 rounded overflow-hidden">
                                    <table className="w-full text-xs text-left text-gray-700">
                                        <thead className="bg-gray-50 text-[11px] uppercase font-semibold text-gray-500 border-b border-gray-200">
                                            <tr>
                                                <th className="p-3">Fecha</th>
                                                <th className="p-3">Asiento</th>
                                                <th className="p-3">Glosa / Concepto</th>
                                                <th className="p-3 text-right">Debe ($)</th>
                                                <th className="p-3 text-right">Haber ($)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 font-mono">
                                            {ledgerMovements.map((mov, i) => (
                                                <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                                                    <td className="p-3 text-gray-600">{new Date(mov.journalEntry?.date).toLocaleDateString('es-EC')}</td>
                                                    <td className="p-3 font-semibold text-blue-700">{mov.journalEntry?.entryNumber}</td>
                                                    <td className="p-3 text-gray-800 font-sans">{mov.description || mov.journalEntry?.description}</td>
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
                            <button onClick={() => setViewingLedger(null)} className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded transition-colors">
                                Cerrar Auditoría
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Creación / Edición */}
            {showModal && (
                <div className="app-modal-overlay">
                    <div className="bg-white rounded border border-gray-200 shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="px-5 py-3.5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                {selectedId ? 'Editar Cuenta' : (formData.parentId ? 'Nueva Subcuenta' : 'Nueva Cuenta Madre')}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1"><FiX size={16} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
                            {!formData.parentId && !selectedId && (
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Naturaleza Contable</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded text-gray-800 focus:outline-none focus:border-blue-500"
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
                                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded text-gray-800 font-mono focus:outline-none focus:border-blue-500 disabled:opacity-60"
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Nivel</label>
                                    <input
                                        type="number" required min="1" disabled
                                        value={formData.level}
                                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-gray-500 font-mono cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Nombre de Cuenta</label>
                                <input
                                    type="text" required placeholder="Ej: Caja General"
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
                                />
                            </div>

                            <div className="flex items-start gap-2.5 p-3 bg-gray-50 border border-gray-200 rounded">
                                <input
                                    type="checkbox"
                                    id="isTransactional"
                                    disabled={!!selectedId && accounts.some(a => a.parentId === selectedId)}
                                    checked={formData.isTransactional}
                                    onChange={e => setFormData({ ...formData, isTransactional: e.target.checked })}
                                    className="h-4 w-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                                />
                                <div className="text-xs">
                                    <label htmlFor="isTransactional" className="font-semibold text-gray-900 cursor-pointer block">
                                        Es Cuenta Transaccional
                                    </label>
                                    <p className="text-gray-500 text-[11px] mt-0.5">Solo las transaccionales reciben asientos. Cuentas con subcuentas no son transaccionales.</p>
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-3.5 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 font-medium text-xs transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-3.5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-xs disabled:opacity-50 transition-colors shadow-xs">
                                    {isSubmitting ? 'Guardando...' : (selectedId ? 'Actualizar Cuenta' : 'Guardar Cuenta')}
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
