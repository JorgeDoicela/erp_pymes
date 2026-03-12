import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import entrepreneurshipService from '../../services/entrepreneurship.service';
import { FiLayout, FiPlus, FiMoreHorizontal, FiCheckCircle, FiClock, FiAlertCircle, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const KanbanRoadmap = () => {
    const { id } = useParams();
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newMilestone, setNewMilestone] = useState({ title: '', description: '', dueDate: '', kanbanColumn: 'BACKLOG' });
    const [saving, setSaving] = useState(false);

    const columns = [
        { id: 'BACKLOG', title: 'Backlog', icon: <FiClock />, color: 'slate' },
        { id: 'IN_PROGRESS', title: 'En Proceso', icon: <FiMoreHorizontal />, color: 'indigo' },
        { id: 'REVIEW', title: 'En Revisión', icon: <FiAlertCircle />, color: 'amber' },
        { id: 'DONE', title: 'Completado', icon: <FiCheckCircle />, color: 'emerald' }
    ];

    useEffect(() => {
        fetchMilestones();
    }, [id]);

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
            fetchMilestones();
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando Roadmap...</div>;

    const getColumnTasks = (columnId) => {
        return milestones.filter(m => (m.kanbanColumn || 'BACKLOG') === columnId);
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <FiLayout className="text-indigo-600" /> Startup Roadmap
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">Gestión ágil de hitos críticos y ejecución estratégica.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-slate-800 transition-all font-bold text-sm shadow-xl shadow-slate-200"
                >
                    <FiPlus /> Nuevo Hito
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[600px]">
                {columns.map((col) => (
                    <div key={col.id} className="bg-slate-50/50 rounded-[32px] p-4 border border-slate-100/50 flex flex-col">
                        <div className="flex items-center justify-between mb-6 px-2">
                            <div className="flex items-center gap-2">
                                <span className={`w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-${col.color}-500 border border-slate-100`}>
                                    {col.icon}
                                </span>
                                <h3 className="font-black text-slate-700 text-sm uppercase tracking-wider">{col.title}</h3>
                            </div>
                            <span className="bg-white border border-slate-100 text-slate-400 text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-lg shadow-sm">
                                {getColumnTasks(col.id).length}
                            </span>
                        </div>

                        <div className="space-y-4 flex-1">
                            {getColumnTasks(col.id).map((task) => (
                                <div key={task.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group pointer-events-auto">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-bold text-slate-800 leading-tight text-sm flex-1 pr-2">{task.title}</h4>
                                        <button 
                                            onClick={() => handleDeleteMilestone(task.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all flex-shrink-0"
                                        >
                                            <FiTrash2 size={12} />
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-slate-500 line-clamp-2 mb-4 font-medium leading-relaxed">
                                        {task.description || "Sin descripción detallada."}
                                    </p>
                                    <div className="flex justify-between items-center mt-auto pt-3 border-t border-slate-50">
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">
                                            Due: {new Date(task.dueDate).toLocaleDateString()}
                                        </span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {columns.filter(c => c.id !== (task.kanbanColumn || 'BACKLOG')).map(c => (
                                                <button 
                                                    key={c.id}
                                                    onClick={() => handleMoveTask(task.id, c.id)}
                                                    className={`w-5 h-5 rounded-lg bg-${c.color}-50 text-${c.color}-600 flex items-center justify-center hover:scale-110 transition-transform`}
                                                    title={`Mover a ${c.title}`}
                                                >
                                                    {c.icon}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {getColumnTasks(col.id).length === 0 && (
                                <div className="h-32 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center">
                                    <span className="text-[10px] uppercase font-black text-slate-300 tracking-widest">Vacío</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Crear Hito */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-slideDown">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800">Nuevo Hito Estratégico</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all">
                                <FiX />
                            </button>
                        </div>
                        <form onSubmit={handleAddMilestone} className="space-y-5">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Título del Hito *</label>
                                <input
                                    required
                                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                                    value={newMilestone.title}
                                    onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                                    placeholder="Ej: Lanzar versión beta pública"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Descripción</label>
                                <textarea
                                    rows="3"
                                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none text-slate-600"
                                    value={newMilestone.description}
                                    onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                                    placeholder="¿Qué abarca este hito?"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Fecha límite *</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                                        value={newMilestone.dueDate}
                                        onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Columna inicial</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                                        value={newMilestone.kanbanColumn}
                                        onChange={(e) => setNewMilestone({ ...newMilestone, kanbanColumn: e.target.value })}
                                    >
                                        {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-all text-sm">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={saving} className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50 text-sm">
                                    {saving ? 'Guardando...' : 'Crear Hito'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KanbanRoadmap;
