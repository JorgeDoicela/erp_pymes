import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { InlineMath, BlockMath } from 'react-katex';
import {
    FiActivity, FiSliders, FiBarChart2, FiDatabase, FiCheckCircle,
    FiGitBranch, FiCpu, FiShield, FiLayers, FiTrendingUp, FiTarget, FiZap,
    FiFileText, FiDownload, FiDollarSign, FiSearch, FiBookOpen, FiSmile,
    FiClock, FiUserCheck, FiAward, FiAlertCircle
} from 'react-icons/fi';
import Modal from '../common/Modal';
import 'katex/dist/katex.min.css';

// ─── Fórmulas Matemáticas y Econométricas para Analíticas y Reportes ─────────
const FORMULAS = {
    // 1. Asistencia
    attendance: {
        absenteeismRate:
            'T_{\\text{abs}} = \\left( \\frac{\\sum \\text{Horas No Laboradas}}{\\sum \\text{Horas Programadas}} \\right) \\times 100',
        punctualityIndex:
            'I_{\\text{puntualidad}} = \\left( \\frac{N_{\\text{jornadas a tiempo}}}{N_{\\text{total jornadas}}} \\right) \\times 100',
        absenteeismCost:
            'C_{\\text{ausentismo}} = \\sum_{i=1}^n \\left( H_{\\text{ausencia}, i} \\times \\text{SalarioHora}_i \\times (1 + \\tau_{\\text{cargas}}) \\right)'
    },

    // 2. Rotación
    turnover: {
        turnoverRate:
            'TR_{\\text{periodo}} = \\frac{S_{\\text{salidas}}}{\\frac{N_{\\text{inicial}} + N_{\\text{final}}}{2}} \\times 100',
        kaplanMeier:
            '\\hat{S}(t) = \\prod_{t_i \\le t} \\left( 1 - \\frac{d_i}{n_i} \\right), \\quad \\text{CostoRotacion} \\approx 0.50 \\times \\text{SalarioAnual} + C_{\\text{recluta}} + C_{\\text{capacita}}'
    },

    // 3. Desempeño
    performance: {
        gaussianFit:
            'f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} \\exp\\!\\left( -\\frac{(x - \\mu)^2}{2\\sigma^2} \\right), \\quad \\text{Skewness} = \\frac{3(\\mu - \\text{Mediana})}{\\sigma}',
        nineBox:
            '\\text{Score}_{9\\text{Box}} = w_{\\text{perf}} \\cdot \\text{Desempeño} + w_{\\text{pot}} \\cdot \\text{Potencial}'
    },

    // 4. Costos Salariales
    payrollCosts: {
        totalCost:
            'CT_{\\text{laboral}} = MB + \\text{IESS}_{\\text{patronal}}(12.15\\%) + \\text{D13} + \\text{D14} + \\text{FondoReserva}(8.33\\%) + \\text{Vacaciones}(4.17\\%)',
        payrollRatio:
            'R_{\\text{masa salarial}} = \\left( \\frac{CT_{\\text{laboral}}}{\\text{Ingresos Operacionales}} \\right) \\times 100'
    },

    // 5. Clima Laboral
    satisfaction: {
        enps:
            'eNPS = \\left( \\frac{N_{\\text{Promotores}} - N_{\\text{Detractores}}}{N_{\\text{Total Respuestas}}} \\right) \\times 100',
        climateIndex:
            'ICG = \\sum_{k=1}^K w_k \\cdot \\bar{S}_k, \\quad \\text{Burnout Risk} = f(\\text{Sobrecarga}, \\text{Ausentismo}, \\text{Clima})'
    },

    // 6. Calibración RSI
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

// ─── Catálogo Maestro de Secciones Analíticas ─────────────────────────────────
const SECTIONS_CATALOG = [
    // === REPORTES OPERATIVOS ===
    {
        id: 'attendance',
        num: 'RO-1',
        title: 'Reportes de Asistencia, Jornadas y Horas Extras',
        category: 'Reportes Operativos',
        icon: FiClock,
        path: '/admin/reports',
        purpose: 'Auditoría precisa de cumplimiento laboral, control de absentismo y liquidación justa de horas suplementarias y extraordinarias según la normativa laboral ecuatoriana.',
        howToUse: '1. Selecciona el rango de fechas (mes o quincena a liquidar). 2. Aplica filtros departamentales o busca por empleado. 3. Revisa el total de horas efectivas, atrasos y horas extras al 50% y 100%. 4. Exporta a Excel/PDF para conciliación con nómina.',
        formulas: [
            { latex: FORMULAS.attendance.absenteeismRate, label: 'Tasa de Absentismo Laboral (%)' },
            { latex: FORMULAS.attendance.punctualityIndex, label: 'Índice de Puntualidad Operativa (%)' },
            { latex: FORMULAS.attendance.absenteeismCost, label: 'Impacto Financiero del Absentismo ($)' }
        ],
        parameters: [
            'Horas Efectivas: Tiempo real registrado por biométrico deduciendo recesos no remunerados.',
            'Horas Suplementarias (50%): Laboradas fuera de la jornada regular diurna (hasta 4h/día, 12h/semana).',
            'Horas Extraordinarias (100%): Laboradas en fines de semana, feriados o jornada nocturna especial.',
            'Tasa de Absentismo Crítico: Un valor > 3.5% indica problemas de sobrecarga o baja motivación.'
        ],
        talkingPoints: 'Demuestra el control estricto de nómina, eliminando pagos indebidos y asegurando cumplimiento legal ante el Ministerio del Trabajo.'
    },
    {
        id: 'turnover',
        num: 'RO-2',
        title: 'Rotación de Personal y Costo de Desvinculación',
        category: 'Reportes Operativos',
        icon: FiUserCheck,
        path: '/analytics/turnover',
        purpose: 'Monitorea la dinámica de entradas y salidas de colaboradores, identificando causas raíz de fuga de talento, áreas vulnerables y el costo financiero de reemplazo.',
        howToUse: '1. Define el horizonte de análisis (trimestre o año). 2. Examina la tasa global de rotación contra el benchmark sectorial (meta < 10% anual). 3. Analiza el diagrama de Pareto de motivos de salida. 4. Identifica departamentos con rotación prematura (< 90 días).',
        formulas: [
            { latex: FORMULAS.turnover.turnoverRate, label: 'Tasa de Rotación de Personal (Fórmula Estándar)' },
            { latex: FORMULAS.turnover.kaplanMeier, label: 'Estimador de Kaplan-Meier & Costo de Reemplazo' }
        ],
        parameters: [
            'Rotación Voluntaria: Renuncias por iniciativa del colaborador (señal de alerta salarial o de clima).',
            'Rotación Involuntaria: Despidos o no renovación de contratos temporales/a prueba.',
            'Costo de Reemplazo: Equivale al 50%-150% del salario anual del puesto debido a reclutamiento, onboarding y curva de aprendizaje perdida.',
            'Rotación Temprana: Porcentaje de salidas antes de los 90 días; evalúa la efectividad del proceso de selección.'
        ],
        talkingPoints: 'Permite justificar ante la junta directiva la inversión en planes de retención y aumentos focalizados para evitar pérdidas millonarias en liquidación y reclutamiento.'
    },
    {
        id: 'performance',
        num: 'RO-3',
        title: 'Rendimiento, Desempeño 360° y 9-Box Grid',
        category: 'Reportes Operativos',
        icon: FiAward,
        path: '/analytics/performance',
        purpose: 'Evalúa el cumplimiento de metas (KPIs) y competencias laborales, ubicando al talento en la matriz 9-Box para planes de sucesión y aumentos por mérito.',
        howToUse: '1. Selecciona el ciclo de evaluación consolidado. 2. Revisa la distribución gaussiana de calificaciones para detectar sesgos de lenidad o severidad. 3. Consulta la matriz 9-Box (Potencial vs Desempeño). 4. Identifica a los Top Performers y al personal en plan de mejora.',
        formulas: [
            { latex: FORMULAS.performance.gaussianFit, label: 'Ajuste de Campana de Gauss y Asimetría (Skewness)' },
            { latex: FORMULAS.performance.nineBox, label: 'Calificación Ponderada 9-Box Grid' }
        ],
        parameters: [
            'Evaluación 360°: Ponderación de autoevaluación (10%), jefe directo (50%), pares (20%) y subordinados (20%).',
            'Matriz 9-Box: Clasificación en 9 cuadrantes desde "Riesgo" (Bajo-Bajo) hasta "Futuro Líder" (Alto-Alto).',
            'Sesgo de Lenidad: Ocurre cuando el promedio departamental es > 90/100 sin varianza; amerita calibración RSI.',
            'Top Performers: Empleados con score > μ + 1.5σ (objetivo prioritario de retención).'
        ],
        talkingPoints: 'Fundamenta la meritocracia empresarial, garantizando que los ascensos y bonos se sustenten en datos auditables y no en favoritismos.'
    },
    {
        id: 'payroll_costs',
        num: 'RO-4',
        title: 'Costos Salariales, Provisiones y Masa Salarial',
        category: 'Reportes Operativos',
        icon: FiDollarSign,
        path: '/analytics/payroll-costs',
        purpose: 'Desglose financiero integral del costo laboral de la empresa: sueldos brutos, cargas sociales de ley (IESS), provisiones de décimos, fondos de reserva y beneficios.',
        howToUse: '1. Filtra por mes contable y centro de costos. 2. Visualiza la evolución del costo laboral total vs el presupuesto anual. 3. Examina las provisiones acumuladas de pasivos laborales. 4. Compara el ratio de masa salarial sobre facturación.',
        formulas: [
            { latex: FORMULAS.payrollCosts.totalCost, label: 'Costo Laboral Total Empresarial (Ecuador)' },
            { latex: FORMULAS.payrollCosts.payrollRatio, label: 'Ratio de Masa Salarial / Ingresos (%)' }
        ],
        parameters: [
            'Aporte Patronal IESS: 12.15% sobre la materia gravada de cada trabajador.',
            'Décimo Tercero: Provisión mensual de la 12va parte de todo lo ganado en el año calendario.',
            'Décimo Cuarto: Provisión mensual de la 12va parte de un Salario Básico Unificado (SBU).',
            'Fondos de Reserva: 8.33% aplicable a partir del segundo año de servicio continuo.',
            'Carga Prestacional Total: Suele representar entre el 25% y el 33% adicional sobre el sueldo nominal.'
        ],
        talkingPoints: 'Herramienta vital para el CFO y la gerencia de finanzas; previene descalces de liquidez al provisionar con exactitud los pasivos de fin de año.'
    },
    {
        id: 'satisfaction',
        num: 'RO-5',
        title: 'Clima Laboral, Prevención de Burnout y eNPS',
        category: 'Reportes Operativos',
        icon: FiSmile,
        path: '/analytics/satisfaction',
        purpose: 'Monitorea el clima interno, la satisfacción laboral y el nivel de recomendación como empleador (eNPS), detectando a tiempo focos de estrés y sobrecarga.',
        howToUse: '1. Elige la encuesta o período activo. 2. Evalúa el score eNPS (meta > +30). 3. Desglosa los promedios por dimensión (liderazgo, salario, balance de vida). 4. Revisa alertas de riesgo de burnout por departamento.',
        formulas: [
            { latex: FORMULAS.satisfaction.enps, label: 'Employee Net Promoter Score (eNPS)' },
            { latex: FORMULAS.satisfaction.climateIndex, label: 'Índice de Clima Global (ICG)' }
        ],
        parameters: [
            'Promotores (Nota 9-10): Colaboradores altamente comprometidos y embajadores de la marca.',
            'Pasivos (Nota 7-8): Satisfechos pero susceptibles a ofertas de la competencia.',
            'Detractores (Nota 0-6): Colaboradores desmotivados con alto riesgo de fuga o sabotaje del clima.',
            'Índice de Burnout: Correlaciona sobrecarga de horas extras con ausentismo y caídas en clima.'
        ],
        talkingPoints: 'Demuestra el compromiso ético y humano de la organización con la salud mental de su equipo, lo cual impacta directamente en la productividad.'
    },

    // === MOTORES DE IA Y ANALÍTICA PREDICTIVA ===
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
            'Brier Score: Métrica de calibración probabilística (0 = predicción perfecta; baseline ~ 0.21).',
            'D_KS < D_crit: Confirma que las probabilidades predichas coinciden fielmente con los eventos reales.',
            'K-Fold Cross-Validation: Validación cruzada en 5 subconjuntos para evitar sobreajuste (overfitting).',
            'Multi-Seed Sensitivity: Evalúa la robustez del modelo ante diferentes semillas aleatorias.'
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
        howToUse: '1. Selecciona los hiperparámetros (épocas, batch size, learning rate). 2. Haz clic en "Entrenar FT-Transformer". 3. Evalúa las curvas de pérdida y la métrica ROC-AUC. 4. Utiliza el modelo entrenado para scoring predictivo de toda la plantilla.',
        formulas: [
            { latex: FORMULAS.ftTransformer.architecture, label: 'Tokenización de Características y Capa Transformer Tabular' }
        ],
        parameters: [
            'Feature Tokenizer: Proyecta tanto números continuos (sueldo, horas extras) como variables categóricas (departamento, cargo) al mismo espacio vectorial denso.',
            'Multi-Head Self-Attention: Aprende interacciones no lineales complejas entre todas las variables simultáneamente.',
            'ROC-AUC > 0.88: Excelente poder discriminativo para anticipar fuga de talento o anomalías en nómina.'
        ],
        talkingPoints: 'Sitúa a la plataforma en el estado del arte de la inteligencia artificial mundial aplicada a People Analytics.'
    }
];

