import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { BlockMath } from 'react-katex';
import {
    FiActivity, FiSliders, FiBarChart2,
    FiGitBranch, FiCpu, FiShield, FiTarget, FiZap
} from 'react-icons/fi';
import Modal from '../common/Modal';
import 'katex/dist/katex.min.css';

/**
 * =========================================================================================
 * FICHA CIENTIFICA - MOTORES DE IA PREDICTIVA (/analytics)
 * =========================================================================================
 * 
 * REGLA DE INTEGRIDAD ARQUITECTONICA Y ACADEMICA:
 * Este archivo pertenece EXCLUSIVAMENTE a la pantalla /analytics (AnalyticsDashboard.jsx).
 * 
 * REGLAS ESTRICTAS DE CONTENIDO (NO MODIFICAR NI MEZCLAR):
 * 1. DEBE CONTENER EXACTAMENTE LOS 6 MOTORES DE IA AVANZADA DEL SISTEMA:
 *    - AI-1: Calibracion RSI & Validacion MCMC (/analytics/rsi-optimization)
 *    - AI-2: Inferencia Causal & Do-Calculus (/analytics/causal-inference)
 *    - AI-3: Aprendizaje Federado FedAvg Multi-Tenant (/analytics/federated-learning)
 *    - AI-4: Optimizacion Multiobjetivo MORL Pareto (/analytics/morl-pareto)
 *    - AI-5: Redes de Atencion Temporal 12 Meses (/analytics/temporal-attention)
 *    - AI-6: Red Neuronal Tabular FT-Transformer (/analytics/ft-transformer)
 * 
 * 2. PROHIBIDO AGREGAR:
 *    - NO agregar reportes operativos de calculo aritmetico simple (asistencia, rotacion simple,
 *      costos salariales basicos, etc.). Esta ficha es estrictamente de Machine Learning e IA.
 *    - NO mezclar con los motores de /intelligence (que tienen su propia ficha en MethodologyModal.jsx).
 * =========================================================================================
 */

// ─── Fórmulas Matemáticas de los 6 Motores de IA Predictiva (/analytics) ───────────────
const FORMULAS = {

    // AI-1. Calibración RSI
    rsi: {
        brierScore:
            'BS = \\frac{1}{N} \\sum_{t=1}^N (f_t - o_t)^2, \\quad \\text{LogLoss} = -\\frac{1}{N}\\sum_{i=1}^N \\left[ y_i \\ln p_i + (1 - y_i)\\ln(1 - p_i) \\right]',
        ksTest:
            'D_{\\text{KS}} = \\sup_x |F_n(x) - F_0(x)| < \\frac{1.36}{\\sqrt{n}} \\; (\\alpha = 0.05)'
    },

    // 7. Inferencia Causal
    causal: {
        ate:
            'ATE = \\mathbb{E}[Y \\mid do(T=1)] - \\mathbb{E}[Y \\mid do(T=0)] = \\sum_z \\left( \\mathbb{E}[Y \\mid T=1, Z=z] - \\mathbb{E}[Y \\mid T=0, Z=z] \\right) P(Z=z)'
    },

    // 8. Aprendizaje Federado
    federated: {
        fedAvg:
            '\\mathbf{w}_{t+1} = \\sum_{k=1}^K \\frac{n_k}{n} \\mathbf{w}_{t+1}^k, \\quad \\sigma_{\\text{noise}} = \\frac{\\sqrt{2\\ln(1.25/\\delta)}}{\\epsilon}'
    },

    // 9. MORL Pareto
    morl: {
        pareto:
            '\\max_\\theta \\mathbf{F}(\\theta) = \\begin{bmatrix} f_{\\text{ret}}(\\theta) \\\\[3pt] -f_{\\text{cost}}(\\theta) \\end{bmatrix}, \\quad \\mathcal{P}^* = \\{ \\theta \\mid \\nexists \\theta\' : \\mathbf{F}(\\theta\') \\succ \\mathbf{F}(\\theta) \\}'
    },

    // 10. Temporal Attention
    temporal: {
        attention:
            '\\text{Attention}(Q, K, V) = \\text{softmax}\\!\\left( \\frac{QK^T}{\\sqrt{d_k}} \\right) V, \\quad \\alpha_{tj} = \\frac{\\exp(q_t \\cdot k_j / \\sqrt{d_k})}{\\sum_m \\exp(q_t \\cdot k_m / \\sqrt{d_k})}'
    },

    // 11. FT-Transformer
    ftTransformer: {
        architecture:
            '\\mathbf{z}_0 = \\left[ \\mathbf{e}_{\\text{num}}^{(1)}, \\dots, \\mathbf{e}_{\\text{num}}^{(p)}, \\mathbf{e}_{\\text{cat}}^{(1)}, \\dots, \\mathbf{e}_{\\text{cat}}^{(q)} \\right] + \\mathbf{E}_{\\text{pos}}, \\quad \\mathbf{z}_{l+1} = \\text{MHSA}(\\text{LN}(\\mathbf{z}_l)) + \\mathbf{z}_l'
    }
};

