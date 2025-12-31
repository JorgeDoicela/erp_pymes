import React, { useState, useEffect } from 'react';
import absenceService from '../../../services/attendance/absenceService';
import * as employeeService from '../../../services/employees/employee.service'; // Named
import { motion } from 'framer-motion';

const EmployeeAbsences = () => {
    const [requests, setRequests] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [balance, setBalance] = useState(0); // Vacation Balance

    const [formData, setFormData] = useState({
        type: 'Vacaciones', // Default to Vacaciones as it's most common/important
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

            // Perfil
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'REJECTED': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 flex justify-between items-center text-white">
                <span>Mis Permisos y Ausencias</span>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                    {isCreating ? 'Cancelar' : '+ Nueva Solicitud'}
                </button>
            </h2>

            {/* Balance Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl shadow-lg border border-blue-400/30 mb-8 max-w-sm">
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
                    className="bg-slate-800 p-6 rounded-xl border border-white/5 mb-8 text-white"
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Tipo de Ausencia</label>
                                <select
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="Enfermedad">Enfermedad</option>
                                    <option value="Vacaciones">Vacaciones</option>
                                    <option value="Asuntos Personales">Asuntos Personales</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Desde</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Hasta</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2"
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
                                ? (Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1) > balance
                                    ? 'bg-red-500/10 border-red-500/30 text-red-200'
                                    : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                                : 'bg-slate-700/50 border-slate-600 text-slate-300'
                                }`}>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Duración estimada:</span>
                                    <span className="font-bold text-lg">
                                        {Math.max(0, Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1)} días
                                    </span>
                                </div>

                                {formData.type === 'Vacaciones' && (
                                    <div className="mt-2 text-sm border-t border-white/10 pt-2">
                                        <div className="flex justify-between">
                                            <span>Tu saldo actual:</span>
                                            <span>{balance} días</span>
                                        </div>
                                        <div className="flex justify-between font-bold mt-1">
                                            <span>Saldo final estimado:</span>
                                            <span className={balance - (Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1) < 0 ? 'text-red-400' : 'text-green-400'}>
                                                {balance - (Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1)} días
                                            </span>
                                        </div>
                                        {(Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1) > balance && (
                                            <p className="text-red-400 mt-2 text-xs flex items-center gap-1">
                                                ⚠️ Saldo insuficiente para esta solicitud.
                                            </p>
                                        )}
                                    </div>
                                )}
                                {formData.type !== 'Vacaciones' && (
                                    <p className="text-xs mt-2 opacity-70">
                                        ℹ️ Este tipo de ausencia NO descuenta días de tu saldo de vacaciones.
                                    </p>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Motivo / Descripción</label>
                            <textarea
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2"
                                rows="3"
                                value={formData.reason}
                                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                required
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Justificativo (JPG, PNG, PDF)</label>
                            <input
                                type="file"
                                className="block w-full text-sm text-slate-400
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-full file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-blue-500/10 file:text-blue-400
                                  hover:file:bg-blue-500/20"
                                onChange={e => setFormData({ ...formData, file: e.target.files[0] })}
                                accept="image/*,.pdf"
                            />
                        </div>

                        <div className="flex gap-4 items-center">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-6 py-2 rounded-lg font-bold text-white shadow-lg disabled:opacity-50"
                            >
                                {loading ? 'Enviando...' : 'Enviar Solicitud'}
                            </button>
                            {message && <span className="text-sm text-blue-300">{message}</span>}
                        </div>
                    </form>
                </motion.div>
            )
            }

            {/* List */}
            <div className="space-y-4">
                {requests.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No tienes solicitudes registradas.</p>
                ) : (
                    requests.map(req => (
                        <div key={req.id} className="bg-slate-800/50 rounded-xl p-4 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-bold text-lg text-white">{req.type}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(req.status)}`}>
                                        {req.status === 'PENDING' ? 'Pendiente' : req.status === 'APPROVED' ? 'Aprobado' : 'Rechazado'}
                                    </span>
                                </div>
                                <p className="text-slate-400 text-sm">
                                    {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                                </p>
                                <p className="text-slate-300 mt-2 text-sm italic">"{req.reason}"</p>
                                {req.adminComment && (
                                    <p className="text-xs text-yellow-500/80 mt-1">Admin: {req.adminComment}</p>
                                )}
                            </div>

                            {req.evidenceUrl && (
                                <a
                                    href={`http://localhost:4000/uploads/evidence/${req.evidenceUrl}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-400 text-sm hover:underline flex items-center gap-1"
                                >
                                    📎 Ver Evidencia
                                </a>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div >
    );
};

export default EmployeeAbsences;
