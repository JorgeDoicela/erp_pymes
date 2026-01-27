import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import absenceService from '../../services/attendance/absenceService';
import { motion } from 'framer-motion';

import TeamCalendar from './TeamCalendar';

const AdminAbsences = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [comment, setComment] = useState('');
    const [activeId, setActiveId] = useState(null); // ID of request being acted upon
    const [showCalendar, setShowCalendar] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Fetch PENDING requests primarily, or all. Let's fetch all and filter in UI or backend
            const res = await absenceService.getRequests({ status: 'PENDING' });
            if (res.success) setRequests(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAction = async (id, status) => {
        if (!confirm(`¿Estás seguro de ${status === 'APPROVED' ? 'APROBAR' : 'RECHAZAR'} esta solicitud?`)) return;

        try {
            await absenceService.updateStatus(id, status, comment);
            alert('Actualizado correctamente');
            setActiveId(null);
            setComment('');
            loadData();
        } catch (error) {
            alert('Error al actualizar');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                    Aprobación de Ausencias
                </h1>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-400 hover:text-white transition-colors"
                    >
                        ← Volver
                    </button>
                    <button
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-sm text-white"
                    >
                        {showCalendar ? 'Ocultar Calendario' : 'Ver Calendario'}
                    </button>
                </div>
            </div>

            {showCalendar && <TeamCalendar />}

            {!showCalendar && (
                <div className="grid grid-cols-1 gap-6 mt-8">
                    {requests.length === 0 ? (
                        <div className="bg-slate-800 p-8 rounded-xl text-center text-slate-400">
                            No hay solicitudes pendientes.
                        </div>
                    ) : (
                        requests.map(req => (
                            <div key={req.id} className="bg-slate-800 rounded-xl border border-white/5 p-6 shadow-lg flex flex-col lg:flex-row gap-6">
                                {/* Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-blue-300">
                                            {req.employee.firstName[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{req.employee.firstName} {req.employee.lastName}</h3>
                                            <p className="text-xs text-slate-400">{req.employee.position}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-slate-500">Tipo</p>
                                            <p className="font-medium text-blue-200">{req.type}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500">Fechas</p>
                                            <p className="font-medium">{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 bg-slate-900/50 p-3 rounded-lg border border-white/5">
                                        <p className="text-slate-400 text-sm mb-1">Motivo:</p>
                                        <p className="text-gray-300 italic">"{req.reason}"</p>
                                    </div>

                                    {req.evidenceUrl && (
                                        <div className="mt-4">
                                            <a
                                                href={`${import.meta.env.VITE_API_URL || ''}/uploads/evidence/${req.evidenceUrl}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-400 text-sm hover:underline flex items-center gap-2"
                                            >
                                                Ver Certificado/Evidencia Adjunta
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="w-full lg:w-1/3 bg-slate-900/50 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
                                    <p className="text-sm text-slate-400 mb-2">Acciones Administrativas</p>
                                    <textarea
                                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white mb-3"
                                        rows="2"
                                        placeholder="Comentario (opcional)..."
                                        value={activeId === req.id ? comment : ''}
                                        onChange={(e) => { setActiveId(req.id); setComment(e.target.value); }}
                                    ></textarea>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleAction(req.id, 'APPROVED')}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded font-bold text-sm"
                                        >
                                            Aprobar
                                        </button>
                                        <button
                                            onClick={() => handleAction(req.id, 'REJECTED')}
                                            className="bg-red-600 hover:bg-red-500 text-white py-2 rounded font-bold text-sm"
                                        >
                                            Rechazar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminAbsences;
