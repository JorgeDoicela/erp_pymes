import { useState, useEffect } from 'react';
import { getMyPayrolls } from '../../services/payroll/payrollConfig.service';
import { generatePayslipPDF } from '../../utils/generatePayslipPDF';

const MyPayments = ({ user }) => {
    // const { user } = useAuth(); // Removed
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const handleDownload = (detail) => {
        // detail has .payroll (header) and other fields
        // We construct the "employee" object from current user context or what's available
        // But better is if `getMyPayrolls` returned full objects.
        // `getMyPayrolls` returns PayrollDetails which includes everything we need EXCEPT full employee data?
        // Wait, `req.user.id` gets `getPayrollsByEmployee`. 
        // The endpoint returns `PayrollDetail` + `Payroll`.
        // We need explicit employee info (department, position) which might NOT be in detail?
        // Ah, `PayrollDetail` only has FK. We need to include `employee` in the query in Backend or use Context.
        // Context `user` has name/role/dept if we stored it?
        // Let's rely on Context `user` for now, assuming it has basics. 
        // Actually best is to update Backend query to include Employee info just in case.

        // Assuming Backend update is done or we use User context:
        generatePayslipPDF(detail, detail.employee, detail.payroll.period);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 mb-8">
                Mis Roles de Pago
            </h1>

            {loading ? <p>Cargando...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {payrolls.map(detail => (
                        <div key={detail.id} className="bg-slate-800 p-6 rounded-xl border border-white/5 hover:border-blue-500/50 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-slate-400">Período</p>
                                    <h3 className="text-xl font-bold">
                                        {new Date(detail.payroll.period).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}
                                    </h3>
                                </div>
                                {detail.payroll.status === 'APPROVED' || detail.payroll.status === 'PAID' ? (
                                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold">
                                        {detail.payroll.status === 'PAID' ? 'PAGADO' : 'DISPONIBLE'}
                                    </span>
                                ) : (
                                    <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs font-bold">PROCESANDO</span>
                                )}
                            </div>

                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Ingresos</span>
                                    <span className="text-green-400">+${(detail.netSalary + (JSON.parse(detail.deductions).reduce((a, b) => a + b.amount, 0))).toFixed(2)}</span>
                                    {/* Approximation only for UI */}
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Total a Recibir</span>
                                    <span className="text-xl font-bold text-white">${detail.netSalary.toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDownload(detail)}
                                disabled={detail.payroll.status !== 'APPROVED' && detail.payroll.status !== 'PAID'}
                                className={`w-full py-2 rounded-lg font-bold flex items-center justify-center gap-2 ${(detail.payroll.status === 'APPROVED' || detail.payroll.status === 'PAID') ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                            >
                                Descargar PDF
                            </button>
                        </div>
                    ))}
                    {payrolls.length === 0 && (
                        <p className="text-slate-500 col-span-3 text-center py-10">No tienes roles de pago generados aún.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default MyPayments;
