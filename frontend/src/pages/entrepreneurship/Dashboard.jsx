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
        IDEATION: 'bg-blue-50 text-blue-800 border border-blue-200',
        VALIDATION: 'bg-amber-50 text-amber-800 border border-amber-200',
        MVP: 'bg-green-50 text-green-800 border border-green-200',
        SCALING: 'bg-green-50 text-green-800 border border-green-200'
    };

    const stageNames = {
        IDEATION: 'Ideación',
        VALIDATION: 'Validación',
        MVP: 'MVP / Prototipo',
        SCALING: 'Escalamiento'
    };

    return (
        <div className="space-y-5">
            {/* Header Limpio ERP */}
            <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Emprendimiento · Incubadora</p>
                    <h1 className="text-xl font-semibold text-gray-900">Incubadora de Startups</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Ecosistema de innovación e intraemprendimiento.</p>
                </div>
                <Link 
                    to="create" 
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors inline-flex items-center gap-1.5 shrink-0"
                >
                    <FiPlus size={14} /> Lanzar Proyecto
                </Link>
            </div>

            {/* Resumen de Estados ERP */}
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50/50 border-b border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Métricas de Incubación</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-gray-100 text-xs">
                    <div className="p-3.5 text-center">
                        <p className="text-gray-500 mb-0.5">Total Proyectos</p>
                        <p className="text-base font-semibold text-gray-900 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{stats.total}</p>
                    </div>
                    <div className="p-3.5 text-center">
                        <p className="text-gray-500 mb-0.5">Ideación</p>
                        <p className="text-base font-semibold text-gray-900 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{stats.ideation}</p>
                    </div>
                    <div className="p-3.5 text-center">
                        <p className="text-gray-500 mb-0.5">Validación</p>
                        <p className="text-base font-semibold text-gray-900 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{stats.validation}</p>
                    </div>
                    <div className="p-3.5 text-center">
                        <p className="text-gray-500 mb-0.5">MVP</p>
                        <p className="text-base font-semibold text-gray-900 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{stats.mvp}</p>
                    </div>
                    <div className="p-3.5 text-center">
                        <p className="text-gray-500 mb-0.5">Escalamiento</p>
                        <p className="text-base font-semibold text-gray-900 font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>{stats.scaling}</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center text-gray-400 text-xs">Cargando proyectos de incubación...</div>
            ) : projects.length === 0 ? (
                <div className="p-12 text-center bg-white border border-gray-200 rounded">
                    <p className="text-sm font-medium text-gray-700">Sin proyectos activos</p>
                    <p className="text-xs text-gray-400 mt-1">Registra tu idea para comenzar el proceso de incubación.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {projects.map((project) => (
                        <Link 
                            key={project.id} 
                            to={`${project.id}`}
                            className="bg-white rounded border border-gray-200 hover:border-gray-300 transition-colors p-4 flex flex-col h-full group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${stageColors[project.stage]}`}>
                                    {stageNames[project.stage]}
                                </span>
                            </div>
                            
                            <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate group-hover:text-blue-600 transition-colors">
                                {project.title}
                            </h3>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-grow">
                                {project.description}
                            </p>
                            
                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                                <span className="font-medium text-gray-600">{project.owner?.firstName} {project.owner?.lastName}</span>
                                <span className="font-mono">{new Date(project.createdAt).toLocaleDateString()}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
