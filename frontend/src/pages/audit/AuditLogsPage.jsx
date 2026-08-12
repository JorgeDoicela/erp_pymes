import React, { useState, useEffect } from 'react';
import {
    FiShield,
    FiFilter,
    FiCalendar,
    FiUser,
    FiActivity,
    FiServer,
    FiInfo,
    FiGlobe
} from 'react-icons/fi';
import axios from 'axios';
import useAutoSync from '../../hooks/useAutoSync.js';

const translations = {
    actions: {
        'CREATE': 'CREAR',
        'UPDATE': 'ACTUALIZAR',
        'DELETE': 'ELIMINAR',
        'GENERATE': 'GENERAR',
        'CONFIRM': 'CONFIRMAR',
        'PAYMENT': 'PAGO',
        'FAILED_LOGIN': 'LOGIN FALLIDO',
        'LOGIN': 'INICIO SESIÓN',
        'LOGOUT': 'CIERRE SESIÓN',
        'RESET_PASSWORD': 'RESTABLECER CONTRASEÑA',
        'BULK_CREATE': 'CREACIÓN MASIVA',
        'DEACTIVATE': 'DESACTIVAR'
    },
    entities: {
        'Employee': 'Empleado',
        'Payroll': 'Nómina',
        'Evaluation': 'Evaluación',
        'Auth': 'Autenticación',
        'JobVacancy': 'Vacante',
        'Attendance': 'Asistencia',
        'ClimateSurvey': 'Encuesta Clima',
        'Contract': 'Contrato'
    }
};

const AuditLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        entity: '',
        action: '',
        performer: '',
        limit: 50
    });

    const fetchLogs = async (isSilent = false) => {
        try {
            if (!isSilent && !logs.length) setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/audit`, {
                headers: { Authorization: `Bearer ${token}` },
                params: filters
            });
            setLogs(response.data.data);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const { lastSynced, isSyncing, triggerSync } = useAutoSync(
        () => fetchLogs(true),
        { intervalMs: 15000 }
    );

    useEffect(() => {
        fetchLogs();
    }, [filters]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionBadgeClass = (action) => {
        switch (action) {
            case 'CREATE': return 'bg-emerald-50 text-emerald-700 border border-emerald-200/80';
            case 'UPDATE': return 'bg-indigo-50 text-indigo-700 border border-indigo-200/80';
            case 'DELETE': return 'bg-rose-50 text-rose-700 border border-rose-200/80';
            case 'FAILED_LOGIN': return 'bg-amber-50 text-amber-700 border border-amber-200/80';
            case 'GENERATE': return 'bg-purple-50 text-purple-700 border border-purple-200/80';
            case 'PAYMENT': return 'bg-emerald-50 text-emerald-700 border border-emerald-200/80';
            default: return 'bg-slate-100 text-slate-700 border border-slate-200/80';
        }
    };

    const formatDetails = (details) => {
        if (!details) return '-';
        try {
            const parsed = JSON.parse(details);
            return Object.entries(parsed)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
        } catch (e) {
            return details;
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <FiShield className="text-indigo-600 shrink-0" />
                        Auditoría y Trazabilidad
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Registro histórico de acciones críticas en el sistema</p>
                </div>
            </header>

            {/* Filtros Adaptativos */}
            <div className="bg-white p-4 rounded border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Entidad</label>
                    <select
                        name="entity"
                        value={filters.entity}
                        onChange={handleFilterChange}
                        className="app-input text-xs"
                    >
                        <option value="">Todas las Entidades</option>
                        {Object.entries(translations.entities).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Acción</label>
                    <select
                        name="action"
                        value={filters.action}
                        onChange={handleFilterChange}
                        className="app-input text-xs"
                    >
                        <option value="">Todas las Acciones</option>
                        {Object.entries(translations.actions).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Realizado por</label>
                    <div className="relative">
                        <FiUser className="absolute left-3 top-3 text-slate-400" />
                        <input
                            type="text"
                            name="performer"
                            placeholder="Nombre o ID..."
                            value={filters.performer}
                            onChange={handleFilterChange}
                            className="app-input text-xs pl-9"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Límite de Registros</label>
                    <select
                        name="limit"
                        value={filters.limit}
                        onChange={handleFilterChange}
                        className="app-input text-xs"
                    >
                        <option value="50">Últimos 50</option>
                        <option value="100">Últimos 100</option>
                        <option value="500">Últimos 500</option>
                    </select>
                </div>
            </div>

            {/* VISTA MÓVIL: Tarjetas Apiladas (Responsive UX sin desplazamiento horizontal) */}
            <div className="block md:hidden space-y-3">
                {loading ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-semibold">Cargando registros de auditoría...</div>
                ) : logs.length === 0 ? (
                    <div className="p-8 bg-white rounded border border-slate-200/80 text-center text-slate-400 text-xs italic">
                        No se encontraron registros con los filtros seleccionados.
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="bg-white rounded border border-slate-200/80 p-4 space-y-3 shadow-xs">
                            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${getActionBadgeClass(log.action)}`}>
                                    {translations.actions[log.action] || log.action}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                    <FiCalendar className="text-slate-400" />
                                    {formatDate(log.timestamp)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[10px] shrink-0">
                                        {log.performedBy ? log.performedBy.substring(0, 2).toUpperCase() : 'US'}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">{log.performedBy}</p>
                                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                            <FiServer className="text-slate-400 shrink-0" />
                                            {translations.entities[log.entity] || log.entity}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 flex items-center gap-1">
                                        <FiGlobe className="w-3 h-3 text-slate-400" />
                                        {log.ip || 'Local'}
                                    </span>
                                </div>
                            </div>

                            {log.details && (
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed italic">
                                    <span className="font-semibold text-slate-700 not-italic block mb-0.5">Detalles:</span>
                                    {formatDetails(log.details)}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* VISTA ESCRITORIO: Tabla Completa */}
            <div className="hidden md:block app-table-wrapper">
                <table className="app-table">
                    <thead>
                        <tr>
                            <th className="app-th">Fecha y Hora</th>
                            <th className="app-th">Usuario</th>
                            <th className="app-th">Acción</th>
                            <th className="app-th">Entidad</th>
                            <th className="app-th">IP</th>
                            <th className="app-th">Detalles</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-xs font-semibold">
                                    Cargando registros...
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-xs italic">
                                    No se encontraron registros de auditoría.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="app-td">
                                        <div className="flex items-center gap-2 text-slate-500 font-medium">
                                            <FiCalendar className="text-slate-400" />
                                            {formatDate(log.timestamp)}
                                        </div>
                                    </td>
                                    <td className="app-td">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[10px] shrink-0">
                                                {log.performedBy ? log.performedBy.substring(0, 2).toUpperCase() : 'US'}
                                            </div>
                                            <span className="font-bold text-slate-900">{log.performedBy}</span>
                                        </div>
                                    </td>
                                    <td className="app-td">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${getActionBadgeClass(log.action)}`}>
                                            {translations.actions[log.action] || log.action}
                                        </span>
                                    </td>
                                    <td className="app-td font-semibold text-slate-700">
                                        {translations.entities[log.entity] || log.entity}
                                    </td>
                                    <td className="app-td font-mono text-xs text-slate-400">
                                        {log.ip || '-'}
                                    </td>
                                    <td className="app-td max-w-xs truncate italic text-slate-500">
                                        {formatDetails(log.details)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogsPage;
