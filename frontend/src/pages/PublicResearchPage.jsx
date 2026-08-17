import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { submitResearchSurvey } from '../api/researchApi';

export default function PublicResearchPage() {
    const [selectedForm, setSelectedForm] = useState('POST_SYSTEM');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

    const [demographics, setDemographics] = useState({
        respondentRole: 'Director / Jefe de RRHH',
        companySize: 'Pequeña empresa (10 - 49 emp)',
        economicSector: 'Tecnología / Servicios Profesionales',
        experienceYears: '2 - 5 años',
        academicDegree: 'Licenciatura / Ingeniería'
    });

    const [answers, setAnswers] = useState({});

    const handleLikertChange = (qId, val) => {
        setAnswers(prev => ({ ...prev, [qId]: val }));
    };

    const handleTextChange = (qId, val) => {
        setAnswers(prev => ({ ...prev, [qId]: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!demographics.respondentRole || !demographics.companySize || !demographics.economicSector) {
            toast.error('Por favor complete los datos demográficos iniciales.');
            return;
        }

        const answeredCount = Object.keys(answers).length;
        if (answeredCount < 3) {
            toast.error('Por favor responda las preguntas principales de la encuesta.');
            return;
        }

        try {
            setIsSubmitting(true);
            await submitResearchSurvey({
                surveyType: selectedForm,
                ...demographics,
                answers
            });

            toast.success('Respuesta registrada correctamente en el estudio científico.');
            setIsSubmittedSuccess(true);
        } catch (error) {
            const msg = error.response?.data?.message || 'Error al enviar la encuesta.';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formsMetadata = {
        PRE_SYSTEM: {
            title: 'Formulario 1 — Diagnóstico Pre-Sistema (Línea Base)',
            description: 'Medición de problemas operativos, marcación manual, costos de rotación y salarios en texto plano en PyMEs antes de usar Emplifi.',
            badge: 'Pre-Sistema / Línea Base',
            badgeBg: 'bg-amber-50 text-amber-800 border-amber-200'
        },
        POST_SYSTEM: {
            title: 'Formulario 2 — Evaluación Post-Sistema (UAT e Inteligencia Causal)',
            description: 'Medición de usabilidad (SUS), impacto en reducción de tiempos de RRHH, confianza en el simulador Causal ATE y Scoring 5D.',
            badge: 'Post-Sistema / UAT & IA',
            badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200'
        },
        EXPERT_EVAL: {
            title: 'Formulario 3 — Evaluación de Expertos e Investigadores',
            description: 'Validación del rigor científico, Do-Calculus, privacidad diferencial DP-SGD, algoritmo Weibull y Frontera de Pareto MORL.',
            badge: 'Evaluación Científica / Expertos',
            badgeBg: 'bg-blue-50 text-blue-800 border-blue-200'
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-16">
            {/* Header ERP Empresarial */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-900 flex items-center justify-center font-mono font-bold text-white text-sm">
                            E
                        </div>
                        <div>
                            <h1 className="text-sm font-semibold text-gray-900 tracking-tight flex items-center gap-2">
                                Emplifi Research Portal
                                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                    Artículo Científico
                                </span>
                            </h1>
                            <p className="text-xs text-gray-500">
                                Estudio de Analítica Causal, Automejora Recursiva y Privacidad Diferencial en SaaS PyMEs
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setSelectedForm('POST_SYSTEM'); setIsSubmittedSuccess(false); }}
                            className="px-3.5 py-1.5 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                            Responder Encuesta
                        </button>
                        <Link
                            to="/investigacion/resultados"
                            className="px-3.5 py-1.5 rounded text-xs font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Resultados & Estadísticas Públicas
                        </Link>
                        <Link
                            to="/login"
                            className="px-3 py-1.5 rounded text-xs font-medium text-gray-500 hover:text-gray-900"
                        >
                            Acceso Sistema
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                {isSubmittedSuccess ? (
                    <div className="bg-white border border-gray-200 rounded-md p-8 text-center my-8">
                        <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xs font-bold mb-3">
                            OK
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">Respuesta Registrada con Éxito</h2>
                        <p className="text-xs text-gray-600 max-w-xl mx-auto leading-relaxed mb-6">
                            Su aporte ha sido integrado en la base de datos anonimizada del proyecto de investigación científica sobre Emplifi.
                        </p>
                        <div className="flex justify-center gap-3">
                            <Link
                                to="/investigacion/resultados"
                                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors"
                            >
                                Ver Resultados Públicos y Estadísticas en Vivo
                            </Link>
                            <button
                                onClick={() => { setIsSubmittedSuccess(false); setAnswers({}); }}
                                className="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs transition-colors"
                            >
                                Llenar otra respuesta
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Selector de Formulario ERP */}
                        <div className="mb-6">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Seleccione el Instrumento de Investigación</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {Object.keys(formsMetadata).map(key => {
                                    const meta = formsMetadata[key];
                                    const isSelected = selectedForm === key;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => { setSelectedForm(key); setAnswers({}); }}
                                            className={`text-left p-4 rounded-md border transition-colors flex flex-col justify-between ${
                                                isSelected
                                                    ? 'bg-white border-blue-600 ring-1 ring-blue-600'
                                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div>
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border mb-2 ${meta.badgeBg}`}>
                                                    {meta.badge}
                                                </span>
                                                <h3 className="font-semibold text-gray-900 text-xs mb-1">{meta.title}</h3>
                                                <p className="text-[11px] text-gray-500 leading-normal">{meta.description}</p>
                                            </div>
                                            {isSelected && (
                                                <div className="mt-3 text-[11px] font-semibold text-blue-600">
                                                    Seleccionado
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Formulario Principal Estilo ERP */}
                        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-md p-6">
                            {/* Header del Formulario */}
                            <div className="border-b border-gray-200 pb-4 mb-6">
                                <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold border mb-1.5 ${formsMetadata[selectedForm].badgeBg}`}>
                                    {formsMetadata[selectedForm].badge}
                                </span>
                                <h2 className="text-base font-semibold text-gray-900">{formsMetadata[selectedForm].title}</h2>
                                <p className="text-xs text-gray-500 mt-0.5">{formsMetadata[selectedForm].description}</p>
                            </div>

                            {/* Sección 1: Datos Demográficos */}
                            <div className="mb-6">
                                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                                    1. Caracterización Demográfica y Organizacional
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Cargo u Ocupación Principal</label>
                                        <select
                                            value={demographics.respondentRole}
                                            onChange={e => setDemographics({ ...demographics, respondentRole: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="Gerente General / Dueño">Gerente General / Dueño</option>
                                            <option value="Director / Jefe de RRHH">Director / Jefe de RRHH</option>
                                            <option value="Contador / Administrador Financiero">Contador / Administrador Financiero</option>
                                            <option value="Analista de Personal / Operaciones">Analista de Personal / Operaciones</option>
                                            <option value="Docente / Investigador Académico">Docente / Investigador Académico</option>
                                            <option value="Otro Profesional">Otro Profesional</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Tamaño de la Empresa</label>
                                        <select
                                            value={demographics.companySize}
                                            onChange={e => setDemographics({ ...demographics, companySize: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="Microempresa (1 - 9 emp)">Microempresa (1 - 9 empleados)</option>
                                            <option value="Pequeña empresa (10 - 49 emp)">Pequeña empresa (10 - 49 empleados)</option>
                                            <option value="Mediana empresa (50 - 199 emp)">Mediana empresa (50 - 199 empleados)</option>
                                            <option value="Empresa grande (> 200 emp)">Empresa grande (&gt; 200 empleados)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Sector Económico</label>
                                        <select
                                            value={demographics.economicSector}
                                            onChange={e => setDemographics({ ...demographics, economicSector: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="Tecnología / Servicios Profesionales">Tecnología / Servicios Profesionales</option>
                                            <option value="Comercio / Distribución">Comercio / Distribución</option>
                                            <option value="Manufactura / Producción">Manufactura / Producción</option>
                                            <option value="Salud / Educación">Salud / Educación</option>
                                            <option value="Servicios Financieros">Servicios Financieros / Banca</option>
                                            <option value="Otro Sector">Otro Sector</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Experiencia Profesional</label>
                                        <select
                                            value={demographics.experienceYears}
                                            onChange={e => setDemographics({ ...demographics, experienceYears: e.target.value })}
                                            className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="< 2 años">&lt; 2 años</option>
                                            <option value="2 - 5 años">2 - 5 años</option>
                                            <option value="6 - 10 años">6 - 10 años</option>
                                            <option value="> 10 años">&gt; 10 años</option>
                                        </select>
                                    </div>

                                    {selectedForm === 'EXPERT_EVAL' && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Grado Académico Máximo</label>
                                            <select
                                                value={demographics.academicDegree}
                                                onChange={e => setDemographics({ ...demographics, academicDegree: e.target.value })}
                                                className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                                            >
                                                <option value="Licenciatura / Ingeniería">Licenciatura / Ingeniería</option>
                                                <option value="Maestría / MSc">Maestría / MSc</option>
                                                <option value="Doctorado / PhD">Doctorado / PhD</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sección 2: Preguntas Escala Likert (1 a 5) */}
                            <div className="mb-6 border-t border-gray-200 pt-5">
                                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    2. Valoración de Afirmaciones (Escala Likert 1-5)
                                </h3>
                                <p className="text-[11px] text-gray-500 mb-4">
                                    Responda marcando de 1 (Muy en desacuerdo / Nunca) a 5 (Muy de acuerdo / Siempre).
                                </p>

                                <div className="space-y-4">
                                    {getQuestionsForForm(selectedForm).map((q, idx) => (
                                        <div key={q.id} className="p-3.5 bg-gray-50 border border-gray-200 rounded">
                                            <p className="text-xs font-medium text-gray-800 leading-relaxed mb-2.5">
                                                <span className="font-semibold text-gray-900 mr-1">{idx + 1}.</span>
                                                {q.text}
                                            </p>

                                            <div className="flex items-center gap-2">
                                                {[1, 2, 3, 4, 5].map(rating => {
                                                    const isChecked = answers[q.id] === rating;
                                                    return (
                                                        <button
                                                            key={rating}
                                                            type="button"
                                                            onClick={() => handleLikertChange(q.id, rating)}
                                                            className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors border ${
                                                                isChecked
                                                                    ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                                                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                                                            }`}
                                                        >
                                                            <span className="font-mono">{rating}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sección 3: Observaciones Abiertas */}
                            <div className="mb-6 border-t border-gray-200 pt-5">
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Comentarios o Sugerencias Adicionales (Opcional)
                                </label>
                                <textarea
                                    rows="3"
                                    placeholder="Escriba sus comentarios..."
                                    value={answers.comments || ''}
                                    onChange={e => handleTextChange('comments', e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded p-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 placeholder:text-gray-400"
                                ></textarea>
                            </div>

                            {/* Acciones del Formulario */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 pt-4">
                                <p className="text-[11px] text-gray-500">
                                    Respuestas 100% confidenciales y anonimizadas para fines estrictamente académicos.
                                </p>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Enviando respuestas...' : 'Enviar Respuesta a Investigación'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </main>
        </div>
    );
}

function getQuestionsForForm(formType) {
    if (formType === 'PRE_SYSTEM') {
        return [
            { id: 'pre_6_manual_attendance', text: 'El registro de asistencia y tardanzas en su empresa se realiza manualmente o en listas en papel/Excel.' },
            { id: 'pre_7_buddy_punching', text: 'Se han registrado casos de marcación por terceros o falsificación de presencialidad.' },
            { id: 'pre_8_field_tracking_diff', text: 'Es difícil verificar el cumplimiento geográfico del personal de campo o teletrabajo.' },
            { id: 'pre_9_overtime_calc_hours', text: 'La consolidación de horas extra (50%), extraordinarias (100%) y recargos insume horas de trabajo manual.' },
            { id: 'pre_10_fragmented_files', text: 'La información de contratos, expedientes y asistencias está dispersa en archivos independientes.' },
            { id: 'pre_11_subjective_performance', text: 'Las evaluaciones de desempeño se basan en la percepción intuitiva del evaluador sin métricas unificadas.' },
            { id: 'pre_12_lacks_5d_metric', text: 'Se carece de un índice sintético que consolide Desempeño, Asistencia, Retención y Objetivos SMART.' },
            { id: 'pre_13_turnover_risk_blindness', text: 'Es difícil anticipar con precisión la renuncia inesperada de colaboradores clave antes de su salida.' },
            { id: 'pre_18_manual_severance_errors', text: 'Los cálculos de liquidación laboral (desahucio, despido intempestivo, 13ro/14to) son propensos a error manual.' },
            { id: 'pre_20_unencrypted_salaries', text: 'Los datos salariales y cuentas bancarias se almacenan sin encriptación de grado bancario.' }
        ];
    }

    if (formType === 'POST_SYSTEM') {
        return [
            { id: 'post_1_navigation_usability', text: 'La navegación entre los 19 módulos de Emplifi es fluida, estructurada e intuitiva.' },
            { id: 'post_2_5d_score_clarity', text: 'El Scoring Multidimensional 5D ofrece una visión objetiva del desempeño y potencial del colaborador.' },
            { id: 'post_3_geofence_passkey_speed', text: 'El fichaje con geocerca Haversine y biometría Passkey (WebAuthn) es rápido y elimina suplantaciones.' },
            { id: 'post_4_recommend_system', text: 'Recomendaría este sistema para la gestión integral del talento humano y nómina en PyMEs.' },
            { id: 'post_6_weibull_survival_precision', text: 'La curva de supervivencia de Weibull ayuda a identificar horizontes temporales de riesgo de deserción.' },
            { id: 'post_7_rsi_self_improve_confidence', text: 'El motor de automejora recursiva (RSI Engine) genera confianza al reducir el error predictivo automáticamente.' },
            { id: 'post_9_causal_simulator_whatif', text: 'El simulador Causal (Do-Calculus) permite proyectar el impacto de aumentos salariales o teletrabajo de forma clara.' },
            { id: 'post_10_ate_roi_budget_justification', text: 'El cálculo del Efecto Promedio del Tratamiento (ATE) y ROI financiero en USD facilita justificar presupuesto.' },
            { id: 'post_12_pareto_frontier_tradeoff', text: 'La Frontera de Pareto (MORL) permite balancear eficazmente el costo de presupuesto vs la retención lograda.' },
            { id: 'post_14_aes256_privacy_confidence', text: 'El cifrado AES-256-GCM de datos sensibles y salarios satisface requerimientos de privacidad LOPDP.' },
            { id: 'post_16_ecuador_labor_law_compliance', text: 'La generación automática de finiquitos conforme al Código del Trabajo de Ecuador elimina errores de liquidación.' }
        ];
    }

    return [
        { id: 'exp_1_weibull_theoretical_rigor', text: 'El modelo proporcional de Weibull con covariables es teóricamente adecuado para modelar la tasa de riesgo de deserción.' },
        { id: 'exp_2_causal_docalculus_validity', text: 'La implementación de Do-Calculus e Inverse Probability Weighting (IPW) proporciona estimaciones no sesgadas del ATE.' },
        { id: 'exp_3_dpsgd_privacy_guarantee', text: 'El recorte de gradientes y la adición de ruido Gaussiano (DP-SGD) garantizan la privacidad diferencial entre tenants.' },
        { id: 'exp_4_morl_pareto_optimality', text: 'La aproximación de la Frontera de Pareto por Aprendizaje por Refuerzo Multiobjetivo resuelve el trade-off costo-retención.' },
        { id: 'exp_5_rsi_gradient_descent_calibration', text: 'La calibración recursiva por descenso de gradiente disminuye el Brier Score sobre eventos reales de rotación.' },
        { id: 'exp_7_haversine_passkey_security', text: 'La combinación de Haversine truncado y biometría FIDO2 ofrece un esquema robusto de no-repudio de presencia.' },
        { id: 'exp_8_ecuador_labor_law_precision', text: 'La parametrización de las leyes laborales del Ecuador en los motores de liquidación es precisa y rigurosa.' },
        { id: 'exp_9_scientific_paper_contribution', text: 'Este marco integrado posee un valor científico e innovador apto para publicación en revistas internacionales indexadas.' }
    ];
}
