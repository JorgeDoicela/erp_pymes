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
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
            {/* Navigation Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                <button 
                    onClick={() => navigate('/entrepreneurship')}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-all font-bold text-sm"
                >
                    <FiArrowLeft /> Dashboard
                </button>
                <div className="flex gap-2">
                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest leading-none flex items-center">
                        {project.stage}
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest leading-none flex items-center">
                        Tier 4 Validado
                    </span>
                </div>
            </div>

            {/* Project Cover Info */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                    <FiZap size={180} className="text-indigo-500" />
                </div>
                
                <div className="relative z-10 max-w-3xl space-y-6">
                    <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-indigo-100 mb-6">
                        {project.title.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">{project.title}</h1>
                        <p className="text-slate-500 text-lg md:text-xl leading-relaxed font-medium">{project.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-4 pt-4">
                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                            <FiTrendingUp className="text-indigo-500" />
                            <span className="text-slate-800 font-bold text-sm select-none">${(project.valuation || 0).toLocaleString()} <span className="text-[10px] text-slate-400 font-medium">Valuación</span></span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                            <FiUsers className="text-emerald-500" />
                            <span className="text-slate-800 font-bold text-sm select-none">{project.members?.length + 1} <span className="text-[10px] text-slate-400 font-medium">Miembros</span></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md py-4 rounded-3xl px-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap shadow-sm ${
                            activeTab === tab.id 
                            ? 'bg-indigo-600 text-white translate-y-[-2px]' 
                            : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content Panels */}
            <div className="animate-fadeIn pb-12">
                {activeTab === 'roadmap' && <KanbanRoadmap />}
                {activeTab === 'analytics' && <AnalyticsView />}
                {activeTab === 'growth' && <GrowthMetrics />}
                {activeTab === 'pitch' && <PitchOptimizer />}
                {activeTab === 'captable' && <CapTableManager />}
                {activeTab === 'validation' && <DiscoveryLog />}

                {activeTab === 'team' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm col-span-1 md:col-span-2">
                            <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500"><FiUsers /></div> Fundadores y Miembros
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-4 p-5 rounded-3xl bg-indigo-50 border border-indigo-100 group">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
                                        {project.owner?.firstName?.[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-lg leading-tight">{project.owner?.firstName} {project.owner?.lastName}</p>
                                        <p className="text-[10px] uppercase font-black text-indigo-600 tracking-widest mt-1">Fundador / CEO</p>
                                    </div>
                                </div>
                                {project.members?.map(member => (
                                    <div key={member.id} className="flex items-center gap-4 p-5 rounded-3xl bg-white border border-slate-100 hover:border-slate-200 transition-colors">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xl">
                                            {member.employee?.firstName?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 leading-tight">{member.employee?.firstName} {member.employee?.lastName}</p>
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">{member.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-slate-900">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><FiZap /></div> Mentores Asignados
                            </h3>
                            <div className="flex-1 space-y-4">
                                {project.mentors?.length === 0 ? (
                                    <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                                        Aún no hay mentores estratégicos vinculados.
                                    </div>
                                ) : (
                                    project.mentors.map(m => (
                                        <div key={m.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 hover:bg-slate-100/80 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                                                {m.mentorName[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{m.mentorName}</p>
                                                <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">{m.specialty}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <button className="app-button-primary w-full mt-6">
                                Emparejar Mentor AI
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && <AnalyticsView />}
                {activeTab === 'captable' && <CapTableManager />}
                {activeTab === 'validation' && <DiscoveryLog />}

                {activeTab === 'updates' && (
                    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold text-slate-800">Bitácora de Innovación</h3>
                            <button onClick={() => setShowUpdateModal(true)} className="app-button-primary">
                                Nueva Entrada
                            </button>
                        </div>
                        <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100">
                            {project.updates?.length === 0 ? (
                                <div className="text-center py-16">
                                    <FiArchive className="text-slate-200 text-6xl mx-auto mb-4" />
                                    <p className="text-slate-400 font-medium text-xs">No hay registros en la bitácora todavía.</p>
                                </div>
                            ) : (
                                project.updates.map((update) => (
                                    <div key={update.id} onClick={() => setDetailUpdate(update)} className="relative pl-12 group cursor-pointer">
                                        <div className="absolute left-0 top-1 w-10 h-10 rounded-xl bg-white border-2 border-indigo-500 z-10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                            <FiActivity size={14} />
                                        </div>
                                        <div className="space-y-2 bg-slate-50/60 p-4 rounded-xl hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-200">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase">{update.type}</span>
                                                <span className="text-[11px] font-semibold text-slate-400">{new Date(update.createdAt).toLocaleString()}</span>
                                            </div>
                                            <h4 className="text-lg font-bold text-slate-800 tracking-tight">{update.title}</h4>
                                            <p className="text-slate-500 text-xs leading-relaxed max-w-4xl line-clamp-2">{update.content}</p>
                                        </div>
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
