import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const ExpiringContracts = () => {
    const navigate = useNavigate();
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchContracts = async () => {
            try {
                const response = await api.get('/contracts/expiring?days=60');
                setContracts(response.data.data);
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
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        Contratos por Vencer
                    </h2>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1">Gestión de renovaciones y terminaciones próximas</p>
                </div>
                <button
                    onClick={() => navigate('/admin')}
                    className="app-button-secondary w-full sm:w-auto"
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
                <div className="text-center py-12 text-slate-400 text-xs font-semibold">Cargando alertas...</div>
            ) : (
                <div className="bg-white rounded border border-slate-200/80 overflow-hidden shadow-xs">
                    {/* VISTA MÓVIL: Tarjetas Apiladas (Cero scroll horizontal) */}
                    <div className="block md:hidden divide-y divide-slate-100">
                        {contracts.length > 0 ? (
                            contracts.map((contract) => {
                                const days = getDaysRemaining(contract.endDate);
                                return (
                                    <div key={contract.id} className="p-4 space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">
                                                    {contract.employee.firstName} {contract.employee.lastName}
                                                </p>
                                                <p className="text-xs text-slate-500">{contract.employee.department}</p>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${getStatusColor(days)}`}>
                                                {days} días
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-50">
                                            <span>Vence: {new Date(contract.endDate).toLocaleDateString()}</span>
                                            <button
                                                onClick={() => navigate(`/admin/employees/${contract.employee.id}`)}
                                                className="app-button-secondary py-1 px-3 text-xs cursor-pointer"
                                            >
                                                Ver Expediente
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12 text-slate-400 text-xs italic">
                                No hay contratos próximos a vencer en los siguientes 60 días.
                            </div>
                        )}
                    </div>

                    {/* VISTA ESCRITORIO: Tabla Completa */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="app-table w-full">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider">
                                <tr>
                                    <th className="px-6 py-3.5">Empleado</th>
                                    <th className="px-6 py-3.5">Departamento</th>
                                    <th className="px-6 py-3.5">Fecha Vencimiento</th>
                                    <th className="px-6 py-3.5">Días Restantes</th>
                                    <th className="px-6 py-3.5 text-right">Acciones</th>
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
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(days)}`}>
                                                        {days} días
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => navigate(`/admin/employees/${contract.employee.id}`)}
                                                        className="app-button-secondary py-1 px-3 text-xs cursor-pointer"
                                                    >
                                                        Ver Expediente
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-12 text-slate-400 text-xs italic">
                                            No hay contratos próximos a vencer en los siguientes 60 días.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpiringContracts;
