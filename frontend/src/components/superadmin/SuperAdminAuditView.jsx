import { useState, useEffect } from 'react';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import { 
    FiShield, FiSearch, FiRefreshCw, FiChevronLeft, FiChevronRight, 
    FiAlertTriangle, FiFilter, FiUser, FiCalendar
} from 'react-icons/fi';

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
            if (res.data.success) {
                setTenantsList(res.data.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchLogs = async (pageToLoad = pagination.page) => {
        setLoading(true);
        try {
            const params = {
                page: pageToLoad,
                limit: pagination.limit
            };
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

    useEffect(() => {
        fetchTenants();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, selectedTenantId]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchLogs(newPage);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Auditoría Global */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs uppercase tracking-wider mb-1">
                        <FiShield className="w-4 h-4 text-slate-700" /> Gobernanza & Seguridad SaaS
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                        Auditoría Global de Eventos del Sistema
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Registro inmutable de actividades administrativas, inicios de sesión, cambios de plan e impersonación de soporte.
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                        type="text"
                        placeholder="Buscar evento, usuario o acción..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-800"
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                        <FiFilter className="w-4 h-4 text-slate-400" /> Empresa:
                    </div>
                    <select
                        value={selectedTenantId}
                        onChange={(e) => setSelectedTenantId(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none cursor-pointer w-full sm:w-64"
                    >
                        <option value="">Todas las Empresas (Global)</option>
                        {tenantsList.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.slug})</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tabla de Logs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {loading && logs.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <FiRefreshCw className="animate-spin text-3xl mx-auto mb-2 text-slate-600" />
                        <span className="text-sm font-medium">Cargando eventos de auditoría...</span>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <FiAlertTriangle className="text-3xl mx-auto mb-2 text-slate-400" />
                        <p className="text-sm font-medium text-slate-700">No se registraron eventos para los filtros seleccionados.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        <th className="py-3.5 px-4">Fecha & Hora</th>
                                        <th className="py-3.5 px-4">Empresa / Tenant</th>
                                        <th className="py-3.5 px-4">Acción Auditoría</th>
                                        <th className="py-3.5 px-4">Ejecutado Por</th>
                                        <th className="py-3.5 px-4">Detalles</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-3.5 px-4 text-slate-500 font-mono whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {log.tenant ? (
                                                    <span className="font-bold text-slate-900">
                                                        {log.tenant.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">SaaS Global</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                                                    log.action.includes('IMPERSONATE') 
                                                        ? 'bg-amber-100 text-amber-800' 
                                                        : log.action.includes('CREATE')
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 font-medium text-slate-800">
                                                {log.performedBy}
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-600 max-w-md truncate">
                                                {log.details}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        {pagination.totalPages > 1 && (
                            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <p className="text-xs text-slate-500">
                                    Página <span className="font-semibold text-slate-800">{pagination.page}</span> de <span className="font-semibold text-slate-800">{pagination.totalPages}</span> ({pagination.total} registros)
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={pagination.page <= 1}
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        <FiChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        disabled={pagination.page >= pagination.totalPages}
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        <FiChevronRight className="w-4 h-4" />
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
