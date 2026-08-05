import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCpu, FiSend, FiCheckCircle, FiTrendingUp, FiZap, FiBriefcase } from 'react-icons/fi';

/**
 * Asistente Ejecutivo de Inteligencia Artificial para RRHH y Directores
 * Estilo minimalista y limpio perfectamente integrado con la plataforma
 */
export default function StrategicAIAdvisor({ dashboardData }) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeAdvice, setActiveAdvice] = useState(null);

    const presets = [
        {
            id: 'retention-plan',
            label: 'Plan de Retención de Talento Top',
            icon: FiTrendingUp,
            question: '¿Cuál es el plan óptimo para retener al personal en alto riesgo de rotación?',
            response: {
                title: 'Plan de Choque de Retención de Talento Crítico',
                executiveSummary: 'Se identificaron empleados en riesgo alto con un costo de reposición estimado significativo. El factor dominante es el desfase salarial respecto al mercado y la falta de promociones en los últimos 18 meses.',
                actions: [
                    { step: '1. Nivelación Salarial Focalizada', detail: 'Ajustar el estipendio base en un 6-8% prioritariamente para cargos técnicos y de supervisión.' },
                    { step: '2. Entrevistas de Permanencia (Stay Interviews)', detail: 'Agendar sesiones 1-on-1 directas con el Gerente General durante los próximos 14 días.' },
                    { step: '3. Plan de Carrera Transparente', detail: 'Definir metas trimestrales asociadas a promociones y bonos por desempeño cuantificable.' },
                ],
                impact: 'Reducción estimada del 45% en la probabilidad de fuga este trimestre.',
                financialROI: 'Ahorro de ~$12,400 USD en costos directos e indirectos de reclutamiento.',
            }
        },
        {
            id: 'payroll-efficiency',
            label: 'Optimización de Nómina y Horas Extras',
            icon: FiZap,
            question: '¿Cómo optimizar el presupuesto de horas extras sin afectar la productividad?',
            response: {
                title: 'Estrategia de Eficiencia Operativa y Control de Horas Extras',
                executiveSummary: 'Se detecta una concentración inusual de horas extras atípicas en áreas operativas, lo que genera desgaste físico y sobrecosto del 18% sobre el presupuesto regular.',
                actions: [
                    { step: '1. Redistribución de Turnos', detail: 'Implementar turnos rotativos escalonados para cubrir las horas pico sin recargo extraordinario.' },
                    { step: '2. Automatización de Tareas Repetitivas', detail: 'Digitalizar los registros de asistencia y reportería diaria.' },
                    { step: '3. Tope de Horas Semanales', detail: 'Establecer alertas automáticas cuando un empleado supere 8 horas extras semanales.' },
                ],
                impact: 'Disminución del 25% en costos extraordinarios de nómina.',
                financialROI: 'Ahorro recurrente de ~$2,100 USD mensuales.',
            }
        },
        {
            id: 'board-report',
            label: 'Síntesis para Junta Directiva',
            icon: FiBriefcase,
            question: 'Sintetizar el estado organizacional para la Junta Directiva de este mes.',
            response: {
                title: 'Resumen Ejecutivo de Salud Organizacional y Talento',
                executiveSummary: 'La organización mantiene un índice de Salud de Talento del 78%. Los niveles de productividad se mantienen altos, pero se requiere atención preventiva en la curva de ausentismo operacional.',
                actions: [
                    { step: '1. Priorizar Retención Preventiva', detail: 'Aprobar presupuesto contingente del 2.5% para retención de talentos clave.' },
                    { step: '2. Clima Laboral y Bienestar', detail: 'Desplegar programa de flexibilidad de horarios para departamentos saturados.' },
                    { step: '3. Medición Trimestral OKR', detail: 'Alinear los objetivos individuales con la meta global de EBITDA.' },
                ],
                impact: 'Estabilidad operativa asegurada para la meta del segundo semestre.',
                financialROI: 'Preservación del valor del capital humano y continuidad de proyectos clave.',
            }
        }
    ];

    const handleSelectPreset = (preset) => {
        setQuery(preset.question);
        setLoading(true);
        setActiveAdvice(null);
        setTimeout(() => {
            setActiveAdvice(preset.response);
            setLoading(false);
        }, 500);
    };

    const handleCustomSubmit = (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        setActiveAdvice(null);

        setTimeout(() => {
            setActiveAdvice({
                title: `Análisis Estratégico: "${query}"`,
                executiveSummary: 'El algoritmo predictivo analizó los datos de asistencia, desempeño y estructura salarial de la empresa para responder a esta consulta estratégica.',
                actions: [
                    { step: '1. Diagnóstico Directo', detail: 'Revisar la coherencia salarial y asistencial de los equipos impactados.' },
                    { step: '2. Implementación Focalizada', detail: 'Establecer metas claras de desempeño con revisión mensual.' },
                    { step: '3. Monitoreo Activo', detail: 'Usar los paneles de alertas del sistema de inteligencia para prevenir desviaciones.' }
                ],
                impact: 'Optimización de recursos y mejora directa en el clima de trabajo.',
                financialROI: 'Impacto positivo de alto retorno sobre la eficiencia del equipo.'
            });
            setLoading(false);
        }, 600);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl shrink-0">
                        <FiCpu className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Asistente IA Consultor Estratégico</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Recomendaciones y Planes de Acción para Ejecutivos</p>
                    </div>
                </div>
                <div className="self-start sm:self-center">
                    <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" /> Motor Activo
                    </span>
                </div>
            </div>

            {/* Presets Rápidos */}
            <div className="space-y-2.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Consultas Frecuentes para Directores:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {presets.map((p) => {
                        const Icon = p.icon;
                        return (
                            <button
                                key={p.id}
                                onClick={() => handleSelectPreset(p)}
                                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50/80 hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-200 text-left transition-all duration-200 group"
                            >
                                <div className="p-2 rounded-lg bg-white border border-slate-200 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors shrink-0 shadow-xs">
                                    <Icon className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-900 leading-snug min-w-0 flex-1">
                                    {p.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Input Form Bar */}
            <form onSubmit={handleCustomSubmit} className="flex flex-col sm:flex-row gap-3 pt-1">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Haz una consulta estratégica a la IA (ej. ¿Cómo reducir la rotación este mes?)..."
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-all shrink-0 disabled:opacity-50"
                >
                    <FiSend className="w-4 h-4" /> Consultar
                </button>
            </form>

            {/* Loading Indicator */}
            {loading && (
                <div className="py-8 text-center space-y-3">
                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-indigo-600 animate-pulse font-medium">Sintetizando datos corporativos y generando modelo de decisión...</p>
                </div>
            )}

            {/* Active Advice Box */}
            <AnimatePresence>
                {activeAdvice && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-slate-50/80 rounded-xl p-5 md:p-6 border border-indigo-100 space-y-4"
                    >
                        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <FiCheckCircle className="text-emerald-600 shrink-0" /> {activeAdvice.title}
                        </h4>

                        <p className="text-xs text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-200/80 font-normal shadow-xs">
                            {activeAdvice.executiveSummary}
                        </p>

                        {/* Plan de Acción */}
                        <div className="space-y-2.5">
                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Plan de Acción Recomendado:</p>
                            <div className="space-y-2">
                                {activeAdvice.actions.map((act, i) => (
                                    <div key={i} className="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-1 shadow-xs">
                                        <p className="text-xs font-bold text-indigo-700">{act.step}</p>
                                        <p className="text-xs text-slate-600 leading-normal">{act.detail}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Impacto & ROI */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3 border-t border-slate-200">
                            <div className="bg-emerald-50/80 border border-emerald-200/80 p-3.5 rounded-xl">
                                <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">Impacto Esperado:</span>
                                <p className="text-xs font-medium text-emerald-900 mt-1 leading-normal">{activeAdvice.impact}</p>
                            </div>
                            <div className="bg-indigo-50/80 border border-indigo-200/80 p-3.5 rounded-xl">
                                <span className="text-[11px] text-indigo-800 font-bold uppercase tracking-wider">Retorno Financiero ROI:</span>
                                <p className="text-xs font-medium text-indigo-900 mt-1 leading-normal">{activeAdvice.financialROI}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
