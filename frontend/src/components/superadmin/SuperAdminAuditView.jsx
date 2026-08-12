import { useState, useEffect } from 'react';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import { FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function SuperAdminAuditView() {
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedTenantId, setSelectedTenantId] = useState('');
    const [tenantsList, setTenantsList] = useState([]);

    const fetchTenants = async () => {
        try {
            const res = await api.get('/superadmin/tenants-list');
            if (res.data.success) setTenantsList(res.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchLogs = async (pageToLoad = pagination.page) => {
        setLoading(true);
        try {
            const params = { page: pageToLoad, limit: pagination.limit };
            if (search.trim()) params.search = search.trim();
            if (selectedTenantId) params.tenantId = selectedTenantId;

            const res = await api.get('/superadmin/audit', { params });
            if (res.data.success) {
                setLogs(res.data.data);
                if (res.data.pagination) setPagination(res.data.pagination);
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar logs de auditoría global');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTenants(); }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchLogs(1), 300);
        return () => clearTimeout(timer);
    }, [search, selectedTenantId]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) fetchLogs(newPage);
    };

    const getActionStyle = (action) => {
        if (action?.includes('IMPERSONATE')) return 'bg-amber-50 text-amber-800 border-amber-200';
        if (action?.includes('CREATE')) return 'bg-blue-50 text-blue-800 border-blue-200';
        if (action?.includes('SUSPEND') || action?.includes('DELETE')) return 'bg-red-50 text-red-800 border-red-200';
        return 'bg-gray-100 text-gray-700 border-gray-200';
    };

    return (
        <div className="space-y-4">
            {/* Encabezado */}
            <div className="pb-4 border-b border-gray-200">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Backoffice · Gobernanza</p>
                <h1 className="text-xl font-semibold text-gray-900">Auditoría Global del Sistema</h1>
                <p className="text-sm text-gray-500 mt-0.5">Registro inmutable de actividades administrativas, inicios de sesión, cambios de plan e impersonación.</p>
            </div>

            {/* Barra de Filtros */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative w-full sm:w-72">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                    <input
                        type="text"
                        placeholder="Buscar evento, usuario o acción..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400 font-medium shrink-0">Empresa:</span>
                    <select
                        value={selectedTenantId}
                        onChange={(e) => setSelectedTenantId(e.target.value)}
                        className="bg-white border border-gray-200 text-gray-700 text-xs rounded px-3 py-1.5 focus:outline-none focus:border-gray-400 cursor-pointer"
                    >
                        <option value="">Todas las empresas</option>
                        {tenantsList.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.slug})</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tabla de Logs */}
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
                {loading && logs.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 text-sm">
                        Cargando registros de auditoría...
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-sm font-medium text-gray-600">Sin registros</p>
                        <p className="text-xs text-gray-400 mt-1">No se encontraron eventos para los filtros seleccionados.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Fecha y Hora</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Ejecutado por</th>
                                        <th className="py-2.5 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Detalles</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log, idx) => (
                                        <tr key={log.id} className={`border-b border-gray-100 hover:bg-gray-50/60 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                                            <td className="py-2.5 px-4 text-gray-400 font-mono text-xs whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="py-2.5 px-4">
                                                {log.tenant ? (
                                                    <span className="text-xs font-medium text-gray-900">{log.tenant.name}</span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">SaaS Global</span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-4">
                                                <span className={`inline-block px-2 py-0.5 border rounded text-[10px] font-mono font-semibold uppercase tracking-wide ${getActionStyle(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 text-xs font-medium text-gray-700">
                                                {log.performedBy}
                                            </td>
                                            <td className="py-2.5 px-4 text-xs text-gray-500 max-w-xs truncate">
                                                {log.details}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {pagination.totalPages > 1 && (
                            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <p className="text-xs text-gray-500 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                    Página {pagination.page} de {pagination.totalPages} · {pagination.total} registros
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        disabled={pagination.page <= 1}
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        className="p-1.5 border border-gray-200 rounded text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors cursor-pointer"
                                    >
                                        <FiChevronLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        disabled={pagination.page >= pagination.totalPages}
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        className="p-1.5 border border-gray-200 rounded text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors cursor-pointer"
                                    >
                                        <FiChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