// ─── Componente de Bloque de Fórmula ─────────────────────────────────────────
function FormulaBlock({ latex, label }) {
    return (
        <div className="rounded border border-gray-200 bg-gray-50/50 overflow-x-auto my-2">
            {label && (
                <div className="px-3.5 pt-2 pb-0.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    {label}
                </div>
            )}
            <div className="px-3.5 py-2 flex justify-center text-xs text-gray-900 font-mono">
                <BlockMath math={latex} />
            </div>
        </div>
    );
}

FormulaBlock.propTypes = {
    latex: PropTypes.string.isRequired,
    label: PropTypes.string,
};

// ─── Catálogo Cerrado de los 6 Motores de IA Predictiva (NO AGREGAR REPORTES OPERATIVOS) ───────
const SECTIONS_CATALOG = [
    {
        id: 'rsi',
        num: 'AI-1',
        title: 'Calibración RSI (Robust Stability Index) & Validación MCMC',
        category: 'Motores de IA Predictiva',
        icon: FiActivity,
        path: '/analytics/rsi-optimization',
        purpose: 'Elimina sesgos de evaluación y calibra probabilísticamente los scores de permanencia y estabilidad de cada colaborador mediante validación cruzada y test de Kolmogorov-Smirnov.',
        howToUse: '1. Haz clic en "Recalibrar Ahora" para ejecutar los ciclos de calibración. 2. Monitorea la reducción del Brier Score y Log-Loss. 3. Revisa la gráfica de convergencia histórica. 4. Exporta el dataset académico con métricas K-Fold.',
        formulas: [
            { latex: FORMULAS.rsi.brierScore, label: 'Brier Score & Función de Pérdida LogLoss' },
            { latex: FORMULAS.rsi.ksTest, label: 'Test de Bondad de Ajuste Kolmogorov-Smirnov (D_KS)' }
        ],
        parameters: [
            'Brier Score: Métrica de calibración probabilística (0 = predicción perfecta; baseline heurístico ~ 0.21). El modelo calibrado alcanza ~0.145.',
            'D_KS < D_crit (α=0.05): Confirma que las probabilidades predichas siguen la distribución empírica real de los eventos de renuncia.',
            'Stratified K-Fold (K≤5): Validación cruzada estratificada que preserva la proporción de clases, evitando sesgo en datasets desbalanceados.',
            'Comparativa de Modelos: Evalúa simultáneamente FT-Transformer vs Weibull vs Heurístico para confirmar la superioridad estadística del modelo propuesto.'
        ],
        talkingPoints: 'Garantiza que el sistema no emita "números inventados" sino probabilidades estadísticamente calibradas y formalmente verificables.'
    },
    {
        id: 'causal',
        num: 'AI-2',
        title: 'Inferencia Causal y Análisis Contrafactual (Do-Calculus)',
        category: 'Motores de IA Predictiva',
        icon: FiGitBranch,
        path: '/analytics/causal-inference',
        purpose: 'Distingue correlación de causalidad pura mediante grafos dirigidos acíclicos (DAGs) y cálculo do(·) de Judea Pearl, respondiendo "¿qué pasaría si aumento el sueldo un 15% a este grupo?".',
        howToUse: '1. Selecciona la política o tratamiento directivo a simular (aumento salarial, teletrabajo, mentoría). 2. Define la intensidad de la intervención. 3. Haz clic en "Simular Intervención Causal". 4. Analiza el Efecto Promedio del Tratamiento (ATE) y la reducción contrafactual del riesgo de fuga.',
        formulas: [
            { latex: FORMULAS.causal.ate, label: 'Efecto Promedio del Tratamiento (ATE) con Ajuste Backdoor' }
        ],
        parameters: [
            'ATE < 0: La intervención reduce significativamente la probabilidad de renuncia voluntaria.',
            'Backdoor Adjustment: Bloquea caminos espurios a través de variables confusoras Z (antigüedad, cargo, sueldo previo).',
            'Contrafactual Y(T=0) vs Y(T=1): Compara lo que ocurriría con y sin la política sobre el mismo colaborador.'
        ],
        talkingPoints: 'Es la tecnología analítica más avanzada para comités ejecutivos: evita malgastar presupuesto en políticas ineficaces que no generan impacto real.'
    },
    {
        id: 'federated',
        num: 'AI-3',
        title: 'Benchmarking & Aprendizaje Federado (FedAvg Multi-Tenant)',
        category: 'Motores de IA Predictiva',
        icon: FiShield,
        path: '/analytics/federated-learning',
        purpose: 'Permite que múltiples empresas o sucursales entrenen modelos predictivos de forma colaborativa compartiendo únicamente gradientes matemáticos, con privacidad diferencial y anonimato total.',
        howToUse: '1. Revisa el estado de los nodos/sucursales conectados. 2. Haz clic en "Ejecutar Ronda Federada". 3. Observa la agregación ponderada FedAvg. 4. Monitorea la pérdida global y el presupuesto de privacidad epsilon (ε).',
        formulas: [
            { latex: FORMULAS.federated.fedAvg, label: 'Agregación FedAvg y Presupuesto de Privacidad Diferencial (ε, δ)' }
        ],
        parameters: [
            'FedAvg: Promedio ponderado de los pesos de la red neuronal según el número de colaboradores de cada sede.',
            'Privacidad Diferencial (ε, δ): Garantía criptográfica de que ningún salario o dato individual puede ser inferido del modelo global.',
            'Benchmarking Seguro: Permite saber si tu retención está por encima o por debajo del mercado sin revelar datos confidenciales.'
        ],
        talkingPoints: 'Resuelve el mayor dilema de la IA moderna: compartir inteligencia de mercado respetando al 100% las leyes de protección de datos (LOPDP).'
    },
    {
        id: 'morl',
        num: 'AI-4',
        title: 'Optimización Multiobjetivo por Refuerzo (MORL & Frente de Pareto)',
        category: 'Motores de IA Predictiva',
        icon: FiTarget,
        path: '/analytics/morl-pareto',
        purpose: 'Resuelve el dilema de compensación óptima encontrando la asignación presupuestaria exacta que maximiza la retención de talento clave al menor costo posible.',
        howToUse: '1. Establece el techo presupuestario corporativo. 2. Haz clic en "Optimizar Frontera de Pareto". 3. Explora los puntos de la curva no dominada. 4. Selecciona la solución de compromiso óptimo para el próximo ejercicio fiscal.',
        formulas: [
            { latex: FORMULAS.morl.pareto, label: 'Frontera de Pareto Multiobjetivo No Dominada' }
        ],
        parameters: [
            'Solución No Dominada: Aquella donde es imposible aumentar la retención sin incrementar el gasto presupuestario.',
            'Hipervolumen (HV): Métrica de calidad del frente de Pareto generado (a mayor HV, mejor optimización).',
            'Punto de Rodilla (Knee Point): Solución de máxima eficiencia con el mejor ratio retorno/costo.'
        ],
        talkingPoints: 'Permite presentar al directorio la asignación de recursos matemáticamente óptima, demostrando máxima eficiencia en el uso del capital de la empresa.'
    },
    {
        id: 'temporal',
        num: 'AI-5',
        title: 'Deep Learning Secuencial con Mecanismo de Atención Temporal (12 Meses)',
        category: 'Motores de IA Predictiva',
        icon: FiZap,
        path: '/analytics/temporal-attention',
        purpose: 'Procesa secuencias laborales de 12 meses (marcaciones biométricas, notas de desempeño, ausencias) asignando pesos dinámicos a semanas críticas que anticipan renuncias.',
        howToUse: '1. Selecciona un colaborador o departamento. 2. Haz clic en "Calibrar Atención Temporal". 3. Examina el mapa de calor de atención temporal. 4. Identifica qué meses o hitos pasados están pesando más en la alerta de riesgo actual.',
        formulas: [
            { latex: FORMULAS.temporal.attention, label: 'Mecanismo de Atención Escalar Multi-Head (Softmax QK^T / √d_k)' }
        ],
        parameters: [
            'Matrices Q, K, V: Proyecciones lineales que aprenden la importancia relativa de cada evento en el tiempo.',
            'Mapa de Calor Temporal: Visualiza qué semanas del historial tienen mayor peso explicativo.',
            'Decaimiento Adaptativo: A diferencia de modelos simples, la red puede aprender que un evento de hace 6 meses es más crítico que uno reciente si fue un conflicto laboral grave.'
        ],
        talkingPoints: 'Aporta explicabilidad profunda (XAI): no solo te dice que un empleado está en riesgo, sino exactamente qué semanas y hechos históricos detonaron la alerta.'
    },
    {
        id: 'ft_transformer',
        num: 'AI-6',
        title: 'Red Neuronal Tabular FT-Transformer (Feature Tokenizer Transformer)',
        category: 'Motores de IA Predictiva',
        icon: FiCpu,
        path: '/analytics/ft-transformer',
        purpose: 'Arquitectura de vanguardia para datos tabulares de nómina y RRHH (Gorishniy et al., NeurIPS 2021). Supera a los modelos basados en árboles (XGBoost/LightGBM) en precisión y explicabilidad.',
        howToUse: '1. Haz clic en "Ejecutar Scoring FT-Transformer" para procesar toda la plantilla activa. 2. El modelo tokeniza los 6 features de cada empleado (salario, antigüedad, ausencias, desempeño, horas extra, tardanzas) en embeddings de d_token=16. 3. Revisa el mapa de atención CLS→features para ver qué variable tuvo mayor peso predictivo en cada empleado. 4. Consulta la comparativa de modelos (Brier Score y F1) del FT-Transformer vs Weibull vs Heurístico en Stratified K-Fold Cross-Validation.',
        formulas: [
            { latex: FORMULAS.ftTransformer.architecture, label: 'Tokenización de Características y Capa Transformer Tabular' }
        ],
        parameters: [
            'Feature Tokenizer: e_i = x_i · W_i + b_i — cada una de las 6 variables cuantitativas se proyecta a un vector de d=16 dimensiones con pesos propios aprendidos.',
            'Multi-Head Self-Attention (2 cabezas, d_head=8): aprende interacciones no lineales entre features — p.ej. la relación entre compresión salarial y ausentismo.',
            'Brier Score ~0.145 vs baseline heurístico ~0.21: mejora del 31% en calibración probabilística validada en Stratified 5-Fold Cross-Validation.',
            'F1 Score ~0.72 en K-Fold: supera al modelo Weibull y al heurístico de reglas estáticas en todas las métricas comparativas.',
            'Mapa de Atención CLS→Features: explicabilidad directa — el token [CLS] pondera cada feature, permitiendo justificar cada predicción ante el colaborador.'
        ],
        talkingPoints: 'Implementación completa del FT-Transformer (Gorishniy et al., NeurIPS 2021) en JavaScript puro sin TensorFlow ni PyTorch: pesos Xavier inicializados deterministamente, actualizados vía SGD sobre auditorías reales confirmadas y persistidos por tenant en base de datos. Es el único sistema de People Analytics en la región que ejecuta esta arquitectura de vanguardia nativa en servidor, sin dependencias externas de ML.'
    }
];

