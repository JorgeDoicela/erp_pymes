import React, { useState, useEffect } from 'react';
import { FiCompass, FiPlus, FiBox, FiTrendingUp, FiCheckCircle, FiClock } from 'react-icons/fi';
import entrepreneurshipService from '../../services/entrepreneurship.service';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        ideation: 0,
        validation: 0,
        mvp: 0,
        scaling: 0
    });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const data = await entrepreneurshipService.getProjects();
            setProjects(data);
            
            // Calculate stats
            const newStats = data.reduce((acc, p) => {
                acc.total++;
                acc[p.stage.toLowerCase()] = (acc[p.stage.toLowerCase()] || 0) + 1;
                return acc;
            }, { total: 0, ideation: 0, validation: 0, mvp: 0, scaling: 0 });
            setStats(newStats);
        } catch (error) {
            toast.error('Error al cargar proyectos');
        } finally {
            setLoading(false);
        }
    };

    const stageColors = {
        IDEATION: 'bg-blue-100 text-blue-700',
        VALIDATION: 'bg-purple-100 text-purple-700',
        MVP: 'bg-amber-100 text-amber-700',
        SCALING: 'bg-emerald-100 text-emerald-700'
    };

    const stageNames = {
        IDEATION: 'Ideación',
        VALIDATION: 'Validación',
        MVP: 'MVP / Prototipo',
        SCALING: 'Escalamiento'
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <FiCompass className="text-slate-700" /> Incubadora de Startups
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Ecosistema de innovación e intraemprendimiento profesional.</p>
                </div>
                <Link 
                    to="create" 
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all text-xs font-semibold shadow-xs"
                >
                    <FiPlus /> Lanzar Proyecto
                </Link>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: 'Total Proyectos', val: stats.total, icon: <FiBox /> },
                    { label: 'Ideación', val: stats.ideation, icon: <FiCompass /> },
                    { label: 'Validación', val: stats.validation, icon: <FiCheckCircle /> },
                    { label: 'MVP', val: stats.mvp, icon: <FiTrendingUp /> },
                    { label: 'Escalamiento', val: stats.scaling, icon: <FiTrendingUp /> },
                ].map((s, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center hover:border-slate-300 transition-all">
                        <span className="text-xl mb-2 text-slate-600">{s.icon}</span>
                        <span className="text-2xl font-bold text-slate-900">{s.val}</span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{s.label}</span>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : projects.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <FiCompass className="text-3xl text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700">No hay proyectos activos</h3>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                        ¡Sé el primero en innovar! Sube tu idea y empieza el proceso de incubación hoy mismo.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <Link 
                            key={project.id} 
                            to={`${project.id}`}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all p-5 flex flex-col h-full group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${stageColors[project.stage]}`}>
                                    {stageNames[project.stage]}
                                </span>
                                <span className="text-slate-300 group-hover:text-indigo-500 transition-colors">
                                    <FiTrendingUp />
                                </span>
                            </div>
                            
                            <h3 className="text-lg font-bold text-slate-800 mb-2 truncate group-hover:text-indigo-600">
                                {project.title}
                            </h3>
                            <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-grow">
                                {project.description}
                            </p>
                            
                            <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200">
                                        {project.owner?.firstName?.[0] || 'O'}
                                    </div>
                                    <span className="font-medium">{project.owner?.firstName} {project.owner?.lastName}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <FiClock /> {new Date(project.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
