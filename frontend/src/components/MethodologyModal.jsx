import { useState } from 'react';
import PropTypes from 'prop-types';
import { BlockMath } from 'react-katex';
import Modal from './common/Modal';
import 'katex/dist/katex.min.css';

// Formulas LaTeX
const FORMULAS = {
    weibull:
        'h(t) = \\dfrac{k}{\\lambda}\\left(\\dfrac{t}{\\lambda}\\right)^{k-1} \\cdot \\exp\\!\\left(\\beta_{\\text{sal}}\\,\\ln\\frac{S_{\\text{emp}}}{S_{\\text{dept}}} + \\beta_{\\text{abs}}\\sum_{i=1}^n e^{-\\lambda_{\\text{decay}}\\,\\Delta t_i} + \\beta_{\\text{perf}}\\cdot\\text{Deficit}\\right)',

    survival:
        'R(t) = 1 - e^{-\\Delta H(t)}, \\quad \\hat{\\sigma}_R^2(t) = [R(t)]^2 \\sum_{t_i \\le t} \\frac{d_i}{n_i (n_i - d_i)}, \\quad CI_{95\\%} = R(t) \\pm 1.96\\,\\hat{\\sigma}_R(t)',

    montecarlo:
        'ROI_{\\text{sim}} = \\frac{\\Delta C_{\\text{rotacion}} + \\Delta H_{\\text{ahorro}} - I_{\\text{total}}}{I_{\\text{total}}} \\times 100',
    
    cvar:
        'CVaR_{95\\%} = \\mathbb{E}\\left[ X \\mid X \\le P_{5} \\right] = \\frac{1}{0.05}\\int_{0}^{0.05} VaR_u(X)\\,du',

    anova:
        'F = \\frac{MS_{\\text{between}}}{MS_{\\text{within}}} = \\frac{SS_{\\text{between}}\\,/\\,(k-1)}{SS_{\\text{within}}\\,/\\,(N-k)}, \\quad p \\approx 1 - \\Phi\\!\\left(Z_{\\text{Wilson-Hilferty}}\\right)',

    payrollProjection:
        'P_{t+h} = P_t \\cdot (1 + g_{\\text{org}})^h + \\sum_{j=1}^h \\Delta S_{\\text{ajuste}, j}, \\quad \\text{Burnout}_{\\text{idx}} = \\frac{\\text{HorasExtras}}{\\text{HorasBase}} \\cdot w_{\\text{ext}} + \\frac{\\text{Ausencias}}{\\text{DiasHabiles}} \\cdot w_{\\text{abs}}',

    ohi:
        'OHI = 0.30\\cdot\\text{Clima} + 0.30\\cdot\\text{Retencion} + 0.20\\cdot\\text{EquidadSalarial} + 0.20\\cdot\\text{Asistencia}',

    rsi:
        'RSI_i = 100 \\cdot \\left(1 - \\frac{h_i(t)}{h_{\\max}}\\right) \\cdot \\left(1 - \\gamma\\cdot e^{-\\lambda_{t} t}\\right)',

    dataQuality:
        'Q_{\\text{data}} = \\frac{1}{M}\\sum_{m=1}^M \\left( 0.40\\cdot C_m + 0.35\\cdot F_m + 0.25\\cdot I_m \\right)'
};

