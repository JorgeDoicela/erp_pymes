import React, { useState, useEffect } from 'react';
import absenceService from '../../../services/attendance/absenceService';
import * as employeeService from '../../../services/employees/employee.service';
import { motion } from 'framer-motion';
import { FiCalendar, FiPlus, FiX } from 'react-icons/fi';

const EmployeeAbsences = () => {
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
            case 'APPROVED': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Mis Permisos y Ausencias</h2>
                    <p className="text-slate-500 text-sm mt-1">Gestiona tus solicitudes de permisos y vacaciones</p>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${isCreating
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                        }`}
                >
                    {isCreating ? <><FiX size={16} /> Cancelar</> : <><FiPlus size={16} /> Nueva Solicitud</>}
                </button>
            </div>

            {/* Balance Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl shadow-md max-w-xs">
                <p className="text-blue-100 text-sm font-medium">Días de Vacaciones Disponibles</p>
                <div className="flex items-end gap-2 mt-2">
                    <span className="text-4xl font-bold text-white">{balance}</span>
                    <span className="text-blue-200 mb-1">días</span>
                </div>
            </div>

            {/* Create Form */}
            {isCreating && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
                >
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FiCalendar className="text-blue-600" /> Nueva Solicitud de Permiso
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Ausencia</label>
                                <select
                                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all"
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
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Desde</label>
                                    <input
                                        type="date"
                                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Hasta</label>
                                    <input
                                        type="date"
                                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Vacation Impact Feedback */}
                        {formData.startDate && formData.endDate && (
                            <div className={`p-4 rounded-lg border ${formData.type === 'Vacaciones'
                                    ? estimatedDays > balance
                                        ? 'bg-red-50 border-red-200 text-red-700'
                                        : 'bg-blue-50 border-blue-200 text-blue-700'
                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                                }`}>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-sm">Duración estimada:</span>
                                    <span className="font-bold text-lg">{estimatedDays} días</span>
                                </div>
                                {formData.type === 'Vacaciones' && (
                                    <div className="mt-2 text-sm border-t border-current/10 pt-2 space-y-1">
                                        <div className="flex justify-between">
                                            <span>Tu saldo actual:</span>
                                            <span className="font-semibold">{balance} días</span>
                                        </div>
                                        <div className="flex justify-between font-bold">
                                            <span>Saldo final estimado:</span>
                                            <span className={balance - estimatedDays < 0 ? 'text-red-600' : 'text-emerald-600'}>
                                                {balance - estimatedDays} días
                                            </span>
                                        </div>
                                        {estimatedDays > balance && (
                                            <p className="text-red-600 text-xs mt-1 font-semibold">
                                                ⚠ Saldo insuficiente para esta solicitud.
                                            </p>
                                        )}
                                    </div>
                                )}
                                {formData.type !== 'Vacaciones' && (
                                    <p className="text-xs mt-2 opacity-70">
                                        Este tipo de ausencia NO descuenta días de tu saldo de vacaciones.
                                    </p>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Motivo / Descripción</label>
                            <textarea
                                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all resize-none"
                                rows="3"
                                placeholder="Describe el motivo de tu solicitud..."
                                value={formData.reason}
                                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Justificativo (JPG, PNG, PDF)</label>
                            <input
                                type="file"
                                className="block w-full text-sm text-slate-600
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-lg file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-blue-50 file:text-blue-700
                                  hover:file:bg-blue-100 transition-all"
                                onChange={e => setFormData({ ...formData, file: e.target.files[0] })}
                                accept="image/*,.pdf"
                            />
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-6 py-2.5 rounded-lg font-bold text-white shadow-md disabled:opacity-50 transition-all"
                            >
                                {loading ? 'Enviando...' : 'Enviar Solicitud'}
                            </button>
                            {message && (
                                <span className="text-sm font-medium text-emerald-600">{message}</span>
                            )}
                        </div>
                    </form>
                </motion.div>
            )}

            {/* List */}
            <div className="space-y-3">
                {requests.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
                        <FiCalendar className="mx-auto text-slate-300 mb-3" size={40} />
                        <p className="text-slate-500 font-medium">No tienes solicitudes registradas</p>
                        <p className="text-slate-400 text-sm mt-1">Crea una nueva solicitud con el botón de arriba</p>
                    </div>
                ) : (
                    requests.map(req => (
                        <motion.div
                            key={req.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-bold text-lg text-slate-800">{req.type}</h3>
                                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getStatusStyle(req.status)}`}>
                                        {getStatusLabel(req.status)}
                                    </span>
                                </div>
                                <p className="text-slate-500 text-sm">
                                    {new Date(req.startDate).toLocaleDateString('es-ES')} — {new Date(req.endDate).toLocaleDateString('es-ES')}
                                </p>
                                <p className="text-slate-600 mt-2 text-sm italic">"{req.reason}"</p>
                                {req.adminComment && (
                                    <p className="text-xs text-amber-600 font-medium mt-1 bg-amber-50 px-2 py-1 rounded-md inline-block">
                                        Admin: {req.adminComment}
                                    </p>
                                )}
                            </div>

                            {req.evidenceUrl && (
                                <a
                                    href={`${import.meta.env.VITE_API_URL || ''}/uploads/evidence/${req.evidenceUrl}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1 whitespace-nowrap"
                                >
                                    Ver Evidencia →
                                </a>
                            )}
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default EmployeeAbsences;
