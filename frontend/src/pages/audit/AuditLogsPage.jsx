import { useState, useEffect } from 'react';
import { getAuditLogs, getAuditStats } from '../../services/audit.service';
import useAutoSync from '../../hooks/useAutoSync';

const translations = {
    actions: {
        'CREATE': 'CREAR',
        'CREATE_VACANCY': 'CREAR VACANTE',
        'CREATE_ANNOUNCEMENT': 'PUBLICAR COMUNICADO',
        'UPDATE': 'ACTUALIZAR',
        'UPDATE_VACANCY_STATUS': 'CAMBIO ESTADO VACANTE',
        'UPDATE_APPLICATION_STATUS': 'ESTADO POSTULACIÓN',
        'UPDATE_NOTIFICATION_PREFERENCES': 'PREFERENCIAS NOTIF',
        'DELETE': 'ELIMINAR',
        'DELETE_VACANCY': 'ELIMINAR VACANTE',
        'DELETE_CANDIDATE': 'ELIMINAR CANDIDATO',
        'DELETE_ANNOUNCEMENT': 'ELIMINAR COMUNICADO',
        'HIRE_CANDIDATE': 'CONTRATAR CANDIDATO',
        'ACKNOWLEDGE_ANNOUNCEMENT': 'ACUSE DE RECIBO',
        'ASSIGN_EVALUATION': 'ASIGNAR EVALUACIÓN',
        'SUBMIT_ASSESSMENT': 'ENVIAR EVALUACIÓN',
        'GRANT_SALARY_ADVANCE': 'CONCEDER ANTICIPO',
        'APPROVE_ADVANCE': 'APROBAR ANTICIPO',
        'REJECT_ADVANCE': 'RECHAZAR ANTICIPO',
        'ASSIGN_BENEFIT': 'ASIGNAR BENEFICIO',
        'GENERATE': 'GENERAR',
        'CONFIRM': 'CONFIRMAR',
        'PAYMENT': 'PAGO',
        'FAILED_LOGIN': 'LOGIN FALLIDO',
        'LOGIN': 'INICIO SESIÓN',
        'LOGOUT': 'CIERRE SESIÓN',
        'RESET_PASSWORD': 'CAMBIO CONTRASEÑA'
    },
    entities: {
        'Employee': 'Empleado / Personal',
        'Contract': 'Contrato Laboral',
        'Payroll': 'Rol de Pagos',
        'SalaryAdvance': 'Anticipo de Sueldo',
        'EmployeeBenefit': 'Beneficio de Ley',
        'JobVacancy': 'Vacante Laboral',
        'JobApplication': 'Postulación / Candidato',
        'EmployeeEvaluation': 'Evaluación Desempeño',
        'Announcement': 'Comunicado Oficial',
        'NotificationPreference': 'Preferencias Notif',
        'Auth': 'Seguridad / Auth',
        'Absence': 'Permiso / Ausencia',
        'System': 'Sistema'
    }
};

