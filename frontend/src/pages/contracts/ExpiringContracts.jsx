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
        if (days <= 7) return 'bg-red-500/20 text-red-300 border-red-500/50';
        if (days <= 15) return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-400">
                            Contratos por Vencer
                        </h2>
                        <p className="text-slate-400 mt-1">Gestión de renovaciones y terminaciones próximas</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin')}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300"
                    >
                        Volver al Panel
                    </button>
                </header>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12 text-slate-400">Cargando alertas...</div>
                ) : (
                    <div className="bg-slate-800/50 rounded-xl border border-white/5 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">Empleado</th>
                                    <th className="px-6 py-4">Departamento</th>
                                    <th className="px-6 py-4">Fecha Vencimiento</th>
                                    <th className="px-6 py-4">Días Restantes</th>
                                    <th className="px-6 py-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {contracts.length > 0 ? (
                                    contracts.map((contract) => {
                                        const days = getDaysRemaining(contract.endDate);
                                        return (
                                            <tr key={contract.id} className="hover:bg-slate-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-white">
                                                        {contract.employee.firstName} {contract.employee.lastName}
                                                    </div>
                                                    <div className="text-xs text-slate-500">{contract.employee.email}</div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-300">{contract.employee.department}</td>
                                                <td className="px-6 py-4 text-slate-300">
                                                    {new Date(contract.endDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(days)}`}>
                                                        {days} días
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => navigate(`/admin/employees/${contract.employee.id}`)}
                                                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                                                    >
                                                        Gestionar
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                            No hay contratos próximos a vencer (30 días).
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpiringContracts;
