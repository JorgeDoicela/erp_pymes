import { useState, useEffect } from 'react';
import absenceService from '../../services/attendance/absenceService';
import TeamCalendar from './TeamCalendar';

const AdminAbsences = () => {
    const [requests, setRequests] = useState([]);
    const [comment, setComment] = useState('');
    const [activeId, setActiveId] = useState(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await absenceService.getRequests({ status: 'PENDING' });
            if (res.success) setRequests(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAction = async (id, status) => {
        if (!confirm(`¿Confirmar ${status === 'APPROVED' ? 'APROBACIÓN' : 'RECHAZO'} de esta solicitud?`)) return;
        setActionLoading(id + status);
        try {
            await absenceService.updateStatus(id, status, comment);
            setActiveId(null);
            setComment('');
            loadData();
        } catch (error) {
            alert('Error al actualizar el estado de la solicitud.');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-5">
            {/* Header ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Asistencia · Gestión de Ausencias</p>
                    <h1 className="text-xl font-semibold text-gray-900">Aprobación de Ausencias y Permisos</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Revise y procese las solicitudes de permisos y vacaciones pendientes.</p>
                </div>
                <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer shrink-0"
                >
                    {showCalendar ? 'Ver Solicitudes' : 'Ver Calendario del Equipo'}
                </button>
            </div>

            {showCalendar ? (
                <TeamCalendar />
            ) : (
                <div className="space-y-4">
                    {requests.length === 0 ? (
                        <div className="p-12 text-center bg-white border border-gray-200 rounded">
                            <p className="text-sm font-medium text-gray-700">Sin solicitudes pendientes</p>
                            <p className="text-xs text-gray-400 mt-1">Las nuevas solicitudes de ausencia aparecerán aquí para su revisión.</p>
                        </div>
                    ) : (
                        requests.map(req => (
                            <div key={req.id} className="bg-white rounded border border-gray-200 overflow-hidden">
                                <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded bg-gray-100 border border-gray-200 flex items-center justify-center font-mono font-semibold text-xs text-gray-700">
                                            {req.employee.firstName[0]}
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-900">{req.employee.firstName} {req.employee.lastName}</p>
                                            <p className="text-[11px] text-gray-400">{req.employee.position}</p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">PENDIENTE</span>
                                </div>

                                <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    {/* Detalles de la solicitud */}
                                    <div className="lg:col-span-2 space-y-3">
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div className="bg-gray-50 border border-gray-100 rounded p-3">
                                                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium mb-1">Tipo de Ausencia</p>
                                                <p className="font-medium text-gray-800">{req.type}</p>
                                            </div>
                                            <div className="bg-gray-50 border border-gray-100 rounded p-3">
                                                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium mb-1">Período Solicitado</p>
                                                <p className="font-mono text-gray-800" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                    {new Date(req.startDate).toLocaleDateString('es-EC')} — {new Date(req.endDate).toLocaleDateString('es-EC')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-amber-50 border border-amber-100 rounded p-3 text-xs">
                                            <p className="text-[11px] text-amber-700 uppercase tracking-wider font-medium mb-1">Motivo declarado</p>
                                            <p className="text-gray-700 italic">"{req.reason}"</p>
                                        </div>
                                        {req.evidenceUrl && (
                                            <a
                                                href={`${import.meta.env.VITE_API_URL || ''}/uploads/evidence/${req.evidenceUrl}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-blue-600 text-xs hover:underline font-medium"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                Ver Certificado Adjunto
                                            </a>
                                        )}
                                    </div>

                                    {/* Panel de Acciones */}
                                    <div className="bg-gray-50 border border-gray-200 rounded p-4 flex flex-col gap-3">
                                        <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 pb-2">Acción Administrativa</p>
                                        <textarea
                                            className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors resize-none"
                                            rows="3"
                                            placeholder="Comentario opcional..."
                                            value={activeId === req.id ? comment : ''}
                                            onChange={(e) => { setActiveId(req.id); setComment(e.target.value); }}
                                        />
                                        <div className="flex gap-2 mt-auto">
                                            <button
                                                onClick={() => handleAction(req.id, 'APPROVED')}
                                                disabled={actionLoading === req.id + 'APPROVED'}
                                                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                                {actionLoading === req.id + 'APPROVED' ? '...' : 'Aprobar'}
                                            </button>
                                            <button
                                                onClick={() => handleAction(req.id, 'REJECTED')}
                                                disabled={actionLoading === req.id + 'REJECTED'}
                                                className="flex-1 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                                {actionLoading === req.id + 'REJECTED' ? '...' : 'Rechazar'}
                                            </button>
                                        </div>
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
