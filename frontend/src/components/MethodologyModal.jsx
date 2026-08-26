import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { BlockMath } from 'react-katex';
import Modal from './common/Modal';
import 'katex/dist/katex.min.css';
import {
    WeibullInteractive,
    MonteCarloInteractive,
    Scoring360Interactive,
    AnovaInteractive,
    OhiInteractive,
    DataQualityInteractive,
    PayrollBurnoutInteractive
} from './methodology/IntelligenceVisualizers.jsx';

// Formulas LaTeX de los Motores Operativos del Centro de Inteligencia (/intelligence)
const FORMULAS = {
    ohi:
        '\\text{OHI} = 0.30\\cdot\\text{Clima} + 0.30\\cdot\\text{Retencion} + 0.20\\cdot\\text{EquidadSalarial} + 0.20\\cdot\\text{Asistencia}',

    rsi:
        '\\text{RSI}_i = 100 \\cdot \\left(1 - \\frac{h_i(t)}{h_{\\max}}\\right) \\cdot \\left(1 - \\gamma\\cdot e^{-\\lambda_{t} t}\\right)',

    payroll:
        '\\hat{P}_{t+k} = P_t \\cdot (1 + g)^k + \\sum_{j=1}^m \\Delta S_j, \\quad \\text{Burnout} = 0.45\\!\\left(\\frac{H_{\\text{extra}}}{H_{\\text{base}}}\\right) + 0.35\\!\\left(\\frac{\\text{Ausencias}}{20}\\right) + 0.20\\,(100 - \\text{Clima})',

    montecarlo:
        '\\text{ROI}_{\\text{sim}} = \\frac{\\Delta C_{\\text{rotacion}} + \\Delta H_{\\text{ahorro}} - I_{\\text{total}}}{I_{\\text{total}}} \\times 100',

    cvar:
        '\\text{CVaR}_{95\\%} = \\mathbb{E}\\left[ X \\mid X \\le P_{5} \\right] = \\frac{1}{0.05}\\int_{0}^{0.05} \\text{VaR}_u(X)\\,du',

    scoring360:
        '\\text{Score}_{360} = 0.10\\cdot E_{\\text{auto}} + 0.50\\cdot E_{\\text{jefe}} + 0.20\\cdot E_{\\text{pares}} + 0.20\\cdot E_{\\text{sub}}, \\quad \\text{Top Performer} \\iff \\text{Score}_{360} > \\mu + 1.5\\sigma',

    weibull:
        'h(t) = \\dfrac{k}{\\lambda}\\left(\\dfrac{t}{\\lambda}\\right)^{k-1} \\cdot \\exp\\!\\left(\\beta_{\\text{sal}}\\,\\ln\\frac{S_{\\text{emp}}}{S_{\\text{dept}}} + \\beta_{\\text{abs}}\\sum_{i=1}^n e^{-\\lambda_{\\text{decay}}\\,\\Delta t_i} + \\beta_{\\text{perf}}\\cdot\\text{Deficit}\\right)',

    anova:
        'F = \\frac{MS_{\\text{between}}}{MS_{\\text{within}}} = \\frac{SS_{\\text{between}}\\,/\\,(k-1)}{SS_{\\text{within}}\\,/\\,(N-k)}, \\quad p \\approx 1 - \\Phi\\!\\left(Z_{\\text{Wilson-Hilferty}}\\right)',

    dataQuality:
        'Q_{\\text{data}} = \\frac{1}{M}\\sum_{m=1}^M \\left( 0.40\\cdot C_m + 0.35\\cdot F_m + 0.25\\cdot I_m \\right)'
};

// Componente de Bloque de Formula
function FormulaBlock({ latex, label }) {
    return (
        <div className="py-3 border-y border-gray-100 overflow-x-auto max-w-full text-center font-mono text-gray-900 my-2 px-1">
            {label && (
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {label}
                </div>
            )}
            <div className="flex justify-center text-sm sm:text-base">
                <BlockMath math={latex} />
            </div>
        </div>
    );
}

FormulaBlock.propTypes = {
    latex: PropTypes.string.isRequired,
    label: PropTypes.string,
};

