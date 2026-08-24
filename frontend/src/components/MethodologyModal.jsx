import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { InlineMath, BlockMath } from 'react-katex';
import { FiX, FiBookOpen, FiActivity, FiSliders, FiBarChart2, FiDatabase, FiCheckCircle } from 'react-icons/fi';
import 'katex/dist/katex.min.css';

// ─── Fórmulas LaTeX ───────────────────────────────────────────────────────────
const FORMULAS = {
    weibull:
        'h(t) = \\dfrac{k}{\\lambda}\\left(\\dfrac{t}{\\lambda}\\right)^{k-1} \\cdot \\exp\\!\\left(\\beta_{sal}\\,\\ln\\frac{S_{emp}}{S_{dept}} + \\beta_{abs}\\sum e^{-\\lambda_{decay}\\,\\Delta t} + \\beta_{perf}\\cdot\\text{Deficit}\\right)',

    survival:
        'R(t) = 1 - e^{-\\Delta H(t)}, \\quad CI_{95\\%} = R(t) \\pm 1.96\\,\\hat{\\sigma}_{R}',

    montecarlo:
        'ROI_{sim} = \\frac{\\Delta C_{rotación} + \\Delta H_{ahorro} - I_{total}}{I_{total}} \\times 100',

    anova:
        'F = \\frac{MS_{between}}{MS_{within}} = \\frac{SS_{between}\\,/\\,(k-1)}{SS_{within}\\,/\\,(N-k)}',

    pvalue:
        'p \\approx 1 - \\Phi\\!\\left(Z_{Wilson\\text{-}Hilferty}\\right)',
};

// ─── Componente de bloque de fórmula ─────────────────────────────────────────
function FormulaBlock({ latex, label }) {
    return (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 overflow-x-auto">
            {label && (
                <div className="px-4 pt-3 pb-1 text-[10px] font-semibold text-indigo-400 uppercase tracking-widest">
                    {label}
                </div>
            )}
            <div className="px-4 py-3 flex justify-center">
                <BlockMath math={latex} />
            </div>
        </div>
    );
}

FormulaBlock.propTypes = {
    latex: PropTypes.string.isRequired,
    label: PropTypes.string,
};