const AuditLogsPage = () => {
    // Estados principales
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({
        totalLogs: 0,
        authLogs: 0,
        payrollLogs: 0,
        employeeLogs: 0,
        systemLogs: 0
    });
    const [loading, setLoading] = useState(true);

    // Filtros y Paginación
    const [activeTab, setActiveTab] = useState('ALL'); // ALL, AUTH, PAYROLL, EMPLOYEE, SYSTEM
    const [searchTerm, setSearchTerm] = useState('');
    const [entityFilter, setEntityFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });

    // Modal de detalle extenso
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        loadStats();
    }, []);

    useEffect(() => {
        loadLogsData();
    }, [activeTab, entityFilter, actionFilter, pagination.page]);

    const loadStats = async () => {
        try {
            const res = await getAuditStats();
            if (res.success && res.data) {
                setStats(res.data);
            }
        } catch (error) {
            console.error('Error cargando estadísticas de auditoría:', error);
        }
    };

    const loadLogsData = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const params = {
                category: activeTab === 'ALL' ? undefined : activeTab,
                entity: entityFilter || undefined,
                action: actionFilter || undefined,
                performer: searchTerm.trim() || undefined,
                page: pagination.page,
                limit: pagination.limit
            };

            const res = await getAuditLogs(params);
            if (res.success) {
                setLogs(res.data || []);
                if (res.pagination) {
                    setPagination(prev => ({
                        ...prev,
                        total: res.pagination.total || 0,
                        totalPages: res.pagination.totalPages || 1
                    }));
                }
            }
        } catch (error) {
            console.error('Error al cargar logs de auditoría:', error);
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    // Sincronización automática silenciosa cada 30 segundos
    useAutoSync(() => loadLogsData(true), { intervalMs: 30000 });

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        loadLogsData();
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const getActionBadgeClass = (action) => {
        if (!action) return 'bg-gray-50 text-gray-700 border-gray-200';
        if (action.includes('DELETE') || action.includes('REJECT') || action.includes('FAILED')) {
            return 'bg-red-50 text-red-800 border-red-200';
        }
        if (action.includes('CREATE') || action.includes('HIRE') || action.includes('APPROVE') || action.includes('PAYMENT')) {
            return 'bg-emerald-50 text-emerald-800 border-emerald-200';
        }
        if (action.includes('UPDATE') || action.includes('ASSIGN') || action.includes('GENERATE')) {
            return 'bg-blue-50 text-blue-800 border-blue-200';
        }
        if (action.includes('LOGIN') || action.includes('ACKNOWLEDGE')) {
            return 'bg-purple-50 text-purple-800 border-purple-200';
        }
        return 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const formatDetails = (details) => {
        if (!details) return '—';
        try {
            const parsed = typeof details === 'string' ? JSON.parse(details) : details;
            if (typeof parsed === 'object' && parsed !== null) {
                return Object.entries(parsed)
                    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                    .join(' · ');
            }
            return String(details);
        } catch {
            return String(details);
        }
    };

    const inputClass = "w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors";

    return (
        <div className="space-y-4">
            {/* Header ERP con Resumen de Seguridad */}
            <div className="pb-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Seguridad · Trazabilidad & Cumplimiento</p>
                    <h1 className="text-xl font-semibold text-gray-900">Auditoría del Sistema</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Registro inmutable de transacciones críticas, accesos y modificaciones operativas.</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-4 bg-white px-3.5 py-2 rounded border border-gray-200 font-mono text-xs">
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Total Registros</span>
                            <span className="font-semibold text-gray-900 tabular-nums">{stats.totalLogs}</span>
                        </div>
                        <div className="w-px h-6 bg-gray-200" />
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Accesos / Auth</span>
                            <span className="font-semibold text-purple-700 tabular-nums">{stats.authLogs}</span>
                        </div>
                        <div className="w-px h-6 bg-gray-200" />
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Nómina & Pagos</span>
                            <span className="font-semibold text-emerald-700 tabular-nums">{stats.payrollLogs}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => { loadStats(); loadLogsData(); }}
                        className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                        title="Actualizar registros"
                    >
                        Sincronizar ⟳
                    </button>
                </div>
            </div>

            {/* Pestañas con Contadores Integrados (Holded/Linear Style) */}
            <div className="flex items-center justify-between border-b border-gray-200 gap-4 overflow-x-auto">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => handleTabChange('ALL')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'ALL'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Todos los Registros <span className="ml-1.5 font-mono text-[11px] text-gray-400">({stats.totalLogs})</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('AUTH')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'AUTH'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Autenticación & Accesos <span className="ml-1.5 font-mono text-[11px] text-purple-700">({stats.authLogs})</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('PAYROLL')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'PAYROLL'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Nómina & Pagos <span className="ml-1.5 font-mono text-[11px] text-emerald-700">({stats.payrollLogs})</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('EMPLOYEE')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'EMPLOYEE'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Empleados & Contratos <span className="ml-1.5 font-mono text-[11px] text-blue-700">({stats.employeeLogs})</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('SYSTEM')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'SYSTEM'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Operaciones del Sistema <span className="ml-1.5 font-mono text-[11px] text-gray-400">({stats.systemLogs})</span>
                    </button>
                </div>
            </div>

            {/* Barra de Búsqueda y Filtros en Línea */}
            <div className="bg-white p-3 rounded border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3">
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto flex-grow max-w-sm">
                    <input
                        type="text"
                        placeholder="Buscar por usuario o IP..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={inputClass}
                    />
                    <button
                        type="submit"
                        className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors shrink-0 cursor-pointer"
                    >
                        Buscar
                    </button>
                </form>

                <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                    <select
                        value={entityFilter}
                        onChange={(e) => { setEntityFilter(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
                        className="bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                    >
                        <option value="">Todas las Entidades</option>
                        {Object.entries(translations.entities).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                        ))}
                    </select>

                    <select
                        value={actionFilter}
                        onChange={(e) => { setActionFilter(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
                        className="bg-white border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                    >
                        <option value="">Todas las Acciones</option>
                        {Object.entries(translations.actions).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                        ))}
                    </select>

                    {(searchTerm || entityFilter || actionFilter) && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm('');
                                setEntityFilter('');
                                setActionFilter('');
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer"
                        >
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* Tabla Principal de Auditoría (Hoja de Cálculo Sobria) */}
            <div className="bg-white rounded border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="py-2.5 px-4 w-44">Fecha y Hora</th>
                                <th className="py-2.5 px-4">Usuario Responsable</th>
                                <th className="py-2.5 px-4">Acción</th>
                                <th className="py-2.5 px-4">Entidad / Módulo</th>
                                <th className="py-2.5 px-4">Dirección IP</th>
                                <th className="py-2.5 px-4">Detalles Técnicos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-gray-400 text-xs">
                                        Cargando registros de auditoría...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center">
                                        <p className="text-sm font-medium text-gray-700">Sin registros de auditoría</p>
                                        <p className="text-xs text-gray-400 mt-1">No se encontraron eventos con los filtros seleccionados.</p>
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="py-2.5 px-4 font-mono text-[11px] text-gray-500 tabular-nums">
                                            {new Date(log.timestamp).toLocaleString('es-EC', {
                                                day: '2-digit', month: '2-digit', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                                            })}
                                        </td>
                                        <td className="py-2.5 px-4 font-medium text-gray-900">
                                            {log.performedBy || 'Sistema'}
                                        </td>
                                        <td className="py-2.5 px-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${getActionBadgeClass(log.action)}`}>
                                                {translations.actions[log.action] || log.action}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-4 font-medium text-gray-700">
                                            {translations.entities[log.entity] || log.entity}
                                        </td>
                                        <td className="py-2.5 px-4 font-mono text-[11px] text-gray-400 tabular-nums">
                                            {log.ip || 'Local / Interno'}
                                        </td>
                                        <td className="py-2.5 px-4 text-gray-600 max-w-md truncate">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedLog(log)}
                                                className="text-left text-gray-600 hover:text-blue-600 hover:underline cursor-pointer truncate block w-full text-xs"
                                                title="Ver detalle completo"
                                            >
                                                {formatDetails(log.details)}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {!loading && pagination.totalPages > 1 && (
                    <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                        <span>Mostrando página {pagination.page} de {pagination.totalPages} ({pagination.total} registros)</span>
                        <div className="flex items-center gap-1">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                className="px-2.5 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                            >
                                Anterior
                            </button>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                className="px-2.5 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Detalle de Log */}
            {selectedLog && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded max-w-lg w-full overflow-hidden shadow-xl text-xs">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Detalle de Registro de Auditoría</h3>
                                <p className="text-[11px] text-gray-500 font-mono mt-0.5">ID: {selectedLog.id}</p>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer">&times;</button>
                        </div>

                        <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded border border-gray-200">
                                <div>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Fecha y Hora</span>
                                    <span className="font-mono text-gray-900 font-medium">
                                        {new Date(selectedLog.timestamp).toLocaleString('es-EC')}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Responsable</span>
                                    <span className="font-semibold text-gray-900">{selectedLog.performedBy || 'Sistema'}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Acción</span>
                                    <span className="font-mono text-blue-700 font-semibold">{translations.actions[selectedLog.action] || selectedLog.action}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Entidad / ID</span>
                                    <span className="font-medium text-gray-800">{translations.entities[selectedLog.entity] || selectedLog.entity} (#{selectedLog.entityId})</span>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    Payload y Parámetros
                                </h4>
                                <pre className="bg-gray-900 text-emerald-400 p-3 rounded text-[11px] font-mono overflow-x-auto whitespace-pre-wrap">
                                    {(() => {
                                        try {
                                            const p = typeof selectedLog.details === 'string' ? JSON.parse(selectedLog.details) : selectedLog.details;
                                            return JSON.stringify(p, null, 2);
                                        } catch {
                                            return selectedLog.details || 'Sin detalles adicionales';
                                        }
                                    })()}
                                </pre>
                            </div>
                        </div>

                        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-3.5 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded transition-colors cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogsPage;