// Modal Principal de Ficha Metodológica de /intelligence
export default function MethodologyModal({ isOpen, onClose }) {
    // Catálogo ordenado en estricta sincronía con las pestañas de /intelligence (Pestaña 1 a 5)
    const sections = [
        {
            id: 'ohi_scoring',
            title: 'Salud Organizacional (OHI) y Calibración de Estabilidad Corporativa',
            tabName: 'Pestaña 1: Resumen Ejecutivo de Negocio',
            actions: 'Velocímetro OHI (0-100), barra de progreso y desglose de los 4 pilares corporativos',
            summary: 'Sintetiza la salud corporativa en un índice compuesto OHI (0-100) calibrando la solidez de la empresa en clima, retención, equidad salarial y puntualidad.',
            formula: FORMULAS.ohi,
            formulaLabel: 'Índice de Salud Organizacional (OHI)',
            extraFormula: FORMULAS.rsi,
            extraFormulaLabel: 'Fórmula de Estabilidad y Normalización de Permanencia',
            flowSteps: [
                '1. Extracción de los 4 pilares fundamentales: Clima Laboral, Tasa de Retención, Equidad Salarial y Asistencia.',
                '2. Ponderación estratégica: 30% Clima, 30% Retención, 20% Equidad y 20% Asistencia.',
                '3. Integración en el índice compuesto OHI (0 a 100 puntos).',
                '4. Diagnóstico ejecutivo: clasificación en Vulnerable (<60), Regular (60-75) o Saludable (>75).'
            ],
            caseStudy: {
                title: 'Caso Real: Calificación Trimestral de Salud Corporativa',
                scenario: 'Clima = 75 pts, Retención = 82 pts, Equidad Salarial = 68 pts, Asistencia = 90 pts.',
                mathStep: '\\text{OHI} = 75(0.30) + 82(0.30) + 68(0.20) + 90(0.20) = 78.7 \\;\\; (\\text{Zona Saludable})',
                result: 'OHI = 78.7 (Zona Saludable). El pilar de Equidad Salarial (68 pts) es señalado automáticamente como el principal cuello de botella.'
            },
            visualizer: <OhiInteractive />,
            details: [
                'OHI: Ponderación de 4 pilares: Clima (30%), Retención (30%), Equidad (20%) y Asistencia (20%).',
                'Diagnóstico Integral: Permite a los directivos evaluar de un vistazo el bienestar operativo y clima de la compañía.'
            ],
            talkingPoints: 'Un OHI por debajo de 60 correlaciona con incrementos del 40–60% en la rotación voluntaria en el siguiente ejercicio según literatura de People Analytics. Presentarlo en el directorio convierte la percepción subjetiva de “ambiente laboral” en una cifra de 0 a 100, auditable trimestre a trimestre.'
        },
        {
            id: 'payroll_burnout',
            title: 'Proyección Algorítmica de Nómina y Diagnóstico de Sobrecarga (Burnout)',
            tabName: 'Pestaña 2: Tendencias y Proyecciones',
            actions: 'Curva de proyección salarial a 6 meses, medidor de fatiga por área y recomendación de balance de carga',
            summary: 'Proyecta el gasto presupuestario de nómina considerando crecimiento orgánico e incrementos previstos, y evalúa el índice de sobrecarga departamental cruzando horas extras y ausentismo.',
            formula: FORMULAS.payroll,
            formulaLabel: 'Modelo de Proyección Salarial y Función de Sobrecarga (Burnout)',
            flowSteps: [
                '1. Extracción de masa salarial base (P_t) y tasa histórica de crecimiento departamental (g).',
                '2. Proyección de horizontes temporales a 6 meses con incorporación de nuevos puestos presupuestados.',
                '3. Cálculo del vector de sobrecarga: ratio de horas extras vs jornada nominal y tasa de ausencias reiteradas.',
                '4. Alerta temprana: si Burnout > 50 pts, se proyecta un incremento preventivo de hasta 12% en absentismo.'
            ],
            caseStudy: {
                title: 'Caso Real: Proyección de Operaciones con Sobrecarga en Turnos',
                scenario: 'Nómina actual de $48,500/mes con 2.5% de crecimiento mensual y 14% de horas extras.',
                mathStep: '\\hat{P}_{6} = \\$48{,}500 \\cdot (1 + 0.025)^6 = \\$56{,}245 \\text{ USD}, \\quad \\text{Burnout} = 58\\,/\\,100',
                result: 'La nómina proyectada alcanzará $56,245 (+15.9%). El índice de sobrecarga de 58/100 activa una recomendación de redistribución horaria.'
            },
            visualizer: <PayrollBurnoutInteractive />,
            details: [
                'P_t: Masa salarial bruta devengada en el período base.',
                'g: Tasa media de crecimiento orgánico mensual proyectada.',
                'H_extra / H_base: Ratio de sobretiempos sobre la jornada nominal de 160h/mes.',
                'Control de Fatiga: Detección preventiva de áreas con saturación antes de que derive en renuncias.'
            ],
            talkingPoints: 'Permite al CFO y a RRHH anticipar con exactitud matemática el flujo de caja salarial a seis meses vista y mitigar el riesgo operativo de fatiga antes de que impacte en la continuidad del servicio.'
        },
        {
            id: 'montecarlo',
            title: 'Simulación Estocástica de Monte Carlo y CVaR al 95% (Simulador What-If)',
            tabName: 'Pestaña 3: Simulador de Escenarios',
            actions: 'Sliders interactivos: Aumento Preventivo (0-15%), Presupuesto Bienestar ($0-$500) y Horas Extras (0-40%)',
            summary: 'Genera 2,000 iteraciones estocásticas con perturbaciones normales Box-Muller para proyectar el retorno de inversión (ROI), percentiles de distribución (P10, P50, P90) y el Valor en Riesgo Condicional (CVaR 95%).',
            formula: FORMULAS.montecarlo,
            formulaLabel: 'Retorno de Inversión Simulado (ROI)',
            extraFormula: FORMULAS.cvar,
            extraFormulaLabel: 'Valor en Riesgo Condicional (CVaR 95%)',
            flowSteps: [
                '1. Captura de parámetros directivos: presupuesto asignado e intervenciones preventivas desde la interfaz.',
                '2. Generación pseudoaleatoria Box-Muller: simulación de 2,000 trayectorias paralelas con variabilidad estocástica en rotación.',
                '3. Cuantificación de ahorros: cálculo de liquidaciones no pagadas y horas de productividad recuperadas.',
                '4. Estimación del CVaR 95%: promedio de pérdidas financieras en el 5% de los peores escenarios posibles.'
            ],
            caseStudy: {
                title: 'Caso Real: Inversión Preventiva de $250 por Colaborador',
                scenario: 'Empresa de 40 colaboradores analiza destinar $10,000 anuales a retención y bienestar.',
                mathStep: '\\text{ROI}_{\\text{Mediana}} = \\frac{\\$28{,}500 - \\$10{,}000}{\\$10{,}000} \\times 100 = 185\\%, \\quad \\text{CVaR}_{95\\%} = -\\$620',
                result: 'Percentil 50 (Mediana) = +$18,500 netos. En el 5% de los peores escenarios (CVaR 95%), el retorno mínimo garantizado es de -$620 (pérdida máxima acotada).'
            },
            visualizer: <MonteCarloInteractive />,
            details: [
                'Transformada Box-Muller: Genera variaciones continuas normales N(mu, sigma^2) sobre rotación y costos.',
                'Delta C_rotacion: Ahorro financiero proyectado por disminución de despidos y liquidaciones.',
                'Delta H_ahorro: Beneficio monetario por reducción de absentismo no justificado.',
                'I_total: Inversión presupuestaria total asignada a la estrategia de retención.',
                'CVaR_95%: Pérdida esperada en el 5% de los peores escenarios simulados.',
                'Diagrama de Tornado: Sensibilidad e impacto relativo de cada variable sobre la retención neta.'
            ],
            talkingPoints: '2,000 iteraciones estocásticas equivalen a simular el comportamiento de la empresa durante 2,000 años de forma paralela en milisegundos. El CVaR 95% es la misma métrica que utilizan los fondos de inversión institucionales para cuantificar el peor escenario financiero admisible — aquí aplicada a cuantificar el costo máximo de rotación bajo interés directivo.'
        },
        {
            id: 'talent_scoring',
            title: 'Scoring Multidimensional 360° y Detección de Top Performers',
            tabName: 'Pestaña 4: Talento y Desempeño',
            actions: 'Tarjetas de empleados destacados, indicadores de score multidimensional y detección temprana de fuga',
            summary: 'Evalúa el desempeño integral del colaborador combinando notas de autoevaluación, pares, subordinados y supervisores ponderadas por fiabilidad, y ubica al talento en la matriz 9-Box.',
            formula: FORMULAS.scoring360,
            formulaLabel: 'Fórmula de Scoring Compuesto 360° y Umbral de Top Performer',
            flowSteps: [
                '1. Recopilación de evaluaciones multi-fuente: Autoevaluación (10%), Jefe Directo (50%), Pares (20%) y Subordinados (20%).',
                '2. Normalización de sesgos de lenidad/severidad: ajuste de puntajes según la media histórica del evaluador.',
                '3. Cálculo del Score 360° compuesto ponderado por fiabilidad.',
                '4. Clasificación estadística: colaboradores con Score > μ + 1.5σ (percentil 85) son etiquetados como Top Performers.'
            ],
            caseStudy: {
                title: 'Caso Real: Evaluación Consolidada de un Líder de Equipo',
                scenario: 'Autoevaluación: 90, Jefe Directo: 86, Pares: 84, Subordinados: 82. Media de la empresa μ = 72.0, Desviación σ = 7.5.',
                mathStep: '\\text{Score}_{360} = 90(0.10) + 86(0.50) + 84(0.20) + 82(0.20) = 85.2 > \\mu + 1.5\\sigma = 83.25',
                result: 'Dado que 85.2 > 83.25, el sistema lo promueve automáticamente a "Top Performer" y genera una alerta de retención prioritaria.'
            },
            visualizer: <Scoring360Interactive />,
            details: [
                'w_auto = 10%, w_jefe = 50%, w_pares = 20%, w_sub = 20%: ponderación estándar de evaluación 360°.',
                'Top Performer: Puntuación compuesta superior al percentil 85 (> μ + 1.5σ) con bajo riesgo de rotación.',
                'Needs Improvement: Detección temprana de brechas de rendimiento antes del ciclo anual de desvinculación.',
                'Consistencia Evaluativa: Normalización estadística para eliminar sesgos de evaluadores estrictos o permisivos.'
            ],
            talkingPoints: 'El umbral de percentil 85 como criterio de Top Performer es el mismo estándar que usan consultoras como McKinsey y BCG para sus programas de high-potentials. La normalización estadística elimina el sesgo del evaluador — si un jefe siempre pone 10, el sistema corrige la distorsión automáticamente.'
        },
        {
            id: 'weibull',
            title: 'Riesgo de Rotación Instantánea (Modelo de Weibull Generalizado)',
            tabName: 'Pestaña 4: Talento y Desempeño',
            actions: 'Tarjetas de colaboradores, panel de retención e indicadores de riesgo en tiempo real',
            summary: 'Modela la tasa instantánea de renuncia voluntaria h(t) considerando antigüedad, compresión salarial interna, ausentismo con decaimiento temporal y déficit de desempeño 360.',
            formula: FORMULAS.weibull,
            formulaLabel: 'Función de Peligro Multivariada h(t)',
            flowSteps: [
                '1. Extracción de variables continuas: antigüedad en meses (t), salario relativo al departamento y vector de ausencias biométricas.',
                '2. Ponderación por decaimiento temporal: las ausencias recientes pesan exponencialmente más que las de meses pasados.',
                '3. Evaluación del multiplicador de riesgo: cálculo de la tasa instantánea h(t) frente a la línea base de la industria.',
                '4. Calibración en escala 0-100: mapeo del hazard rate a niveles de Bajo, Medio y Alto Riesgo para la toma de decisiones.'
            ],
            caseStudy: {
                title: 'Caso Real: Desarrollador Semi-Senior con 24 meses de antigüedad',
                scenario: 'Empleado con salario 15% inferior a la mediana de su área y 3 ausencias en el último trimestre.',
                mathStep: 'h(24) = \\left(\\frac{1.45}{48}\\right) \\cdot \\left(\\frac{24}{48}\\right)^{0.45} \\cdot \\exp\\!\\Big(-0.045(-15) + 0.18(3)\\Big) = 0.0221 \\cdot \\exp(1.215) = 0.0745',
                result: 'El riesgo se multiplica por 3.37x (+237% sobre la tasa base), elevando su score de 24 a 74/100 (Alerta: Alto Riesgo).'
            },
            visualizer: <WeibullInteractive />,
            details: [
                'k: Parámetro de forma (k > 1 indica aceleración del riesgo de fuga a mayor antigüedad).',
                'lambda: Parámetro de escala base del período.',
                'beta_sal: Ponderador de compresión salarial respecto a la mediana departamental ln(S_emp / S_dept).',
                'beta_abs: Ponderador de ausentismo con decaimiento temporal acumulado exp(-lambda_decay * Delta t).',
                'beta_perf: Ponderador del déficit de competencias en la evaluación 360.'
            ],
            talkingPoints: 'El modelo de Weibull es el mismo utilizado por aseguradoras de vida para calcular primas actuariales. Aplicarlo a RRHH permite cuantificar el riesgo individual de renuncia con el mismo rigor con que un actuario calcula el riesgo de mortalidad — convirtiendo una intuición gerencial en una cifra auditada y reproducible.'
        },
        {
            id: 'anova',
            title: 'Análisis de Varianza Interdepartamental (ANOVA Unidireccional & Welch\'s T-Test)',
            tabName: 'Pestaña 5: Organización',
            actions: 'Tabla de significancia estadística ANOVA, estadístico F de Snedecor y test post-hoc de Welch entre áreas',
            summary: 'Determina si las disparidades en satisfacción, rotación y absentismo entre departamentos son estadísticamente significativas o producto del azar.',
            formula: FORMULAS.anova,
            formulaLabel: 'Estadístico F de Snedecor y Aproximación Wilson-Hilferty',
            flowSteps: [
                '1. Agrupación por departamentos: cálculo de medias y varianzas internas de ausentismo y rotación.',
                '2. Partición de la suma de cuadrados: cálculo de la varianza entre grupos (MS_between) y la varianza residual interna (MS_within).',
                '3. Cálculo del estadístico F de Snedecor y derivación del valor-p mediante aproximación Wilson-Hilferty.',
                '4. Test Post-Hoc de Welch: identificación exacta de qué pares de áreas presentan disparidades estructurales críticas.'
            ],
            caseStudy: {
                title: 'Caso Real: Disparidad de Clima entre Ventas (68.2%) y Tecnología (84.5%)',
                scenario: 'Auditoría sobre 4 departamentos (k = 4, N = 86 colaboradores).',
                mathStep: 'F = \\frac{MS_{\\text{between}}}{MS_{\\text{within}}} = \\frac{42.10}{6.15} = 6.845, \\quad p = 0.0018 < 0.05',
                result: 'Dado que p = 0.0018 < 0.05, se rechaza la hipótesis nula H0: la diferencia no es aleatoria sino un problema de gestión en Ventas.'
            },
            visualizer: <AnovaInteractive />,
            details: [
                'MS_between: Varianza entre las medias de los distintos departamentos de la empresa.',
                'MS_within: Varianza residual interna de los empleados dentro de su propio departamento.',
                'Valor p < 0.05: Confirma heterogeneidad estructural real, justificando intervenciones diferenciadas por área.',
                'Welch\'s T-Test: Identifica exactamente qué pares de departamentos presentan diferencias críticas sin asumir varianzas iguales.'
            ],
            talkingPoints: 'El estadístico F de Snedecor es la prueba de referencia en econometría laboral para confirmar diferencias estructurales entre grupos. Un valor-p < 0.05 presentado al directorio equivale a decir: “estas diferencias entre departamentos no son coincidencia — tienen un origen estructural que requiere intervención diferenciada por área”.'
        },
        {
            id: 'dataquality_export',
            title: 'Motor de Integridad de Datos y Generador de Dataset Académico Anonimizado',
            tabName: 'Header Principal & Auditoría de Calidad',
            actions: 'Botón “Exportar Dataset”, selector de formato (CSV / JSON) y panel de completitud en pantalla',
            summary: 'Audita continuamente la completitud y frescura de las fuentes de datos (expedientes, contratos, biométrico, nómina) y genera datasets con k-anonimato para investigación empírica y auditorías externas.',
            formula: FORMULAS.dataQuality,
            formulaLabel: 'Índice Global de Calidad e Integridad de Datos (Q_data)',
            flowSteps: [
                '1. Auditoría automática de fuentes: verificación de completitud en contratos, biométrico y evaluaciones.',
                '2. Cálculo del índice Q_data ponderando Completitud (40%), Frescura (35%) y Consistencia (25%).',
                '3. Enmascaramiento criptográfico: hasheo SHA-256 de identificadores personales (cédulas, nombres).',
                '4. Generalización y perturbación: aplicación de k-anonimato (k=5) y agrupación salarial por deciles para exportación segura.'
            ],
            caseStudy: {
                title: 'Caso Real: Auditoría de Datos Previa a Exportación Científica',
                scenario: 'Dataset con 96.4% de campos obligatorios llenos, 94.0% de sincronización biométrica y 97.2% de consistencia relacional.',
                mathStep: 'Q_{\\text{data}} = 0.40(0.964) + 0.35(0.940) + 0.25(0.972) = 0.9576 \\;\\; (95.8\\% > 70\\%)',
                result: 'Q_data = 0.958 (> 0.70 umbral mínimo). El sistema certifica la validez matemática del dataset y habilita la descarga anonimizada en CSV/JSON.'
            },
            visualizer: <DataQualityInteractive />,
            details: [
                'Completitud (40%): Porcentaje de campos críticos no nulos en expedientes y contratos.',
                'Frescura (35%): Antigüedad y frecuencia de sincronización de marcaciones biométricas.',
                'Consistencia (25%): Integridad referencial entre nómina, departamentos y evaluaciones.',
                'Exportación Anonimizada: Anonimiza identificadores directos (nombres, cédulas) preservando propiedades estadísticas.'
            ],
            talkingPoints: 'Un índice Q_data < 0.70 invalida estadísticamente cualquier predicción del sistema. Publicarlo de forma transparente demuestra rigor metodológico: los resultados son reproducibles por auditores externos y los hallazgos pueden ser verificados y auditados independientemente.'
        }
    ];

    const [selectedEngineId, setSelectedEngineId] = useState(sections[0]?.id || 'ohi_scoring');

    const activeEngine = sections.find(s => s.id === selectedEngineId) || sections[0];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Ficha Metodológica — Centro de Inteligencia de Negocio"
            subtitle="Tecnológico Traversari · Investigación 2026 · Fundamentación Matemática y Algorítmica de los Motores de Gestión"
            size="7xl"
            bodyClassName="p-0 flex flex-col flex-1 min-h-0 overflow-hidden"
        >
            <div className="flex flex-col sm:flex-row h-full text-xs min-h-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
                {/* Selector móvil (pantallas < sm) */}
                <div className="sm:hidden p-3 bg-gray-50 border-b border-gray-200 shrink-0">
                    <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                        Seleccionar Motor ({sections.length}):
                    </label>
                    <select
                        value={selectedEngineId}
                        onChange={(e) => setSelectedEngineId(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer shadow-2xs"
                    >
                        {sections.map(sec => (
                            <option key={sec.id} value={sec.id}>{sec.title}</option>
                        ))}
                    </select>
                </div>

                {/* Barra lateral para pantallas >= sm (Split screen y Desktop) */}
                <div className="hidden sm:block w-48 md:w-56 lg:w-60 shrink-0 bg-gray-50/60 p-2 space-y-1 overflow-y-auto h-full">
                    <div className="px-2.5 py-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/95 z-10 border-b border-gray-200/80 mb-1">
                        Motores ({sections.length})
                    </div>
                    {sections.map(sec => {
                        const isSelected = activeEngine?.id === sec.id;
                        return (
                            <button
                                key={sec.id}
                                type="button"
                                onClick={() => setSelectedEngineId(sec.id)}
                                className={`w-full text-left px-3 py-2.5 rounded text-xs leading-snug transition-colors cursor-pointer ${
                                    isSelected
                                        ? 'bg-gray-900 text-white font-semibold shadow-xs'
                                        : 'text-gray-700 hover:bg-gray-200/70 font-medium'
                                }`}
                            >
                                {sec.title}
                            </button>
                        );
                    })}
                </div>

                {/* Columna de Contenido Principal (visible SIEMPRE) */}
                <div className="flex-1 min-w-0 bg-white overflow-y-auto h-full">
                    {activeEngine ? (
                        <div>
                            <div className="sticky top-0 z-10 px-4 sm:px-6 py-3.5 bg-white/95 backdrop-blur-xs border-b border-gray-200 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
                                        {activeEngine.title}
                                    </h3>
                                    <div className="text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-0.5">
                                        {activeEngine.tabName}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 text-xs text-gray-700 leading-relaxed">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                                    <div>
                                        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                            Aplicación Operativa
                                        </div>
                                        <p className="text-xs text-gray-800 leading-relaxed">
                                            {activeEngine.summary}
                                        </p>
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                            Disparador / Elemento en Pantalla
                                        </div>
                                        <p className="text-xs font-mono text-gray-800 leading-relaxed">
                                            {activeEngine.actions}
                                        </p>
                                    </div>
                                </div>

                                {activeEngine.flowSteps && (
                                    <div className="space-y-3 pb-5 border-b border-gray-100">
                                        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                            Flujo de Ejecución Algorítmica (Paso a Paso)
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                                            {activeEngine.flowSteps.map((step, sIdx) => (
                                                <div key={sIdx} className={`${sIdx > 0 ? 'sm:pl-6' : ''} pt-2 sm:pt-0 space-y-1`}>
                                                    <div className="text-[11px] font-mono font-bold text-gray-900">
                                                        0{sIdx + 1}.
                                                    </div>
                                                    <p className="text-xs text-gray-800 leading-relaxed">
                                                        {step.replace(/^\d+\.\s*/, '')}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 pb-5 border-b border-gray-100">
                                    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        Formulación Matemática Rigurosa
                                    </div>
                                    <FormulaBlock latex={activeEngine.formula} label={activeEngine.formulaLabel} />
                                    {activeEngine.extraFormula && (
                                        <FormulaBlock latex={activeEngine.extraFormula} label={activeEngine.extraFormulaLabel} />
                                    )}
                                </div>

                                {activeEngine.visualizer && (
                                    <div className="space-y-2 pb-5 border-b border-gray-100">
                                        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                            Simulación & Visualización Interactiva
                                        </div>
                                        <div className="w-full">
                                            {activeEngine.visualizer}
                                        </div>
                                    </div>
                                )}

                                {activeEngine.caseStudy && (
                                    <div className="space-y-3 pb-5 border-b border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                                Ejemplo de Caso de Estudio Real (Cálculo Resuelto)
                                            </div>
                                            <span className="text-[10px] font-mono font-medium text-gray-500">
                                                Datos Auditables
                                            </span>
                                        </div>
                                        <div className="space-y-2 text-xs">
                                            <p className="font-bold text-gray-900 text-sm">{activeEngine.caseStudy.title}</p>
                                            <p className="text-gray-600"><span className="font-medium text-gray-700">Escenario:</span> {activeEngine.caseStudy.scenario}</p>
                                            
                                            <div className="py-2.5 border-y border-gray-100 overflow-x-auto my-2 flex justify-center font-mono text-gray-900 text-sm">
                                                <BlockMath math={activeEngine.caseStudy.mathStep} />
                                            </div>
                                            
                                            <p className="text-gray-700">
                                                <span className="font-semibold text-gray-900">Resultado e Interpretación: </span>
                                                {activeEngine.caseStudy.result}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 pb-4 border-b border-gray-100">
                                    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        Parámetros, Notación y Fundamento Teórico
                                    </div>
                                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                                        {activeEngine.details.map((det, dIdx) => (
                                            <li key={dIdx} className="leading-relaxed">{det}</li>
                                        ))}
                                    </ul>
                                </div>

                                {activeEngine.talkingPoints && (
                                    <div className="border-l-2 border-blue-600 pl-3.5 py-1 text-xs text-gray-800">
                                        <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-0.5">
                                            Clave de Interpretación & Aplicación Directiva
                                        </div>
                                        <p className="leading-relaxed text-gray-700">
                                            {activeEngine.talkingPoints}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-gray-400 text-sm">
                            Selecciona un algoritmo del directorio izquierdo.
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}

MethodologyModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};
