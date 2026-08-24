import { useState, useEffect } from 'react';
import { getMyPayrolls } from '../../services/payroll/payrollConfig.service';
import { FiFileText, FiActivity, FiEye } from 'react-icons/fi';

/**
 * Genera e imprime un rol de pago como PDF usando el diálogo de impresión del navegador.
 */
const printPayStubPDF = (detail, user) => {
    const period = new Date(detail.payroll.period);
    const periodLabel = period.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
    const deductions = (() => {
        try { return JSON.parse(detail.deductions) || []; }
        catch { return []; }
    })();
    const bonuses = (() => {
        try { return JSON.parse(detail.bonuses || '[]') || []; }
        catch { return []; }
    })();
    const totalDeductions = deductions.reduce((a, b) => a + (b.amount || 0), 0);
    const totalBonuses = bonuses.reduce((a, b) => a + (b.amount || 0), 0);
    const grossSalary = (detail.netSalary + totalDeductions).toFixed(2);
    const emp = detail.employee || user || {};

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Rol de Pago - ${periodLabel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12px; color: #111827; background: white; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 20px; }
    .company { font-size: 18px; font-weight: bold; color: #111827; }
    .company-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .badge { border: 1px solid #e5e7eb; background: #f9fafb; color: #374151; padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; font-family: monospace; }
    .title { text-align: center; font-size: 14px; font-weight: bold; color: #111827; margin: 16px 0 20px; text-transform: uppercase; letter-spacing: 0.5px; }
    .section { margin-bottom: 18px; }
    .section-title { font-size: 10px; font-weight: bold; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 10px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
    .field { display: flex; flex-direction: column; }
    .field-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; }
    .field-value { font-size: 12px; font-weight: 500; color: #111827; margin-top: 1px; }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    th { background: #f9fafb; text-align: left; padding: 6px 10px; font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
    td { padding: 6px 10px; border-bottom: 1px solid #f3f4f6; font-size: 12px; font-family: monospace; }
    .amount { text-align: right; }
    .deduction { color: #991b1b; }
    .bonus { color: #166534; }
    .totals-box { border: 1px solid #e5e7eb; border-radius: 4px; padding: 12px 16px; margin-top: 18px; background: #f9fafb; }
    .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; font-family: monospace; }
    .totals-row.total { border-top: 1px solid #111827; margin-top: 8px; padding-top: 8px; font-weight: bold; font-size: 13px; color: #111827; }
    .footer { margin-top: 36px; border-top: 1px solid #e5e7eb; padding-top: 16px; display: flex; justify-content: space-around; text-align: center; font-size: 10px; color: #6b7280; }
    .signature-line { border-top: 1px solid #111827; margin: 40px auto 4px; width: 180px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">SISTEMA DE TALENTO HUMANO & NÓMINA</div>
      <div class="company-sub">Comprobante Oficial de Rol de Pagos Individual</div>
    </div>
    <div class="badge">OFICIAL</div>
  </div>

  <div class="title">Rol de Pago Individual — ${periodLabel}</div>

  <div class="section">
    <div class="section-title">Datos del Colaborador</div>
    <div class="grid2">
      <div class="field"><span class="field-label">Nombre Completo</span><span class="field-value">${emp?.firstName || ''} ${emp?.lastName || ''}</span></div>
      <div class="field"><span class="field-label">Cédula / Documento</span><span class="field-value" style="font-family: monospace;">${emp?.identityCard || 'S/N'}</span></div>
      <div class="field"><span class="field-label">Cargo / Puesto</span><span class="field-value">${emp?.position || 'Colaborador'}</span></div>
      <div class="field"><span class="field-label">Departamento</span><span class="field-value">${emp?.department || 'General'}</span></div>
      <div class="field"><span class="field-label">Días Trabajados</span><span class="field-value" style="font-family: monospace;">${detail.workedDays || 30} días</span></div>
      <div class="field"><span class="field-label">Período Fiscal</span><span class="field-value">${periodLabel}</span></div>
      <div class="field"><span class="field-label">Fecha de Emisión</span><span class="field-value" style="font-family: monospace;">${new Date().toLocaleDateString('es-EC')}</span></div>
      <div class="field"><span class="field-label">Estado de Nómina</span><span class="field-value">${detail.payroll.status === 'PAID' ? 'PAGADO' : 'APROBADO'}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Ingresos y Remuneraciones</div>
    <table>
      <thead><tr><th>Concepto</th><th class="amount">Monto</th></tr></thead>
      <tbody>
        <tr><td>Sueldo Base Mensual Ganado</td><td class="amount bonus">$${(parseFloat(grossSalary) - totalBonuses - (detail.overtimeAmount || 0)).toFixed(2)}</td></tr>
        ${detail.overtimeAmount > 0 ? `<tr><td>Horas Extras y Suplementarias (${detail.overtimeHours || 0} hrs)</td><td class="amount bonus">+$${Number(detail.overtimeAmount).toFixed(2)}</td></tr>` : ''}
        ${bonuses.map(b => `<tr><td>${b.concept || b.name || 'Bono / Beneficio'}</td><td class="amount bonus">+$${(b.amount || 0).toFixed(2)}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Descuentos y Retenciones Legales</div>
    <table>
      <thead><tr><th>Concepto</th><th class="amount">Monto</th></tr></thead>
      <tbody>
        ${deductions.length > 0 
          ? deductions.map(d => `<tr><td>${d.concept || d.name || 'Descuento / Aporte'}</td><td class="amount deduction">-$${(d.amount || 0).toFixed(2)}</td></tr>`).join('')
          : '<tr><td colspan="2" style="color:#9ca3af; text-align:center;">Sin descuentos registrados en este período.</td></tr>'
        }
      </tbody>
    </table>
  </div>

  <div class="totals-box">
    <div class="totals-row"><span>Total Ingresos Brutos:</span><span class="bonus">$${grossSalary} USD</span></div>
    <div class="totals-row"><span>Total Descuentos / Retenciones:</span><span class="deduction">-$${totalDeductions.toFixed(2)} USD</span></div>
    <div class="totals-row total"><span>LÍQUIDO A RECIBIR (NETO):</span><span>$${parseFloat(detail.netSalary).toFixed(2)} USD</span></div>
  </div>

  <div class="footer">
    <div>
      <div class="signature-line"></div>
      <div>Firma del Colaborador</div>
      <div style="font-family: monospace; font-size: 9px; margin-top: 2px;">C.I. ${emp?.identityCard || 'S/N'}</div>
    </div>
    <div>
      <div class="signature-line"></div>
      <div>Firma Autorizada</div>
      <div>Departamento de Recursos Humanos</div>
    </div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=800,height=900');
    win.document.write(html);
    win.document.close();
    win.onload = () => {
        win.focus();
        win.print();
    };
};

const MyPayments = ({ user }) => {
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [printing, setPrinting] = useState(null);
    const [selectedPayroll, setSelectedPayroll] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await getMyPayrolls();
            if (res.success) setPayrolls(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = (detail) => {
        setPrinting(detail.id);
        setTimeout(() => {
            printPayStubPDF(detail, user);
            setPrinting(null);
        }, 100);
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="bg-white p-5 rounded border border-gray-200">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 font-mono mb-1">
                    Mi Portal · Nómina y Remuneraciones
                </div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                    Mis Recibos de Pago
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                    Historial de roles de pago aprobados, detalle de ingresos y descuentos, y comprobantes oficiales descargables.
                </p>
            </div>

            {loading ? (
                <div className="p-12 text-center text-xs text-gray-400 font-mono">
                    Cargando recibos de pago...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {payrolls.map(detail => {
                        const periodDate = new Date(detail.payroll.period);
                        const periodName = periodDate.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
                        const deductionsList = (() => {
                            try { return JSON.parse(detail.deductions) || []; }
                            catch { return []; }
                        })();
                        const deductionsSum = deductionsList.reduce((a, b) => a + (b.amount || 0), 0);
                        const grossSum = detail.netSalary + deductionsSum;

                        return (
                            <div key={detail.id} className="bg-white p-4 rounded border border-gray-200 flex flex-col justify-between space-y-4">
                                <div>
                                    <div className="flex justify-between items-start pb-3 border-b border-gray-100 mb-3">
                                        <div>
                                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block font-sans">
                                                Período Fiscal
                                            </span>
                                            <h3 className="text-sm font-bold text-gray-900 capitalize">
                                                {periodName}
                                            </h3>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                                            detail.payroll.status === 'PAID'
                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                : 'bg-blue-50 text-blue-800 border-blue-200'
                                        }`}>
                                            {detail.payroll.status === 'PAID' ? 'PAGADO' : 'DISPONIBLE'}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Ingresos Totales:</span>
                                            <span className="font-mono tabular-nums text-gray-800">${grossSum.toFixed(2)} USD</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Descuentos y Aportes:</span>
                                            <span className="font-mono tabular-nums text-rose-700">-${deductionsSum.toFixed(2)} USD</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-gray-100 font-semibold">
                                            <span className="text-gray-900">Líquido a Recibir:</span>
                                            <span className="font-mono tabular-nums text-emerald-800 font-bold">${detail.netSalary.toFixed(2)} USD</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                                    <button
                                        onClick={() => setSelectedPayroll(detail)}
                                        className="border border-gray-300 hover:border-gray-400 bg-white text-gray-700 text-xs font-medium px-2.5 py-1.5 rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <FiEye className="w-3.5 h-3.5" />
                                        <span>Ver Detalle</span>
                                    </button>
                                    <button
                                        onClick={() => handlePrint(detail)}
                                        disabled={printing === detail.id}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-2.5 py-1.5 rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                                    >
                                        {printing === detail.id
                                            ? <><FiActivity className="animate-spin w-3.5 h-3.5" /> <span>Generando...</span></>
                                            : <><FiFileText className="w-3.5 h-3.5" /> <span>Imprimir PDF</span></>
                                        }
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {payrolls.length === 0 && (
                        <div className="col-span-full p-12 text-center text-gray-400 text-xs bg-white rounded border border-gray-200">
                            <p className="text-sm font-semibold text-gray-800">No tienes roles de pago generados</p>
                            <p className="text-xs text-gray-400 mt-1">Los comprobantes aprobados por el departamento de RRHH aparecerán automáticamente en esta sección.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal de Detalle Completo del Rol de Pago */}
            {selectedPayroll && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded border border-gray-200 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto text-xs space-y-4">
                        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">
                                    Detalle del Rol de Pago — {new Date(selectedPayroll.payroll.period).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}
                                </h3>
                                <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                                    Días laborados: {selectedPayroll.workedDays || 30} días · Estado: {selectedPayroll.payroll.status === 'PAID' ? 'PAGADO' : 'APROBADO'}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedPayroll(null)}
                                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Desglose de Ingresos */}
                            <div>
                                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider pb-1 border-b border-gray-100 mb-2">
                                    Rubros de Ingresos
                                </h4>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs py-1">
                                        <span className="text-gray-600">Sueldo Base Mensual</span>
                                        <span className="font-mono tabular-nums text-gray-900 font-medium">${Number(selectedPayroll.baseSalary || 0).toFixed(2)} USD</span>
                                    </div>
                                    {selectedPayroll.overtimeAmount > 0 && (
                                        <div className="flex justify-between text-xs py-1">
                                            <span className="text-gray-600">Horas Extras / Recargos ({selectedPayroll.overtimeHours || 0} hrs)</span>
                                            <span className="font-mono tabular-nums text-emerald-800 font-medium">+${Number(selectedPayroll.overtimeAmount).toFixed(2)} USD</span>
                                        </div>
                                    )}
                                    {(() => {
                                        try {
                                            const bonuses = JSON.parse(selectedPayroll.bonuses || '[]');
                                            return bonuses.map((b, idx) => (
                                                <div key={idx} className="flex justify-between text-xs py-1">
                                                    <span className="text-gray-600">{b.concept || b.name || 'Bono / Beneficio'}</span>
                                                    <span className="font-mono tabular-nums text-emerald-800 font-medium">+${Number(b.amount || 0).toFixed(2)} USD</span>
                                                </div>
                                            ));
                                        } catch {
                                            return null;
                                        }
                                    })()}
                                </div>
                            </div>

                            {/* Desglose de Descuentos */}
                            <div>
                                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider pb-1 border-b border-gray-100 mb-2">
                                    Descuentos y Retenciones
                                </h4>
                                <div className="space-y-1.5">
                                    {(() => {
                                        try {
                                            const deductions = JSON.parse(selectedPayroll.deductions || '[]');
                                            if (deductions.length === 0) {
                                                return <p className="text-gray-400 italic py-1">Sin deducciones aplicadas en el período.</p>;
                                            }
                                            return deductions.map((d, idx) => (
                                                <div key={idx} className="flex justify-between text-xs py-1">
                                                    <span className="text-gray-600">{d.concept || d.name || 'Descuento / Aporte'}</span>
                                                    <span className="font-mono tabular-nums text-rose-700 font-medium">-${Number(d.amount || 0).toFixed(2)} USD</span>
                                                </div>
                                            ));
                                        } catch {
                                            return null;
                                        }
                                    })()}
                                </div>
                            </div>

                            {/* Caja de Neto */}
                            <div className="bg-gray-50 p-3.5 rounded border border-gray-200 flex justify-between items-center text-xs">
                                <div>
                                    <span className="text-gray-500 uppercase font-semibold text-[10px] block">Líquido a Recibir</span>
                                    <span className="text-sm font-bold text-gray-900 font-mono tabular-nums">${Number(selectedPayroll.netSalary).toFixed(2)} USD</span>
                                </div>
                                <button
                                    onClick={() => handlePrint(selectedPayroll)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                    <FiFileText className="w-3.5 h-3.5" />
                                    <span>Imprimir Comprobante</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyPayments;
