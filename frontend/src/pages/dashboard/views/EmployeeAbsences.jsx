import React, { useState, useEffect } from 'react';
import absenceService from '../../../services/attendance/absenceService';
import { motion } from 'framer-motion';

const EmployeeAbsences = () => {
    const [requests, setRequests] = useState([]);
    const [isCreating, setIsCreating] = useState(false);

    const [formData, setFormData] = useState({
        type: 'Enfermedad',
        startDate: '',
        endDate: '',
        reason: '',
        file: null
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            const res = await absenceService.getMyRequests();
            if (res.success) setRequests(res.data);
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
                setFormData({ type: 'Enfermedad', startDate: '', endDate: '', reason: '', file: null });
                loadRequests();
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
                                    <option>Enfermedad</option>
                                    <option>Vacaciones</option>
                                    <option>Asuntos Personales</option>
                                    <option>Otro</option>
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
            )}

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
        </div>
    );
};

export default EmployeeAbsences;