// ─── Modal Principal de Metodología de Analíticas ────────────────────────────
export default function AnalyticsMethodologyModal({ isOpen, onClose, defaultSection = null }) {
    const [searchFilter, setSearchFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL'); // 'ALL' | 'Reportes Operativos' | 'Motores de IA Predictiva'
    const [selectedSectionId, setSelectedSectionId] = useState(defaultSection);

    useEffect(() => {
        if (defaultSection) {
            setSelectedSectionId(defaultSection);
        }
    }, [defaultSection, isOpen]);

    const filteredSections = SECTIONS_CATALOG.filter(sec => {
        const matchesCategory = categoryFilter === 'ALL' || sec.category === categoryFilter;
        const matchesSearch =
            sec.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
            sec.purpose.toLowerCase().includes(searchFilter.toLowerCase()) ||
            sec.howToUse.toLowerCase().includes(searchFilter.toLowerCase()) ||
            sec.num.toLowerCase().includes(searchFilter.toLowerCase()) ||
            sec.category.toLowerCase().includes(searchFilter.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const activeSection = SECTIONS_CATALOG.find(s => s.id === selectedSectionId) || filteredSections[0];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Ficha Técnica & Guía Científica — Analíticas y Reportes (/analytics)"
            subtitle="Fundamentación matemática y operativa de los 5 Reportes de Gestión y los 6 Motores de IA Predictiva"
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
                
                {/* Barra Superior: Búsqueda y Filtros de Categoría */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0 pb-1 border-b border-gray-100">
                    <div className="relative flex-1 w-full">
                        <input
                            type="text"
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            placeholder="Buscar por módulo, fórmula, botón o variable (ej. Rotación, Causal, Asistencia, Brier, FedAvg, FT-Transformer)..."
                            className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="flex border border-gray-200 rounded overflow-hidden text-[11px] shrink-0 bg-white shadow-2xs">
                        <button
                            type="button"
                            onClick={() => setCategoryFilter('ALL')}
                            className={`px-3 py-1.5 font-medium transition-colors cursor-pointer ${
                                categoryFilter === 'ALL' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            Todos (11)
                        </button>
                        <button
                            type="button"
                            onClick={() => setCategoryFilter('Reportes Operativos')}
                            className={`px-3 py-1.5 font-medium transition-colors cursor-pointer border-l border-gray-200 ${
                                categoryFilter === 'Reportes Operativos' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            Operativos (5)
                        </button>
                        <button
                            type="button"
                            onClick={() => setCategoryFilter('Motores de IA Predictiva')}
                            className={`px-3 py-1.5 font-medium transition-colors cursor-pointer border-l border-gray-200 ${
                                categoryFilter === 'Motores de IA Predictiva' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            Motores IA (6)
                        </button>
                    </div>
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
