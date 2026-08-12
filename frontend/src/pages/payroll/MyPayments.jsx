import { useState, useEffect } from 'react';
import { getMyPayrolls } from '../../services/payroll/payrollConfig.service';
import { FiFileText, FiActivity } from 'react-icons/fi';

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
    const emp = detail.employee;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Rol de Pago - ${periodLabel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; color: #111827; background: white; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 20px; }
    .company { font-size: 18px; font-weight: bold; color: #111827; }
    .company-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .badge { border: 1px solid #e5e7eb; background: #f9fafb; color: #374151; padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: bold; uppercase; }
    .title { text-align: center; font-size: 14px; font-weight: bold; color: #111827; margin: 16px 0 20px; text-transform: uppercase; letter-spacing: 0.5px; }
    .section { margin-bottom: 18px; }
    .section-title { font-size: 10px; font-weight: bold; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 10px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
    .field { display: flex; flex-direction: column; }
    .field-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; }
    .field-value { font-size: 12px; font-weight: 500; color: #111827; margin-top: 1px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f9fafb; text-align: left; padding: 6px 10px; font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
    td { padding: 6px 10px; border-bottom: 1px solid #f3f4f6; font-size: 12px; font-family: monospace; }
    .amount { text-align: right; }
    .deduction { color: #991b1b; }
    .bonus { color: #166534; }
    .totals-box { border: 1px solid #e5e7eb; border-radius: 4px; padding: 12px 16px; margin-top: 18px; background: #f9fafb; }
    .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; font-family: monospace; }
    .totals-row.total { border-top: 1px solid #111827; margin-top: 8px; padding-top: 8px; font-weight: bold; font-size: 13px; color: #111827; }
    .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; display: flex; justify-content: space-around; text-align: center; font-size: 10px; color: #6b7280; }
    .signature-line { border-top: 1px solid #111827; margin: 40px auto 4px; width: 160px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">EMPLIFI ERP</div>
      <div class="company-sub">Comprobante de Rol de Pagos Individual</div>
    </div>
    <div class="badge">OFICIAL</div>
  </div>

  <div class="title">Rol de Pago — ${periodLabel}</div>

  <div class="section">
    <div class="section-title">Datos del Colaborador</div>
    <div class="grid2">
      <div class="field"><span class="field-label">Nombre Completo</span><span class="field-value">${emp?.firstName || ''} ${emp?.lastName || ''}</span></div>
      <div class="field"><span class="field-label">Cargo / Puesto</span><span class="field-value">${emp?.position || 'N/A'}</span></div>
      <div class="field"><span class="field-label">Departamento</span><span class="field-value">${emp?.department || 'N/A'}</span></div>
      <div class="field"><span class="field-label">Período Fiscal</span><span class="field-value">${periodLabel}</span></div>
      <div class="field"><span class="field-label">Fecha de Emisión</span><span class="field-value">${new Date().toLocaleDateString('es-EC')}</span></div>
      <div class="field"><span class="field-label">Estado</span><span class="field-value">${detail.payroll.status === 'PAID' ? 'PAGADO' : detail.payroll.status === 'APPROVED' ? 'APROBADO' : detail.payroll.status}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Ingresos</div>
    <table>
      <thead><tr><th>Concepto</th><th class="amount">Monto</th></tr></thead>
      <tbody>
        <tr><td>Salario Base</td><td class="amount bonus">$${(parseFloat(grossSalary) - totalBonuses).toFixed(2)}</td></tr>
        ${bonuses.map(b => `<tr><td>${b.concept || b.name || 'Bono'}</td><td class="amount bonus">+$${(b.amount || 0).toFixed(2)}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>

  ${deductions.length > 0 ? `
  <div class="section">
    <div class="section-title">Descuentos</div>
    <table>
      <thead><tr><th>Concepto</th><th class="amount">Monto</th></tr></thead>
      <tbody>
        ${deductions.map(d => `<tr><td>${d.concept || d.name || 'Descuento'}</td><td class="amount deduction">-$${(d.amount || 0).toFixed(2)}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <div class="totals-box">
    <div class="totals-row"><span>Total Ingresos</span><span class="bonus">$${grossSalary}</span></div>
    <div class="totals-row"><span>Total Descuentos</span><span class="deduction">-$${totalDeductions.toFixed(2)}</span></div>
    <div class="totals-row total"><span>NETO A RECIBIR</span><span>$${parseFloat(detail.netSalary).toFixed(2)} USD</span></div>
  </div>

  <div class="footer">
    <div>
      <div class="signature-line"></div>
      <div>Firma del Empleado</div>
      <div>${emp?.firstName || ''} ${emp?.lastName || ''}</div>
    </div>
    <div>
      <div class="signature-line"></div>
      <div>Firma Autorizada</div>
      <div>Departamento de RRHH</div>
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
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Nómina y Compensaciones
                </div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                    Mis Recibos de Pago
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                    Historial de roles de pago emitidos y comprobantes descargables.
                </p>
            </div>

            {loading ? (
                <div className="p-8 text-center text-xs text-gray-400 font-mono">Cargando recibos de pago...</div>
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
                            <div key={detail.id} className="bg-white p-4 rounded border border-gray-200 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-3">
                                        <div>
                                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                                                Período Fiscal
                                            </span>
                                            <h3 className="text-sm font-bold text-gray-900 capitalize">
                                                {periodName}
                                            </h3>
                                        </div>
                                        {detail.payroll.status === 'APPROVED' || detail.payroll.status === 'PAID' ? (
                                            <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-[11px] font-medium">
                                                {detail.payroll.status === 'PAID' ? 'PAGADO' : 'DISPONIBLE'}
                                            </span>
                                        ) : (
                                            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-medium">PROCESANDO</span>
                                        )}
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">Ingresos Totales:</span>
                                            <span className="font-mono tabular-nums text-gray-700">${grossSum.toFixed(2)} USD</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">Descuentos Aplicados:</span>
                                            <span className="font-mono tabular-nums text-red-700">-${deductionsSum.toFixed(2)} USD</span>
                                        </div>
                                        <div className="flex justify-between text-xs pt-2 border-t border-gray-100 font-semibold">
                                            <span className="text-gray-900">Neto a Recibir:</span>
                                            <span className="font-mono tabular-nums text-gray-900">${detail.netSalary.toFixed(2)} USD</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handlePrint(detail)}
                                    disabled={printing === detail.id}
                                    className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 hover:text-gray-900 text-xs px-3 py-1.5 rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    {printing === detail.id
                                        ? <><FiActivity className="animate-spin w-3.5 h-3.5" /> Generando PDF...</>
                                        : <><FiFileText className="w-3.5 h-3.5" /> Comprobante PDF</>
                                    }
                                </button>
                            </div>
                        );
                    })}

                    {payrolls.length === 0 && (
                        <div className="col-span-full p-12 text-center text-gray-400 text-sm bg-white rounded border border-gray-200">
                            <p className="text-sm font-medium text-gray-700">No tienes roles de pago generados</p>
                            <p className="text-xs text-gray-400 mt-1">Los roles de pago aprobados por RRHH aparecerán en esta sección.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MyPayments;

