import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { FiX, FiBookOpen, FiActivity, FiSliders, FiBarChart2, FiDatabase, FiCheckCircle } from 'react-icons/fi';

export default function MethodologyModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
                                <FiBookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold tracking-tight">Ficha Metodológica de Modelos Estadísticos y Econométricos</h3>
                                <p className="text-xs text-slate-400">Documentación científica y fundamentación matemática del Agente de Inteligencia</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content Body */}
                    <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-700 text-xs sm:text-sm leading-relaxed">

                        {/* Modelo 1: Análisis de Supervivencia de Weibull */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2.5">
                            <div className="flex items-center gap-2 text-indigo-700 font-bold text-base">
                                <FiActivity className="w-5 h-5 shrink-0" />
                                <h4>1. Modelo de Análisis de Supervivencia & Regresión Proporcional de Weibull</h4>
                            </div>
                            <p>
                                El cálculo del riesgo de rotación voluntaria (Turnover Risk) no emplea heurísticas lineales simples, sino una función de peligro acumulada h(t) basada en la distribución de Weibull paramétrica generalizada a nivel individual:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto my-2 border border-slate-800">
                                {"h(t) = (k / λ) * (t / λ)^(k-1) * exp( β_sal * ln(S_emp / S_dept) + β_abs * Σ exp(-λ_decay * Δt) + β_perf * Deficit )"}
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-2">
                                <li><strong>Parámetro de forma k = 1.25:</strong> Captura el incremento no lineal del riesgo con la antigüedad.</li>
                                <li><strong>Decaimiento Exponencial de Ausencias:</strong> Pondera la recurrencia reciente con vida media λ_decay = 0.008 (aprox. 90 días).</li>
                                <li><strong>Probabilidad de Rotación a 12 Meses:</strong> R(t) = 1 - exp(-ΔH(t)), con intervalo de confianza del 95% (CI_95%).</li>
                            </ul>
                        </div>

                        {/* Modelo 2: Simulador Monte Carlo What-If */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2.5">
                            <div className="flex items-center gap-2 text-indigo-700 font-bold text-base">
                                <FiSliders className="w-5 h-5 shrink-0" />
                                <h4>2. Simulador Estocástico Monte Carlo & Sensibilidad Paramétrica</h4>
                            </div>
                            <p>
                                Para evaluar escenarios de inversión en retención y optimización de nómina, se ejecutan N = 2,000 iteraciones estocásticas simulando perturbaciones gaussianas (transformada de Box-Muller) en las respuestas elásticas del personal:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto my-2 border border-slate-800">
                                {"ROI_sim = [ (Δ CostoRotación_evitado + Δ HorasExtras_ahorro - InversiónTotal) / InversiónTotal ] * 100"}
                            </div>
                            <p>
                                Se obtienen percentiles empíricos P_2.5 y P_97.5 para los intervalos de confianza al 95%, junto con el índice de sensibilidad de Sobol para construir el gráfico de Tornado.
                            </p>
                        </div>

                        {/* Modelo 3: ANOVA & t-Student Welch */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2.5">
                            <div className="flex items-center gap-2 text-indigo-700 font-bold text-base">
                                <FiBarChart2 className="w-5 h-5 shrink-0" />
                                <h4>3. Inferencia Estadística Interdepartamental (ANOVA de 1 Factor & Prueba t de Welch)</h4>
                            </div>
                            <p>
                                La comparación del desempeño y ausentismo interdepartamental se evalúa con Análisis de Varianza de un solo factor (One-Way ANOVA) evaluando el estadístico F:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto my-2 border border-slate-800">
                                {"F = MS_between / MS_within = [ SS_between / (k - 1) ] / [ SS_within / (N - k) ],   p ≈ 1 - Φ(Z_Wilson-Hilferty)"}
                            </div>
                            <p>
                                Para los departamentos con mayor variabilidad, se aplica la prueba t de Welch post-hoc asumiendo varianzas heterocedásticas.
                            </p>
                        </div>

                        {/* Modelo 4: Gobernanza y Anonimización */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2.5">
                            <div className="flex items-center gap-2 text-indigo-700 font-bold text-base">
                                <FiDatabase className="w-5 h-5 shrink-0" />
                                <h4>4. Gobernanza de Datos, Anonimización & Single-Pass Data Fetching</h4>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-2">
                                <li><strong>Exportación Académica:</strong> Sustituye PII (nombres, cédulas) por identificadores disociados (EMP_0001), preservando covariables científicas normalizadas en CSV/JSON.</li>
                                <li><strong>Horizonte Temporal Ampliado:</strong> Consultas Prisma recuperan hasta 12 meses históricos de ausencias, evaluaciones y nóminas en un único pase optimizado (latencia &lt; 300ms).</li>
                            </ul>
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                            <FiCheckCircle className="w-4 h-4 text-emerald-600" /> Modelos Verificados científicamente
                        </span>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                        >
                            Entendido y Cerrar
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

MethodologyModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};
