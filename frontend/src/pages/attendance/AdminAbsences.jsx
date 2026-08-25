import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import absenceService from '../../services/attendance/absenceService';
import TeamCalendar from './TeamCalendar';
import Modal from '../../components/common/Modal';

const STATUS_MAP = {
    PENDING: { label: 'Pendiente', cls: 'text-amber-800 bg-amber-50 border-amber-200' },
    APPROVED: { label: 'Aprobado', cls: 'text-green-800 bg-green-50 border-green-200' },
    REJECTED: { label: 'Rechazado', cls: 'text-red-800 bg-red-50 border-red-200' },
    CANCELLED: { label: 'Cancelado', cls: 'text-gray-800 bg-gray-50 border-gray-200' }
};

const AdminAbsences = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'
    const [searchTerm, setSearchTerm] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Modal de Resolución
    const [resolutionModal, setResolutionModal] = useState({
        open: false,
        request: null,
        status: 'APPROVED', // 'APPROVED' | 'REJECTED'
        comment: ''
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await absenceService.getRequests({});
            if (res.success) {
                setRequests(res.data || []);
            }
        } catch (error) {
            toast.error(error.message || 'Error al cargar las solicitudes de ausencia');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        let isMounted = true;
        absenceService.getRequests({})
            .then(res => {
                if (isMounted && res.success) {
                    setRequests(res.data || []);
                }
            })
            .catch(error => {
                if (isMounted) toast.error(error.message || 'Error al cargar las solicitudes de ausencia');
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, []);

    // Tab counts
    const counts = useMemo(() => {
        const p = requests.filter(r => r.status === 'PENDING').length;
        const a = requests.filter(r => r.status === 'APPROVED').length;
        const r = requests.filter(r => r.status === 'REJECTED').length;
        return { PENDING: p, APPROVED: a, REJECTED: r, ALL: requests.length };
    }, [requests]);

    // Filtered requests by Tab and Search
    const filteredRequests = useMemo(() => {
        let list = requests;
        if (activeTab !== 'ALL') {
            list = list.filter(r => r.status === activeTab);
        }
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            list = list.filter(r => {
                const name = `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.toLowerCase();
                const pos = (r.employee?.position || '').toLowerCase();
                const dept = (r.employee?.department || '').toLowerCase();
                const type = (r.type || '').toLowerCase();
                const reason = (r.reason || '').toLowerCase();
                return name.includes(q) || pos.includes(q) || dept.includes(q) || type.includes(q) || reason.includes(q);
            });
        }
        return list;
    }, [requests, activeTab, searchTerm]);

    const openResolutionModal = (req, status) => {
        setResolutionModal({
            open: true,
            request: req,
            status,
            comment: req.adminComment || ''
        });
    };

    const handleConfirmResolution = async (e) => {
        e.preventDefault();
        if (!resolutionModal.request) return;

        setActionLoading(true);
        try {
            const res = await absenceService.updateStatus(
                resolutionModal.request.id,
                resolutionModal.status,
                resolutionModal.comment
            );
            if (res.success) {
                const isApproved = resolutionModal.status === 'APPROVED';
                toast.success(`Solicitud de ${resolutionModal.request.employee?.firstName} ${isApproved ? 'aprobada' : 'rechazada'}`);
                setResolutionModal({ open: false, request: null, status: 'APPROVED', comment: '' });
                await loadData();
            }
        } catch (error) {
            toast.error(error.message || 'Error al procesar la solicitud');
        } finally {
            setActionLoading(false);
        }
    };

    const calculateDays = (start, end) => {
        try {
            const s = new Date(start);
            const e = new Date(end);
            const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
            return Math.max(1, diff);
        } catch {
            return 1;
        }
    };

    const inputClass = "w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors";

    return (
        <div className="space-y-5">
            {/* Header ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Asistencia · Gestión de Ausencias</p>
                    <h1 className="text-xl font-semibold text-gray-900">Aprobación de Ausencias y Permisos</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Revise, audite y procese las solicitudes de permisos, vacaciones y licencias del personal.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => setShowCalendar(!showCalendar)}
                        className={`px-3.5 py-2 border text-xs font-medium rounded transition-colors cursor-pointer ${
                            showCalendar
                                ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-xs'
                                : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700'
                        }`}
                    >
                        {showCalendar ? 'Ver Lista de Solicitudes' : 'Ver Calendario del Equipo'}
                    </button>
                </div>
            </div>

            {showCalendar ? (
                <TeamCalendar />
            ) : (
                <div className="space-y-4">
                    {/* Barra de Pestañas con Contadores Integrados y Buscador */}
                    <div className="bg-white border border-gray-200 rounded p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Pestañas con Contadores Tabulares */}
                        <div className="flex items-center gap-1 overflow-x-auto">
                            {[
                                { key: 'PENDING', label: 'Pendientes', count: counts.PENDING },
                                { key: 'APPROVED', label: 'Aprobadas', count: counts.APPROVED },
                                { key: 'REJECTED', label: 'Rechazadas', count: counts.REJECTED },
                                { key: 'ALL', label: 'Todas', count: counts.ALL }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                                        activeTab === tab.key
                                            ? 'bg-gray-900 text-white'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span
                                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                                            activeTab === tab.key ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-600'
                                        }`}
                                        style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
                                    >
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Buscador Reactivo */}
                        <div className="w-full md:w-72 shrink-0">
                            <input
                                type="text"
                                placeholder="Buscar colaborador, área o motivo..."
                                className={inputClass}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Lista de Solicitudes */}
                    {loading ? (
                        <div className="p-12 text-center text-gray-400 text-xs bg-white border border-gray-200 rounded">
                            Cargando solicitudes de ausencia...
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="p-12 text-center bg-white border border-gray-200 rounded">
                            <p className="text-sm font-medium text-gray-700">Sin solicitudes para mostrar</p>
                            <p className="text-xs text-gray-400 mt-1">
                                {searchTerm
                                    ? 'No se encontraron resultados con el término de búsqueda.'
                                    : activeTab === 'PENDING'
                                        ? 'No hay solicitudes pendientes de aprobación en este momento.'
                                        : 'No hay registros en esta categoría.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredRequests.map(req => {
                                const status = STATUS_MAP[req.status] || STATUS_MAP.PENDING;
                                const days = calculateDays(req.startDate, req.endDate);
                                const isPending = req.status === 'PENDING';

                                return (
                                    <div key={req.id} className="bg-white rounded border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors">
                                        {/* Cabecera de la solicitud */}
                                        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center font-mono font-semibold text-xs text-gray-700 shrink-0">
                                                    {req.employee?.firstName ? req.employee.firstName[0] : 'U'}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-900">
                                                        {req.employee?.firstName} {req.employee?.lastName}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500">
                                                        {req.employee?.position || 'Sin cargo'} · <span className="text-gray-400">{req.employee?.department || 'General'}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className={`text-[11px] font-mono border px-2.5 py-0.5 rounded ${status.cls}`}>
                                                    {status.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Cuerpo con Información */}
                                        <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                                            {/* Detalles principales */}
                                            <div className="lg:col-span-8 space-y-3">
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                                    <div className="bg-gray-50 border border-gray-100 rounded p-2.5">
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Tipo de Permiso</p>
                                                        <p className="font-medium text-gray-800">{req.type}</p>
                                                    </div>
                                                    <div className="bg-gray-50 border border-gray-100 rounded p-2.5">
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Período Solicitado</p>
                                                        <p className="font-mono text-gray-800 text-[11px]" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                            {new Date(req.startDate).toLocaleDateString('es-EC')} — {new Date(req.endDate).toLocaleDateString('es-EC')}
                                                        </p>
                                                    </div>
                                                    <div className="bg-gray-50 border border-gray-100 rounded p-2.5">
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Duración Total</p>
                                                        <p className="font-mono font-medium text-gray-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                            {days} {days === 1 ? 'día hábil' : 'días hábiles'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Motivo declarado */}
                                                <div className="bg-gray-50/70 border border-gray-100 rounded p-3 text-xs">
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Motivo declarado por el colaborador</p>
                                                    <p className="text-gray-700 italic">
                                                        {req.reason ? `"${req.reason}"` : 'Sin motivo especificado.'}
                                                    </p>
                                                </div>

                                                {/* Justificativo / Certificado */}
                                                {req.evidenceUrl && (
                                                    <div className="pt-1">
                                                        <a
                                                            href={`${import.meta.env.VITE_API_URL || ''}/uploads/evidence/${req.evidenceUrl}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1.5 text-blue-600 text-xs hover:underline font-medium"
                                                        >
                                                            <span>Ver Certificado Adjunto / Evidencia →</span>
                                                        </a>
                                                    </div>
                                                )}

                                                {/* Comentario administrativo histórico */}
                                                {req.adminComment && (
                                                    <div className="bg-blue-50/50 border border-blue-100 rounded p-2.5 text-xs text-blue-900">
                                                        <span className="font-semibold text-[10px] uppercase block mb-0.5">Comentario Administrativo:</span>
                                                        <p className="text-blue-800">{req.adminComment}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Panel Lateral de Acciones */}
                                            <div className="lg:col-span-4 bg-gray-50/60 border border-gray-200 rounded p-3 flex flex-col justify-between gap-3 h-full">
                                                <div>
                                                    <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Resolución</p>
                                                    <p className="text-[11px] text-gray-500">
                                                        {isPending
                                                            ? 'Esta solicitud requiere respuesta administrativa.'
                                                            : `Procesada previamente como ${status.label.toLowerCase()}. Puede modificar la resolución si es necesario.`}
                                                    </p>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openResolutionModal(req, 'APPROVED')}
                                                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
                                                    >
                                                        Aprobar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openResolutionModal(req, 'REJECTED')}
                                                        className="flex-1 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded transition-colors cursor-pointer"
                                                    >
                                                        Rechazar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* MODAL — Confirmación y Resolución de Ausencia */}
            <Modal
                isOpen={resolutionModal.open && !!resolutionModal.request}
                onClose={() => setResolutionModal({ open: false, request: null, status: 'APPROVED', comment: '' })}
                title={resolutionModal.status === 'APPROVED' ? 'Aprobar Solicitud de Ausencia' : 'Rechazar Solicitud de Ausencia'}
                subtitle={resolutionModal.request ? `${resolutionModal.request.employee?.firstName} ${resolutionModal.request.employee?.lastName} · ${resolutionModal.request.type}` : ''}
                size="md"
            >
                {resolutionModal.request && (
                    <form onSubmit={handleConfirmResolution} className="space-y-4">
                        <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs space-y-1">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Período:</span>
                                <span className="font-mono text-gray-800" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                    {new Date(resolutionModal.request.startDate).toLocaleDateString('es-EC')} — {new Date(resolutionModal.request.endDate).toLocaleDateString('es-EC')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Días:</span>
                                <span className="font-mono font-semibold text-gray-800" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                    {calculateDays(resolutionModal.request.startDate, resolutionModal.request.endDate)} días
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Comentario u Observación Administrativa (opcional)
                            </label>
                            <textarea
                                rows="3"
                                className={`${inputClass} resize-none`}
                                placeholder="Ingrese una justificación o indicación para el colaborador..."
                                value={resolutionModal.comment}
                                onChange={e => setResolutionModal({ ...resolutionModal, comment: e.target.value })}
                            />
                            <p className="text-[11px] text-gray-400 mt-1">
                                El colaborador recibirá una notificación en el sistema informando sobre esta resolución.
                            </p>
                        </div>

                        <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setResolutionModal({ open: false, request: null, status: 'APPROVED', comment: '' })}
                                className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={actionLoading}
                                className={`px-3.5 py-2 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50 ${
                                    resolutionModal.status === 'APPROVED'
                                        ? 'bg-blue-600 hover:bg-blue-700 shadow-xs'
                                        : 'bg-red-600 hover:bg-red-700'
                                }`}
                            >
                                {actionLoading ? 'Procesando...' : resolutionModal.status === 'APPROVED' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default AdminAbsences;
