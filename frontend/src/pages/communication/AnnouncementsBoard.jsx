import React, { useState, useEffect } from 'react';
import {
    getAnnouncements,
    getBoardStats,
    createAnnouncement,
    markAnnouncementReadOrAcknowledge,
    getAnnouncementStats,
    deleteAnnouncement,
    getBirthdays
} from '../../services/communication/announcement.service';
import Modal from '../../components/common/Modal';

const CATEGORY_MAP = {
    POLICY: { label: 'POLÍTICA / REGLAMENTO', cls: 'bg-gray-50 text-gray-700 border-gray-200' },
    HOLIDAY: { label: 'FERIADO / ASUETO', cls: 'bg-amber-50/60 text-amber-900 border-amber-200' },
    BIRTHDAY: { label: 'CUMPLEAÑOS', cls: 'bg-blue-50/60 text-blue-900 border-blue-200' },
    GENERAL: { label: 'AVISO GENERAL', cls: 'bg-gray-50 text-gray-700 border-gray-200' }
};

const AnnouncementsBoard = ({ user }) => {
    // Estados principales
    const [announcements, setAnnouncements] = useState([]);
    const [birthdays, setBirthdays] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        policyCount: 0,
        holidayCount: 0,
        birthdayCount: 0,
        pendingAcknowledgmentCount: 0
    });
    const [loading, setLoading] = useState(true);

    // Navegación de pestañas: 'ALL', 'POLICY', 'HOLIDAY', 'BIRTHDAYS', 'PENDING_ACK'
    const [activeTab, setActiveTab] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // Modales y acciones
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [statsModalOpen, setStatsModalOpen] = useState(false);
    const [selectedStats, setSelectedStats] = useState(null);
    const [announcementToDelete, setAnnouncementToDelete] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [notification, setNotification] = useState(null);

    // Formulario de publicación
    const [form, setForm] = useState({
        title: '',
        content: '',
        category: 'GENERAL',
        priority: 'NORMAL',
        requiresAcknowledgment: false,
        attachmentUrl: ''
    });

    const isAdmin = user?.role === 'admin' || user?.role === 'hr';

    useEffect(() => {
        window.scrollTo(0, 0);
        loadBoardStats();
        loadBirthdays();
    }, []);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const loadBoardStats = async () => {
        try {
            const res = await getBoardStats();
            if (res.success && res.data) {
                setStats(res.data);
            }
        } catch (error) {
            console.error('Error cargando estadísticas del tablón:', error);
        }
    };

    const loadBirthdays = async () => {
        try {
            const res = await getBirthdays();
            if (res.success && Array.isArray(res.data)) {
                setBirthdays(res.data);
            }
        } catch (error) {
            console.error('Error cargando cumpleaños:', error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const params = {
                search: searchTerm.trim() || undefined
            };

            if (activeTab === 'POLICY') params.category = 'POLICY';
            else if (activeTab === 'HOLIDAY') params.category = 'HOLIDAY';
            else if (activeTab === 'PENDING_ACK') params.pendingOnly = true;

            const res = await getAnnouncements(params);
            if (res.success && Array.isArray(res.data)) {
                setAnnouncements(res.data);
            }
        } catch (error) {
            showNotification('error', error.message || 'Error al cargar comunicados');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadData();
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const handlePublishSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.content.trim()) {
            showNotification('error', 'Proporcione el título y contenido del comunicado');
            return;
        }
        setActionLoading(true);
        try {
            const res = await createAnnouncement(form);
            if (res.success) {
                showNotification('success', 'Comunicado oficial publicado exitosamente');
                setCreateModalOpen(false);
                setForm({
                    title: '',
                    content: '',
                    category: 'GENERAL',
                    priority: 'NORMAL',
                    requiresAcknowledgment: false,
                    attachmentUrl: ''
                });
                loadData();
                loadBoardStats();
            }
        } catch (error) {
            showNotification('error', error.message || 'Error al publicar comunicado');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAcknowledge = async (announcementId) => {
        setActionLoading(true);
        try {
            const res = await markAnnouncementReadOrAcknowledge(announcementId, true);
            if (res.success) {
                showNotification('success', 'Acuse de recibo digital firmado y registrado');
                loadData();
                loadBoardStats();
            }
        } catch (error) {
            showNotification('error', error.message || 'Error al registrar acuse de recibo');
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkAsRead = async (announcementId) => {
        try {
            const res = await markAnnouncementReadOrAcknowledge(announcementId, false);
            if (res.success) {
                showNotification('success', 'Lectura confirmada');
                loadData();
                loadBoardStats();
            }
        } catch (error) {
            showNotification('error', error.message || 'Error al confirmar lectura');
        }
    };

    const handleOpenStats = async (announcementId) => {
        try {
            const res = await getAnnouncementStats(announcementId);
            if (res.success) {
                setSelectedStats(res.data);
                setStatsModalOpen(true);
            }
        } catch (error) {
            showNotification('error', error.message || 'Error al obtener métricas de lectura');
        }
    };

    const handleDeleteAnnouncement = async () => {
        if (!announcementToDelete) return;
        setActionLoading(true);
        try {
            await deleteAnnouncement(announcementToDelete.id);
            showNotification('success', 'Comunicado eliminado correctamente');
            setAnnouncementToDelete(null);
            loadData();
            loadBoardStats();
        } catch (error) {
            showNotification('error', error.message || 'Error al eliminar el comunicado');
        } finally {
            setActionLoading(false);
        }
    };

    const inputClass = "w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors";

    return (
        <div className="space-y-4">
            {/* Notificación Toast Sobria */}
            {notification && (
                <div
                    className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded border text-xs font-medium shadow-md transition-all ${
                        notification.type === 'success'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : 'bg-red-50 text-red-900 border-red-200'
                    }`}
                >
                    {notification.message}
                </div>
            )}

            {/* Header ERP con Resumen Institucional */}
            <div className="pb-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Plataforma · Comunicación Institucional</p>
                    <h1 className="text-xl font-semibold text-gray-900">Tablón de Anuncios y Comunicados</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Canal oficial de noticias, políticas de la empresa y acuses de recibo digitales.</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-4 bg-white px-3.5 py-2 rounded border border-gray-200 font-mono text-xs">
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Comunicados Oficiales</span>
                            <span className="font-semibold text-gray-900 tabular-nums">{stats.total} publicados</span>
                        </div>
                        <div className="w-px h-6 bg-gray-200" />
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Políticas Vigentes</span>
                            <span className="font-semibold text-blue-700 tabular-nums">{stats.policyCount}</span>
                        </div>
                        <div className="w-px h-6 bg-gray-200" />
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Cumpleaños Mes</span>
                            <span className="font-semibold text-emerald-700 tabular-nums">{stats.birthdayCount}</span>
                        </div>
                    </div>

                    {isAdmin && (
                        <button
                            onClick={() => setCreateModalOpen(true)}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs"
                        >
                            + Publicar Comunicado
                        </button>
                    )}
                </div>
            </div>

            {/* Pestañas con Contadores Integrados (Holded/Linear Style) */}
            <div className="flex items-center justify-between border-b border-gray-200 gap-4 overflow-x-auto">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => handleTabChange('ALL')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'ALL'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Todos <span className="ml-1.5 font-mono text-[11px] text-gray-400">({stats.total})</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('POLICY')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'POLICY'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Políticas & Reglamentos <span className="ml-1.5 font-mono text-[11px] text-gray-400">({stats.policyCount})</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('HOLIDAY')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'HOLIDAY'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Feriados & Asuetos <span className="ml-1.5 font-mono text-[11px] text-amber-700">({stats.holidayCount})</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('PENDING_ACK')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'PENDING_ACK'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Requieren Acuse de Recibo <span className="ml-1.5 font-mono text-[11px] text-blue-700">({stats.pendingAcknowledgmentCount})</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('BIRTHDAYS')}
                        className={`pb-2.5 px-3 text-xs font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === 'BIRTHDAYS'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        Cumpleaños del Mes <span className="ml-1.5 font-mono text-[11px] text-emerald-600">({stats.birthdayCount})</span>
                    </button>
                </div>
            </div>

            {/* Barra de Búsqueda */}
            {activeTab !== 'BIRTHDAYS' && (
                <div className="bg-white p-3 rounded border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto flex-grow max-w-md">
                        <input
                            type="text"
                            placeholder="Buscar por título o contenido del comunicado..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={inputClass}
                        />
                        <button
                            type="submit"
                            className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors shrink-0 cursor-pointer"
                        >
                            Buscar
                        </button>
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchTerm('');
                                    setTimeout(loadData, 0);
                                }}
                                className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer shrink-0"
                            >
                                Limpiar
                            </button>
                        )}
                    </form>
                </div>
            )}

            {/* Layout Principal: Feed + Sidebar */}
            {activeTab === 'BIRTHDAYS' ? (
                /* VISTA COMPLETA DE CUMPLEAÑOS */
                <div className="bg-white rounded border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                        <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                            Cumpleañeros del Mes Actual ({birthdays.length})
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="py-2.5 px-4">Colaborador</th>
                                    <th className="py-2.5 px-4">Departamento</th>
                                    <th className="py-2.5 px-4">Cargo / Posición</th>
                                    <th className="py-2.5 px-4 text-center">Día de Celebración</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {birthdays.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-12 text-center text-gray-400 text-xs">
                                            No hay cumpleaños registrados este mes.
                                        </td>
                                    </tr>
                                ) : (
                                    birthdays.map(bday => (
                                        <tr key={bday.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="py-2.5 px-4 font-medium text-gray-900">
                                                {bday.firstName} {bday.lastName}
                                            </td>
                                            <td className="py-2.5 px-4 text-gray-600">{bday.department || 'General'}</td>
                                            <td className="py-2.5 px-4 text-gray-500">{bday.position || 'Colaborador'}</td>
                                            <td className="py-2.5 px-4 text-center font-mono font-semibold text-gray-900 tabular-nums">
                                                Día {bday.day}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* FEED PRINCIPAL + SIDEBAR */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* FEED DE COMUNICADOS */}
                    <div className="lg:col-span-2 space-y-3">
                        {loading ? (
                            <div className="bg-white p-12 text-center text-gray-400 text-xs rounded border border-gray-200">
                                Cargando comunicados oficiales...
                            </div>
                        ) : announcements.length === 0 ? (
                            <div className="bg-white p-12 text-center rounded border border-gray-200">
                                <p className="text-sm font-medium text-gray-700">Sin comunicados disponibles</p>
                                <p className="text-xs text-gray-400 mt-1">No se encontraron avisos o políticas con los filtros actuales.</p>
                            </div>
                        ) : (
                            announcements.map(ann => {
                                const catConfig = CATEGORY_MAP[ann.category] || CATEGORY_MAP.GENERAL;

                                return (
                                    <div
                                        key={ann.id}
                                        className={`bg-white p-4 rounded border transition-colors ${
                                            ann.priority === 'URGENT' ? 'border-red-200' : 'border-gray-200'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start gap-3 pb-2 border-b border-gray-100">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {ann.priority === 'URGENT' && (
                                                        <span className="px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 font-mono font-semibold text-[10px] uppercase rounded">
                                                            URGENTE
                                                        </span>
                                                    )}
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${catConfig.cls}`}>
                                                        {catConfig.label}
                                                    </span>
                                                    <span className="text-[11px] text-gray-400 font-mono tabular-nums">
                                                        {new Date(ann.createdAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-semibold text-gray-900 pt-0.5">{ann.title}</h3>
                                                <p className="text-[11px] text-gray-400">
                                                    Publicado por: {ann.createdBy?.firstName} {ann.createdBy?.lastName || 'Administración'}
                                                </p>
                                            </div>

                                            {isAdmin && (
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <button
                                                        onClick={() => handleOpenStats(ann.id)}
                                                        className="border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                    >
                                                        Lecturas
                                                    </button>
                                                    <button
                                                        onClick={() => setAnnouncementToDelete(ann)}
                                                        className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs px-2 py-1 rounded transition-colors cursor-pointer"
                                                        title="Eliminar comunicado"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-gray-700 text-xs leading-relaxed whitespace-pre-line py-3">
                                            {ann.content}
                                        </div>

                                        {ann.attachmentUrl && (
                                            <div className="pt-1 pb-2">
                                                <a
                                                    href={ann.attachmentUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-mono"
                                                >
                                                    Ver Archivo Adjunto ↗
                                                </a>
                                            </div>
                                        )}

                                        {/* Acuse de recibo digital o confirmación de lectura */}
                                        {ann.requiresAcknowledgment ? (
                                            <div className="pt-3 border-t border-gray-100">
                                                {ann.isAcknowledged ? (
                                                    <div className="bg-emerald-50/60 border border-emerald-200 p-2.5 rounded flex items-center justify-between text-xs text-emerald-900">
                                                        <span className="font-medium">Acuse de recibo digital firmado</span>
                                                        <span className="text-[11px] text-emerald-700 font-mono tabular-nums">
                                                            {new Date(ann.readAt).toLocaleDateString('es-EC')}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="bg-amber-50/60 border border-amber-200 p-3 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                        <p className="text-xs text-amber-900 font-medium">
                                                            Este comunicado requiere confirmación obligatoria de lectura.
                                                        </p>
                                                        <button
                                                            disabled={actionLoading}
                                                            onClick={() => handleAcknowledge(ann.id)}
                                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded transition-colors cursor-pointer shrink-0 disabled:opacity-50 shadow-xs"
                                                        >
                                                            Firmar Acuse de Recibo
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
                                                {ann.isRead ? (
                                                    <span className="text-[11px] text-gray-400 font-mono">
                                                        Lectura confirmada · {new Date(ann.readAt).toLocaleDateString('es-EC')}
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleMarkAsRead(ann.id)}
                                                        className="border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 text-[11px] px-2.5 py-1 rounded transition-colors cursor-pointer"
                                                    >
                                                        Marcar como leído
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* SIDEBAR DE CUMPLEAÑOS DEL MES */}
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded border border-gray-200 space-y-3">
                            <div className="border-b border-gray-100 pb-2">
                                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Cumpleaños del Mes</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Colaboradores que celebran este mes.</p>
                            </div>

                            <div className="space-y-2">
                                {birthdays.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-4">Sin cumpleaños registrados</p>
                                ) : (
                                    birthdays.map(bday => (
                                        <div key={bday.id} className="p-2.5 bg-gray-50/60 rounded flex items-center justify-between border border-gray-100 text-xs">
                                            <div>
                                                <p className="font-medium text-gray-900">{bday.firstName} {bday.lastName}</p>
                                                <p className="text-[11px] text-gray-400">{bday.department || 'General'}</p>
                                            </div>
                                            <span className="font-mono text-xs text-gray-700 font-semibold bg-white border border-gray-200 px-2 py-0.5 rounded tabular-nums">
                                                Día {bday.day}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: PUBLICAR COMUNICADO OFICIAL */}
            <Modal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="Publicar Comunicado Oficial"
                size="lg"
            >
                <form onSubmit={handlePublishSubmit}>
                    <div className="space-y-3.5">
                        <div>
                            <label className="block font-medium text-gray-700 mb-1">Título del Comunicado</label>
                            <input
                                type="text"
                                required
                                placeholder="ej. Actualización de Políticas / Aviso Operativo"
                                className={inputClass}
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Categoría</label>
                                <select
                                    className={inputClass}
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                >
                                    <option value="GENERAL">Aviso General</option>
                                    <option value="POLICY">Política / Reglamento</option>
                                    <option value="HOLIDAY">Feriado / Asueto</option>
                                    <option value="BIRTHDAY">Cumpleaños</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Prioridad</label>
                                <select
                                    className={inputClass}
                                    value={form.priority}
                                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                >
                                    <option value="LOW">Baja / Informativa</option>
                                    <option value="NORMAL">Normal</option>
                                    <option value="HIGH">Alta / Importante</option>
                                    <option value="URGENT">Urgente</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block font-medium text-gray-700 mb-1">Contenido del Comunicado</label>
                            <textarea
                                rows="4"
                                required
                                placeholder="Escribe el mensaje o disposición para el personal..."
                                className={inputClass}
                                value={form.content}
                                onChange={(e) => setForm({ ...form, content: e.target.value })}
                            ></textarea>
                        </div>

                        <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={form.requiresAcknowledge}
                                    onChange={(e) => setForm({ ...form, requiresAcknowledge: e.target.checked })}
                                />
                                <span className="font-medium text-gray-900">Exigir Confirmación de Lectura Obligatoria</span>
                            </label>
                            <p className="text-[11px] text-gray-500 pl-6">
                                Los colaboradores deberán pulsar el botón de acuse formal para registrar su conocimiento legal.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Fijar en Tablón Hasta</label>
                                <input
                                    type="date"
                                    className={inputClass}
                                    value={form.pinnedUntil}
                                    onChange={(e) => setForm({ ...form, pinnedUntil: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Fecha de Expiración</label>
                                <input
                                    type="date"
                                    className={inputClass}
                                    value={form.expiresAt}
                                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-200 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setCreateModalOpen(false)}
                            className="px-3.5 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={actionLoading}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {actionLoading ? 'Publicando...' : 'Publicar Comunicado'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL: ESTADÍSTICAS DE LECTURA (ADMIN) */}
            <Modal
                isOpen={statsModalOpen && !!selectedStats}
                onClose={() => setStatsModalOpen(false)}
                title="Control de Lectura y Acuses"
                subtitle={selectedStats?.announcement?.title}
                size="lg"
                footer={
                    <button
                        onClick={() => setStatsModalOpen(false)}
                        className="px-3.5 py-1.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded transition-colors cursor-pointer"
                    >
                        Cerrar
                    </button>
                }
            >
                {selectedStats && (
                    <div className="space-y-4 max-h-[65vh] overflow-y-auto">
                        {/* Métricas */}
                        <div className="grid grid-cols-2 gap-3 font-mono">
                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Lecturas Confirmadas</span>
                                <span className="text-base font-semibold text-gray-900 tabular-nums">
                                    {selectedStats.metrics?.totalReads} / {selectedStats.metrics?.totalActiveEmployees}
                                </span>
                                <span className="text-[11px] text-gray-500 block">({selectedStats.metrics?.readPercentage}%)</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-sans">Acuses Firmados</span>
                                <span className="text-base font-semibold text-emerald-700 tabular-nums">
                                    {selectedStats.metrics?.totalAcknowledged} / {selectedStats.metrics?.totalActiveEmployees}
                                </span>
                                <span className="text-[11px] text-gray-500 block">({selectedStats.metrics?.acknowledgedPercentage}%)</span>
                            </div>
                        </div>

                        {/* Colaboradores con lectura registrada */}
                        <div>
                            <h4 className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                Colaboradores que leyeron ({selectedStats.reads?.length || 0})
                            </h4>
                            <div className="divide-y divide-gray-100 border border-gray-200 rounded max-h-36 overflow-y-auto">
                                {selectedStats.reads && selectedStats.reads.length > 0 ? (
                                    selectedStats.reads.map(r => (
                                        <div key={r.id} className="p-2 flex items-center justify-between">
                                            <span>{r.employee?.firstName} {r.employee?.lastName}</span>
                                            <span className="font-mono text-[11px] text-gray-400">
                                                {new Date(r.readAt).toLocaleDateString('es-EC')}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="p-3 text-center text-gray-400">Sin lecturas registradas</p>
                                )}
                            </div>
                        </div>

                        {/* Colaboradores pendientes */}
                        <div>
                            <h4 className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                Colaboradores pendientes ({selectedStats.pendingEmployees?.length || 0})
                            </h4>
                            <div className="divide-y divide-gray-100 border border-gray-200 rounded max-h-36 overflow-y-auto">
                                {selectedStats.pendingEmployees && selectedStats.pendingEmployees.length > 0 ? (
                                    selectedStats.pendingEmployees.map(emp => (
                                        <div key={emp.id} className="p-2 flex items-center justify-between text-gray-600">
                                            <span>{emp.firstName} {emp.lastName}</span>
                                            <span className="text-[11px] text-gray-400">{emp.department || 'General'}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="p-3 text-center text-emerald-600 font-medium">¡Todos los colaboradores han leído el comunicado!</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
            <Modal
                isOpen={!!announcementToDelete}
                onClose={() => setAnnouncementToDelete(null)}
                title="¿Eliminar comunicado?"
                size="sm"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setAnnouncementToDelete(null)}
                            className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            disabled={actionLoading}
                            onClick={handleDeleteAnnouncement}
                            className="px-3 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {actionLoading ? 'Eliminando...' : 'Sí, Eliminar'}
                        </button>
                    </>
                }
            >
                {announcementToDelete && (
                    <p className="text-xs text-gray-500">
                        Se retirará del tablón el comunicado "{announcementToDelete.title}" junto con todos sus registros de acuse de recibo.
                    </p>
                )}
            </Modal>
        </div>
    );
};

export default AnnouncementsBoard;
