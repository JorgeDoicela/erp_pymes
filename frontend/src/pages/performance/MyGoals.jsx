import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getMyGoals, createGoal, updateGoalProgress, deleteGoal } from '../../services/goals.service';
import { FiPlus, FiTrash2, FiClock, FiTarget, FiActivity } from 'react-icons/fi';
import Modal from '../../components/common/Modal';

const MyGoals = () => {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [updateModal, setUpdateModal] = useState({ show: false, goal: null });

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        metric: '',
        targetValue: '',
        unit: '%',
        deadline: '',
        priority: 'MEDIUM'
    });

    const [progressData, setProgressData] = useState({ currentValue: '' });

    const fetchGoals = async () => {
        try {
            const data = await getMyGoals();
            setGoals(data || []);
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Error al cargar objetivos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGoals();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createGoal(formData);
            setShowModal(false);
            setFormData({ title: '', description: '', metric: '', targetValue: '', unit: '%', deadline: '', priority: 'MEDIUM' });
            toast.success('Objetivo SMART registrado exitosamente');
            fetchGoals();
        } catch (error) {
            toast.error(error.message || "Error al crear el objetivo");
        }
    };

    const handleUpdateProgress = async (e) => {
        e.preventDefault();
        try {
            await updateGoalProgress(updateModal.goal.id, { currentValue: progressData.currentValue });
            setUpdateModal({ show: false, goal: null });
            toast.success('Progreso del objetivo actualizado');
            fetchGoals();
        } catch (error) {
            toast.error(error.message || "Error al actualizar progreso");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Confirmas la eliminación de este objetivo?")) return;
        try {
            await deleteGoal(id);
            toast.success('Objetivo eliminado');
            fetchGoals();
        } catch (error) {
            toast.error(error.message || 'Error al eliminar objetivo');
        }
    };

    const getPriorityBadge = (p) => {
        switch (p) {
            case 'HIGH': return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-50 text-rose-800 border border-rose-200">ALTA</span>;
            case 'MEDIUM': return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200">MEDIA</span>;
            case 'LOW': return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">BAJA</span>;
            default: return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-gray-100 text-gray-700 border border-gray-200">NORMAL</span>;
        }
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            {/* Header Limpio ERP */}
            <div className="bg-white p-5 rounded border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 font-mono mb-1">
                        Mi Portal · Gestión del Desempeño y KPIs
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                        Mis Objetivos y Metas
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Define metas cuantificables SMART, registra avances periódicos y monitorea tus indicadores clave.
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                    <FiPlus className="w-3.5 h-3.5" />
                    <span>Nuevo Objetivo</span>
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-xs text-gray-400 font-mono">
                    Cargando objetivos y metas...
                </div>
            ) : goals.length === 0 ? (
                <div className="bg-white p-12 rounded border border-gray-200 text-center text-gray-400 text-xs">
                    <p className="text-sm font-semibold text-gray-800">No tienes objetivos registrados</p>
                    <p className="text-xs text-gray-400 mt-1">Haz clic en "Nuevo Objetivo" para registrar tus metas SMART del período.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {goals.map(goal => (
                        <div key={goal.id} className="bg-white rounded border border-gray-200 p-4 flex flex-col justify-between space-y-3">
                            <div className="space-y-2">
                                <div className="flex justify-between items-start gap-2">
                                    {getPriorityBadge(goal.priority)}
                                    <button 
                                        onClick={() => handleDelete(goal.id)} 
                                        className="text-gray-400 hover:text-rose-600 text-xs p-1 cursor-pointer transition-colors"
                                        title="Eliminar objetivo"
                                    >
                                        <FiTrash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <h3 className="font-semibold text-xs text-gray-900 line-clamp-1">{goal.title}</h3>
                                {goal.description && <p className="text-xs text-gray-500 line-clamp-2">{goal.description}</p>}
                            </div>

                            <div className="space-y-1.5 pt-2 border-t border-gray-100">
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>Progreso Alcanzado</span>
                                    <span className="font-mono font-semibold text-gray-900 tabular-nums">{Number(goal.progress).toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded h-1.5 overflow-hidden border border-gray-200">
                                    <div
                                        className={`h-full rounded transition-all duration-300 ${goal.progress >= 100 ? 'bg-emerald-600' : 'bg-blue-600'}`}
                                        style={{ width: `${Math.min(100, goal.progress)}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-xs text-gray-500 font-mono tabular-nums bg-gray-50 p-2.5 rounded border border-gray-200">
                                <div>
                                    <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Meta</span>
                                    <span className="font-semibold text-gray-800">{goal.targetValue} {goal.unit}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Actual</span>
                                    <span className="font-semibold text-gray-800">{goal.currentValue} {goal.unit}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs">
                                <span className={`text-[11px] font-mono inline-flex items-center gap-1 ${new Date(goal.deadline) < new Date() && goal.progress < 100 ? 'text-rose-700 font-medium' : 'text-gray-400'}`}>
                                    <FiClock className="w-3 h-3" /> Vence: {new Date(goal.deadline).toLocaleDateString('es-EC')}
                                </span>

                                <button
                                    onClick={() => {
                                        setUpdateModal({ show: true, goal });
                                        setProgressData({ currentValue: goal.currentValue });
                                    }}
                                    className="border border-gray-300 hover:border-gray-400 bg-white text-gray-700 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                                >
                                    Actualizar Progreso
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Goal Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Nuevo Objetivo Individual"
                subtitle="Define una meta cuantificable de rendimiento profesional."
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Título del Objetivo</label>
                        <input required type="text" className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                            value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Ej. Optimizar tiempo de entrega de reportes" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Descripción / Justificación</label>
                        <textarea className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 h-16 resize-none"
                            value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Detalles de la meta esperada..." />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Métrica (KPI)</label>
                            <input required type="text" className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                                value={formData.metric} onChange={e => setFormData({ ...formData, metric: e.target.value })} placeholder="Ej. Entregas a tiempo" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Unidad</label>
                            <input required type="text" className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                                value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} placeholder="Ej: %, USD, Horas, Casos" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Valor Meta Numérico</label>
                            <input required type="number" step="0.01" className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                                value={formData.targetValue} onChange={e => setFormData({ ...formData, targetValue: e.target.value })} placeholder="Ej. 100" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Límite</label>
                            <input required type="date" className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                                value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Prioridad</label>
                        <select className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                            value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                            <option value="LOW">Baja</option>
                            <option value="MEDIUM">Media</option>
                            <option value="HIGH">Alta</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                        <button type="button" onClick={() => setShowModal(false)} className="border border-gray-300 hover:border-gray-400 bg-white text-gray-700 text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer">Cancelar</button>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer shadow-xs">Crear Objetivo</button>
                    </div>
                </form>
            </Modal>

            {/* Update Modal */}
            <Modal
                isOpen={updateModal.show && !!updateModal.goal}
                onClose={() => setUpdateModal({ show: false, goal: null })}
                title="Actualizar Progreso"
                subtitle={updateModal.goal?.title}
                size="sm"
            >
                {updateModal.goal && (
                    <form onSubmit={handleUpdateProgress} className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Valor Actual ({updateModal.goal.unit})</label>
                            <input
                                type="number"
                                step="0.01"
                                autoFocus
                                className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono font-semibold"
                                value={progressData.currentValue}
                                onChange={e => setProgressData({ currentValue: e.target.value })}
                            />
                            <p className="text-[11px] text-right text-gray-400 font-mono mt-0.5">Meta establecida: {updateModal.goal.targetValue} {updateModal.goal.unit}</p>
                        </div>
                        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                            <button type="button" onClick={() => setUpdateModal({ show: false, goal: null })} className="border border-gray-300 hover:border-gray-400 bg-white text-gray-700 text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer">Cancelar</button>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer shadow-xs">Guardar Progreso</button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default MyGoals;
