import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import entrepreneurshipService from '../../services/entrepreneurship.service';
import { FiLayout, FiPlus, FiMoreHorizontal, FiCheckCircle, FiClock, FiAlertCircle, FiTrash2, FiX, FiCalendar, FiEdit3 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const statusColors = {
    PENDING: 'bg-slate-100 text-slate-600',
    IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
    REVIEW: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
};

const KanbanRoadmap = () => {
    const { id } = useParams();
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [detailModal, setDetailModal] = useState(null); // holds milestone object
    const [newMilestone, setNewMilestone] = useState({ title: '', description: '', dueDate: '', kanbanColumn: 'BACKLOG' });
    const [saving, setSaving] = useState(false);

    const columns = [
        { id: 'BACKLOG', title: 'Backlog', icon: <FiClock />, color: 'slate' },
        { id: 'IN_PROGRESS', title: 'En Proceso', icon: <FiMoreHorizontal />, color: 'indigo' },
        { id: 'REVIEW', title: 'En Revisión', icon: <FiAlertCircle />, color: 'amber' },
        { id: 'DONE', title: 'Completado', icon: <FiCheckCircle />, color: 'emerald' }
    ];

    useEffect(() => { fetchMilestones(); }, [id]);

    const fetchMilestones = async () => {
        try {
            const response = await entrepreneurshipService.getProjectDetails(id);
            setMilestones(response.milestones || []);
        } catch (error) {
            console.error("Error loading milestones", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMoveTask = async (milestoneId, newColumn) => {
        try {
            await entrepreneurshipService.updateMilestone(milestoneId, { kanbanColumn: newColumn });
            toast.success("Hito movido");
            if (detailModal?.id === milestoneId) {
                setDetailModal(prev => ({ ...prev, kanbanColumn: newColumn }));
            }
            fetchMilestones();
        } catch (error) {
            toast.error("Error al mover el hito");
        }
    };

    const handleAddMilestone = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await entrepreneurshipService.addMilestone({ ...newMilestone, projectId: id });
            toast.success("Hito creado correctamente");
            setShowModal(false);
            setNewMilestone({ title: '', description: '', dueDate: '', kanbanColumn: 'BACKLOG' });
            fetchMilestones();
        } catch (error) {
            toast.error("Error al crear el hito");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteMilestone = async (milestoneId) => {
        if (!window.confirm("¿Eliminar este hito del roadmap?")) return;
        try {
            await entrepreneurshipService.deleteMilestone(milestoneId);
            toast.success("Hito eliminado");
            setDetailModal(null);
            fetchMilestones();
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando Roadmap...</div>;

    const getColumnTasks = (columnId) => milestones.filter(m => (m.kanbanColumn || 'BACKLOG') === columnId);

    return (
        <div className="space-y-8 animate-fadeIn">            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <FiLayout className="text-blue-600" /> Tablero de Hitos y Entregables
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Seguimiento de ejecución por etapas operativas.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)} 
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                    <FiPlus size={14} /> Nuevo Hito
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[500px] overflow-x-auto pb-2 text-xs">
                {columns.map((col) => (
                    <div key={col.id} className="bg-gray-50/50 rounded border border-gray-200 p-3 flex flex-col space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                            <div className="flex items-center gap-1.5">
                                <span className="text-gray-600">{col.icon}</span>
                                <h3 className="font-semibold text-gray-800 text-xs uppercase tracking-wider">{col.title}</h3>
                            </div>
                            <span className="bg-white border border-gray-200 text-gray-600 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded">
                                {getColumnTasks(col.id).length}
                            </span>
                        </div>
                        <div className="space-y-2.5 flex-1">
                            {getColumnTasks(col.id).map((task) => (
                                <div
                                    key={task.id}
                                    onClick={() => setDetailModal(task)}
                                    className="bg-white p-3 rounded border border-gray-200 hover:border-blue-400 transition-colors group cursor-pointer space-y-2"
                                >
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold text-gray-900 leading-snug text-xs flex-1 pr-1">{task.title}</h4>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteMilestone(task.id); }}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity shrink-0"
                                        >
                                            <FiTrash2 size={12} />
                                        </button>
                                    </div>
                                    {task.description && (
                                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                                            {task.description}
                                        </p>
                                    )}
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                        <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                                            <FiCalendar size={10} /> {new Date(task.dueDate).toLocaleDateString('es-EC')}
                                        </span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                            {columns.filter(c => c.id !== (task.kanbanColumn || 'BACKLOG')).map(c => (
                                                <button key={c.id} onClick={() => handleMoveTask(task.id, c.id)} className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center text-[10px]" title={`Mover a ${c.title}`}>
                                                    {c.icon}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {getColumnTasks(col.id).length === 0 && (
                                <div className="h-24 border border-dashed border-gray-200 rounded flex items-center justify-center">
                                    <span className="text-[11px] text-gray-400 font-mono">Sin tareas</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Detalle de Hito */}
            {detailModal && (
                <div className="app-modal-overlay" onClick={() => setDetailModal(null)}>
                    <div className="bg-white rounded border border-gray-200 shadow-xl w-full max-w-md p-5 animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded uppercase ${statusColors[detailModal.status] || 'bg-gray-100 text-gray-600'}`}>
                                    {detailModal.status === 'PENDING' ? 'PENDIENTE' : 
                                     detailModal.status === 'IN_PROGRESS' ? 'EN PROCESO' : 
                                     detailModal.status === 'REVIEW' ? 'EN REVISIÓN' : 'COMPLETADO'}
                                </span>
                                <h3 className="text-sm font-semibold text-gray-900 mt-2">{detailModal.title}</h3>
                            </div>
                            <button onClick={() => setDetailModal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                                <FiX size={16} />
                            </button>
                        </div>
                        
                        <div className="space-y-3 text-xs">
                            {detailModal.description && (
                                <div className="bg-gray-50 p-3 rounded border border-gray-200 text-gray-700 leading-relaxed">
                                    {detailModal.description}
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
                                    <p className="text-[10px] text-gray-400 font-sans uppercase mb-0.5">Fecha Límite</p>
                                    <p className="font-semibold text-gray-800">{new Date(detailModal.dueDate).toLocaleDateString('es-EC')}</p>
                                </div>
                                <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
                                    <p className="text-[10px] text-gray-400 font-sans uppercase mb-0.5">Columna</p>
                                    <p className="font-semibold text-gray-800">{columns.find(c => c.id === detailModal.kanbanColumn)?.title || 'Backlog'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                            <button onClick={() => handleMoveTask(detailModal.id, 'DONE')} className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors shadow-xs">
                                Marcar como Realizado
                            </button>
                            <button onClick={() => { handleDeleteMilestone(detailModal.id); }} className="px-3 py-1.5 text-gray-700 bg-white border border-gray-300 rounded text-xs font-medium hover:bg-red-50 hover:text-red-600 transition-colors">
                                <FiTrash2 size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Crear Hito */}
            {showModal && (
                <div className="app-modal-overlay">
                    <div className="bg-white rounded border border-gray-200 shadow-xl w-full max-w-md p-5 animate-scale-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Nuevo Hito de Proyecto</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1"><FiX size={16} /></button>
                        </div>
                        <form onSubmit={handleAddMilestone} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Título *</label>
                                <input required className="w-full px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500" value={newMilestone.title} onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })} placeholder="Ej: Lanzar versión beta pública" />
                            </div>
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea rows="3" className="w-full px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500 resize-none" value={newMilestone.description} onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })} placeholder="Detalles u objetivos del hito..." />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Fecha Límite *</label>
                                    <input required type="date" className="w-full px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500 font-mono" value={newMilestone.dueDate} onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Columna</label>
                                    <select className="w-full px-3 py-1.5 rounded bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-blue-500" value={newMilestone.kanbanColumn} onChange={(e) => setNewMilestone({ ...newMilestone, kanbanColumn: e.target.value })}>
                                        {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                <button type="button" onClick={() => setShowModal(false)} className="px-3.5 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 font-medium transition-colors">Cancelar</button>
                                <button type="submit" disabled={saving} className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors shadow-xs">{saving ? 'Guardando...' : 'Crear Hito'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KanbanRoadmap;
