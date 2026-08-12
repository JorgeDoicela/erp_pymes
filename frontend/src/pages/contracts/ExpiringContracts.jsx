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
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const getStatusBadge = (days) => {
        if (days <= 7) return <span className="px-2 py-0.5 rounded text-[11px] font-mono border bg-red-50 text-red-800 border-red-200">{days} días restantes</span>;
        if (days <= 15) return <span className="px-2 py-0.5 rounded text-[11px] font-mono border bg-amber-50 text-amber-800 border-amber-200">{days} días restantes</span>;
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono border bg-gray-50 text-gray-700 border-gray-200">{days} días restantes</span>;
    };

    return (
        <div className="space-y-5">
            {/* Header ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Contratos · Alertas de Vencimiento</p>
                    <h1 className="text-xl font-semibold text-gray-900">Contratos por Vencer</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Gestión de renovaciones y terminaciones contractuales próximas (60 días).</p>
                </div>
                <button
                    onClick={() => navigate('/admin')}
                    className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer shrink-0"
                >
                    ← Panel Principal
                </button>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">{error}</div>
            )}

            {loading ? (
                <div className="p-12 text-center text-gray-400 text-xs">Cargando contratos por vencer...</div>
            ) : (
                <div className="bg-white rounded border border-gray-200 overflow-hidden">
                    {/* VISTA MÓVIL */}
                    <div className="block md:hidden divide-y divide-gray-100">
                        {contracts.length > 0 ? (
                            contracts.map((contract) => {
                                const days = getDaysRemaining(contract.endDate);
                                return (
                                    <div key={contract.id} className="p-4 space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <div>
                                                <p className="font-semibold text-gray-900 text-xs">
                                                    {contract.employee.firstName} {contract.employee.lastName}
                                                </p>
                                                <p className="text-[11px] text-gray-400">{contract.employee.department}</p>
                                            </div>
                                            {getStatusBadge(days)}
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-50">
                                            <span className="font-mono">{new Date(contract.endDate).toLocaleDateString('es-EC')}</span>
                                            <button
                                                onClick={() => navigate(`/admin/employees/${contract.employee.id}`)}
                                                className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                                            >
                                                Ver Expediente
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center text-gray-400 text-xs">
                                No hay contratos próximos a vencer en los siguientes 60 días.
                            </div>
                        )}
                    </div>

                    {/* VISTA ESCRITORIO */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Empleado</th>
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Departamento</th>
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Fecha Vencimiento</th>
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Restante</th>
                                    <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {contracts.length > 0 ? (
                                    contracts.map((contract) => {
                                        const days = getDaysRemaining(contract.endDate);
                                        return (
                                            <tr key={contract.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="py-2.5 px-4 font-medium text-gray-900">
                                                    {contract.employee.firstName} {contract.employee.lastName}
                                                    <span className="text-[11px] text-gray-400 block font-normal">{contract.employee.email}</span>
                                                </td>
                                                <td className="py-2.5 px-4 text-gray-700">{contract.employee.department}</td>
                                                <td className="py-2.5 px-4 text-gray-700 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                    {new Date(contract.endDate).toLocaleDateString('es-EC')}
                                                </td>
                                                <td className="py-2.5 px-4">
                                                    {getStatusBadge(days)}
                                                </td>
                                                <td className="py-2.5 px-4 text-right">
                                                    <button
                                                        onClick={() => navigate(`/admin/employees/${contract.employee.id}`)}
                                                        className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                    >
                                                        Ver Expediente
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-400">
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
