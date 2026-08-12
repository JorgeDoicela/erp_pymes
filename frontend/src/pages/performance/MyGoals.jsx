import { useEffect, useState } from 'react';
import { getMyGoals, createGoal, updateGoalProgress, deleteGoal } from '../../services/goals.service';
import { FiPlus, FiTrash2, FiX, FiClock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const MyGoals = () => {
    const navigate = useNavigate();
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
            setGoals(data);
        } catch (error) {
            console.error(error);
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
            fetchGoals();
        } catch (error) {
            alert("Error al crear objetivo");
        }
    };

    const handleUpdateProgress = async (e) => {
        e.preventDefault();
        try {
            await updateGoalProgress(updateModal.goal.id, { currentValue: progressData.currentValue });
            setUpdateModal({ show: false, goal: null });
            fetchGoals();
        } catch (error) {
            alert("Error al actualizar progreso");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Eliminar este objetivo?")) {
            await deleteGoal(id);
            fetchGoals();
        }
    };

    const getPriorityBadge = (p) => {
        switch (p) {
            case 'HIGH': return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">Alta</span>;
            case 'MEDIUM': return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">Media</span>;
            case 'LOW': return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-green-50 text-green-700 border border-green-200">Baja</span>;
            default: return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-50 text-gray-500 border border-gray-200">Normal</span>;
        }
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            {/* Header Limpio ERP */}
            <div className="bg-white p-5 rounded border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                        Gestión de Desempeño · Objetivos SMART
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                        Mis Objetivos y Metas
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Define metas cuantificables, registra avances y monitorea tus KPIs.
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-2 rounded transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                >
                    <FiPlus className="w-3.5 h-3.5" />
                    <span>Nuevo Objetivo</span>
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-xs text-gray-400 font-mono">
                    Cargando objetivos...
                </div>
            ) : goals.length === 0 ? (
                <div className="bg-white p-12 rounded border border-gray-200 text-center text-gray-400 text-sm">
                    No tienes objetivos registrados. Haz clic en "Nuevo Objetivo" para comenzar.
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
                                        className="text-gray-400 hover:text-red-600 text-xs p-0.5 cursor-pointer"
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
                                    <span>Progreso</span>
                                    <span className="font-mono font-semibold text-gray-900 tabular-nums">{goal.progress.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded h-1.5 overflow-hidden border border-gray-200">
                                    <div
                                        className={`h-full rounded transition-all duration-300 ${goal.progress >= 100 ? 'bg-green-600' : 'bg-blue-600'}`}
                                        style={{ width: `${goal.progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-xs text-gray-500 font-mono tabular-nums bg-gray-50 p-2 rounded border border-gray-200">
                                <div>
                                    <span className="text-[10px] text-gray-400 block uppercase">Meta</span>
                                    <span className="font-semibold text-gray-800">{goal.targetValue} {goal.unit}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-gray-400 block uppercase">Actual</span>
                                    <span className="font-semibold text-gray-800">{goal.currentValue} {goal.unit}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs">
                                <span className={`text-[11px] font-mono inline-flex items-center gap-1 ${new Date(goal.deadline) < new Date() && goal.progress < 100 ? 'text-red-600' : 'text-gray-400'}`}>
                                    <FiClock className="w-3 h-3" /> Vence: {new Date(goal.deadline).toLocaleDateString('es-EC')}
                                </span>

                                <button
                                    onClick={() => {
                                        setUpdateModal({ show: true, goal });
                                        setProgressData({ currentValue: goal.currentValue });
                                    }}
                                    className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                                >
                                    Actualizar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded border border-gray-200 shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-sm font-bold text-gray-900">Nuevo Objetivo SMART</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Título del Objetivo</label>
                                <input required type="text" className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500"
                                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Ej. Incrementar efectividad de entregas" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                                <textarea className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 h-16 resize-none"
                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Detalles de la meta..." />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Métrica (KPI)</label>
                                    <input required type="text" className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500"
                                        value={formData.metric} onChange={e => setFormData({ ...formData, metric: e.target.value })} placeholder="Ej. Entregas a tiempo" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Unidad</label>
                                    <input required type="text" className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                                        value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} placeholder="Ej: %, USD, Unidades" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Valor Meta</label>
                                    <input required type="number" step="0.01" className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                                        value={formData.targetValue} onChange={e => setFormData({ ...formData, targetValue: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Fecha Límite</label>
                                    <input required type="date" className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                                        value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Prioridad</label>
                                <select className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500"
                                    value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                    <option value="LOW">Baja</option>
                                    <option value="MEDIUM">Media</option>
                                    <option value="HIGH">Alta</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer">Cancelar</button>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer">Crear Objetivo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Update Modal */}
            {updateModal.show && (
                <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded border border-gray-200 shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-sm font-bold text-gray-900">Actualizar Progreso</h2>
                            <button onClick={() => setUpdateModal({ show: false, goal: null })} className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer">&times;</button>
                        </div>
                        <div className="p-5 space-y-3">
                            <p className="text-xs text-gray-600">Meta: <span className="font-semibold text-gray-900">{updateModal.goal.title}</span></p>

                            <form onSubmit={handleUpdateProgress} className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Valor Actual ({updateModal.goal.unit})</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        autoFocus
                                        className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 font-mono font-semibold"
                                        value={progressData.currentValue}
                                        onChange={e => setProgressData({ currentValue: e.target.value })}
                                    />
                                    <p className="text-[11px] text-right text-gray-400 font-mono mt-0.5">Meta requerida: {updateModal.goal.targetValue}</p>
                                </div>
                                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                    <button type="button" onClick={() => setUpdateModal({ show: false, goal: null })} className="border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer">Cancelar</button>
                                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 py-1.5 rounded transition-colors cursor-pointer">Guardar Progreso</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyGoals;

