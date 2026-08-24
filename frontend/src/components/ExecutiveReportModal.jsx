import { FiPrinter, FiX, FiShield, FiDollarSign } from 'react-icons/fi';

/**
 * Modal de Generación e Impresión de Informe Ejecutivo para Directivos / Junta
 * Estilo minimalista y claro integrado con la plataforma
 */
export default function ExecutiveReportModal({ isOpen, onClose, data }) {
    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    const financial = data?.financialImpact || {
        estimatedTurnoverCostRisk: 0,
        potentialRetentionSavings: 0,
        estimatedAbsenteeismCost: 0,
        totalFinancialOpportunity: 0,
        currency: 'USD',
    };

    const retention = data?.retention?.stats || { total: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0 };
    
    const healthScore = data?.organizationalHealth?.overallScore ?? data?.organizationalHealth?.score ?? 0;
    const healthCategory = data?.organizationalHealth?.category ?? 'Sin datos';

    const formatUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded max-w-4xl w-full shadow-xl overflow-hidden border border-gray-200 my-8">
                {/* Minimalist Header Modal Bar */}
                <div className="bg-gray-50 text-gray-800 p-3 px-5 border-b border-gray-200 flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-xs text-gray-900 uppercase tracking-wider">Informe Ejecutivo Organizacional y Financiero</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                            <FiPrinter size={13} /> Imprimir / PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
                        >
                            <FiX size={16} />
                        </button>
                    </div>
                </div>

                {/* Printable Document Body */}
                <div className="p-8 space-y-6 text-slate-800 print:p-0 print:space-y-4">
                    {/* Document Header */}
                    <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">INFORME ESTRATÉGICO EMPRESARIAL</h1>
                            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mt-1">
                                Sistema de Inteligencia Predictiva & Capital Humano
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-700">FECHA DE EMISIÓN</p>
                            <p className="text-xs text-slate-500">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            <p className="text-[10px] text-slate-400 mt-1">DOCUMENTO CONFIDENCIAL EJECUTIVO</p>
                        </div>
                    </div>

                    {/* Resumen de Salud Organizacional */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl">
                            <p className="text-xs font-semibold text-slate-500">Salud Organizacional Global</p>
                            <p className="text-3xl font-extrabold text-indigo-600 mt-1">{healthScore} <span className="text-sm font-semibold text-slate-400">/ 100</span></p>
                            <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Categoría: {healthCategory}</p>
                        </div>
                        <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl">
                            <p className="text-xs font-semibold text-slate-500">Población Evaluada</p>
                            <p className="text-3xl font-extrabold text-slate-800 mt-1">{retention.total}</p>
                            <p className="text-[11px] text-slate-600 mt-0.5 font-medium">{retention.highRisk} en riesgo alto de rotación</p>
                        </div>
                        <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl">
                            <p className="text-xs font-semibold text-slate-500">Oportunidad de ROI Neto</p>
                            <p className="text-3xl font-extrabold text-emerald-600 mt-1">{formatUSD(financial.totalFinancialOpportunity)}</p>
                            <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Ahorro potencial realizable</p>
                        </div>
                    </div>

                    {/* Desglose Financiero */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                            <FiDollarSign className="text-indigo-600" /> Diagnóstico Financiero de Riesgo y Oportunidades
                        </h3>
                        <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Categoría de Análisis</th>
                                    <th className="p-3">Diagnóstico Situacional</th>
                                    <th className="p-3 text-right">Valor Financiero (USD)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-700">
                                <tr>
                                    <td className="p-3 font-semibold text-slate-900">Riesgo Financiero por Rotación</td>
                                    <td className="p-3">Costo de reemplazo proyectado para {retention.highRisk} empleados en riesgo alto</td>
                                    <td className="p-3 text-right font-bold text-red-600">{formatUSD(financial.estimatedTurnoverCostRisk)}</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-semibold text-slate-900">Retención Preventiva Ahorrable</td>
                                    <td className="p-3">Ahorro proyectado mediante intervenciones y nivelación salarial oportuna</td>
                                    <td className="p-3 text-right font-bold text-emerald-600">{formatUSD(financial.potentialRetentionSavings)}</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-semibold text-slate-900">Pérdida por Ausentismo Atípico</td>
                                    <td className="p-3">Impacto operacional directo por ausencias e imprevistos</td>
                                    <td className="p-3 text-right font-bold text-amber-600">{formatUSD(financial.estimatedAbsenteeismCost)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Recomendaciones Estratégicas Priorizadas */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                            <FiShield className="text-indigo-600" /> Dictamen Estratégico & Plan de Acción para la Alta Dirección
                        </h3>
                        <div className="space-y-2">
                            <div className="p-3.5 bg-slate-50/80 border-l-4 border-indigo-600 text-xs text-slate-700 space-y-1 rounded-r-xl">
                                <p className="font-bold text-slate-900">1. Retención Activa de Personal Clave</p>
                                <p>Ejecutar reuniones de alineación estratégica con los empleados de mayor antigüedad y bajo ratio salarial para evitar fuga de conocimiento.</p>
                            </div>
                            <div className="p-3.5 bg-slate-50/80 border-l-4 border-emerald-500 text-xs text-slate-700 space-y-1 rounded-r-xl">
                                <p className="font-bold text-slate-900">2. Control Eficiente de Costos de Nómina</p>
                                <p>Reorganizar la programación de turnos en departamentos críticos para erradicar sobrecostos del 15%+ en horas extras.</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Signature Block */}
                    <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
                        <div>
                            <p className="font-bold text-slate-800">Generado por Emplifi · Plataforma ERP para PYMEs</p>
                            <p>Plataforma de Analítica Predictiva & Gestión de Talento</p>
                        </div>
                        <div className="text-right border-t border-slate-300 pt-2 w-48 text-center">
                            <p className="font-semibold text-slate-800">Firma / Aprobación</p>
                            <p className="text-[10px] text-slate-400">Dirección General / Gestión Empresarial</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