// ─── Modal principal ──────────────────────────────────────────────────────────
export default function MethodologyModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="bg-white rounded shadow-xl border border-gray-200 w-full max-w-3xl overflow-hidden my-8"
                >
                    {/* ── Header ── */}
                    <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-gray-200">
                        <div className="flex items-center gap-2.5">
                            <FiBookOpen className="w-5 h-5 text-blue-600" />
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">
                                    Ficha Metodológica — Modelos Estadísticos y Econométricos
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Fundamentación analítica de los algoritmos de predicción y riesgo
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors cursor-pointer"
                        >
                            <FiX size={16} />
                        </button>
                    </div>

                    {/* ── Cuerpo ── */}
                    <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto bg-white text-xs">

                        {/* Modelo 1 — Weibull */}
                        <section className="border border-gray-200 rounded overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                                <FiActivity className="w-4 h-4 text-blue-600 shrink-0" />
                                <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wide">
                                    1. Análisis de Estabilidad y Tiempo de Permanencia (Modelo de Weibull)
                                </h4>
                            </div>
                            <div className="px-5 py-4 space-y-3 text-xs text-slate-600 leading-relaxed">
                                <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100 text-indigo-900 font-medium text-[11px] mb-2">
                                    💡 <strong>¿Qué significa para tu empresa?</strong> Calcula el tiempo estimado que un colaborador permanecerá en la empresa evaluando factores clave como salario relativo, ausencias y desempeño.
                                </div>
                                <p>
                                    El riesgo de rotación voluntaria se modela mediante la función de peligro acumulada{' '}
                                    <InlineMath math="h(t)" /> de la distribución de Weibull paramétrica generalizada:
                                </p>
                                <FormulaBlock latex={FORMULAS.weibull} label="Función de peligro" />
                                <FormulaBlock latex={FORMULAS.survival} label="Probabilidad de supervivencia a 12 meses" />
                                <ul className="space-y-1.5 mt-1">
                                    <li className="flex gap-2">
                                        <span className="text-indigo-300 mt-0.5">▸</span>
                                        <span><InlineMath math="k = 1.25" />: captura el incremento no lineal del riesgo con la antigüedad.</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-indigo-300 mt-0.5">▸</span>
                                        <span><InlineMath math="\lambda_{decay} = 0.008" /> (≈ 90 días): vida media del decaimiento exponencial de ausencias.</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* Modelo 2 — Monte Carlo */}
                        <section className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                                <FiSliders className="w-4 h-4 text-indigo-600 shrink-0" />
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                                    2. Simulador de Riesgos Financieros y ROI (Simulación Monte Carlo)
                                </h4>
                            </div>
                            <div className="px-5 py-4 space-y-3 text-xs text-slate-600 leading-relaxed">
                                <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-blue-900 font-medium text-[11px] mb-2">
                                    💡 <strong>¿Qué significa para tu empresa?</strong> Prueba miles de escenarios posibles de aumento salarial o beneficios para estimar el retorno económico real (ROI) y el rango de ahorro probable.
                                </div>
                                <p>
                                    Se ejecutan <InlineMath math="N = 2{,}000" /> iteraciones estocásticas con perturbaciones
                                    gaussianas (Box-Muller) sobre las respuestas elásticas del personal. El ROI simulado es:
                                </p>
                                <FormulaBlock latex={FORMULAS.montecarlo} label="ROI simulado por escenario" />
                                <p>
                                    Los percentiles empíricos <InlineMath math="P_{2.5}" /> y <InlineMath math="P_{97.5}" /> forman
                                    el intervalo de confianza al 95%. El índice de Sobol construye el gráfico de Tornado de sensibilidad.
                                </p>
                            </div>
                        </section>

                        {/* Modelo 3 — ANOVA */}
                        <section className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                                <FiBarChart2 className="w-4 h-4 text-indigo-600 shrink-0" />
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                                    3. Comparativa entre Áreas y Departamentos (Análisis de Varianza ANOVA)
                                </h4>
                            </div>
                            <div className="px-5 py-4 space-y-3 text-xs text-slate-600 leading-relaxed">
                                <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-100 text-amber-900 font-medium text-[11px] mb-2">
                                    💡 <strong>¿Qué significa para tu empresa?</strong> Determina si las diferencias de rotación o desempeño entre departamentos (ej. Ventas vs. Operaciones) son estadísticamente significativas o fruto del azar.
                                </div>
                                <p>
                                    La comparación interdepartamental de desempeño y ausentismo emplea el estadístico{' '}
                                    <InlineMath math="F" /> de varianza:
                                </p>
                                <FormulaBlock latex={FORMULAS.anova} label="Estadístico F" />
                                <FormulaBlock latex={FORMULAS.pvalue} label="Aproximación del p-value" />
                                <p>
                                    Para departamentos con varianzas heterocedásticas se aplica la prueba t de Welch post-hoc.
                                </p>
                            </div>
                        </section>

                        {/* Modelo 4 — Gobernanza */}
                        <section className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                                <FiDatabase className="w-4 h-4 text-indigo-600 shrink-0" />
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                                    4. Protección de Privacidad y Consulta Eficiente
                                </h4>
                            </div>
                            <div className="px-5 py-4 space-y-1.5 text-xs text-slate-600 leading-relaxed">
                                <p>
                                    <span className="font-semibold text-slate-700">Exportación anonimizada:</span>{' '}
                                    Los datos personales (nombres, cédulas) son sustituidos por códigos disociados <InlineMath math="\text{EMP}_{0001}" />,
                                    protegiendo la identidad de los colaboradores.
                                </p>
                                <p>
                                    <span className="font-semibold text-slate-700">Velocidad de respuesta:</span>{' '}
                                    Las consultas recuperan el histórico anual en un único pase optimizado
                                    (respuesta instantánea en <InlineMath math="< 300\,\text{ms}" />).
                                </p>
                            </div>
                        </section>

                    </div>

                    {/* ── Footer ── */}
                    <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
                        <span className="text-xs text-slate-500 flex items-center gap-1.5">
                            <FiCheckCircle className="w-4 h-4 text-emerald-500" />
                            Modelos verificados científicamente
                        </span>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-sm"
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
