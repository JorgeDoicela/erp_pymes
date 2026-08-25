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
            title: 'Riesgo de Rotacion Instantanea (Modelo de Weibull Generalizado)',
            tabName: 'Pestana 1: Resumen Ejecutivo & Pestana 5: Talento',
            actions: 'Calculo en tiempo real en tarjetas de colaboradores, panel de retencion y factores de riesgo',
            summary: 'Modela la tasa instantanea de renuncia voluntaria h(t) considerando antiguedad, compresion salarial interna, ausentismo con decaimiento temporal y deficit de desempeno 360.',
            formula: FORMULAS.weibull,
            formulaLabel: 'Funcion de Peligro Multivariada h(t)',
            details: [
                'k: Parametro de forma (k > 1 indica aceleracion del riesgo de fuga a mayor antiguedad).',
                'lambda: Parametro de escala base del periodo.',
                'beta_sal: Ponderador de compresion salarial respecto a la mediana departamental ln(S_emp / S_dept).',
                'beta_abs: Ponderador de ausentismo con decaimiento temporal acumulado exp(-lambda_decay * Delta t).',
                'beta_perf: Ponderador del deficit de competencias en la evaluacion 360.'
            ]
        },
        {
            id: 'survival',
            num: '2',
            title: 'Curva de Supervivencia Actuarial a 30 / 60 / 90 Dias y Varianza de Greenwood',
            tabName: 'Pestana 2: Tendencias y Proyecciones',
            actions: 'Grafico de lineas con intervalos de confianza al 95% y botones de corte temporal a 30, 60 y 90 dias',
            summary: 'Estima la probabilidad de retencion acumulada R(t) a lo largo del tiempo y calcula intervalos de confianza actuariales al 95% mediante la formula de Greenwood.',
            formula: FORMULAS.survival,
            formulaLabel: 'Funcion de Supervivencia R(t) e Intervalos de Confianza Greenwood',
            details: [
                'R(t): Probabilidad estimada de que el colaborador permanezca activo en el tiempo t.',
                'Delta H(t): Incremento acumulado de la funcion de riesgo integrada.',
                'sigma_R: Error estandar actuarial estimado a partir del numero de eventos y colaboradores en riesgo.'
            ]
        },
        {
            id: 'montecarlo',
            num: '3',
            title: 'Simulacion Estocastica de Monte Carlo y CVaR al 95% (Simulador What-If)',
            tabName: 'Pestana 3: Simulador de Escenarios',
            actions: 'Boton "Ejecutar Simulacion Monte Carlo", sliders de presupuesto, aumento salarial y teletrabajo',
            summary: 'Genera 2,000 iteraciones estocasticas con perturbaciones normales Box-Muller para proyectar el retorno de inversion (ROI), percentiles de distribucion (P10, P50, P90) y el Valor en Riesgo Condicional (CVaR 95%).',
            formula: FORMULAS.montecarlo,
            formulaLabel: 'Retorno de Inversion Simulado (ROI)',
            extraFormula: FORMULAS.cvar,
            extraFormulaLabel: 'Valor en Riesgo Condicional (CVaR 95%)',
            details: [
                'Transformada Box-Muller: Genera variaciones continuas normales N(mu, sigma^2) sobre rotacion y costos.',
                'Delta C_rotacion: Ahorro financiero proyectado por disminucion de despidos y liquidaciones.',
                'Delta H_ahorro: Beneficio monetario por reduccion de absentismo no justificado.',
                'I_total: Inversion presupuestaria total asignada a la estrategia de retencion.',
                'CVaR_95%: Perdida esperada en el 5% de los peores escenarios simulados.'
            ]
        },
        {
            id: 'ai_advisor',
            num: '4',
            title: 'Consejero Estrategico AI (LLM) y Motor Heuristico Prescriptivo',
            tabName: 'Pestana 4: Recomendaciones y Consejero',
            actions: 'Asistente interactivo LLM, prompts estrategicos ejecutivos y tarjetas de recomendacion con accion directa',
            summary: 'Genera recomendaciones prescriptivas priorizadas por impacto financiero y urgencia operativa, combinando heuristicas directivas con prompts enriquecidos del modelo de lenguaje.',
            formula: FORMULAS.payrollProjection,
            formulaLabel: 'Optimizacion de Recomendaciones y Matriz Impacto / Esfuerzo',
            details: [
                'Priorizacion por Matriz: Clasifica acciones en Quick Wins, Proyectos Mayores y Tareas de Mantenimiento.',
                'Contexto Enriquecido: Alimenta al LLM con los KPIs agregados en tiempo real (OHI, tasa de absentismo, masa salarial).',
                'Navegacion Asistida: Permite saltar con un clic al modulo operativo responsable de implementar la sugerencia.'
            ]
        },
        {
            id: 'talent_scoring',
            num: '5',
            title: 'Scoring Multidimensional 360 y Deteccion de Top Performers',
            tabName: 'Pestana 5: Talento y Desempeno',
            actions: 'Tarjetas de empleados destacados, indicadores de score multidimensional y alertas de talento en riesgo',
            summary: 'Evalua el desempeno integral del colaborador combinando notas de autoevaluacion, pares, subordinados y supervisores ponderadas por fiabilidad.',
            formula: FORMULAS.ohi,
            formulaLabel: 'Indice Multidimensional de Desempeno y Retencion',
            details: [
                'Top Performer: Puntuacion compuesta superior al percentil 85 con bajo riesgo de rotacion.',
                'Needs Improvement: Deteccion temprana de brechas de rendimiento antes del ciclo anual de despido.',
                'Consistencia Evaluativa: Normalizacion estadistica para evitar sesgos de evaluadores estrictos o permisivos.'
            ]
        },
        {
            id: 'alerts_engine',
            num: '6',
            title: 'Sistema de Alertas Tempranas y Deteccion de Fuga de Talento',
            tabName: 'Pestana 6: Alertas y Acciones',
            actions: 'Panel de alertas en tiempo real con niveles de severidad (Critico, Medio, Informativo) y enlaces directos a resolucion',
            summary: 'Monitorea 24/7 los indicadores de RRHH y dispara notificaciones inmediatas ante superacion de limites de control estadistico (SPC) en nomina, absentismo o riesgo de renuncia.',
            formula: FORMULAS.weibull,
            formulaLabel: 'Limites de Control y Activacion de Alertas (SPC)',
            details: [
                'Alerta Critica: Empleados clave con riesgo de fuga > 70% o retrasos reiterados en el mes.',
                'Anomalia de Nomina: Deteccion automatica de colaboradores con horas extras que superan el 30% del salario base.',
                'Despacho Proactivo: Asigna tareas de mitigacion directamente al departamento responsable.'
            ]
        },
        {
            id: 'anova',
            num: '7',
            title: 'Analisis de Varianza Interdepartamental (ANOVA Unidireccional & Pairwise T-Test)',
            tabName: 'Pestana 7: Organizacion',
            actions: 'Tabla de significancia estadistica ANOVA, test post-hoc entre areas y grafico de barras comparativo',
            summary: 'Determina si las disparidades en satisfaccion, rotacion y absentismo entre departamentos son estadisticamente significativas o producto del azar.',
            formula: FORMULAS.anova,
            formulaLabel: 'Estadistico F de Snedecor y Aproximacion Wilson-Hilferty',
            details: [
                'MS_between: Varianza entre las medias de los distintos departamentos de la empresa.',
                'MS_within: Varianza residual interna de los empleados dentro de su propio departamento.',
                'Valor p < 0.05: Confirma heterogeneidad estructural real, justificando intervenciones diferenciadas por area.',
                'Pairwise T-Test: Identifica exactamente que pares de departamentos presentan diferencias criticas.'
            ]
        },
        {
            id: 'payroll_burnout',
            num: '8',
            title: 'Proyeccion Presupuestaria de Nomina a 6 Meses y Diagnostico de Burnout',
            tabName: 'Pestana 1: Resumen Ejecutivo de Negocio',
            actions: 'Tarjeta "Proyeccion a 6 Meses", grafico de tendencia y alerta de fatiga laboral',
            summary: 'Proyecta el gasto mensual de nomina considerando crecimiento organico e incrementos previstos, y calcula un indice predictivo de Burnout a partir del ratio de horas extras y ausentismo acumulado.',
            formula: FORMULAS.payrollProjection,
            formulaLabel: 'Ecuacion de Proyeccion Presupuestaria y Ratio de Burnout',
            details: [
                'P_t: Masa salarial actual en el periodo base.',
                'g_org: Tasa mensual de crecimiento organico de la plantilla.',
                'Burnout_idx: Riesgo de agotamiento derivado de sobrecarga horaria prolongada.'
            ]
        },
        {
            id: 'ohi_scoring',
            num: '9',
            title: 'Salud Organizacional (OHI) y Calibracion de Estabilidad Corporativa',
            tabName: 'Pestana 1: Resumen Ejecutivo de Negocio',
            actions: 'Tarjeta "Salud Organizacional OHI", barra de progreso y desglose de los 4 pilares corporativos',
            summary: 'Sintetiza la salud corporativa en un indice compuesto OHI (0-100) calibrando la solidez de la empresa en clima, retencion, equidad salarial y puntualidad.',
            formula: FORMULAS.ohi,
            formulaLabel: 'Indice de Salud Organizacional (OHI)',
            extraFormula: FORMULAS.rsi,
            extraFormulaLabel: 'Formula de Estabilidad y Normalizacion de Permanencia',
            details: [
                'OHI: Ponderacion de 4 pilares: Clima (30%), Retencion (30%), Equidad (20%) y Asistencia (20%).',
                'Diagnostico Integral: Permite a los directivos evaluar de un vistazo el bienestar operativo y clima de la compania.'
            ]
        },
        {
            id: 'dataquality_export',
            num: '10',
            title: 'Motor de Integridad de Datos y Generador de Dataset Academico Anonimizado',
            tabName: 'Header Principal de Inteligencia',
            actions: 'Boton "Exportar Dataset", selector de formato (CSV / JSON) y panel de completitud',
            summary: 'Audita continuamente la completitud y frescura de las fuentes de datos (expedientes, contratos, biometrico, nomina) y genera datasets con k-anonimato para investigacion empirica y auditorias externas.',
            formula: FORMULAS.dataQuality,
            formulaLabel: 'Indice Global de Calidad e Integridad de Datos (Q_data)',
            details: [
                'Completitud (40%): Porcentaje de campos criticos no nulos en expedientes y contratos.',
                'Frescura (35%): Antiguedad y frecuencia de sincronizacion de marcaciones biometricas.',
                'Consistencia (25%): Integridad referencial entre nomina, departamentos y evaluaciones.',
                'Exportacion Anonimizada: Anonimiza identificadores directos (nombres, cedulas) preservando propiedades estadisticas.'
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
            title="Ficha Metodológica — Agente Inteligente (/intelligence)"
            subtitle="Fundamentación matemática rigurosa de las 7 pestañas, algoritmos econométricos y simuladores del Agente Inteligente"
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
