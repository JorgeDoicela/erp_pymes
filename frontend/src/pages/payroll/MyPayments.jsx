import { useState, useEffect } from 'react';
import { getMyPayrolls } from '../../services/payroll/payrollConfig.service';
import { FiFileText, FiActivity } from 'react-icons/fi';

/**
 * Genera e imprime un rol de pago como PDF usando el diálogo de impresión del navegador.
 * No require dependencias externas ni endpoints backend.
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
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1e293b; background: white; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px; }
    .company { font-size: 20px; font-weight: bold; color: #2563eb; }
    .company-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .badge { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; }
    .title { text-align: center; font-size: 15px; font-weight: bold; color: #1e293b; margin: 16px 0 20px; text-transform: uppercase; letter-spacing: 1px; }
    .section { margin-bottom: 18px; }
    .section-title { font-size: 11px; font-weight: bold; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 10px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
    .field { display: flex; flex-direction: column; }
    .field-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.3px; }
    .field-value { font-size: 12px; font-weight: 500; color: #1e293b; margin-top: 1px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f1f5f9; text-align: left; padding: 6px 10px; font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; }
    td { padding: 6px 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
    .amount { text-align: right; }
    .deduction { color: #dc2626; }
    .bonus { color: #16a34a; }
    .totals-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-top: 18px; }
    .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
    .totals-row.total { border-top: 2px solid #2563eb; margin-top: 8px; padding-top: 8px; font-weight: bold; font-size: 14px; color: #16a34a; }
    .footer { margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; display: flex; justify-content: space-around; text-align: center; font-size: 10px; color: #94a3b8; }
    .signature-line { border-top: 1px solid #1e293b; margin: 40px auto 4px; width: 160px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">EMPLIFI HR</div>
      <div class="company-sub">Sistema de Recursos Humanos</div>
    </div>
    <div class="badge">ROL DE PAGO</div>
  </div>

  <div class="title">Comprobante de Pago — ${periodLabel}</div>

  <div class="section">
    <div class="section-title">Datos del Empleado</div>
    <div class="grid2">
      <div class="field"><span class="field-label">Nombre Completo</span><span class="field-value">${emp?.firstName || ''} ${emp?.lastName || ''}</span></div>
      <div class="field"><span class="field-label">Cargo</span><span class="field-value">${emp?.position || 'N/A'}</span></div>
      <div class="field"><span class="field-label">Departamento</span><span class="field-value">${emp?.department || 'N/A'}</span></div>
      <div class="field"><span class="field-label">Período</span><span class="field-value">${periodLabel}</span></div>
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
    <div class="totals-row total"><span>NETO A RECIBIR</span><span>$${parseFloat(detail.netSalary).toFixed(2)}</span></div>
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
      <div>Recursos Humanos</div>
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
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-6">
                Mis Roles de Pago
            </h1>

            {loading ? <p className="text-slate-500">Cargando...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {payrolls.map(detail => (
                        <div key={detail.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Período</p>
                                    <h3 className="text-xl font-bold text-slate-800">
                                        {new Date(detail.payroll.period).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}
                                    </h3>
                                </div>
                                {detail.payroll.status === 'APPROVED' || detail.payroll.status === 'PAID' ? (
                                    <span className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full text-xs font-bold">
                                        {detail.payroll.status === 'PAID' ? 'PAGADO' : 'DISPONIBLE'}
                                    </span>
                                ) : (
                                    <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold">PROCESANDO</span>
                                )}
                            </div>

                            <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div className="flex justify-between">
                                    <span className="text-slate-500 text-sm">Ingresos</span>
                                    <span className="text-emerald-600 font-medium">+${(detail.netSalary + (JSON.parse(detail.deductions).reduce((a, b) => a + b.amount, 0))).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-slate-200">
                                    <span className="text-slate-800 font-bold">Total a Recibir</span>
                                    <span className="text-xl font-bold text-emerald-700">${detail.netSalary.toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handlePrint(detail)}
                                disabled={printing === detail.id}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors text-sm font-medium w-full justify-center"
                            >
                                {printing === detail.id
                                    ? <><FiActivity className="animate-spin" /> Generando...</>
                                    : <><FiFileText /> Descargar PDF</>
                                }
                            </button>
                        </div>
                    ))}
                    {payrolls.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                            <p className="text-slate-500 font-medium">No tienes roles de pago generados aún.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MyPayments;
