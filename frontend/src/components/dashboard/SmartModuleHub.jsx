import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FiSearch } from 'react-icons/fi';
import {
    getFrequentModules,
    getRecentModules,
    recordModuleVisit
} from '../../utils/moduleTracker';

/**
 * SmartModuleHub — Consola de Navegación Inteligente ERP
 * Diseñada según el estándar estilos-erp-pymes (Holded / Xero / Linear):
 * - Tipografía limpia y estructurada
 * - Cero iconos decorativos innecesarios
 * - Tabs con borde inferior activo 2px #111827
 * - Cifras y métricas en font-mono tabular-nums
 */
export default function SmartModuleHub({ user, sections = [] }) {
    const [activeTab, setActiveTab] = useState('smart'); // 'smart' | 'all'
    const [searchQuery, setSearchQuery] = useState('');

    // Aplanar todos los módulos válidos
    const allModules = useMemo(() => {
        const list = [];
        sections.forEach(sec => {
            sec.modules?.forEach(mod => {
                if (mod.path !== '/admin' && mod.path !== '/empleado' && mod.path !== '/superadmin/dashboard') {
                    list.push({
                        title: mod.title,
                        path: mod.path,
                        category: sec.title
                    });
                }
            });
        });
        return list;
    }, [sections]);

    // Módulos más frecuentes / vistos
    const frequentModules = useMemo(() => {
        return getFrequentModules(user, allModules, 6);
    }, [user, allModules]);

    // Módulos recientes
    const recentModules = useMemo(() => {
        return getRecentModules(user, allModules, 6);
    }, [user, allModules]);

    // Búsqueda en tiempo real
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.toLowerCase().trim();
        return allModules.filter(m =>
            m.title.toLowerCase().includes(query) ||
            m.category.toLowerCase().includes(query) ||
            m.path.toLowerCase().includes(query)
        );
    }, [searchQuery, allModules]);

    const handleModuleClick = (mod) => {
        recordModuleVisit(user, mod);
    };

    return (
        <div className="space-y-4">
            {/* Cabecera con Buscador y Tabs de Navegación */}
            <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Tabs con Borde Inferior Activo 2px #111827 */}
                    <div className="flex items-center gap-6 border-b border-gray-200 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => { setActiveTab('smart'); setSearchQuery(''); }}
                            className={`pb-2 text-xs font-medium transition-colors cursor-pointer ${
                                activeTab === 'smart' && !searchQuery
                                    ? 'text-gray-900 border-b-2 border-gray-900 font-semibold'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            Frecuentes & Recientes
                        </button>
                        <button
                            type="button"
                            onClick={() => { setActiveTab('all'); setSearchQuery(''); }}
                            className={`pb-2 text-xs font-medium transition-colors cursor-pointer ${
                                activeTab === 'all' && !searchQuery
                                    ? 'text-gray-900 border-b-2 border-gray-900 font-semibold'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            Catálogo Completo <span className="font-mono tabular-nums text-gray-400">({allModules.length})</span>
                        </button>
                    </div>

                    {/* Buscador Funcional */}
                    <div className="relative w-full sm:w-64">
                        <FiSearch className="absolute left-3 top-2 text-gray-400" size={13} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar función o reporte..."
                            className="w-full pl-8 pr-7 py-1.5 bg-white border border-gray-200 rounded text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1.5 text-gray-400 hover:text-gray-700 text-xs font-medium cursor-pointer"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Vista de Búsqueda Activa */}
            {searchQuery.trim() !== '' ? (
                <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                            Resultados para "{searchQuery}"
                        </span>
                        <span className="text-[11px] font-mono text-gray-400 tabular-nums">
                            {searchResults.length} {searchResults.length === 1 ? 'coincidencia' : 'coincidencias'}
                        </span>
                    </div>

                    {searchResults.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {searchResults.map((mod, idx) => (
                                <Link
                                    key={idx}
                                    to={mod.path}
                                    onClick={() => handleModuleClick(mod)}
                                    className="py-2.5 px-2 flex items-center justify-between hover:bg-gray-50/80 transition-colors group cursor-pointer"
                                >
                                    <div>
                                        <p className="text-xs font-medium text-gray-900 group-hover:text-blue-600 leading-tight">
                                            {mod.title}
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">{mod.category}</p>
                                    </div>
                                    <span className="text-xs text-gray-400 group-hover:text-gray-700 font-mono">
                                        Abrir →
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-xs text-gray-500">
                            <p>No se encontraron módulos con el término especificado.</p>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-blue-600 hover:underline mt-1 font-medium"
                            >
                                Limpiar búsqueda
                            </button>
                        </div>
                    )}
                </div>
            ) : activeTab === 'smart' ? (
                /* Modo Inteligente: Accesos Frecuentes y Últimos Visitados */
                <div className="space-y-4">
                    {/* Frecuentes / Más Vistos */}
                    <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                Accesos Más Frecuentes
                            </h3>
                            <span className="text-[10px] text-gray-400 font-mono">SELECCIÓN INTELIGENTE</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {frequentModules.map((mod, idx) => (
                                <Link
                                    key={idx}
                                    to={mod.path}
                                    onClick={() => handleModuleClick(mod)}
                                    className="p-3 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded flex flex-col justify-between group transition-colors cursor-pointer min-h-[76px]"
                                >
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider truncate">
                                            {mod.category}
                                        </span>
                                        {mod.visitCount > 0 ? (
                                            <span className="text-[10px] font-mono tabular-nums text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                                                {mod.visitCount} {mod.visitCount === 1 ? 'visita' : 'visitas'}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-mono text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                                                Destacado
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 leading-snug">
                                        {mod.title}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Últimos Visitados */}
                    {recentModules.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    Historial Reciente
                                </h3>
                                <span className="text-[10px] text-gray-400 font-mono">ÚLTIMOS ACCESOS</span>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {recentModules.map((mod, idx) => (
                                    <Link
                                        key={idx}
                                        to={mod.path}
                                        onClick={() => handleModuleClick(mod)}
                                        className="py-2 px-2 flex items-center justify-between hover:bg-gray-50/80 transition-colors group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-medium text-gray-800 group-hover:text-blue-600">
                                                {mod.title}
                                            </span>
                                            <span className="text-[10px] text-gray-400">· {mod.category}</span>
                                        </div>
                                        <span className="text-[10px] font-mono tabular-nums text-gray-400">
                                            {mod.relativeTime}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Catálogo Completo por Secciones */
                <div className="space-y-4">
                    {sections.map((section, sIdx) => {
                        const filteredModules = section.modules.filter(
                            m => m.path !== '/admin' && m.path !== '/empleado' && m.path !== '/superadmin/dashboard'
                        );
                        if (filteredModules.length === 0) return null;
                        return (
                            <div key={sIdx} className="bg-white border border-gray-200 rounded p-4">
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                                    <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                        {section.title}
                                    </h3>
                                    <span className="text-[10px] font-mono text-gray-400 tabular-nums font-normal">
                                        {filteredModules.length} accesos
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                    {filteredModules.map((mod, idx) => (
                                        <Link
                                            key={idx}
                                            to={mod.path}
                                            onClick={() => handleModuleClick({ title: mod.title, path: mod.path, category: section.title })}
                                            className="p-2.5 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded transition-colors group cursor-pointer min-h-[64px] flex flex-col justify-between"
                                        >
                                            <span className="text-xs font-medium text-gray-800 group-hover:text-blue-600 leading-snug">
                                                {mod.title}
                                            </span>
                                            <span className="text-[10px] font-mono text-gray-400 mt-1">
                                                Abrir →
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

SmartModuleHub.propTypes = {
    user: PropTypes.object,
    sections: PropTypes.array
};
