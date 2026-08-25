import PropTypes from 'prop-types';
import { InlineMath, BlockMath } from 'react-katex';
import { FiActivity, FiSliders, FiBarChart2, FiDatabase, FiCheckCircle } from 'react-icons/fi';
import Modal from './common/Modal';
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
        <div className="rounded-lg border border-blue-100 bg-blue-50/50 overflow-x-auto">
            {label && (
                <div className="px-4 pt-3 pb-1 text-[10px] font-semibold text-blue-500 uppercase tracking-widest">
                    {label}
                </div>
            )}
            <div className="px-4 py-3 flex justify-center text-xs">
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
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Ficha Metodológica — Modelos Estadísticos y Econométricos"
            subtitle="Fundamentación analítica de los algoritmos de predicción y riesgo"
            size="xl"
            footer={
                <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                        <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                        Modelos verificados científicamente
                    </span>
                    <button
                        onClick={onClose}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium cursor-pointer transition-colors shadow-xs"
                    >
                        Entendido y Cerrar
                    </button>
                </div>
            }
        >
            <div className="space-y-4 max-h-[70vh] overflow-y-auto text-xs pr-1">
                {/* Modelo 1 — Weibull */}
                <section className="border border-gray-200 rounded overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                        <FiActivity className="w-4 h-4 text-blue-600 shrink-0" />
                        <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wide">
                            1. Análisis de Estabilidad y Tiempo de Permanencia (Modelo de Weibull)
                        </h4>
                    </div>
                    <div className="px-5 py-4 space-y-3 text-xs text-slate-600 leading-relaxed">
                        <div className="p-3 bg-blue-50/60 rounded border border-blue-100 text-blue-900 font-medium text-[11px] mb-2">
                            💡 <strong>¿Qué significa para tu empresa?</strong> Calcula el tiempo estimado que un colaborador permanecerá en la empresa evaluando factores clave como salario relativo, ausencias y desempeño.
                        </div>
                        <p>
                            El riesgo de rotación voluntaria se modela mediante la función de peligro acumulada{' '}
                            <InlineMath math="h(t)" /> de la distribución de Weibull paramétrica generalizada:
                        </p>
                        <FormulaBlock latex={FORMULAS.weibull} label="Función de peligro" />
                        <p className="text-[11px] text-gray-500">
                            Donde <InlineMath math="k" /> es el parámetro de forma (aceleración del riesgo con la antigüedad),{' '}
                            <InlineMath math="\lambda" /> es la escala, y los coeficientes <InlineMath math="\beta" /> ponderan
                            la compresión salarial (<InlineMath math="S_{emp}/S_{dept}" />), la tasa de ausencias con decaimiento
                            temporal exponencial (<InlineMath math="\lambda_{decay} = 0.05" />) y el déficit de competencias.
                        </p>
                    </div>
                </section>

                {/* Modelo 2 — Curva de Supervivencia */}
                <section className="border border-gray-200 rounded overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                        <FiSliders className="w-4 h-4 text-blue-600 shrink-0" />
                        <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wide">
                            2. Probabilidad de Retención a 30 / 60 / 90 Días
                        </h4>
                    </div>
                    <div className="px-5 py-4 space-y-3 text-xs text-slate-600 leading-relaxed">
                        <p>
                            La probabilidad de retención <InlineMath math="R(t)" /> y sus intervalos de confianza al{' '}
                            <InlineMath math="95\%" /> se derivan de la función de supervivencia:
                        </p>
                        <FormulaBlock latex={FORMULAS.survival} label="Función de supervivencia e IC 95%" />
                        <p className="text-[11px] text-gray-500">
                            Donde <InlineMath math="\Delta H(t)" /> es el incremento acumulado del riesgo en el horizonte temporal{' '}
                            <InlineMath math="t \in \{30, 60, 90\}" /> días y <InlineMath math="\hat{\sigma}_R" /> es la varianza estimada mediante la fórmula de Greenwood.
                        </p>
                    </div>
                </section>

                {/* Modelo 3 — Monte Carlo */}
                <section className="border border-gray-200 rounded overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                        <FiBarChart2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wide">
                            3. Simulación Financiera de Monte Carlo (ROI Predictivo)
                        </h4>
                    </div>
                    <div className="px-5 py-4 space-y-3 text-xs text-slate-600 leading-relaxed">
                        <p>
                            Se ejecutan iteraciones estocásticas con perturbaciones normales multivariadas en las tasas de
                            rotación y costos de reemplazo:
                        </p>
                        <FormulaBlock latex={FORMULAS.montecarlo} label="Retorno de inversión simulado" />
                        <p className="text-[11px] text-gray-500">
                            Donde <InlineMath math="\Delta C_{rotación}" /> es el ahorro evitado en costos de contratación/capacitación,{' '}
                            <InlineMath math="\Delta H_{ahorro}" /> el beneficio por menor ausentismo, e{' '}
                            <InlineMath math="I_{total}" /> la inversión en planes de retención. Se calculan percentiles{' '}
                            <InlineMath math="P_{10}, P_{50}, P_{90}" /> y el Valor en Riesgo Condicional (<InlineMath math="CVaR_{95\%}" />).
                        </p>
                    </div>
                </section>

                {/* Modelo 4 — ANOVA */}
                <section className="border border-gray-200 rounded overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                        <FiDatabase className="w-4 h-4 text-blue-600 shrink-0" />
                        <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wide">
                            4. Análisis de Varianza Interdepartamental (ANOVA Unidireccional)
                        </h4>
                    </div>
                    <div className="px-5 py-4 space-y-3 text-xs text-slate-600 leading-relaxed">
                        <p>
                            Para determinar si las diferencias de riesgo y satisfacción entre áreas son estadísticamente
                            significativas:
                        </p>
                        <FormulaBlock latex={FORMULAS.anova} label="Estadístico F de Snedecor" />
                        <p>
                            El valor p se aproxima con la transformación de Wilson-Hilferty sobre la función de distribución acumulada normal estándar:
                        </p>
                        <FormulaBlock latex={FORMULAS.pvalue} label="Aproximación del valor p" />
                        <p className="text-[11px] text-gray-500">
                            Un valor <InlineMath math="p < 0.05" /> confirma heterogeneidad significativa entre departamentos,
                            descartando que las variaciones observadas se deban al azar muestral.
                        </p>
                    </div>
                </section>
            </div>
        </Modal>
    );
}

MethodologyModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};
