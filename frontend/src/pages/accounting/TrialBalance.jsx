import React, { useState, useEffect } from 'react';
import { getTrialBalance, getPeriods, getGeneralLedger } from '../../services/accounting.service';
import { FiFileText, FiPrinter, FiRefreshCw, FiEye, FiX, FiBookOpen, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

const TrialBalance = () => {
    const [balance, setBalance] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [loading, setLoading] = useState(false);

    // Estado para el modal de Mayor Auxiliar (Ledger)
    const [ledgerAccount, setLedgerAccount] = useState(null);
    const [ledgerMovements, setLedgerMovements] = useState([]);
    const [loadingLedger, setLoadingLedger] = useState(false);

    useEffect(() => {
        fetchPeriods();
    }, []);

    const fetchPeriods = async () => {
        try {
            const data = await getPeriods();
            setPeriods(data);
            if (data.length > 0) {
                const latest = data[0].id;
                setSelectedPeriod(latest);
                fetchData(latest);
            }
        } catch (error) {
            toast.error('Error al cargar periodos');
        }
    };

    const fetchData = async (periodId) => {
        if (!periodId) return;
        setLoading(true);
        try {
            const data = await getTrialBalance(periodId);
            setBalance(data);
        } catch (error) {
            toast.error('Error al cargar el Balance de Comprobación');
        } finally {
            setLoading(false);
        }
    };

    const handleViewLedger = async (account) => {
        setLedgerAccount(account);
        setLoadingLedger(true);
        try {
            const movements = await getGeneralLedger(account.id, selectedPeriod);
            setLedgerMovements(movements);
        } catch (error) {
            toast.error('Error al cargar movimientos del Mayor');
        } finally {
            setLoadingLedger(false);
        }
    };

    const totalDebits = balance.reduce((acc, row) => acc + row.totalDebits, 0);
    const totalCredits = balance.reduce((acc, row) => acc + row.totalCredits, 0);
    const difference = totalDebits - totalCredits;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FiFileText className="text-indigo-600" /> Balance de Comprobación
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Niveles de cuenta y saldos acumulados</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => { setSelectedPeriod(e.target.value); fetchData(e.target.value); }}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Seleccionar Periodo</option>
                        {periods.map(p => <option key={p.id} value={p.id}>{p.month}/{p.year} - {p.status}</option>)}
                    </select>
                    <button onClick={() => fetchData(selectedPeriod)} className="p-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-slate-800 transition-all shadow-sm">
                        <FiPrinter /> Imprimir Reporte
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="px-6 py-4 border-b">Código</th>
                                <th className="px-6 py-4 border-b">Cuenta Contable</th>
                                <th className="px-6 py-4 border-b text-right">Débitos ($)</th>
                                <th className="px-6 py-4 border-b text-right">Créditos ($)</th>
                                <th className="px-6 py-4 border-b text-right">Saldo Neto ($)</th>
                                <th className="px-6 py-4 border-b text-center w-16">Mov.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {balance.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400">{loading ? 'Cargando balance...' : 'Sin datos en este periodo'}</td></tr>
                            ) : (
                                balance.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group cursor-pointer" onClick={() => handleViewLedger(row)}>
                                        <td className="px-6 py-4 font-mono font-medium text-slate-900">{row.code}</td>
                                        <td className="px-6 py-4 font-bold text-slate-800">{row.name}</td>
                                        <td className="px-6 py-4 text-right font-mono text-blue-600">
                                            {row.totalDebits > 0 ? row.totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-rose-600">
                                            {row.totalCredits > 0 ? row.totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold font-mono ${row.balance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                            ${row.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="p-1.5 text-slate-300 group-hover:text-indigo-600 transition-colors"><FiEye /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200">
                            <tr>
                                <td colSpan="2" className="px-6 py-5 text-slate-900 uppercase text-xs tracking-widest">Totales de Control</td>
                                <td className="px-6 py-5 text-right font-mono text-blue-700 underline decoration-double decoration-blue-200">
                                    ${totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-5 text-right font-mono text-rose-700 underline decoration-double decoration-rose-200">
                                    ${totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td colSpan="2" className={`px-6 py-5 text-right font-mono text-lg ${Math.abs(difference) < 0.01 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    ${difference.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Modal de Mayor Auxiliar (General Ledger) */}
            {ledgerAccount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden animate-scale-in">
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <FiBookOpen /> Mayor Auxiliar
                                </h3>
                                <p className="text-indigo-100 text-sm opacity-90">{ledgerAccount.code} - {ledgerAccount.name}</p>
                            </div>
                            <button onClick={() => setLedgerAccount(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><FiX size={24} /></button>
                        </div>

                        <div className="p-8 max-h-[70vh] overflow-y-auto">
                            {loadingLedger ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <FiRefreshCw className="animate-spin text-indigo-600 w-10 h-10" />
                                    <p className="text-slate-500 font-medium">Consultando movimientos...</p>
                                </div>
                            ) : ledgerMovements.length === 0 ? (
                                <div className="text-center py-20 text-slate-400 italic">No hay movimientos detallados para esta cuenta en el periodo seleccionado.</div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Resumen del Periodo</span>
                                            <div className="flex gap-8">
                                                <div><p className="text-xs text-slate-500">Debe</p><p className="font-mono font-bold text-blue-600">${ledgerAccount.totalDebits.toLocaleString()}</p></div>
                                                <div><p className="text-xs text-slate-500">Haber</p><p className="font-mono font-bold text-rose-600">${ledgerAccount.totalCredits.toLocaleString()}</p></div>
                                                <div className="border-l border-slate-200 pl-8"><p className="text-xs text-slate-500">Saldo Final</p><p className="font-mono font-bold text-indigo-600 text-lg">${ledgerAccount.balance.toLocaleString()}</p></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                        <table className="w-full text-xs">
                                            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-tighter">
                                                <tr>
                                                    <th className="px-4 py-3 text-left">Asiento</th>
                                                    <th className="px-4 py-3 text-left">Fecha</th>
                                                    <th className="px-4 py-3 text-left">Detalle / Referencia</th>
                                                    <th className="px-4 py-3 text-left">Centro Costo</th>
                                                    <th className="px-4 py-3 text-right">Debe ($)</th>
                                                    <th className="px-4 py-3 text-right">Haber ($)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {ledgerMovements.map((mov, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50">
                                                        <td className="px-4 py-3 font-mono font-bold text-indigo-600">{mov.journalEntry?.entryNumber}</td>
                                                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(mov.journalEntry?.date).toLocaleDateString()}</td>
                                                        <td className="px-4 py-3 text-slate-700 font-medium">{mov.description || mov.journalEntry?.description}</td>
                                                        <td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] text-slate-500">{mov.costCenter?.name || '-'}</span></td>
                                                        <td className="px-4 py-3 text-right font-mono text-blue-600">{mov.debit > 0 ? mov.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}</td>
                                                        <td className="px-4 py-3 text-right font-mono text-rose-600">{mov.credit > 0 ? mov.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setLedgerAccount(null)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all text-sm">
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrialBalance;
