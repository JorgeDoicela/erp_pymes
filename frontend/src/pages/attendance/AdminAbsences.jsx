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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Aprobación de Ausencias</h2>
                    <p className="text-slate-500 text-sm">Gestione las solicitudes de permisos y vacaciones</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors text-sm font-medium"
                    >
                        Volver
                    </button>
                    <button
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="px-4 py-2.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition-colors text-sm font-medium"
                    >
                        {showCalendar ? 'Ocultar Calendario' : 'Ver Calendario'}
                    </button>
                </div>
            </div>

            {showCalendar && <TeamCalendar />}

            {!showCalendar && (
                <div className="grid grid-cols-1 gap-6">
                    {requests.length === 0 ? (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-12 rounded-xl text-center">
                            <p className="text-slate-500 font-medium">No hay solicitudes pendientes.</p>
                            <p className="text-slate-400 text-sm mt-1">Las nuevas solicitudes aparecerán aquí.</p>
                        </div>
                    ) : (
                        requests.map(req => (
                            <div key={req.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row gap-6">
                                {/* Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100">
                                            {req.employee.firstName[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800">{req.employee.firstName} {req.employee.lastName}</h3>
                                            <p className="text-sm text-slate-500">{req.employee.position}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <p className="text-slate-500 text-xs uppercase tracking-wide font-semibold mb-1">Tipo de Ausencia</p>
                                            <p className="font-medium text-slate-800">{req.type}</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <p className="text-slate-500 text-xs uppercase tracking-wide font-semibold mb-1">Fechas Solicitadas</p>
                                            <p className="font-medium text-slate-800">{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                                        <p className="text-amber-800 text-sm font-medium mb-1">Motivo declarado:</p>
                                        <p className="text-slate-700 italic">"{req.reason}"</p>
                                    </div>

                                    {req.evidenceUrl && (
                                        <div className="mt-4">
                                            <a
                                                href={`${import.meta.env.VITE_API_URL || ''}/uploads/evidence/${req.evidenceUrl}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 text-blue-600 text-sm hover:text-blue-800 hover:underline font-medium"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                Ver Certificado/Evidencia Adjunta
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="w-full lg:w-80 bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col">
                                    <p className="text-sm font-semibold text-slate-800 mb-3 border-b border-slate-200 pb-2">Acciones Administrativas</p>
                                    <textarea
                                        className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 mb-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all resize-none"
                                        rows="3"
                                        placeholder="Ingrese un comentario opcional..."
                                        value={activeId === req.id ? comment : ''}
                                        onChange={(e) => { setActiveId(req.id); setComment(e.target.value); }}
                                    ></textarea>

                                    <div className="grid grid-cols-2 gap-3 mt-auto">
                                        <button
                                            onClick={() => handleAction(req.id, 'APPROVED')}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all hover:shadow md:flex justify-center items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                            Aprobar
                                        </button>
                                        <button
                                            onClick={() => handleAction(req.id, 'REJECTED')}
                                            className="bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all md:flex justify-center items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
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