// Componente de Bloque de Formula
function FormulaBlock({ latex, label }) {
    return (
        <div className="rounded border border-gray-200 bg-gray-50/50 overflow-x-auto my-2">
            {label && (
                <div className="px-3.5 pt-2.5 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    {label}
                </div>
            )}
            <div className="px-3.5 py-2.5 flex justify-center text-xs text-gray-900 font-mono">
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
    const [searchFilter, setSearchFilter] = useState('');

    const sections = [
        {
            id: 'weibull',
            num: '1',
            title: 'Riesgo de Rotación Instantánea (Modelo de Weibull Generalizado)',
            tabName: 'Pestaña 1: Resumen Ejecutivo & Pestaña 4: Talento',
            actions: 'Cálculo en tiempo real en tarjetas de colaboradores, panel de retención y factores de riesgo',
            summary: 'Modela la tasa instantánea de renuncia voluntaria h(t) considerando antigüedad, compresión salarial interna, ausentismo con decaimiento temporal y déficit de desempeño 360.',
            formula: FORMULAS.weibull,
            formulaLabel: 'Función de Peligro Multivariada h(t)',
            details: [
                'k: Parámetro de forma (k > 1 indica aceleración del riesgo de fuga a mayor antigüedad).',
                'lambda: Parámetro de escala base del período.',
                'beta_sal: Ponderador de compresión salarial respecto a la mediana departamental ln(S_emp / S_dept).',
                'beta_abs: Ponderador de ausentismo con decaimiento temporal acumulado exp(-lambda_decay * Delta t).',
                'beta_perf: Ponderador del déficit de competencias en la evaluación 360.'
            ]
        },
        {
            id: 'survival',
            num: '2',
            title: 'Curva de Supervivencia Actuarial a 30 / 60 / 90 Días y Varianza de Greenwood',
            tabName: 'Pestaña 2: Tendencias y Proyecciones',
            actions: 'Gráfico de líneas con intervalos de confianza al 95% y botones de corte temporal a 30, 60 y 90 días',
            summary: 'Estima la probabilidad de retención acumulada R(t) a lo largo del tiempo y calcula intervalos de confianza actuariales al 95% mediante la fórmula de Greenwood.',
            formula: FORMULAS.survival,
            formulaLabel: 'Función de Supervivencia R(t) e Intervalos de Confianza Greenwood',
            details: [
                'R(t): Probabilidad estimada de que el colaborador permanezca activo en el tiempo t.',
                'Delta H(t): Incremento acumulado de la función de riesgo integrada.',
                'sigma_R: Error estándar actuarial estimado a partir del número de eventos y colaboradores en riesgo.'
            ]
        },
        {
            id: 'montecarlo',
            num: '3',
            title: 'Simulación Estocástica de Monte Carlo y CVaR al 95% (Simulador What-If)',
            tabName: 'Pestaña 3: Simulador de Escenarios',
            actions: 'Sliders interactivos en pantalla: Aumento Salarial Preventivo (0-15%), Presupuesto Bienestar ($0-$500) y Reducción de Horas Extras (0-40%) con cálculo estocástico automático',
            summary: 'Genera 2,000 iteraciones estocásticas con perturbaciones normales Box-Muller para proyectar el retorno de inversión (ROI), percentiles de distribución (P10, P50, P90) y el Valor en Riesgo Condicional (CVaR 95%).',
            formula: FORMULAS.montecarlo,
            formulaLabel: 'Retorno de Inversión Simulado (ROI)',
            extraFormula: FORMULAS.cvar,
            extraFormulaLabel: 'Valor en Riesgo Condicional (CVaR 95%)',
            details: [
                'Transformada Box-Muller: Genera variaciones continuas normales N(mu, sigma^2) sobre rotación y costos.',
                'Delta C_rotacion: Ahorro financiero proyectado por disminución de despidos y liquidaciones.',
                'Delta H_ahorro: Beneficio monetario por reducción de absentismo no justificado.',
                'I_total: Inversión presupuestaria total asignada a la estrategia de retención.',
                'CVaR_95%: Pérdida esperada en el 5% de los peores escenarios simulados.',
                'Diagrama de Tornado: Sensibilidad e impacto relativo de cada variable sobre la retención neta.'
            ]
        },
        {
            id: 'talent_scoring',
            num: '4',
            title: 'Scoring Multidimensional 360° y Detección de Top Performers',
            tabName: 'Pestaña 4: Talento y Desempeño',
            actions: 'Tarjetas de empleados destacados, indicadores de score multidimensional y detección temprana de fuga',
            summary: 'Evalúa el desempeño integral del colaborador combinando notas de autoevaluación, pares, subordinados y supervisores ponderadas por fiabilidad.',
            formula: FORMULAS.ohi,
            formulaLabel: 'Índice Multidimensional de Desempeño y Retención',
            details: [
                'Top Performer: Puntuación compuesta superior al percentil 85 con bajo riesgo de rotación.',
                'Needs Improvement: Detección temprana de brechas de rendimiento antes del ciclo anual de desvinculación.',
                'Consistencia Evaluativa: Normalización estadística para evitar sesgos de evaluadores estrictos o permisivos.'
            ]
        },
        {
            id: 'anova',
            num: '5',
            title: 'Análisis de Varianza Interdepartamental (ANOVA Unidireccional & Welch\'s T-Test)',
            tabName: 'Pestaña 5: Organización',
            actions: 'Tabla de significancia estadística ANOVA, estadístico F de Snedecor y test post-hoc de Welch entre áreas',
            summary: 'Determina si las disparidades en satisfacción, rotación y absentismo entre departamentos son estadísticamente significativas o producto del azar.',
            formula: FORMULAS.anova,
            formulaLabel: 'Estadístico F de Snedecor y Aproximación Wilson-Hilferty',
            details: [
                'MS_between: Varianza entre las medias de los distintos departamentos de la empresa.',
                'MS_within: Varianza residual interna de los empleados dentro de su propio departamento.',
                'Valor p < 0.05: Confirma heterogeneidad estructural real, justificando intervenciones diferenciadas por área.',
                'Welch\'s T-Test: Identifica exactamente qué pares de departamentos presentan diferencias críticas sin asumir varianzas iguales.'
            ]
        },
        {
            id: 'payroll_burnout',
            num: '6',
            title: 'Proyección Presupuestaria de Nómina a 6 Meses y Diagnóstico de Burnout',
            tabName: 'Pestaña 2: Tendencias y Proyecciones',
            actions: 'Gráfico de área de evolución salarial a 6 meses y matriz de diagnóstico de sobrecarga operativa',
            summary: 'Proyecta el gasto mensual de nómina considerando crecimiento orgánico e incrementos previstos, y calcula un índice predictivo de Burnout a partir del ratio de horas extras y ausentismo acumulado.',
            formula: FORMULAS.payrollProjection,
            formulaLabel: 'Ecuación de Proyección Presupuestaria y Ratio de Burnout',
            details: [
                'P_t: Masa salarial actual en el período base.',
                'g_org: Tasa mensual de crecimiento orgánico de la plantilla.',
                'Burnout_idx: Riesgo de agotamiento derivado de sobrecarga horaria prolongada.'
            ]
        },
        {
            id: 'ohi_scoring',
            num: '7',
            title: 'Salud Organizacional (OHI) y Calibración de Estabilidad Corporativa',
            tabName: 'Pestaña 1: Resumen Ejecutivo de Negocio',
            actions: 'Velocímetro OHI (0-100), barra de progreso y desglose de los 4 pilares corporativos',
            summary: 'Sintetiza la salud corporativa en un índice compuesto OHI (0-100) calibrando la solidez de la empresa en clima, retención, equidad salarial y puntualidad.',
            formula: FORMULAS.ohi,
            formulaLabel: 'Índice de Salud Organizacional (OHI)',
            extraFormula: FORMULAS.rsi,
            extraFormulaLabel: 'Fórmula de Estabilidad y Normalización de Permanencia',
            details: [
                'OHI: Ponderación de 4 pilares: Clima (30%), Retención (30%), Equidad (20%) y Asistencia (20%).',
                'Diagnóstico Integral: Permite a los directivos evaluar de un vistazo el bienestar operativo y clima de la compañía.'
            ]
        },
        {
            id: 'dataquality_export',
            num: '8',
            title: 'Motor de Integridad de Datos y Generador de Dataset Académico Anonimizado',
            tabName: 'Header Principal de Inteligencia',
            actions: 'Botón "Exportar Dataset", selector de formato (CSV / JSON) y panel de completitud',
            summary: 'Audita continuamente la completitud y frescura de las fuentes de datos (expedientes, contratos, biométrico, nómina) y genera datasets con k-anonimato para investigación empírica y auditorías externas.',
            formula: FORMULAS.dataQuality,
            formulaLabel: 'Índice Global de Calidad e Integridad de Datos (Q_data)',
            details: [
                'Completitud (40%): Porcentaje de campos críticos no nulos en expedientes y contratos.',
                'Frescura (35%): Antigüedad y frecuencia de sincronización de marcaciones biométricas.',
                'Consistencia (25%): Integridad referencial entre nómina, departamentos y evaluaciones.',
                'Exportación Anonimizada: Anonimiza identificadores directos (nombres, cédulas) preservando propiedades estadísticas.'
            ]
        }
    ];

    const [selectedEngineId, setSelectedEngineId] = useState(sections[0]?.id || 'weibull');

    const filteredSections = sections.filter(sec => 
        sec.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        sec.num.toLowerCase().includes(searchFilter.toLowerCase()) ||
        sec.summary.toLowerCase().includes(searchFilter.toLowerCase()) ||
        sec.tabName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        sec.actions.toLowerCase().includes(searchFilter.toLowerCase())
    );

    const activeEngine = sections.find(s => s.id === selectedEngineId) || filteredSections[0] || sections[0];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Ficha Metodológica — Centro de Inteligencia de Negocio (/intelligence)"
            subtitle="Fundamentación matemática rigurosa de las 5 pestañas, algoritmos econométricos y simuladores del Centro de Inteligencia"
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
                
                {/* Buscador de Algoritmos */}
                <div className="shrink-0">
                    <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="Buscar por pestaña, algoritmo, fórmula o botón de /intelligence..."
                        className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                    />
                </div>

                {/* Layout Maestro de 2 Columnas */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0">
                    
                    {/* Columna Izquierda (4 / 12): Directorio con scroll propio */}
                    <div className="lg:col-span-4 border border-gray-200 rounded bg-gray-50/60 p-2 space-y-1.5 overflow-y-auto h-full pr-1">
                        <div className="px-2 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50/90 z-10">
                            Motores de /intelligence ({filteredSections.length})
                        </div>
                        {filteredSections.map(sec => {
                            const isSelected = activeEngine?.id === sec.id;
                            return (
                                <button
                                    key={sec.id}
                                    type="button"
                                    onClick={() => setSelectedEngineId(sec.id)}
                                    className={`w-full text-left p-2.5 rounded transition-all flex items-start gap-2.5 border cursor-pointer ${
                                        isSelected
                                            ? 'bg-white border-blue-600 shadow-xs'
                                            : 'bg-white/80 border-gray-200 hover:bg-white hover:border-gray-300'
                                    }`}
                                >
                                    <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold shrink-0 ${
                                        isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 border border-gray-200'
                                    }`}>
                                        #{sec.num}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className={`text-xs font-semibold truncate ${
                                            isSelected ? 'text-blue-900' : 'text-gray-900'
                                        }`}>
                                            {sec.title}
                                        </div>
                                        <div className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                                            {sec.tabName}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Columna Derecha (8 / 12): Detalle Técnico con scroll propio */}
                    <div className="lg:col-span-8 border border-gray-200 rounded bg-white overflow-y-auto h-full shadow-2xs">
                        {activeEngine ? (
                            <div>
                                {/* Cabecera del Motor Activo (Sticky) */}
                                <div className="sticky top-0 z-10 px-5 py-3.5 bg-gray-50/95 backdrop-blur-xs border-b border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono font-bold bg-gray-900 text-white px-2 py-0.5 rounded">
                                            MOTOR #{activeEngine.num}
                                        </span>
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 truncate">
                                            {activeEngine.tabName}
                                        </span>
                                    </div>
                                    <h3 className="text-sm sm:text-base font-bold text-gray-900 mt-1">
                                        {activeEngine.title}
                                    </h3>
                                </div>

                                {/* Contenido Técnico */}
                                <div className="p-5 space-y-4 text-xs text-gray-700 leading-relaxed">
                                    
                                    {/* Bloque de Aplicación Operativa y Disparador */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                        <div className="p-3 bg-blue-50/40 border-l-2 border-blue-600 border-y border-r border-blue-100 rounded-r text-gray-800 text-[11px] space-y-1">
                                            <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">
                                                Aplicación Operativa en /intelligence
                                            </div>
                                            <p className="text-gray-700 leading-normal">
                                                {activeEngine.summary}
                                            </p>
                                        </div>

                                        <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-800 text-[11px] space-y-1">
                                            <div className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                                                Disparador / Botón en Pantalla
                                            </div>
                                            <p className="text-gray-700 font-mono text-[11px] leading-normal pt-0.5">
                                                {activeEngine.actions}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Fórmulas Matemáticas */}
                                    <div className="space-y-2 pt-1 border-t border-gray-100">
                                        <div className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                                            Formulación Matemática Rigurosa
                                        </div>
                                        <FormulaBlock latex={activeEngine.formula} label={activeEngine.formulaLabel} />
                                        {activeEngine.extraFormula && (
                                            <FormulaBlock latex={activeEngine.extraFormula} label={activeEngine.extraFormulaLabel} />
                                        )}
                                    </div>

                                    {/* Desglose de Parámetros y Fundamento */}
                                    <div className="bg-gray-50/60 p-3.5 rounded border border-gray-200 text-[11px] space-y-1.5 text-gray-600 pt-1">
                                        <p className="font-bold text-gray-800 uppercase tracking-wider text-[10px]">
                                            Parámetros, Notación y Fundamento Teórico:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1">
                                            {activeEngine.details.map((det, dIdx) => (
                                                <li key={dIdx}>{det}</li>
                                            ))}
                                        </ul>
                                    </div>

                                </div>
                            </div>
                        ) : (
                            <div className="p-12 text-center text-gray-400 text-xs">
                                Selecciona un algoritmo del directorio izquierdo.
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </Modal>
    );
}

MethodologyModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};
