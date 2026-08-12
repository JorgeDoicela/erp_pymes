import React, { useState, useEffect } from 'react';
import { getTrialBalance, getPeriods, getGeneralLedger } from '../../services/accounting.service';
import { FiFileText, FiPrinter, FiEye, FiX, FiBookOpen } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useAutoSync from '../../hooks/useAutoSync.js';

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

    const fetchData = async (periodId = selectedPeriod, isSilent = false) => {
        if (!periodId) return;
        if (!isSilent && !balance.length) setLoading(true);
        try {
            const data = await getTrialBalance(periodId);
            setBalance(data);
        } catch (error) {
            if (!isSilent) toast.error('Error al cargar el Balance de Comprobación');
        } finally {
            setLoading(false);
        }
    };

    useAutoSync(
        () => fetchData(selectedPeriod, true),
        { intervalMs: 30000, enabled: !!selectedPeriod }
    );

    const handleViewLedger = async (account) => {
        setLedgerAccount(account);
        setLoadingLedger(true);
        try {
            const movements = await getGeneralLedger(account.id || account.code, selectedPeriod);
            setLedgerMovements(movements);
        } catch (error) {
            toast.error('Error al cargar movimientos del Mayor');
        } finally {
            setLoadingLedger(false);
        }
    };

    const totalDebits = balance.reduce((acc, row) => acc + (row.totalDebits || 0), 0);
    const totalCredits = balance.reduce((acc, row) => acc + (row.totalCredits || 0), 0);
    const difference = totalDebits - totalCredits;

    return (
        <div className="space-y-5">
            {/* Header Limpio ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Contabilidad · Reportes Financieros</p>
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <FiFileText className="text-blue-600" /> Balance de Comprobación
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Niveles de cuenta y saldos acumulados de sumas y saldos.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => { setSelectedPeriod(e.target.value); fetchData(e.target.value); }}
                        className="bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                    >
                        <option value="">Seleccionar Periodo</option>
                        {periods.map(p => <option key={p.id} value={p.id}>{p.month}/{p.year} - {p.status}</option>)}
                    </select>
                    <button onClick={() => window.print()} className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer inline-flex items-center gap-1.5">
                        <FiPrinter size={14} /> Imprimir Reporte
                    </button>
                </div>
            </div>

            <div className="app-table-wrapper">
                <table className="app-table">
                    <thead>
                        <tr>
                            <th className="app-th">Código</th>
                            <th className="app-th">Cuenta Contable</th>
                            <th className="app-th text-right">Débitos ($)</th>
                            <th className="app-th text-right">Créditos ($)</th>
                            <th className="app-th text-right">Saldo Neto ($)</th>
                            <th className="app-th text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="app-td text-center py-12 text-gray-400">
                                    Cargando datos del Balance de Comprobación...
                                </td>
                            </tr>
                        ) : balance.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="app-td text-center py-12 text-gray-400">
                                    No hay registros de asientos o información para este período.
                                </td>
                            </tr>
                        ) : (
                            balance.map((row, idx) => (
                                <tr key={row.code || idx} className="hover:bg-gray-50/60 transition-colors">
                                    <td className="app-td font-mono font-semibold text-gray-900" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{row.code}</td>
                                    <td className="app-td font-medium text-gray-800">{row.name}</td>
                                    <td className="app-td text-right font-mono text-gray-900" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                        {row.totalDebits > 0 ? `$${row.totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                                    </td>
                                    <td className="app-td text-right font-mono text-gray-900" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                        {row.totalCredits > 0 ? `$${row.totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                                    </td>
                                    <td className={`app-td text-right font-mono font-semibold ${(row.balance || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`} style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                        ${(row.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="app-td text-center">
                                        <button
                                            onClick={() => handleViewLedger(row)}
                                            className="app-button-table inline-flex items-center gap-1"
                                            title="Ver Mayor Auxiliar"
                                        >
                                            <FiEye size={12} /> Mayor
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                        <tr>
                            <td colSpan="2" className="px-4 py-3 font-semibold text-gray-900 uppercase text-[11px] tracking-wider">Totales de Control</td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                ${totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                ${totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td colSpan="2" className={`px-4 py-3 text-right font-mono font-semibold text-xs ${Math.abs(difference) < 0.01 ? 'text-green-700' : 'text-red-700'}`} style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                Diferencia: ${difference.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Drawer Modal de Mayor Auxiliar */}
            {ledgerAccount && (
                <div className="app-modal-overlay" onClick={() => setLedgerAccount(null)}>
                    <div className="app-modal-content max-w-3xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <FiBookOpen className="text-blue-600" /> Mayor Auxiliar: {ledgerAccount.code} - {ledgerAccount.name}
                                </h3>
                                <p className="text-xs text-gray-500">Movimientos contables detallados del periodo seleccionado.</p>
                            </div>
                            <button onClick={() => setLedgerAccount(null)} className="text-gray-400 hover:text-gray-600 p-1">
                                <FiX size={18} />
                            </button>
                        </div>
                        <div className="py-2">
                            {loadingLedger ? (
                                <div className="text-center py-8 text-xs text-gray-400">Cargando movimientos...</div>
                            ) : ledgerMovements.length === 0 ? (
                                <div className="text-center py-8 text-xs text-gray-400">Sin movimientos registrados para esta cuenta.</div>
                            ) : (
                                <div className="app-table-wrapper">
                                    <table className="app-table">
                                        <thead>
                                            <tr>
                                                <th className="app-th">Fecha</th>
                                                <th className="app-th">Asiento</th>
                                                <th className="app-th">Descripción</th>
                                                <th className="app-th text-right">Débito</th>
                                                <th className="app-th text-right">Crédito</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ledgerMovements.map((mov, mIdx) => (
                                                <tr key={mIdx}>
                                                    <td className="app-td font-mono">{mov.date ? new Date(mov.date).toLocaleDateString() : '-'}</td>
                                                    <td className="app-td font-mono font-medium">{mov.entryNumber}</td>
                                                    <td className="app-td">{mov.description}</td>
                                                    <td className="app-td text-right font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>${(mov.debit || 0).toFixed(2)}</td>
                                                    <td className="app-td text-right font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>${(mov.credit || 0).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="pt-3 border-t border-gray-200 flex justify-end">
                            <button onClick={() => setLedgerAccount(null)} className="app-button-secondary">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrialBalance;
