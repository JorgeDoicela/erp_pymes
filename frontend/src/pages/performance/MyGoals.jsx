import { useEffect, useState } from 'react';
import { getMyGoals, createGoal, updateGoalProgress, deleteGoal } from '../../services/goals.service';
import { FiPlus, FiTarget, FiEdit2, FiTrash2, FiSave, FiX, FiCheckCircle, FiClock } from 'react-icons/fi';
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

    const getPriorityColor = (p) => {
        switch (p) {
            case 'HIGH': return 'text-red-400 bg-red-900/30 border-red-500/50';
            case 'MEDIUM': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500/50';
            case 'LOW': return 'text-green-400 bg-green-900/30 border-green-500/50';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent mb-2">
                            Mis Objetivos SMART
                        </h1>
                        <p className="text-gray-400">Define, sigue y alcanza tus metas profesionales.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl font-bold flex items-center shadow-lg transition-transform hover:scale-105"
                    >
                        <FiPlus className="mr-2" /> Nuevo Objetivo
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map(goal => (
                        <div key={goal.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-500 transition-all shadow-lg relative group">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold border ${getPriorityColor(goal.priority)}`}>
                                    {goal.priority === 'HIGH' ? 'ALTA' : goal.priority === 'MEDIUM' ? 'MEDIA' : 'BAJA'}
                                </span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleDelete(goal.id)} className="text-gray-500 hover:text-white"><FiTrash2 /></button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">{goal.title}</h3>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{goal.description}</p>

                            <div className="mb-4">
                                <div className="flex justify-between text-sm text-gray-300 mb-1">
                                    <span>Progreso</span>
                                    <span className="font-bold">{goal.progress.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${goal.progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                        style={{ width: `${goal.progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-sm text-gray-400 mb-6">
                                <div>
                                    <p className="text-xs uppercase tracking-wider">Meta</p>
                                    <p className="font-semibold text-white">{goal.targetValue} {goal.unit}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs uppercase tracking-wider">Actual</p>
                                    <p className="font-semibold text-white">{goal.currentValue} {goal.unit}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center border-t border-gray-700 pt-4 mt-2">
                                <span className={`text-xs flex items-center ${new Date(goal.deadline) < new Date() && goal.progress < 100 ? 'text-red-400' : 'text-gray-500'}`}>
                                    <FiClock className="mr-1 text-gray-400" /> vence: {new Date(goal.deadline).toLocaleDateString()}
                                </span>

                                <button
                                    onClick={() => {
                                        setUpdateModal({ show: true, goal });
                                        setProgressData({ currentValue: goal.currentValue });
                                    }}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Actualizar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Create Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-gray-800 rounded-2xl w-full max-w-lg border border-gray-700 shadow-2xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Nuevo Objetivo SMART</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><FiX size={24} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Título del Objetivo</label>
                                    <input required type="text" className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white"
                                        value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Ej: Aumentar ventas Q3" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Descripción</label>
                                    <textarea className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white h-20"
                                        value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Detalles específicos..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Métrica (KPI)</label>
                                        <input required type="text" className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white"
                                            value={formData.metric} onChange={e => setFormData({ ...formData, metric: e.target.value })} placeholder="Ej: Ventas Nuevas" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Unidad</label>
                                        <input required type="text" className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white"
                                            value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} placeholder="Ej: %, USD, Clientes" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Valor Meta</label>
                                        <input required type="number" step="0.01" className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white"
                                            value={formData.targetValue} onChange={e => setFormData({ ...formData, targetValue: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Fecha Límite</label>
                                        <input required type="date" className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white"
                                            value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Prioridad</label>
                                    <select className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white"
                                        value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                        <option value="LOW">Baja</option>
                                        <option value="MEDIUM">Media</option>
                                        <option value="HIGH">Alta</option>
                                    </select>
                                </div>
                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl mt-4">Crear Objetivo</button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Update Modal */}
                {updateModal.show && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-gray-800 rounded-2xl w-full max-w-sm border border-gray-700 shadow-2xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Actualizar Progreso</h2>
                            <p className="text-gray-400 text-sm mb-4">Actualiza el valor actual para: <span className="text-white font-medium">{updateModal.goal.title}</span></p>

                            <form onSubmit={handleUpdateProgress}>
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-400 mb-1">Valor Actual ({updateModal.goal.unit})</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        autoFocus
                                        className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white text-lg font-bold"
                                        value={progressData.currentValue}
                                        onChange={e => setProgressData({ currentValue: e.target.value })}
                                    />
                                    <p className="text-xs text-right text-gray-500 mt-1">Meta: {updateModal.goal.targetValue}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setUpdateModal({ show: false, goal: null })} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg">Cancelar</button>
                                    <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg">Guardar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyGoals;
