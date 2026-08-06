import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getJournalEntries, createJournalEntry, postJournalEntry, getAccounts, getCostCenters, deleteJournalEntry, getPeriods } from '../../services/accounting.service';
import { FiBook, FiPlus, FiCheckCircle, FiAlertCircle, FiEye, FiTrash2, FiX, FiInfo, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

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

    const fetchData = async (periodId) => {
        const idToUse = periodId || selectedPeriod;
        if (!idToUse) {
            setLoading(false);
            return;
        }
        setLoading(true);
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
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

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
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FiBook className="text-indigo-600" /> Libro Diario
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Registro cronológico de transacciones</p>
                </div>
                {!showForm && (
                    <div className="flex gap-3">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => { setSelectedPeriod(e.target.value); fetchData(e.target.value); }}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Todos los Periodos</option>
                            {periods.map(p => (
                                <option key={p.id} value={p.id}>{p.month}/{p.year} - {p.status}</option>
                            ))}
                        </select>
                        <button onClick={() => fetchData()} className="p-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all"
                        >
                            <FiPlus /> Registrar Asiento
                        </button>
                    </div>
                )}
            </div>

            {showForm ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 animate-fade-in overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h2 className="font-bold text-slate-800">Nuevo Asiento Contable</h2>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><FiX /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Número de Asiento</label>
                                <input type="text" readOnly value={formData.entryNumber} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono text-sm text-slate-600 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label>
                                <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Referencia / Glosa General</label>
                                <input type="text" required placeholder="Ej: Venta de Mercancías segun Fact..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-slate-100 rounded-xl">
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
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="px-6 py-4 border-b">Referencia</th>
                                    <th className="px-6 py-4 border-b">Fecha</th>
                                    <th className="px-6 py-4 border-b text-right">Total ($)</th>
                                    <th className="px-6 py-4 border-b">Estado</th>
                                    <th className="px-6 py-4 border-b text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {entries.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                                            No hay asientos registrados aún.
                                        </td>
                                    </tr>
                                ) : (
                                    entries.map(entry => (
                                        <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{entry.description}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">{entry.entryNumber} | {entry.type}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {new Date(entry.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">
                                                ${entry.totalDebit.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${entry.status === 'POSTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {entry.status === 'POSTED' ? 'Mayorizado' : 'Borrador'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedEntry(entry)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Ver Detalle"
                                                    >
                                                        <FiEye size={18} />
                                                    </button>
                                                    {entry.status === 'DRAFT' && (
                                                        <>
                                                            <button
                                                                onClick={() => handlePost(entry.id)}
                                                                className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all border border-emerald-100"
                                                            >
                                                                <FiCheckCircle /> Mayorizar
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(entry.id)}
                                                                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                                title="Eliminar Borrador"
                                                            >
                                                                <FiTrash2 size={18} />
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
            )}

            {/* Modal de Detalle de Asiento */}
            {selectedEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-scale-in">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Detalle de Asiento Contable</h3>
                                <p className="text-xs text-slate-500 font-mono uppercase">{selectedEntry.entryNumber} | {new Date(selectedEntry.date).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => setSelectedEntry(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><FiX className="text-slate-400" /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-4 items-start">
                                <div className="p-2 bg-indigo-600 text-white rounded-lg">
                                    <FiInfo size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 leading-tight">{selectedEntry.description}</p>
                                    <p className="text-xs text-slate-600 mt-1">Estado: <span className="font-bold text-indigo-600 uppercase">{selectedEntry.status}</span> | Tipo: {selectedEntry.type}</p>
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Cuenta Contable</th>
                                            <th className="px-4 py-3 text-left">Centro Costo</th>
                                            <th className="px-4 py-3 text-left">Descripción Línea</th>
                                            <th className="px-4 py-3 text-right">Debe ($)</th>
                                            <th className="px-4 py-3 text-right">Haber ($)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedEntry.lines.map((line, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-800">{line.account?.name}</div>
                                                    <div className="text-[10px] font-mono text-slate-400">{line.account?.code}</div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600 text-xs">
                                                    {line.costCenter?.name || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-slate-500 text-xs italic">
                                                    {line.description || 'Sin detalle adicional'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-blue-600">
                                                    {line.debit > 0 ? line.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-rose-600">
                                                    {line.credit > 0 ? line.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200">
                                        <tr>
                                            <td colSpan="3" className="px-4 py-4 text-right uppercase text-xs tracking-wider text-slate-500">Totales Cuadrados</td>
                                            <td className="px-4 py-4 text-right font-mono text-indigo-600 border-l border-slate-100">
                                                ${selectedEntry.totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono text-indigo-600 border-l border-slate-100">
                                                ${selectedEntry.totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setSelectedEntry(null)} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all text-sm">
                                Cerrar Vista
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JournalEntries;
