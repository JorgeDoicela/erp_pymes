import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    FiZap, FiArrowLeft, FiPlus, FiCheckCircle, FiCircle, 
    FiUsers, FiCalendar, FiActivity, FiMapPin, FiArchive,
    FiBarChart2, FiPieChart, FiMessageSquare, FiTrendingUp
} from 'react-icons/fi';
import entrepreneurshipService from '../../services/entrepreneurship.service';
import { toast } from 'react-hot-toast';

// Nuevos componentes avanzados
import AnalyticsView from './AnalyticsView';
import CapTableManager from './CapTableManager';
import DiscoveryLog from './DiscoveryLog';
import KanbanRoadmap from './KanbanRoadmap';
import PitchOptimizer from './PitchOptimizer';
import GrowthMetrics from './GrowthMetrics';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('roadmap');
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [detailUpdate, setDetailUpdate] = useState(null);
    const [newUpdate, setNewUpdate] = useState({ title: '', content: '', type: 'GENERAL' });
    const [savingUpdate, setSavingUpdate] = useState(false);

    useEffect(() => {
        fetchProject();
    }, [id]);

    const fetchProject = async () => {
        try {
            const data = await entrepreneurshipService.getProjectDetails(id);
            setProject(data);
        } catch (error) {
            toast.error('Error al cargar detalles');
            navigate('/entrepreneurship');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateMilestone = async (mId, currentStatus) => {
        const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        try {
            await entrepreneurshipService.updateMilestone(mId, { 
                status: newStatus,
                completedDate: newStatus === 'COMPLETED' ? new Date() : null
            });
            toast.success('Estado actualizado');
            fetchProject();
        } catch (error) {
            toast.error('Error al actualizar hito');
        }
    };

    const handleAddUpdate = async (e) => {
        e.preventDefault();
        setSavingUpdate(true);
        try {
            await entrepreneurshipService.addUpdate({ ...newUpdate, projectId: id });
            toast.success('Entrada registrada en la bitácora');
            setShowUpdateModal(false);
            setNewUpdate({ title: '', content: '', type: 'GENERAL' });
            fetchProject();
        } catch (error) {
            toast.error('Error al guardar la entrada');
        } finally {
            setSavingUpdate(false);
        }
    };

    const handleDeleteUpdate = async (updateId) => {
        if (!window.confirm('¿Eliminar esta entrada de la bitácora?')) return;
        try {
            await entrepreneurshipService.deleteUpdate(updateId);
            toast.success('Entrada eliminada');
            setDetailUpdate(null);
            fetchProject();
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    const tabs = [
        { id: 'roadmap', label: 'Roadmap', icon: <FiActivity /> },
        { id: 'analytics', label: 'Analíticas BI', icon: <FiBarChart2 /> },
        { id: 'growth', label: 'Crecimiento', icon: <FiTrendingUp /> },
        { id: 'pitch', label: 'Pitch Predictivo', icon: <FiZap /> },
        { id: 'captable', label: 'CapTable', icon: <FiPieChart /> },
        { id: 'validation', label: 'Validación', icon: <FiMessageSquare /> },
        { id: 'team', label: 'Equipo', icon: <FiUsers /> },
        { id: 'updates', label: 'Bitácora', icon: <FiMapPin /> }
    ];

    return (
        <div className="space-y-5">
            {/* Header Limpio ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/entrepreneurship')}
                        className="px-2.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                        <FiArrowLeft size={14} /> Volver
                    </button>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">{project.title}</h1>
                        <p className="text-xs text-gray-500 mt-0.5">{project.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded text-xs font-mono font-medium">
                        Etapa: {project.stage}
                    </span>
                    <span className="bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 rounded text-xs font-mono font-medium">
                        ${(project.valuation || 0).toLocaleString()} USD Valuación
                    </span>
                </div>
            </div>

            {/* Tabs Navigation Limpio */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs border-b border-gray-200">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 font-medium transition-colors cursor-pointer whitespace-nowrap ${
                            activeTab === tab.id 
                            ? 'border-b-2 border-blue-600 text-blue-600 font-semibold' 
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content Panels */}
            <div className="pb-8">
                {activeTab === 'roadmap' && <KanbanRoadmap />}
                {activeTab === 'analytics' && <AnalyticsView />}
                {activeTab === 'growth' && <GrowthMetrics />}
                {activeTab === 'pitch' && <PitchOptimizer />}
                {activeTab === 'captable' && <CapTableManager />}
                {activeTab === 'validation' && <DiscoveryLog />}

                {activeTab === 'team' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="bg-white p-5 rounded border border-gray-200 md:col-span-2 space-y-4">
                            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                <FiUsers className="text-blue-600" /> Equipo Fundador y Miembros
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="flex items-center gap-3 p-3 rounded bg-blue-50/50 border border-blue-200">
                                    <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                        {project.owner?.firstName?.[0]}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{project.owner?.firstName} {project.owner?.lastName}</p>
                                        <p className="text-[11px] font-mono text-blue-700">Fundador / CEO</p>
                                    </div>
                                </div>
                                {project.members?.map(member => (
                                    <div key={member.id} className="flex items-center gap-3 p-3 rounded bg-white border border-gray-200">
                                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center font-semibold text-gray-600 text-sm">
                                            {member.employee?.firstName?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{member.employee?.firstName} {member.employee?.lastName}</p>
                                            <p className="text-[11px] text-gray-500 font-mono">{member.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded border border-gray-200 flex flex-col justify-between space-y-4">
                            <div>
                                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <FiZap className="text-blue-600" /> Mentores Asignados
                                </h3>
                                <div className="space-y-2.5">
                                    {project.mentors?.length === 0 ? (
                                        <div className="bg-gray-50 p-4 rounded border border-dashed border-gray-200 text-center text-gray-400 text-xs">
                                            Sin mentores estratégicos vinculados.
                                        </div>
                                    ) : (
                                        project.mentors.map(m => (
                                            <div key={m.id} className="flex items-center gap-3 bg-gray-50 p-2.5 rounded border border-gray-200">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs">
                                                    {m.mentorName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-xs">{m.mentorName}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono">{m.specialty}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && <AnalyticsView />}
                {activeTab === 'captable' && <CapTableManager />}
                {activeTab === 'validation' && <DiscoveryLog />}

                {activeTab === 'updates' && (
                    <div className="bg-white p-4 sm:p-5 rounded border border-gray-200 text-xs space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-900">Bitácora de Hitos y Avances</h3>
                                <p className="text-[11px] text-gray-500">Historial cronológico de iteraciones de producto y negocio.</p>
                            </div>
                            <button onClick={() => setShowUpdateModal(true)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors cursor-pointer shadow-xs">
                                + Nueva Entrada
                            </button>
                        </div>
                        <div className="space-y-4">
                            {project.updates?.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    <FiArchive className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                    <p className="text-xs">No hay registros en la bitácora todavía.</p>
                                </div>
                            ) : (
                                project.updates.map((update) => (
                                    <div key={update.id} onClick={() => setDetailUpdate(update)} className="p-3 bg-gray-50 rounded border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-gray-900 text-xs">{update.title}</span>
                                            <span className="text-[11px] font-mono text-gray-500">{new Date(update.createdAt).toLocaleDateString('es-EC')}</span>
                                        </div>
                                        <p className="text-gray-600 text-xs line-clamp-2 leading-relaxed">{update.description}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Modal Detalle de Entrada */}
                {detailUpdate && (
                    <div className="app-modal-overlay" onClick={() => setDetailUpdate(null)}>
                        <div className="app-modal-content max-w-lg" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl uppercase">{detailUpdate.type}</span>
                                    <h3 className="text-xl font-bold text-slate-800 mt-2">{detailUpdate.title}</h3>
                                    <p className="text-slate-400 text-xs">{new Date(detailUpdate.createdAt).toLocaleString()}</p>
                                </div>
                                <button onClick={() => setDetailUpdate(null)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all">✕</button>
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed">{detailUpdate.content}</p>
                            <button onClick={() => handleDeleteUpdate(detailUpdate.id)} className="mt-4 w-full py-2.5 border border-red-200 text-red-600 rounded-xl font-bold text-xs hover:bg-red-50 transition-all">
                                Eliminar Entrada
                            </button>
                        </div>
                    </div>
                )}

                {/* Modal Nueva Entrada de Bitácora */}
                {showUpdateModal && (
                    <div className="app-modal-overlay">
                        <div className="app-modal-content max-w-lg">
                            <h3 className="text-xl font-bold text-slate-800 mb-4">Nueva Entrada de Bitácora</h3>
                            <form onSubmit={handleAddUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Título *</label>
                                    <input required className="app-input font-semibold" value={newUpdate.title} onChange={(e) => setNewUpdate({...newUpdate, title: e.target.value})} placeholder="Ej: Lanzamiento de versión 2.0" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Tipo</label>
                                    <select className="app-input font-semibold" value={newUpdate.type} onChange={(e) => setNewUpdate({...newUpdate, type: e.target.value})}>
                                        <option value="GENERAL">GENERAL</option>
                                        <option value="MILESTONE">HITO</option>
                                        <option value="TECH">TECNOLOGÍA</option>
                                        <option value="INVESTMENT">INVERSIÓN</option>
                                        <option value="PIVOT">PIVOTE</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Contenido *</label>
                                    <textarea required rows="4" className="app-input resize-none" value={newUpdate.content} onChange={(e) => setNewUpdate({...newUpdate, content: e.target.value})} placeholder="¿Qué pasó? ¿Qué aprendimos?"/>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowUpdateModal(false)} className="app-button-secondary flex-1">Cancelar</button>
                                    <button type="submit" disabled={savingUpdate} className="app-button-primary flex-1">{savingUpdate ? 'Guardando...' : 'Publicar'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectDetails;
