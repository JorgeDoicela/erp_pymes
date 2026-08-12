import React, { useState, useEffect } from 'react';
import absenceService from '../../../services/attendance/absenceService';
import * as employeeService from '../../../services/employees/employee.service';
import { FiCalendar, FiPlus, FiX } from 'react-icons/fi';

const EmployeeAbsences = () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.email === 'admin@emplifi.com';

    const [requests, setRequests] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [balance, setBalance] = useState(0);

    const [formData, setFormData] = useState({
        type: 'Vacaciones',
        startDate: '',
        endDate: '',
        reason: '',
        file: null
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await absenceService.getMyRequests();
            if (res.success) setRequests(res.data);

            const userRes = await employeeService.getProfile();
            if (userRes.success) setBalance(userRes.data.vacationDays);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSuperAdmin) {
            setMessage('Modo Supervisión: El SuperAdministrador no puede solicitar permisos ni alterar registros.');
            return;
        }
        setLoading(true);
        setMessage('');

        try {
            const form = new FormData();
            form.append('type', formData.type);
            form.append('startDate', formData.startDate);
            form.append('endDate', formData.endDate);
            form.append('reason', formData.reason);
            if (formData.file) {
                form.append('evidence', formData.file);
            }

            const res = await absenceService.createRequest(form);
            if (res.success) {
                setMessage('Solicitud enviada exitosamente.');
                setIsCreating(false);
                setFormData({ type: 'Vacaciones', startDate: '', endDate: '', reason: '', file: null });
                loadData();
            }
        } catch (error) {
            setMessage('Error al enviar solicitud.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'APPROVED': return 'text-green-700 bg-green-50 border-green-200';
            case 'REJECTED': return 'text-red-700 bg-red-50 border-red-200';
            default: return 'text-amber-700 bg-amber-50 border-amber-200';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'APPROVED': return 'Aprobado';
            case 'REJECTED': return 'Rechazado';
            default: return 'Pendiente';
        }
    };

    const estimatedDays = formData.startDate && formData.endDate
        ? Math.max(0, Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1)
        : 0;

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="bg-white p-5 rounded border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        Tiempo y Permisos
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                        Solicitud y Control de Ausencias
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Gestiona tus solicitudes de permisos, vacaciones y licencias médicas.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-medium transition-colors cursor-pointer ${isCreating
                            ? 'border border-gray-300 hover:border-gray-400 text-gray-700 bg-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    {isCreating ? <><FiX className="w-3.5 h-3.5" /> Cancelar</> : <><FiPlus className="w-3.5 h-3.5" /> Nueva Solicitud</>}
                </button>
            </div>

            {/* Balance Card (Panel Contable Sobrio) */}
            <div className="bg-white p-4 rounded border border-gray-200 max-w-sm">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Saldo de Vacaciones Disponibles
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-gray-900 font-mono tabular-nums">{balance}</span>
                    <span className="text-xs text-gray-500 font-medium">días pagados acumulados</span>
                </div>
            </div>

            {/* Create Form */}
            {isCreating && (
                <div className="bg-white border border-gray-200 rounded p-5">
                    <div className="border-b border-gray-100 pb-3 mb-4">
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <FiCalendar className="text-gray-600" /> Nueva Solicitud de Permiso
                        </h2>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Ausencia</label>
                                <select
                                    className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="Enfermedad">Enfermedad</option>
                                    <option value="Vacaciones">Vacaciones</option>
                                    <option value="Asuntos Personales">Asuntos Personales</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
                                    <input
                                        type="date"
                                        className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-mono"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
                                    <input
                                        type="date"
                                        className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-mono"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Vacation Impact Feedback */}
                        {formData.startDate && formData.endDate && (
                            <div className={`p-3 rounded border text-xs ${formData.type === 'Vacaciones'
                                    ? estimatedDays > balance
                                        ? 'bg-red-50 border-red-200 text-red-700'
                                        : 'bg-blue-50 border-blue-200 text-blue-700'
                                    : 'bg-gray-50 border-gray-200 text-gray-600'
                                }`}>
                                <div className="flex justify-between items-center">
                                    <span>Duración estimada:</span>
                                    <span className="font-semibold font-mono tabular-nums">{estimatedDays} días</span>
                                </div>
                                {formData.type === 'Vacaciones' && (
                                    <div className="mt-2 text-xs border-t border-current/10 pt-2 space-y-1">
                                        <div className="flex justify-between">
                                            <span>Saldo actual:</span>
                                            <span className="font-semibold font-mono tabular-nums">{balance} días</span>
                                        </div>
                                        <div className="flex justify-between font-semibold">
                                            <span>Saldo proyectado:</span>
                                            <span className={`font-mono tabular-nums ${balance - estimatedDays < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                                {balance - estimatedDays} días
                                            </span>
                                        </div>
                                        {estimatedDays > balance && (
                                            <p className="text-red-600 text-[11px] mt-1 font-semibold">
                                                Saldo insuficiente para procesar esta solicitud.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Motivo / Descripción</label>
                            <textarea
                                className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none"
                                rows="3"
                                placeholder="Describe brevemente el motivo..."
                                value={formData.reason}
                                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Justificativo Adjunto (PDF, Imagen)</label>
                            <input
                                type="file"
                                className="block w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-gray-300 file:bg-white file:text-xs file:font-medium hover:file:bg-gray-50 cursor-pointer"
                                onChange={e => setFormData({ ...formData, file: e.target.files[0] })}
                                accept="image/*,.pdf"
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {loading ? 'Enviando...' : 'Enviar Solicitud'}
                            </button>
                            {message && (
                                <span className="text-xs font-medium text-gray-700">{message}</span>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h2 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Historial de Solicitudes
                    </h2>
                </div>

                {requests.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 text-sm">
                        <p className="text-sm font-medium text-gray-700">No tienes solicitudes registradas</p>
                        <p className="text-xs text-gray-400 mt-1">Crea una nueva solicitud de ausencia utilizando el botón superior.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {requests.map(req => (
                            <div
                                key={req.id}
                                className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:bg-gray-50/60 transition-colors"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-xs text-gray-900">{req.type}</h3>
                                        <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${getStatusStyle(req.status)}`}>
                                            {getStatusLabel(req.status)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 font-mono tabular-nums">
                                        {new Date(req.startDate).toLocaleDateString('es-ES')} — {new Date(req.endDate).toLocaleDateString('es-ES')}
                                    </p>
                                    <p className="text-xs text-gray-600">{req.reason}</p>
                                    {req.adminComment && (
                                        <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                                            Observación RRHH: {req.adminComment}
                                        </p>
                                    )}
                                </div>

                                {req.evidenceUrl && (
                                    <a
                                        href={`${import.meta.env.VITE_API_URL || ''}/uploads/evidence/${req.evidenceUrl}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs px-2.5 py-1 rounded transition-colors whitespace-nowrap"
                                    >
                                        Ver Evidencia
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeAbsences;