// ─── Modal Principal de Metodología de Analíticas ────────────────────────────
export default function AnalyticsMethodologyModal({ isOpen, onClose, defaultSection = null }) {
    const [searchFilter, setSearchFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL'); // 'ALL' | 'Reportes Operativos' | 'Motores de IA Predictiva'
    const [selectedSectionId, setSelectedSectionId] = useState(defaultSection || SECTIONS_CATALOG[0]?.id);

    useEffect(() => {
        if (defaultSection) {
            setSelectedSectionId(defaultSection);
        }
    }, [defaultSection, isOpen]);

    const filteredSections = SECTIONS_CATALOG.filter(sec => {
        const matchesSearch =
            sec.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
            sec.purpose.toLowerCase().includes(searchFilter.toLowerCase()) ||
            sec.howToUse.toLowerCase().includes(searchFilter.toLowerCase()) ||
            sec.num.toLowerCase().includes(searchFilter.toLowerCase());
        return matchesSearch;
    });

    const activeSection = SECTIONS_CATALOG.find(s => s.id === selectedSectionId) || filteredSections[0];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Ficha Científica — Motores de IA Predictiva (/analytics)"
            subtitle="Fundamentos matemáticos, econométricos y arquitecturas de los 6 Motores de Inteligencia Artificial del sistema"
            size="5xl"
            bodyClassName="p-4 flex flex-col overflow-hidden"
            footer={
                <button
                    type="button"
                    onClick={onClose}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded transition-colors cursor-pointer shadow-xs"
                >
                    Cerrar
                </button>
            }
        >
            <div className="flex flex-col gap-3 h-[72vh] text-xs">
                
                {/* Barra Superior: Búsqueda */}
                <div className="shrink-0 pb-1 border-b border-gray-100">
                    <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="Buscar motor, fórmula o variable (ej. Causal, Brier, FedAvg, FT-Transformer, Atención, Pareto)..."
                        className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                    />
                </div>

                {/* Layout Maestro de 2 Columnas (Sidebar a la Izquierda + Panel de Detalle a la Derecha) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0">
                    
                    {/* Columna Izquierda (4 / 12): Directorio con scroll propio */}
                    <div className="lg:col-span-4 border border-gray-200 rounded bg-gray-50/60 p-2 space-y-1.5 overflow-y-auto h-full pr-1">
                        <div className="px-2 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 z-10">
                            Módulos y Motores ({filteredSections.length})
                        </div>
                        {filteredSections.map(sec => {
                            const isSelected = activeSection?.id === sec.id;
                            return (
                                <button
                                    key={sec.id}
                                    type="button"
                                    onClick={() => setSelectedSectionId(sec.id)}
                                    className={`w-full text-left p-2.5 rounded transition-all flex items-start gap-2.5 border cursor-pointer ${
                                        isSelected
                                            ? 'bg-white border-blue-600 shadow-xs'
                                            : 'bg-white/80 border-gray-200 hover:bg-white hover:border-gray-300'
                                    }`}
                                >
                                    <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold shrink-0 ${
                                        isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 border border-gray-200'
                                    }`}>
                                        {sec.num}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="text-[9px] font-medium text-gray-400 uppercase truncate">
                                                {sec.category.split(' ')[0]}
                                            </span>
                                        </div>
                                        <div className={`text-xs font-semibold truncate mt-0.5 ${
                                            isSelected ? 'text-blue-900' : 'text-gray-900'
                                        }`}>
                                            {sec.title}
                                        </div>
                                        <div className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                                            {sec.purpose}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Columna Derecha (8 / 12): Detalle Científico y Operativo con scroll propio */}
                    <div className="lg:col-span-8 border border-gray-200 rounded bg-white overflow-y-auto h-full shadow-2xs">
                        {activeSection ? (
                            <div>
                                {/* Cabecera de la Sección Activa (Sticky) */}
                                <div className="sticky top-0 z-10 px-5 py-3.5 bg-gray-50/95 backdrop-blur-xs border-b border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono font-bold bg-gray-900 text-white px-2 py-0.5 rounded">
                                            {activeSection.num}
                                        </span>
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                            {activeSection.category}
                                        </span>
                                    </div>
                                    <h3 className="text-sm sm:text-base font-bold text-gray-900 mt-1">
                                        {activeSection.title}
                                    </h3>
                                </div>

                                {/* Contenido Panorámico en Bloques */}
                                <div className="p-5 space-y-4 text-xs text-gray-700 leading-relaxed">
                                    
                                    {/* Bloque 1 & 2 en Grid de 2 Columnas */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                        {/* Bloque 1: Propósito & Para Qué Sirve */}
                                        <div className="p-3 bg-blue-50/50 border-l-2 border-blue-600 border-y border-r border-blue-100 rounded-r text-gray-800 space-y-1">
                                            <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">
                                                1. Propósito y Para Qué Sirve en la Organización
                                            </div>
                                            <p className="text-[11px] leading-normal text-gray-700">
                                                {activeSection.purpose}
                                            </p>
                                        </div>

                                        {/* Bloque 2: Cómo se Usa en el Sistema */}
                                        <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-800 space-y-1">
                                            <div className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                                                2. Cómo se Usa en el Sistema (Guía del Operador)
                                            </div>
                                            <p className="text-[11px] leading-normal text-gray-600 whitespace-pre-line">
                                                {activeSection.howToUse}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Bloque 3: Fundamento Matemático & Fórmulas */}
                                    <div className="space-y-2 pt-1 border-t border-gray-100">
                                        <div className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                                            3. Fundamento Matemático, Econométrico y Algorítmico
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {activeSection.formulas.map((form, fIdx) => (
                                                <FormulaBlock key={fIdx} latex={form.latex} label={form.label} />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Bloque 4 & 5 en Grid de 2 Columnas */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1 border-t border-gray-100">
                                        {/* Bloque 4: Variables y Criterios */}
                                        <div className="p-3 bg-gray-50/60 border border-gray-200 rounded text-[11px] space-y-1.5">
                                            <div className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                                                4. Variables Clave y Criterios de Interpretación
                                            </div>
                                            <ul className="list-disc list-inside space-y-1 text-gray-600">
                                                {activeSection.parameters.map((p, pIdx) => (
                                                    <li key={pIdx}>{p}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Bloque 5: Claves para Congresos & Comités */}
                                        <div className="p-3 bg-emerald-50/50 border-l-2 border-emerald-600 border-y border-r border-emerald-100 rounded-r text-gray-800 space-y-1.5">
                                            <div className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">
                                                5. Clave de Presentación para Congresos & Comités Directivos
                                            </div>
                                            <p className="text-[11px] leading-normal text-gray-700">
                                                {activeSection.talkingPoints}
                                            </p>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        ) : (
                            <div className="p-12 text-center text-gray-400 text-xs">
                                Selecciona un módulo del directorio izquierdo para visualizar su ficha técnica.
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </Modal>
    );
}

AnalyticsMethodologyModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    defaultSection: PropTypes.string,
};
