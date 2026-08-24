import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCpu, FiSend, FiCheckCircle, FiTrendingUp, FiZap, FiBriefcase } from 'react-icons/fi';
import * as intelligenceService from '../services/intelligenceService.js';

/**
 * Asistente Ejecutivo de Inteligencia Artificial para RRHH y Directores
 * Computa dictámenes y sugerencias 100% dinámicas basadas en los datos reales del tenant
 */
export default function StrategicAIAdvisor({ dashboardData }) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeAdvice, setActiveAdvice] = useState(null);

    const presets = [
        {
            id: 'retention-plan',
            label: 'Plan de Retención de Talento Crítico',
            icon: FiTrendingUp,
            question: '¿Cuál es el plan óptimo para retener al personal en alto riesgo de rotación?'
        },
        {
            id: 'payroll-efficiency',
            label: 'Optimización de Nómina y Asistencia',
            icon: FiZap,
            question: '¿Cómo optimizar el presupuesto de sobretiempos sin afectar la productividad?'
        },
        {
            id: 'board-report',
            label: 'Síntesis para Junta Directiva',
            icon: FiBriefcase,
            question: 'Sintetizar el estado organizacional y estabilidad para la Junta Directiva.'
        }
    ];

    const handleSelectPreset = async (preset) => {
        setQuery(preset.question);
        setLoading(true);
        setActiveAdvice(null);
        try {
            const res = await intelligenceService.getStrategicAdvice(preset.id, preset.question);
            if (res?.success && res?.data) {
                setActiveAdvice(res.data);
            }
        } catch (err) {
            console.error('Error al obtener asesoría estratégica:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCustomSubmit = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        setActiveAdvice(null);

        try {
            const res = await intelligenceService.getStrategicAdvice('custom', query);
            if (res?.success && res?.data) {
                setActiveAdvice(res.data);
            }
        } catch (err) {
            console.error('Error al procesar consulta estratégica:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded border border-gray-200 p-5 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
                <div className="flex items-center gap-2.5">
                    <FiCpu className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">Asistente de Decisiones y Análisis Organizacional</h3>
                        <p className="text-xs text-gray-500">Diagnósticos ejecutivos e inferencias basadas en datos de plantilla y costos.</p>
                    </div>
                </div>
                <div>
                    <span className="px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 text-[10px] font-mono font-medium rounded">
                        Motor Activo
                    </span>
                </div>
            </div>

            {/* Presets Rápidos */}
            <div className="space-y-2">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Consultas Frecuentes:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {presets.map((p) => {
                        const Icon = p.icon;
                        return (
                            <button
                                key={p.id}
                                onClick={() => handleSelectPreset(p)}
                                className="flex items-center gap-2 p-2.5 rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 text-left transition-colors cursor-pointer group"
                            >
                                <Icon className="w-4 h-4 text-gray-500 group-hover:text-blue-600 shrink-0" />
                                <span className="text-xs text-gray-700 group-hover:text-gray-900 leading-snug">
                                    {p.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Input Form Bar */}
            <form onSubmit={handleCustomSubmit} className="flex gap-2 pt-1">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Escriba una consulta estratégica (ej: ¿Cómo optimizar costos de nómina este trimestre?)..."
                    className="flex-1 px-3 py-1.5 rounded bg-white border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                    <FiSend size={12} /> Consultar
                </button>
            </form>

            {/* Loading Indicator */}
            {loading && (
                <div className="py-4 text-center text-xs text-gray-500">
                    Procesando registros de nómina, asistencia y estructura...
                </div>
            )}

            {/* Active Advice Box */}
            <AnimatePresence>
                {activeAdvice && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="bg-gray-50 rounded p-4 border border-gray-200 space-y-3 text-xs"
                    >
                        <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                            <FiCheckCircle className="text-green-600 shrink-0" size={14} /> {activeAdvice.title}
                        </h4>

                        <p className="text-xs text-gray-700 leading-relaxed bg-white p-3 rounded border border-gray-200">
                            {activeAdvice.executiveSummary}
                        </p>

                        {/* Plan de Acción */}
                        <div className="space-y-2">
                            <p className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Plan de Acción Recomendado:</p>
                            <div className="space-y-1.5">
                                {activeAdvice.actions.map((act, i) => (
                                    <div key={i} className="p-2.5 bg-white rounded border border-gray-200 space-y-0.5">
                                        <p className="text-xs font-semibold text-blue-700">{act.step}</p>
                                        <p className="text-xs text-gray-600 leading-normal">{act.detail}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Impacto & ROI */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-gray-200">
                            <div className="bg-green-50/60 border border-green-200 p-2.5 rounded">
                                <span className="text-[10px] text-green-800 font-semibold uppercase tracking-wider">Impacto Esperado:</span>
                                <p className="text-xs text-green-900 mt-0.5">{activeAdvice.impact}</p>
                            </div>
                            <div className="bg-blue-50/60 border border-blue-200 p-2.5 rounded">
                                <span className="text-[10px] text-blue-800 font-semibold uppercase tracking-wider">Retorno Estimado:</span>
                                <p className="text-xs text-blue-900 mt-0.5">{activeAdvice.financialROI}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
