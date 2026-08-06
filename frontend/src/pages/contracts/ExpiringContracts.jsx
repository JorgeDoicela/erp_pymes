import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios'; // Use configured axios instance

const ExpiringContracts = () => {
    const navigate = useNavigate();
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchContracts = async () => {
            try {
                const response = await api.get('/contracts/expiring?days=60'); // Get next 60 days to be safe
                setContracts(response.data.data); // Adjust based on API structure
            } catch (err) {
                console.error(err);
                setError('Error al cargar contratos por vencer');
            } finally {
                setLoading(false);
            }
        };

        fetchContracts();
    }, []);

    const getDaysRemaining = (endDate) => {
        const end = new Date(endDate);
        const today = new Date();
        const diffTime = end - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getStatusColor = (days) => {
        if (days <= 7) return 'bg-rose-50 text-rose-700 border-rose-200/60';
        if (days <= 15) return 'bg-amber-50 text-amber-700 border-amber-200/60';
        return 'bg-slate-100 text-slate-700 border-slate-200/60';
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        Contratos por Vencer
                    </h2>
                    <p className="text-slate-500 text-xs mt-1">Gestión de renovaciones y terminaciones próximas</p>
                </div>
                <button
                    onClick={() => navigate('/admin')}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 transition-colors text-slate-700 text-xs font-semibold shadow-xs"
                >
                    Volver al Panel
                </button>
            </header>

            {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-700 text-xs font-medium">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-slate-400 text-xs">Cargando alertas...</div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-3.5">Empleado</th>
                                <th className="px-6 py-3.5">Departamento</th>
                                <th className="px-6 py-3.5">Fecha Vencimiento</th>
                                <th className="px-6 py-3.5">Días Restantes</th>
                                <th className="px-6 py-3.5">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {contracts.length > 0 ? (
                                contracts.map((contract) => {
                                    const days = getDaysRemaining(contract.endDate);
                                    return (
                                        <tr key={contract.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900 text-xs">
                                                    {contract.employee.firstName} {contract.employee.lastName}
                                                </div>
                                                <div className="text-[11px] text-slate-400">{contract.employee.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-600">{contract.employee.department}</td>
                                            <td className="px-6 py-4 text-xs text-slate-600">
                                                {new Date(contract.endDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${getStatusColor(days)}`}>
                                                    {days} días
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => navigate(`/admin/employees/${contract.employee.id}`)}
                                                    className="text-xs font-semibold text-slate-900 hover:underline"
                                                >
                                                    Ver Perfil
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 text-xs italic">
                                        No hay contratos próximos a vencer (30 días).
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ExpiringContracts;
