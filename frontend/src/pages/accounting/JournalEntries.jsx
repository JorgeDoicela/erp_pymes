import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getJournalEntries, createJournalEntry, postJournalEntry, getAccounts, getCostCenters, deleteJournalEntry, getPeriods } from '../../services/accounting.service';
import { FiBook, FiPlus, FiCheckCircle, FiAlertCircle, FiEye, FiTrash2, FiX, FiInfo, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useAutoSync from '../../hooks/useAutoSync.js';

const JournalEntries = () => {
    const [entries, setEntries] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [periods, setPeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState('');

    // Estado para el formulario del nuevo asiento
    const [formData, setFormData] = useState({
        entryNumber: `AS-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
        description: '',
        type: 'DAILY',
        lines: [
            { accountId: '', costCenterId: '', description: '', debit: 0, credit: 0 },
            { accountId: '', costCenterId: '', description: '', debit: 0, credit: 0 }
        ]
    });

    const location = useLocation();

    useEffect(() => {
        fetchPeriods();
    }, [location]);

    useEffect(() => {
        if (entries.length > 0 && location.state?.highlightEntryId) {
            const entryExists = entries.find(e => e.id === location.state.highlightEntryId);
            if (entryExists) {
                setSelectedEntry(entryExists);
                // Limpiar el estado para que no se abra de nuevo al refrescar
                window.history.replaceState({}, document.title);
            }
        }
    }, [entries, location]);

    const fetchData = async (periodId = selectedPeriod, isSilent = false) => {
        const idToUse = periodId || selectedPeriod;
        if (!idToUse) {
            setLoading(false);
            return;
        }
        if (!isSilent && !entries.length) setLoading(true);
        try {
            const [entriesData, accountsData, centersData] = await Promise.all([
                getJournalEntries(idToUse),
                getAccounts(),
                getCostCenters()
            ]);
            setEntries(entriesData);
            setAccounts(accountsData.filter(a => a.isTransactional));
            setCostCenters(centersData);
        } catch (error) {
            if (!isSilent) toast.error('Error al cargar libros contables');
        } finally {
            setLoading(false);
        }
    };

    const { lastSynced, isSyncing, triggerSync } = useAutoSync(
        () => fetchData(selectedPeriod, true),
        { intervalMs: 30000, enabled: !!selectedPeriod }
    );

    const fetchPeriods = async () => {
        try {
            const data = await getPeriods();
            setPeriods(data);
            if (data.length > 0) {
                // If there's an open period and no selection yet, pick it
                if (!selectedPeriod) {
                    const latest = data.find(p => p.status === 'OPEN')?.id || data[0].id;
                    setSelectedPeriod(latest);
                    fetchData(latest);
                } else {
                    fetchData(selectedPeriod);
                }
            }
        } catch (error) {
            toast.error('Error al cargar periodos');
        }
    };

    const handleLineChange = (index, field, value) => {
        const newLines = [...formData.lines];
        newLines[index][field] = value;
        setFormData({ ...formData, lines: newLines });
    };

    const addLine = () => {
        setFormData({
            ...formData,
            lines: [...formData.lines, { accountId: '', costCenterId: '', description: '', debit: 0, credit: 0 }]
        });
    };

    const removeLine = (index) => {
        if (formData.lines.length <= 2) return;
        const newLines = formData.lines.filter((_, i) => i !== index);
        setFormData({ ...formData, lines: newLines });
    };

    const totalDebit = formData.lines.reduce((acc, l) => acc + (parseFloat(l.debit) || 0), 0);
    const totalCredit = formData.lines.reduce((acc, l) => acc + (parseFloat(l.credit) || 0), 0);
    const difference = Math.abs(totalDebit - totalCredit);

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.email === 'admin@emplifi.com';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSuperAdmin) {
            toast.error('Modo Supervisión: El SuperAdministrador no puede crear ni modificar asientos contables.');
            return;
        }
        if (difference > 0.01) {
            toast.error('El asiento debe estar cuadrado (Debe = Haber)');
            return;
        }

        try {
            await createJournalEntry(formData);
            toast.success('Asiento guardado en borrador');
            setShowForm(false);
            setFormData({
                entryNumber: `AS-${Date.now().toString().slice(-6)}`,
                date: new Date().toISOString().split('T')[0],
                description: '',
                type: 'DAILY',
                lines: [
                    { accountId: '', costCenterId: '', description: '', debit: 0, credit: 0 },
                    { accountId: '', costCenterId: '', description: '', debit: 0, credit: 0 }
                ]
            });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al guardar');
        }
    };

    const handlePost = async (id) => {
        if (isSuperAdmin) {
            toast.error('Modo Supervisión: El SuperAdministrador no puede mayorizar asientos.');
            return;
        }
        if (!window.confirm('¿Mayorizar este asiento? Una vez contabilizado no podrá ser editado ni eliminado.')) return;
        try {
            const response = await postJournalEntry(id);
            toast.success(response.message || 'Asiento mayorizado exitosamente');
            fetchData();
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Error al mayorizar';
            toast.error(errorMsg, { duration: 5000 }); // Más tiempo para leer el motivo del error
        }
    };

    const handleDelete = async (id) => {
        if (isSuperAdmin) {
            toast.error('Modo Supervisión: El SuperAdministrador no puede eliminar asientos.');
            return;
        }
        if (!window.confirm('¿Eliminar este borrador de asiento?')) return;
        try {
            await deleteJournalEntry(id);
            toast.success('Asiento eliminado');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al eliminar');
        }
    };

    return (
        <div className="space-y-5">
            {/* Header Limpio ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Contabilidad · Registro Asistido</p>
                    <h1 className="text-xl font-semibold text-gray-900">Libro Diario General</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Comprobantes de diario, asientos contables de personal y mayorización.</p>
                </div>
                {!showForm && (
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => { setSelectedPeriod(e.target.value); fetchData(e.target.value); }}
                            className="bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 font-medium focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Todos los Periodos</option>
                            {periods.map(p => (
                                <option key={p.id} value={p.id}>{p.month}/{p.year} - {p.status}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                            <FiPlus size={14} /> Registrar Asiento
                        </button>
                    </div>
                )}
            </div>

            {showForm ? (
                <div className="bg-white rounded border border-gray-200 overflow-hidden animate-fade-in">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Nuevo Asiento Contable</h2>
                        <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 p-1"><FiX size={16} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Número de Asiento</label>
                                <input type="text" readOnly value={formData.entryNumber} className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded font-mono text-gray-600 outline-none" />
                            </div>
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Fecha</label>
                                <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded text-gray-800 focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Glosa / Concepto General</label>
                                <input type="text" required placeholder="Ej: Registro nómina mensual..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded text-gray-800 focus:outline-none focus:border-blue-500" />
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-gray-200 rounded">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Cuenta Contable</th>
                                        <th className="px-4 py-3 text-left">Centro de Costo</th>
                                        <th className="px-4 py-3 text-right w-32">Debe ($)</th>
                                        <th className="px-4 py-3 text-right w-32">Haber ($)</th>
                                        <th className="px-4 py-3 text-center w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 italic">
                                    {formData.lines.map((line, idx) => (
                                        <tr key={idx}>
                                            <td className="p-2">
                                                <select required value={line.accountId} onChange={e => handleLineChange(idx, 'accountId', e.target.value)} className="w-full p-2 bg-transparent outline-none focus:bg-white rounded-lg">
                                                    <option value="">Seleccionar Cuenta...</option>
                                                    {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-2">
                                                <select value={line.costCenterId} onChange={e => handleLineChange(idx, 'costCenterId', e.target.value)} className="w-full p-2 bg-transparent outline-none focus:bg-white rounded-lg">
                                                    <option value="">Gral / Corporativo</option>
                                                    {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-2">
                                                <input type="number" step="0.01" min="0" value={line.debit} onChange={e => handleLineChange(idx, 'debit', e.target.value)} className="w-full p-2 text-right bg-transparent outline-none focus:bg-white rounded-lg font-mono" />
                                            </td>
                                            <td className="p-2">
                                                <input type="number" step="0.01" min="0" value={line.credit} onChange={e => handleLineChange(idx, 'credit', e.target.value)} className="w-full p-2 text-right bg-transparent outline-none focus:bg-white rounded-lg font-mono" />
                                            </td>
                                            <td className="p-2 text-center">
                                                <button type="button" onClick={() => removeLine(idx)} className="text-rose-400 hover:text-rose-600"><FiTrash2 /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50/50 font-bold">
                                    <tr>
                                        <td colSpan="2" className="px-4 py-3 text-right uppercase text-xs">Totales</td>
                                        <td className="px-4 py-3 text-right font-mono text-indigo-600">${totalDebit.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right font-mono text-indigo-600">${totalCredit.toFixed(2)}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                            <button type="button" onClick={addLine} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1">
                                <FiPlus /> Añadir Línea
                            </button>
                            {difference > 0.01 && (
                                <div className="text-rose-600 text-xs font-bold animate-pulse flex items-center gap-2">
                                    <FiAlertCircle /> Diferencia: ${difference.toFixed(2)}
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 text-slate-500 hover:text-slate-700 font-medium">Cancelar</button>
                                <button type="submit" disabled={difference > 0.01} className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md">Guardar Asiento</button>
                            </div>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* VISTA MÓVIL: Tarjetas Apiladas (Responsive UX) */}
                    <div className="block md:hidden divide-y divide-gray-100 bg-white rounded border border-gray-200">
                        {entries.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-xs italic">
                                No hay asientos registrados aún.
                            </div>
                        ) : (
                            entries.map(entry => (
                                <div key={entry.id} className="p-4 space-y-2 bg-white">
                                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 text-xs">{entry.description}</h4>
                                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">{entry.entryNumber} · {entry.type}</p>
                                        </div>
                                        <div className="shrink-0">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${entry.status === 'POSTED' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                                {entry.status === 'POSTED' ? 'Mayorizado' : 'Borrador'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                        <div>
                                            <span className="text-[10px] text-gray-400 font-sans font-medium uppercase block">Fecha</span>
                                            <span className="text-gray-700">{new Date(entry.date).toLocaleDateString('es-EC')}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-gray-400 font-sans font-medium uppercase block">Monto Total</span>
                                            <span className="font-semibold text-gray-900 tabular-nums">${entry.totalDebit.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                                        <button
                                            onClick={() => setSelectedEntry(entry)}
                                            className="px-2.5 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded text-xs font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
                                        >
                                            <FiEye size={12} /> Detalle
                                        </button>
                                        {entry.status === 'DRAFT' && (
                                            <>
                                                <button
                                                    onClick={() => handlePost(entry.id)}
                                                    className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors inline-flex items-center gap-1 cursor-pointer shadow-xs"
                                                >
                                                    <FiCheckCircle size={12} /> Mayorizar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(entry.id)}
                                                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                                                    title="Eliminar Borrador"
                                                >
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* VISTA ESCRITORIO: Tabla Completa */}
                    <div className="hidden md:block bg-white rounded border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-gray-700">
                                <thead className="bg-gray-50 text-[11px] font-semibold uppercase text-gray-500 border-b border-gray-200">
                                    <tr>
                                        <th className="p-3.5">Referencia / Glosa</th>
                                        <th className="p-3.5">Fecha</th>
                                        <th className="p-3.5 text-right">Total ($)</th>
                                        <th className="p-3.5">Estado</th>
                                        <th className="p-3.5 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {entries.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-gray-400">
                                                No hay comprobantes contables registrados en el periodo.
                                            </td>
                                        </tr>
                                    ) : (
                                        entries.map(entry => (
                                            <tr key={entry.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="p-3.5">
                                                    <div className="font-semibold text-gray-900">{entry.description}</div>
                                                    <div className="text-[11px] text-gray-400 font-mono">{entry.entryNumber} · {entry.type}</div>
                                                </td>
                                                <td className="p-3.5 font-mono text-gray-600">
                                                    {new Date(entry.date).toLocaleDateString('es-EC')}
                                                </td>
                                                <td className="p-3.5 text-right font-mono font-semibold text-gray-900 tabular-nums">
                                                    ${entry.totalDebit.toFixed(2)}
                                                </td>
                                                <td className="p-3.5">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${entry.status === 'POSTED' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                                        {entry.status === 'POSTED' ? 'Mayorizado' : 'Borrador'}
                                                    </span>
                                                </td>
                                                <td className="p-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => setSelectedEntry(entry)}
                                                            className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                                                            title="Ver Detalle"
                                                        >
                                                            <FiEye size={16} />
                                                        </button>
                                                        {entry.status === 'DRAFT' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handlePost(entry.id)}
                                                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[11px] font-medium transition-colors shadow-xs"
                                                                >
                                                                    Mayorizar
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(entry.id)}
                                                                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                                                                    title="Eliminar Borrador"
                                                                >
                                                                    <FiTrash2 size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Detalle de Asiento */}
            {selectedEntry && (
                <div className="app-modal-overlay">
                    <div className="bg-white rounded border border-gray-200 shadow-xl w-full max-w-4xl overflow-hidden animate-scale-in">
                        <div className="px-5 py-3.5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Comprobante de Diario Contable</h3>
                                <p className="text-[11px] text-gray-500 font-mono mt-0.5">{selectedEntry.entryNumber} — {new Date(selectedEntry.date).toLocaleDateString('es-EC')}</p>
                            </div>
                            <button onClick={() => setSelectedEntry(null)} className="text-gray-400 hover:text-gray-600 p-1"><FiX size={16} /></button>
                        </div>

                        <div className="p-5 space-y-4 text-xs">
                            <div className="bg-blue-50/70 border border-blue-200 rounded p-3 text-gray-700">
                                <p className="font-semibold text-blue-900">{selectedEntry.description}</p>
                                <p className="text-[11px] text-blue-800 font-mono mt-0.5">Estado: <span className="font-semibold uppercase">{selectedEntry.status}</span> · Tipo: {selectedEntry.type}</p>
                            </div>

                            <div className="border border-gray-200 rounded overflow-hidden">
                                <table className="w-full text-xs text-left text-gray-700">
                                    <thead className="bg-gray-50 text-[11px] font-semibold uppercase text-gray-500 border-b border-gray-200">
                                        <tr>
                                            <th className="p-3">Cuenta Contable</th>
                                            <th className="p-3">Centro Costo</th>
                                            <th className="p-3">Descripción Línea</th>
                                            <th className="p-3 text-right">Debe ($)</th>
                                            <th className="p-3 text-right">Haber ($)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 font-mono">
                                        {selectedEntry.lines.map((line, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="p-3 font-sans">
                                                    <div className="font-semibold text-gray-900">{line.account?.name}</div>
                                                    <div className="text-[11px] text-gray-400 font-mono">{line.account?.code}</div>
                                                </td>
                                                <td className="p-3 text-gray-700">
                                                    {line.costCenter?.name || '-'}
                                                </td>
                                                <td className="p-3 text-gray-700 font-sans">
                                                    {line.description || 'Sin detalle adicional'}
                                                </td>
                                                <td className="p-3 text-right tabular-nums text-gray-900">
                                                    {line.debit > 0 ? line.debit.toFixed(2) : '-'}
                                                </td>
                                                <td className="p-3 text-right tabular-nums text-gray-900">
                                                    {line.credit > 0 ? line.credit.toFixed(2) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                                        <tr>
                                            <td colSpan="3" className="p-3 text-right uppercase text-[11px] tracking-wider text-gray-500">Balance Asiento</td>
                                            <td className="p-3 text-right font-mono font-bold text-gray-900 border-l border-gray-100 tabular-nums">
                                                ${selectedEntry.totalDebit.toFixed(2)}
                                            </td>
                                            <td className="p-3 text-right font-mono font-bold text-gray-900 border-l border-gray-100 tabular-nums">
                                                ${selectedEntry.totalCredit.toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button onClick={() => setSelectedEntry(null)} className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded transition-colors">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JournalEntries;
