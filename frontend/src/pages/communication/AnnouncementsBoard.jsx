import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    getAnnouncements, 
    createAnnouncement, 
    markAnnouncementReadOrAcknowledge, 
    getAnnouncementStats, 
    getBirthdays 
} from '../../services/communication/announcement.service';
import { 
    MegaphoneIcon, 
    SparklesIcon, 
    CheckCircleIcon, 
    PlusIcon, 
    EyeIcon, 
    ExclamationTriangleIcon,
    GiftIcon,
    DocumentCheckIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    PaperClipIcon
} from '@heroicons/react/24/outline';

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
                return <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full border border-purple-200">Política / Reglamento</span>;
            case 'HOLIDAY':
                return <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-200">Feriado / Asueto</span>;
            case 'BIRTHDAY':
                return <span className="px-3 py-1 bg-pink-100 text-pink-800 text-xs font-bold rounded-full border border-pink-200">Cumpleaños</span>;
            default:
                return <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full border border-blue-200">Aviso General</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <MegaphoneIcon className="w-8 h-8 text-blue-600" />
                        Tablón de Anuncios y Comunicados Oficiales
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Canal oficial de noticias, políticas institucionales y acuse de recibo digital
                    </p>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all text-sm"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Publicar Nuevo Comunicado
                    </button>
                )}
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    <FunnelIcon className="w-5 h-5 text-slate-400 shrink-0" />
                    {[
                        { label: 'Todos', value: '' },
                        { label: 'Políticas & Código', value: 'POLICY' },
                        { label: 'Feriados & Eventos', value: 'HOLIDAY' },
                        { label: 'Cumpleaños', value: 'BIRTHDAY' }
                    ].map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setFilterCategory(tab.value)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                filterCategory === tab.value
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-72">
                    <div className="relative w-full">
                        <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                            type="text"
                            placeholder="Buscar en comunicados..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="px-3.5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-all">Buscar</button>
                </form>
            </div>

            {/* Layout Grid: Announcements Feed (Left) & Sidebar Widgets (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Announcements Feed */}
                <div className="lg:col-span-2 space-y-5">
                    {loading ? (
                        <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border">Cargando comunicados...</div>
                    ) : announcements.length === 0 ? (
                        <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border">No se encontraron comunicados publicados.</div>
                    ) : (
                        announcements.map(ann => (
                            <motion.div
                                key={ann.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-white p-6 rounded-2xl border shadow-sm space-y-4 ${
                                    ann.priority === 'URGENT' ? 'border-rose-300 ring-1 ring-rose-300' : 'border-slate-200/80'
                                }`}
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {ann.priority === 'URGENT' && (
                                                <span className="px-2.5 py-0.5 bg-rose-600 text-white font-extrabold text-[10px] uppercase rounded-md tracking-wider animate-pulse">
                                                    URGENTE
                                                </span>
                                            )}
                                            {getCategoryBadge(ann.category)}
                                            <span className="text-xs text-slate-400">
                                                Publicado el {new Date(ann.createdAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 pt-1">{ann.title}</h3>
                                        <p className="text-xs text-slate-500">Por {ann.createdBy?.firstName} {ann.createdBy?.lastName}</p>
                                    </div>

                                    {isAdmin && (
                                        <button
                                            onClick={() => handleOpenStats(ann.id)}
                                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                                        >
                                            <EyeIcon className="w-4 h-4 text-slate-500" /> Lecturas
                                        </button>
                                    )}
                                </div>

                                <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line border-t border-slate-100 pt-3">
                                    {ann.content}
                                </div>

                                {ann.attachmentUrl && (
                                    <div className="pt-2">
                                        <a
                                            href={ann.attachmentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline bg-blue-50 px-3 py-2 rounded-xl border border-blue-200"
                                        >
                                            <PaperClipIcon className="w-4 h-4" /> Ver Archivo Adjunto ↗
                                        </a>
                                    </div>
                                )}

                                {/* Acknowledgment digital box */}
                                {ann.requiresAcknowledgment && (
                                    <div className="pt-3 border-t border-slate-100">
                                        {ann.isAcknowledged ? (
                                            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                                                <span className="font-bold flex items-center gap-1.5">
                                                    <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                                                    Acuse de Recibo Digital Firmado
                                                </span>
                                                <span className="text-[11px] text-emerald-600 font-mono">
                                                    {new Date(ann.readAt).toLocaleDateString('es-EC')}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="bg-amber-50/80 border border-amber-300 p-4 rounded-xl space-y-3">
                                                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                                                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0" />
                                                    <span>Este comunicado o política requiere acuse de recibo obligatorio.</span>
                                                </div>
                                                <button
                                                    onClick={() => handleAcknowledge(ann.id)}
                                                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                                                >
                                                    <DocumentCheckIcon className="w-4 h-4" />
                                                    Entendido y Acepto Cumplir esta Norma
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Sidebar Widgets (Birthdays of the month & Quick Policies) */}
                <div className="space-y-6">
                    {/* Birthdays Card */}
                    <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
                        <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                            <GiftIcon className="w-6 h-6 text-pink-400" />
                            <span>Cumpleaños del Mes</span>
                        </div>
                        <p className="text-xs text-purple-200">¡Celebremos a nuestros compañeros este mes!</p>

                        <div className="space-y-3 pt-2">
                            {birthdays.length === 0 ? (
                                <p className="text-xs text-purple-300/70 italic text-center py-2">Sin cumpleaños registrados este mes</p>
                            ) : (
                                birthdays.map(bday => (
                                    <div key={bday.id} className="p-3 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-between border border-white/10 text-xs">
                                        <div>
                                            <p className="font-bold text-white">{bday.firstName} {bday.lastName}</p>
                                            <p className="text-[11px] text-purple-200">{bday.department || 'General'}</p>
                                        </div>
                                        <span className="px-2.5 py-1 bg-pink-500/20 text-pink-300 border border-pink-400/40 rounded-full font-bold text-[11px]">
                                            Día {bday.day} 🎉
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Announcement Modal (Admin Only) */}
            <AnimatePresence>
                {createModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-800">Publicar Nuevo Comunicado Oficial</h3>
                                <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
                            </div>
                            <form onSubmit={handlePublishSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Título del Comunicado</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="ej. Actualización del Código de Conducta / Feriado Nacional"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Categoría</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none"
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
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Prioridad</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none"
                                            value={form.priority}
                                            onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                        >
                                            <option value="NORMAL">Normal</option>
                                            <option value="URGENT">Urgente</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Contenido del Mensaje</label>
                                    <textarea
                                        rows="4"
                                        required
                                        placeholder="Escribe el cuerpo del comunicado oficial..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none"
                                        value={form.content}
                                        onChange={(e) => setForm({ ...form, content: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Enlace / Adjunto (Opcional)</label>
                                    <input
                                        type="url"
                                        placeholder="https://..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none font-mono"
                                        value={form.attachmentUrl}
                                        onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
                                    />
                                </div>

                                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="reqAck"
                                        checked={form.requiresAcknowledgment}
                                        onChange={(e) => setForm({ ...form, requiresAcknowledgment: e.target.checked })}
                                        className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                                    />
                                    <label htmlFor="reqAck" className="text-xs font-bold text-amber-900 cursor-pointer">
                                        Requerir Acuse de Recibo Digital Obligatorio a todos los empleados
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" onClick={() => setCreateModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancelar</button>
                                    <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md">
                                        {actionLoading ? 'Publicando...' : 'Publicar Anuncio'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Read Stats Modal (Admin Only) */}
            <AnimatePresence>
                {statsModalOpen && selectedStats && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Métricas de Lectura y Acuse</h3>
                                    <p className="text-xs text-slate-500 truncate max-w-xs">{selectedStats.announcement?.title}</p>
                                </div>
                                <button onClick={() => setStatsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
                            </div>

                            <div className="p-6 space-y-5 max-h-[450px] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                        <p className="text-xs font-bold text-blue-700 uppercase">Lectura Realizada</p>
                                        <h4 className="text-2xl font-black text-blue-900 mt-1">{selectedStats.metrics?.readPercentage}%</h4>
                                        <p className="text-[11px] text-blue-600 mt-0.5">{selectedStats.metrics?.totalReads} de {selectedStats.metrics?.totalActiveEmployees} Empleados</p>
                                    </div>
                                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                        <p className="text-xs font-bold text-emerald-700 uppercase">Acuse de Recibo</p>
                                        <h4 className="text-2xl font-black text-emerald-900 mt-1">{selectedStats.metrics?.acknowledgedPercentage}%</h4>
                                        <p className="text-[11px] text-emerald-600 mt-0.5">{selectedStats.metrics?.totalAcknowledged} Confirmados</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pendientes por Leer / Firmar ({selectedStats.pendingEmployees?.length || 0})</h4>
                                    <div className="max-h-36 overflow-y-auto space-y-1.5">
                                        {selectedStats.pendingEmployees?.length === 0 ? (
                                            <p className="text-xs text-emerald-600 font-bold italic">¡El 100% de los empleados ha leído esta publicación!</p>
                                        ) : (
                                            selectedStats.pendingEmployees?.map(emp => (
                                                <div key={emp.id} className="p-2 bg-slate-50 rounded-lg text-xs flex justify-between items-center">
                                                    <span className="font-medium text-slate-800">{emp.firstName} {emp.lastName}</span>
                                                    <span className="text-[11px] text-slate-400">{emp.department || 'General'}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AnnouncementsBoard;
