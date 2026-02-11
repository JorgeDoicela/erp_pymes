import { useState, useEffect } from 'react';
import { getMyPayrolls } from '../../services/payroll/payrollConfig.service';
import ExportButtons from '../../components/common/ExportButtons';

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
                                    {/* Approximation only for UI */}
                                </div>
                                <div className="flex justify-between pt-2 border-t border-slate-200">
                                    <span className="text-slate-800 font-bold">Total a Recibir</span>
                                    <span className="text-xl font-bold text-emerald-700">${detail.netSalary.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="mt-auto">
                                <ExportButtons
                                    type="paystub"
                                    id={detail.id}
                                    fileName={`rol_pago_${detail.employee.lastName}_${new Date(detail.payroll.period).getMonth() + 1}`}
                                />
                            </div>
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
