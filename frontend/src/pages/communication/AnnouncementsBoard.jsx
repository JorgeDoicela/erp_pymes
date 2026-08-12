import React, { useState, useEffect } from 'react';
import {
    getAnnouncements,
    createAnnouncement,
    markAnnouncementReadOrAcknowledge,
    getAnnouncementStats,
    getBirthdays
} from '../../services/communication/announcement.service';

const AnnouncementsBoard = ({ user }) => {
    const [announcements, setAnnouncements] = useState([]);
    const [birthdays, setBirthdays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [statsModalOpen, setStatsModalOpen] = useState(false);
    const [selectedStats, setSelectedStats] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Form Publish
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
        loadData();
    }, [filterCategory]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [resAnn, resBday] = await Promise.all([
                getAnnouncements({ category: filterCategory || undefined, search: searchTerm || undefined }),
                getBirthdays().catch(() => ({ data: [] }))
            ]);

            if (resAnn.success) setAnnouncements(resAnn.data);
            if (resBday.success) setBirthdays(resBday.data);
        } catch (error) {
            console.error('Error al cargar comunicados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadData();
    };

    const handlePublishSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.content.trim()) {
            alert('Proporciona el título y contenido del comunicado');
            return;
        }
        setActionLoading(true);
        try {
            const res = await createAnnouncement(form);
            if (res.success) {
                alert('Comunicado publicado exitosamente');
                setCreateModalOpen(false);
                setForm({ title: '', content: '', category: 'GENERAL', priority: 'NORMAL', requiresAcknowledgment: false, attachmentUrl: '' });
                loadData();
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAcknowledge = async (announcementId) => {
        try {
            const res = await markAnnouncementReadOrAcknowledge(announcementId, true);
            if (res.success) {
                alert('Acuse de recibo digital registrado correctamente');
                loadData();
            }
        } catch (error) {
            alert(error.message);
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
            alert(error.message);
        }
    };

    const getCategoryBadge = (category) => {
        switch (category) {
            case 'POLICY':
                return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 text-xs font-mono rounded">Política / Reglamento</span>;
            case 'HOLIDAY':
                return <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono rounded">Feriado / Asueto</span>;
            case 'BIRTHDAY':
                return <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 text-xs font-mono rounded">Cumpleaños</span>;
            default:
                return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 text-xs font-mono rounded">Aviso General</span>;
        }
    };

    return (
        <div className="space-y-5">
            {/* Header Limpio ERP */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Plataforma · Comunicación</p>
                    <h1 className="text-xl font-semibold text-gray-900">Tablón de Anuncios y Comunicados Oficiales</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Canal institucional de noticias, políticas de la empresa y acuse de recibo digital.</p>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => setCreateModalOpen(false) || setCreateModalOpen(true)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors shrink-0 cursor-pointer"
                    >
                        Publicar nuevo comunicado
                    </button>
                )}
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white p-3.5 rounded border border-gray-200">
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                    {[
                        { label: 'Todos', value: '' },
                        { label: 'Políticas & Código', value: 'POLICY' },
                        { label: 'Feriados & Eventos', value: 'HOLIDAY' },
                        { label: 'Cumpleaños', value: 'BIRTHDAY' }
                    ].map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setFilterCategory(tab.value)}
                            className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap cursor-pointer ${
                                filterCategory === tab.value
                                    ? 'bg-blue-600 text-white font-medium'
                                    : 'border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-72">
                    <input
                        type="text"
                        placeholder="Buscar en comunicados..."
                        className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" className="px-3 py-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer shrink-0">
                        Buscar
                    </button>
                </form>
            </div>

            {/* Layout Grid: Feed Principal + Cumpleaños Lateral */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Feed de Comunicados */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="bg-white p-12 text-center text-gray-400 text-xs rounded border border-gray-200">
                            Cargando comunicados...
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="bg-white p-12 text-center text-gray-400 text-xs rounded border border-gray-200">
                            No se encontraron comunicados publicados.
                        </div>
                    ) : (
                        announcements.map(ann => (
                            <div
                                key={ann.id}
                                className={`bg-white p-5 rounded border space-y-3 ${
                                    ann.priority === 'URGENT' ? 'border-red-300 bg-red-50/10' : 'border-gray-200'
                                }`}
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {ann.priority === 'URGENT' && (
                                                <span className="px-2 py-0.5 bg-red-600 text-white font-mono font-bold text-[10px] uppercase rounded">
                                                    URGENTE
                                                </span>
                                            )}
                                            {getCategoryBadge(ann.category)}
                                            <span className="text-xs text-gray-400 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                {new Date(ann.createdAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-semibold text-gray-900 pt-0.5">{ann.title}</h3>
                                        <p className="text-xs text-gray-500">Por {ann.createdBy?.firstName} {ann.createdBy?.lastName}</p>
                                    </div>

                                    {isAdmin && (
                                        <button
                                            onClick={() => handleOpenStats(ann.id)}
                                            className="px-2.5 py-1 border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 text-xs rounded transition-colors cursor-pointer shrink-0"
                                        >
                                            Lecturas
                                        </button>
                                    )}
                                </div>

                                <div className="text-gray-700 text-xs leading-relaxed whitespace-pre-line border-t border-gray-100 pt-3">
                                    {ann.content}
                                </div>

                                {ann.attachmentUrl && (
                                    <div className="pt-1">
                                        <a
                                            href={ann.attachmentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-mono"
                                        >
                                            Ver Archivo Adjunto (URL)
                                        </a>
                                    </div>
                                )}

                                {/* Acuse de recibo digital */}
                                {ann.requiresAcknowledgment && (
                                    <div className="pt-3 border-t border-gray-100">
                                        {ann.isAcknowledged ? (
                                            <div className="bg-green-50 border border-green-200 p-2.5 rounded flex items-center justify-between text-xs text-green-800">
                                                <span className="font-medium">Acuse de recibo digital firmado</span>
                                                <span className="text-[11px] text-green-700 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                                    {new Date(ann.readAt).toLocaleDateString('es-EC')}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="bg-amber-50 border border-amber-200 p-3 rounded space-y-2">
                                                <p className="text-xs text-amber-900 font-medium">Este comunicado requiere confirmación obligatoria de lectura.</p>
                                                <button
                                                    onClick={() => handleAcknowledge(ann.id)}
                                                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded transition-colors cursor-pointer"
                                                >
                                                    Confirmar Lectura y Acuse de Recibo
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Sidebar Lateral: Cumpleaños del Mes */}
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded border border-gray-200 space-y-3">
                        <div className="border-b border-gray-100 pb-2">
                            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Cumpleaños del Mes</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Compañeros que celebran este mes.</p>
                        </div>

                        <div className="space-y-2">
                            {birthdays.length === 0 ? (
                                <p className="text-xs text-gray-400 italic text-center py-2">Sin cumpleaños registrados este mes</p>
                            ) : (
                                birthdays.map(bday => (
                                    <div key={bday.id} className="p-2.5 bg-gray-50/70 rounded flex items-center justify-between border border-gray-100 text-xs">
                                        <div>
                                            <p className="font-medium text-gray-900">{bday.firstName} {bday.lastName}</p>
                                            <p className="text-[11px] text-gray-400">{bday.department || 'General'}</p>
                                        </div>
                                        <span className="font-mono text-xs text-gray-700 font-semibold bg-white border border-gray-200 px-2 py-0.5 rounded" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                            Día {bday.day}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Crear Comunicado (Admin) */}
            {createModalOpen && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded max-w-xl w-full overflow-hidden shadow-xl">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900">Publicar Comunicado Oficial</h3>
                            <button onClick={() => setCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
                        </div>
                        <form onSubmit={handlePublishSubmit}>
                            <div className="p-5 space-y-4 text-xs">
                                <div>
                                    <label className="block font-medium text-gray-600 mb-1">Título del Comunicado</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="ej. Actualización de Políticas / Aviso Operativo"
                                        className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-medium text-gray-600 mb-1">Categoría</label>
                                        <select
                                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
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
                                        <label className="block font-medium text-gray-600 mb-1">Prioridad</label>
                                        <select
                                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                            value={form.priority}
                                            onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                        >
                                            <option value="NORMAL">Normal</option>
                                            <option value="URGENT">Urgente</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-medium text-gray-600 mb-1">Contenido</label>
                                    <textarea
                                        rows="4"
                                        required
                                        placeholder="Escribe el contenido del mensaje..."
                                        className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                        value={form.content}
                                        onChange={(e) => setForm({ ...form, content: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block font-medium text-gray-600 mb-1">Enlace / Adjunto (Opcional)</label>
                                    <input
                                        type="url"
                                        placeholder="https://..."
                                        className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 font-mono focus:outline-none focus:border-blue-500"
                                        value={form.attachmentUrl}
                                        onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
                                    />
                                </div>

                                <div className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded">
                                    <input
                                        type="checkbox"
                                        id="reqAck"
                                        checked={form.requiresAcknowledgment}
                                        onChange={(e) => setForm({ ...form, requiresAcknowledgment: e.target.checked })}
                                        className="rounded border-gray-300 text-blue-600 cursor-pointer"
                                    />
                                    <label htmlFor="reqAck" className="text-xs text-gray-700 font-medium cursor-pointer">
                                        Requerir Acuse de Recibo Digital a los empleados
                                    </label>
                                </div>
                            </div>

                            <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(false)}
                                    className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
                                >
                                    {actionLoading ? 'Publicando...' : 'Publicar Anuncio'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Estadísticas de Lectura */}
            {statsModalOpen && selectedStats && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded max-w-xl w-full overflow-hidden shadow-xl">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">Métricas de Lectura y Acuse</h3>
                                <p className="text-xs text-gray-400 truncate max-w-xs">{selectedStats.announcement?.title}</p>
                            </div>
                            <button onClick={() => setStatsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
                        </div>

                        <div className="p-5 space-y-4 max-h-[450px] overflow-y-auto text-xs">
                            <div className="grid grid-cols-2 gap-3 text-center">
                                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded">
                                    <p className="text-[11px] font-medium text-gray-400 uppercase">Lectura Realizada</p>
                                    <h4 className="text-xl font-bold text-gray-900 font-mono mt-1" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                        {selectedStats.metrics?.readPercentage}%
                                    </h4>
                                    <p className="text-[11px] text-gray-500 font-mono mt-0.5">{selectedStats.metrics?.totalReads} / {selectedStats.metrics?.totalActiveEmployees} Empleados</p>
                                </div>
                                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded">
                                    <p className="text-[11px] font-medium text-gray-400 uppercase">Acuse de Recibo</p>
                                    <h4 className="text-xl font-bold text-gray-900 font-mono mt-1" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                                        {selectedStats.metrics?.acknowledgedPercentage}%
                                    </h4>
                                    <p className="text-[11px] text-gray-500 font-mono mt-0.5">{selectedStats.metrics?.totalAcknowledged} Confirmados</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Pendientes por Leer / Firmar ({selectedStats.pendingEmployees?.length || 0})</h4>
                                <div className="max-h-36 overflow-y-auto space-y-1.5">
                                    {selectedStats.pendingEmployees?.length === 0 ? (
                                        <p className="text-xs text-green-700 font-medium italic">¡El 100% de los empleados ha leído esta publicación!</p>
                                    ) : (
                                        selectedStats.pendingEmployees?.map(emp => (
                                            <div key={emp.id} className="p-2 bg-gray-50 rounded border border-gray-100 text-xs flex justify-between items-center">
                                                <span className="font-medium text-gray-800">{emp.firstName} {emp.lastName}</span>
                                                <span className="text-[11px] text-gray-400">{emp.department || 'General'}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end">
                            <button
                                onClick={() => setStatsModalOpen(false)}
                                className="px-3.5 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium rounded transition-colors cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnouncementsBoard;
