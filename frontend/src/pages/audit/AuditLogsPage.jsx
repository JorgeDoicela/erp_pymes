import React, { useState, useEffect } from 'react';
import {
    FiShield,
    FiSearch,
    FiFilter,
    FiCalendar,
    FiUser,
    FiActivity,
    FiEye
} from 'react-icons/fi';
import axios from 'axios';

const AuditLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        entity: '',
        action: '',
        performer: '',
        limit: 50
    });

    const fetchLogs = async () => {
        try {
            setLoading(true);
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

    const getActionColor = (action) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-800';
            case 'UPDATE': return 'bg-blue-100 text-blue-800';
            case 'DELETE': return 'bg-red-100 text-red-800';
            case 'FAILED_LOGIN': return 'bg-orange-100 text-orange-800';
            case 'GENERATE': return 'bg-purple-100 text-purple-800';
            case 'PAYMENT': return 'bg-emerald-100 text-emerald-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FiShield className="text-blue-600" /> Auditoría y Trazabilidad
                    </h1>
                    <p className="text-gray-600">Registro histórico de acciones críticas en el sistema</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="bg-white px-4 py-2 rounded-lg border hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                    <FiActivity /> Actualizar
                </button>
            </div>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-xl shadow-sm border mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entidad</label>
                    <select
                        name="entity"
                        value={filters.entity}
                        onChange={handleFilterChange}
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">Todas</option>
                        <option value="Employee">Empleado</option>
                        <option value="Payroll">Nómina</option>
                        <option value="Evaluation">Evaluación</option>
                        <option value="Auth">Autenticación</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
                    <select
                        name="action"
                        value={filters.action}
                        onChange={handleFilterChange}
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">Todas</option>
                        <option value="CREATE">Crear</option>
                        <option value="UPDATE">Actualizar</option>
                        <option value="GENERATE">Generar</option>
                        <option value="CONFIRM">Confirmar</option>
                        <option value="PAYMENT">Pago</option>
                        <option value="FAILED_LOGIN">Login Fallido</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Realizado por</label>
                    <div className="relative">
                        <FiUser className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            name="performer"
                            placeholder="Nombre o ID..."
                            value={filters.performer}
                            onChange={handleFilterChange}
                            className="w-full border rounded-lg p-2 pl-10 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Límite</label>
                    <select
                        name="limit"
                        value={filters.limit}
                        onChange={handleFilterChange}
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="50">Últimos 50</option>
                        <option value="100">Últimos 100</option>
                        <option value="500">Últimos 500</option>
                    </select>
                </div>
            </div>

            {/* Tabla de Logs */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-700">Fecha</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Usuario</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Acción</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Entidad</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Detalles</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                    Cargando registros...
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                    No se encontraron registros de auditoría.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <FiCalendar className="text-gray-400" />
                                            {formatDate(log.timestamp)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-800">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                {log.performedBy.substring(0, 2).toUpperCase()}
                                            </div>
                                            {log.performedBy}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 font-semibold italic">
                                        {log.entity}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">
                                        {log.details}
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
